import { Injectable } from '@nestjs/common';
import { getArtifactStorageBackend, usePrismaRepositories } from '../config/database-config';
import { PrismaService } from '../config/prisma.service';
import { resolveOutputsRoot, resolveTemplatesRoot } from '../config/path-config';
import { ArtifactStorageService } from '../storage/artifact-storage.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly storageService: StorageService,
    private readonly artifactStorageService: ArtifactStorageService,
    private readonly prismaService: PrismaService,
  ) {}

  async getReadiness() {
    const outputsRoot = resolveOutputsRoot();
    const templatesRoot = resolveTemplatesRoot();

    await this.artifactStorageService.ensureDir(outputsRoot);
    const templatesExists = await this.storageService.pathExists(templatesRoot);
    const outputsExists = await this.artifactStorageService.pathExists(outputsRoot);

    const result = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        storage: outputsExists ? 'ok' : 'error',
        artifactStorageBackend: getArtifactStorageBackend(),
        templates: templatesExists ? 'ok' : 'error',
        database: 'disabled' as 'ok' | 'error' | 'disabled',
      },
    };

    if (usePrismaRepositories()) {
      await this.prismaService.$queryRaw`SELECT 1`;
      result.checks.database = 'ok';
    }

    return result;
  }
}