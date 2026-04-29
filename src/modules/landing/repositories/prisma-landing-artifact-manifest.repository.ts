import { Injectable } from '@nestjs/common';
import { getArtifactStorageBackend } from '../../../common/config/database-config';
import { PrismaService } from '../../../common/config/prisma.service';
import { LandingArtifactManifestRepository } from './landing-artifact-manifest.repository';
import { RenderMetadata } from '../types/render-metadata.type';

@Injectable()
export class PrismaLandingArtifactManifestRepository implements LandingArtifactManifestRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async saveArtifactManifest(metadata: RenderMetadata): Promise<void> {
    await this.prismaService.landingArtifactManifest.upsert({
      where: { renderId: metadata.renderId },
      update: {
        templateCode: metadata.templateCode,
        templateVersion: metadata.templateVersion,
        storageBackend: getArtifactStorageBackend(),
        inputPath: metadata.artifacts.input,
        inputContentType: 'application/json',
        canonicalPath: metadata.artifacts.canonical,
        canonicalContentType: 'application/json',
        htmlPath: metadata.artifacts.html,
        htmlContentType: 'text/html; charset=utf-8',
        metadataPath: metadata.artifacts.metadata,
        metadataContentType: 'application/json',
        eventsPath: metadata.artifacts.events,
        eventsContentType: 'application/json',
        pdfPath: metadata.artifacts.pdf,
        pdfContentType: metadata.artifacts.pdf ? 'application/pdf' : null,
        updatedAt: new Date(),
      },
      create: {
        renderId: metadata.renderId,
        templateCode: metadata.templateCode,
        templateVersion: metadata.templateVersion,
        storageBackend: getArtifactStorageBackend(),
        inputPath: metadata.artifacts.input,
        inputContentType: 'application/json',
        canonicalPath: metadata.artifacts.canonical,
        canonicalContentType: 'application/json',
        htmlPath: metadata.artifacts.html,
        htmlContentType: 'text/html; charset=utf-8',
        metadataPath: metadata.artifacts.metadata,
        metadataContentType: 'application/json',
        eventsPath: metadata.artifacts.events,
        eventsContentType: 'application/json',
        pdfPath: metadata.artifacts.pdf,
        pdfContentType: metadata.artifacts.pdf ? 'application/pdf' : null,
        updatedAt: new Date(),
      },
    });
  }
}