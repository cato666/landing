import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LandingMetadataRepository } from '../repositories/landing-metadata.repository';
import { LandingArtifactManifestRepository } from '../repositories/landing-artifact-manifest.repository';
import { ArtifactStorageService } from '../../../common/storage/artifact-storage.service';
import { PrismaService } from '../../../common/config/prisma.service';

@Injectable()
export class ArtifactCleanupService {
  private readonly logger = new Logger(ArtifactCleanupService.name);

  constructor(
    private readonly metadataRepository: LandingMetadataRepository,
    private readonly artifactManifestRepository: LandingArtifactManifestRepository,
    private readonly storageService: ArtifactStorageService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Run cleanup job every hour
   * Removes artifacts that:
   * 1. Have expired (expiresAt < now)
   * 2. Are older than retention period (createdAt < now - LANDING_ARTIFACT_RETENTION_DAYS)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredAndOldArtifacts() {
    this.logger.log('Starting artifact cleanup job...');

    const retentionDays = Number(process.env.LANDING_ARTIFACT_RETENTION_DAYS ?? '90');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Find all metadata entries that should be cleaned up
      const allMetadata = await this.prisma.landingMetadata.findMany();
      let deletedCount = 0;
      let errorCount = 0;

      for (const metadata of allMetadata) {
        const createdAt = new Date(metadata.createdAt);
        const expiresAt = metadata.expiresAt ? new Date(metadata.expiresAt) : null;
        const now = new Date();

        // Check if should be deleted:
        // 1. Expired token
        const isExpired = expiresAt && expiresAt <= now;
        // 2. Retention period exceeded
        const isOldArtifact = createdAt <= cutoffDate;

        if (isExpired || isOldArtifact) {
          try {
            await this.deleteArtifacts(metadata.renderId, !!isExpired, isOldArtifact);
            deletedCount++;
          } catch (error) {
            this.logger.error(
              `Failed to cleanup artifacts for renderId=${metadata.renderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            errorCount++;
          }
        }
      }

      this.logger.log(
        `Artifact cleanup completed: ${deletedCount} artifact sets deleted, ${errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(
        `Artifact cleanup job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async deleteArtifacts(
    renderId: string,
    isExpired: boolean,
    isOldArtifact: boolean,
  ): Promise<void> {
    const reason = isExpired && isOldArtifact ? 'expired & old' : isExpired ? 'expired' : 'old';
    this.logger.debug(`Deleting artifacts for renderId=${renderId} (reason: ${reason})`);

    // Delete from storage
    try {
      await this.storageService.deleteArtifactSet(renderId);
    } catch (error) {
      this.logger.warn(
        `Could not delete storage artifacts for renderId=${renderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Continue to delete metadata even if storage deletion fails
    }

    // Delete metadata records
    await Promise.all([
      this.prisma.landingMetadata.delete({
        where: { renderId },
      }).catch(err => {
        this.logger.warn(`Failed to delete metadata for ${renderId}: ${err.message}`);
      }),
      this.prisma.landingArtifactManifest.delete({
        where: { renderId },
      }).catch(err => {
        this.logger.warn(`Failed to delete manifest for ${renderId}: ${err.message}`);
      }),
    ]);
  }
}
