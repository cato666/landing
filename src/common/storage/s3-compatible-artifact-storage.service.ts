import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { getS3StorageConfig } from '../config/runtime-config';
import { ArtifactStorageService } from './artifact-storage.service';

@Injectable()
export class S3CompatibleArtifactStorageService implements ArtifactStorageService {
  private readonly config = getS3StorageConfig();

  private readonly client = new S3Client({
    region: this.config.region,
    endpoint: this.config.endpoint,
    forcePathStyle: this.config.forcePathStyle,
    credentials: {
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    },
  });

  async ensureDir(_dirPath: string): Promise<void> {
    return;
  }

  async pathExists(targetPath: string): Promise<boolean> {
    const key = this.normalizeKey(targetPath);

    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }));
      return true;
    } catch {
      const listing = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: this.asPrefix(key), MaxKeys: 1 }),
      );

      if ((listing.Contents?.length ?? 0) > 0) {
        return true;
      }

      return !/\.[^/]+$/.test(key);
    }
  }

  async readJson<T>(filePath: string): Promise<T> {
    return JSON.parse(await this.readFile(filePath, 'utf8')) as T;
  }

  async writeJson(filePath: string, data: unknown): Promise<void> {
    await this.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    const buffer = await this.readBuffer(filePath);
    return buffer.toString(encoding);
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: this.normalizeKey(filePath) }),
    );
    const bytes = await response.Body?.transformToByteArray();
    return Buffer.from(bytes ?? []);
  }

  async writeFile(filePath: string, content: string | Buffer, encoding?: BufferEncoding): Promise<void> {
    const body = typeof content === 'string' ? Buffer.from(content, encoding ?? 'utf8') : content;
    await this.client.send(
      new PutObjectCommand({ Bucket: this.config.bucket, Key: this.normalizeKey(filePath), Body: body }),
    );
  }

  async readdir(dirPath: string): Promise<string[]> {
    const prefix = this.asPrefix(this.normalizeKey(dirPath));
    const result = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: prefix, Delimiter: '/' }),
    );

    return (result.CommonPrefixes ?? [])
      .map((entry) => entry.Prefix?.slice(prefix.length).replace(/\/$/, ''))
      .filter((value): value is string => Boolean(value));
  }

  async remove(targetPath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: this.normalizeKey(targetPath) }),
    );
  }

  async deleteArtifactSet(renderId: string): Promise<void> {
    const prefix = `${renderId}/`;
    let continuationToken: string | undefined;

    // List all objects with the renderId prefix and delete them
    do {
      const result = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000, // Batch delete up to 1000 objects at a time
        }),
      );

      if ((result.Contents?.length ?? 0) > 0) {
        const deleteParams = {
          Bucket: this.config.bucket,
          Delete: {
            Objects: result.Contents!.map((obj) => ({ Key: obj.Key! })),
          },
        };

        await this.client.send(new DeleteObjectsCommand(deleteParams));
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  private normalizeKey(targetPath: string): string {
    return targetPath
      .replace(/^[A-Za-z]:[\\/]/, '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
  }

  private asPrefix(key: string): string {
    return key.endsWith('/') ? key : `${key}/`;
  }
}
