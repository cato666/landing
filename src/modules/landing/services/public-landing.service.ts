import { GoneException, Injectable } from '@nestjs/common';
import { LandingArtifactRepository } from '../repositories/landing-artifact.repository';
import { LandingArtifactManifestRepository } from '../repositories/landing-artifact-manifest.repository';
import { LandingMetadataRepository } from '../repositories/landing-metadata.repository';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';
import { RenderMetadata } from '../types/render-metadata.type';
import { PdfRendererService } from './pdf-renderer.service';
import { MetricsService } from '../../../common/observability/metrics.service';

@Injectable()
export class PublicLandingService {
  constructor(
    private readonly metadataRepository: LandingMetadataRepository,
    private readonly artifactRepository: LandingArtifactRepository,
    private readonly artifactManifestRepository: LandingArtifactManifestRepository,
    private readonly analyticsRepository: PublicationAnalyticsRepository,
    private readonly pdfRenderer: PdfRendererService,
    private readonly metricsService: MetricsService,
  ) {}

  async getLandingByToken(token: string): Promise<{ renderId: string; html: string }> {
    const metadata = await this.getMetadataByToken(token, true);
    const html = await this.artifactRepository.readLandingHtml(metadata.renderId);
    await this.analyticsRepository.recordPublicationAccess({
      renderId: metadata.renderId,
      token,
      accessType: 'landing_view',
    });
    await this.analyticsRepository.incrementAggregateMetric('public_landing_views_total');
    this.metricsService.incrementPublicLandingViews();

    return {
      renderId: metadata.renderId,
      html,
    };
  }

  async getMetadataByToken(token: string, requireActive = false): Promise<RenderMetadata> {
    const metadata = await this.metadataRepository.readMetadataByToken(token);

    if (requireActive) {
      this.ensureTokenIsActive(metadata);
    }

    return metadata;
  }

  async getPdfByToken(token: string): Promise<Buffer | null> {
    const metadata = await this.getMetadataByToken(token, true);
    const existingPdf = await this.artifactRepository.readPdf(metadata.renderId);
    await this.analyticsRepository.recordPublicationAccess({
      renderId: metadata.renderId,
      token,
      accessType: 'pdf_request',
    });
    await this.analyticsRepository.incrementAggregateMetric('pdf_requests_total');
    this.metricsService.incrementPdfRequests();

    if (existingPdf) {
      return existingPdf;
    }

    const html = await this.artifactRepository.readLandingHtml(metadata.renderId);
    const generatedPdf = await this.pdfRenderer.render(html, metadata);

    if (!generatedPdf) {
      return null;
    }

    await this.artifactRepository.persistPdf(metadata.renderId, generatedPdf);
    metadata.artifacts.pdf = `outputs/${metadata.renderId}/landing.pdf`;
    await this.artifactManifestRepository.saveArtifactManifest(metadata);
    await this.metadataRepository.saveMetadata(metadata);
    return generatedPdf;
  }

  private ensureTokenIsActive(metadata: RenderMetadata): void {
    if (!metadata.expiresAt) {
      return;
    }

    const expiresAt = new Date(metadata.expiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      throw new GoneException(`La landing para el token ${metadata.token} esta vencida`);
    }
  }
}
