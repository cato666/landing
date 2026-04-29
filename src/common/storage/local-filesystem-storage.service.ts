import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import { ArtifactStorageService } from './artifact-storage.service';
import { StorageService } from './storage.service';

@Injectable()
export class LocalFilesystemStorageService implements StorageService, ArtifactStorageService {
  async ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  async pathExists(targetPath: string): Promise<boolean> {
    return fs.pathExists(targetPath);
  }

  async readJson<T>(filePath: string): Promise<T> {
    return fs.readJson(filePath) as Promise<T>;
  }

  async writeJson(filePath: string, data: unknown): Promise<void> {
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    return fs.readFile(filePath, encoding);
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  async writeFile(filePath: string, content: string | Buffer, encoding?: BufferEncoding): Promise<void> {
    if (typeof content === 'string') {
      await fs.writeFile(filePath, content, encoding ?? 'utf8');
      return;
    }

    await fs.writeFile(filePath, content);
  }

  async readdir(dirPath: string): Promise<string[]> {
    return fs.readdir(dirPath);
  }

  async remove(targetPath: string): Promise<void> {
    await fs.remove(targetPath);
  }

  async deleteArtifactSet(renderId: string): Promise<void> {
    const outputRoot = process.env.OUTPUTS_ROOT ?? './outputs';
    const artifactDir = `${outputRoot}/${renderId}`;
    await fs.remove(artifactDir);
  }
}