import { Injectable, Logger } from '@nestjs/common';
import Handlebars from 'handlebars';
import { randomUUID } from 'crypto';
import { JsonNormalizationService } from './json-normalization.service';
import { LandingArtifactRepository } from '../repositories/landing-artifact.repository';
import { LandingArtifactManifestRepository } from '../repositories/landing-artifact-manifest.repository';
import { LandingMetadataRepository } from '../repositories/landing-metadata.repository';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';
import { TemplateRepositoryService } from '../repositories/template-repository.service';
import { RenderLandingDto } from '../dtos/render-landing.dto';
import { RenderMetadata } from '../types/render-metadata.type';
import { registerHandlebarsHelpers } from '../templates/helpers/handlebars-helpers';
import { TemplateContextService } from './template-context.service';
import { MetricsService } from '../../../common/observability/metrics.service';

@Injectable()
export class LandingRenderService {
  private readonly logger = new Logger(LandingRenderService.name);

  constructor(
    private readonly normalizationService: JsonNormalizationService,
    private readonly templateRepository: TemplateRepositoryService,
    private readonly outputRepository: LandingArtifactRepository,
    private readonly artifactManifestRepository: LandingArtifactManifestRepository,
    private readonly metadataRepository: LandingMetadataRepository,
    private readonly analyticsRepository: PublicationAnalyticsRepository,
    private readonly templateContextService: TemplateContextService,
    private readonly metricsService: MetricsService,
  ) {
    registerHandlebarsHelpers();
  }

  async render(request: RenderLandingDto): Promise<RenderMetadata> {
    this.metricsService.incrementRenderRequests();
    await this.analyticsRepository.incrementAggregateMetric('render_requests_total');
    const renderId = randomUUID();
    const token = randomUUID().replace(/-/g, '');
    const createdAt = new Date();
    const expiresAt = this.resolveExpiration(request, createdAt);
    const canonical = this.normalizationService.normalize(request.data);
    const template = await this.templateRepository.getTemplate(request.templateCode, request.templateVersion);
    const renderContext = this.templateContextService.buildContext(
      template.code,
      template.version,
      canonical,
    );

    const compiled = Handlebars.compile(template.content);
    const html = compiled(renderContext);

    const metadata: RenderMetadata = {
      renderId,
      token,
      templateCode: template.code,
      templateVersion: template.version,
      createdAt: createdAt.toISOString(),
      expiresAt,
      status: 'generated',
      artifacts: {
        input: `outputs/${renderId}/input.json`,
        canonical: `outputs/${renderId}/canonical.json`,
        html: `outputs/${renderId}/landing.html`,
        metadata: `outputs/${renderId}/metadata.json`,
        events: `outputs/${renderId}/events.json`,
        pdf: null,
      },
    };

    await this.outputRepository.persistRenderArtifacts({
      renderId,
      input: request.data,
      canonical,
      html,
      metadata,
    });
    await this.artifactManifestRepository.saveArtifactManifest(metadata);
    await this.metadataRepository.saveMetadata(metadata);

    this.logger.log(`Render generado renderId=${renderId} token=${token} template=${template.code}@${template.version}`);
    return metadata;
  }

  private resolveExpiration(request: RenderLandingDto, createdAt: Date): string | null {
    if (request.expiresAt) {
      return new Date(request.expiresAt).toISOString();
    }

    const configuredTtlDays = Number(process.env.LANDING_TOKEN_TTL_DAYS ?? '');
    if (!Number.isFinite(configuredTtlDays) || configuredTtlDays <= 0) {
      return null;
    }

    const expiresAt = new Date(createdAt);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + configuredTtlDays);
    return expiresAt.toISOString();
  }

  async renderBatch(requests: RenderLandingDto[]) {
    const results = await Promise.allSettled(requests.map((item) => this.render(item)));

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          index,
          success: true,
          renderId: result.value.renderId,
          token: result.value.token,
          templateVersion: result.value.templateVersion,
          publicUrl: `/api/v1/public/landing/${result.value.token}`,
        };
      }

      return {
        index,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Error desconocido',
      };
    });
  }
}
