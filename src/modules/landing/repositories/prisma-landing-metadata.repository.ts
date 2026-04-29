import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/config/prisma.service';
import { LandingMetadataRepository } from './landing-metadata.repository';
import { RenderMetadata } from '../types/render-metadata.type';

@Injectable()
export class PrismaLandingMetadataRepository implements LandingMetadataRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async saveMetadata(metadata: RenderMetadata): Promise<void> {
    await this.prismaService.landingMetadata.upsert({
      where: { token: metadata.token },
      update: {
        templateCode: metadata.templateCode,
        templateVersion: metadata.templateVersion,
        createdAt: new Date(metadata.createdAt),
        expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : null,
        artifacts: metadata.artifacts as Prisma.InputJsonValue,
      },
      create: {
        renderId: metadata.renderId,
        token: metadata.token,
        templateCode: metadata.templateCode,
        templateVersion: metadata.templateVersion,
        createdAt: new Date(metadata.createdAt),
        expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : null,
        artifacts: metadata.artifacts as Prisma.InputJsonValue,
      },
    });
  }

  async readMetadataByToken(token: string): Promise<RenderMetadata> {
    const metadata = await this.prismaService.landingMetadata.findUniqueOrThrow({
      where: { token },
    });

    return {
      renderId: metadata.renderId,
      token: metadata.token,
      templateCode: metadata.templateCode,
      templateVersion: metadata.templateVersion,
      createdAt: metadata.createdAt.toISOString(),
      expiresAt: metadata.expiresAt ? metadata.expiresAt.toISOString() : null,
      status: 'generated',
      artifacts: metadata.artifacts as RenderMetadata['artifacts'],
    };
  }
}