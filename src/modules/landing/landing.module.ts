import { Module } from '@nestjs/common';
import { getArtifactStorageBackend, usePrismaRepositories } from '../../common/config/database-config';
import { PrismaService } from '../../common/config/prisma.service';
import { ObservabilityModule } from '../../common/observability/observability.module';
import { ArtifactStorageService } from '../../common/storage/artifact-storage.service';
import { LocalFilesystemStorageService } from '../../common/storage/local-filesystem-storage.service';
import { S3CompatibleArtifactStorageService } from '../../common/storage/s3-compatible-artifact-storage.service';
import { StorageService } from '../../common/storage/storage.service';
import { LandingRenderController } from './controllers/landing-render.controller';
import { AnalyticsReportingController } from './controllers/analytics-reporting.controller';
import { PublicLandingController } from './controllers/public-landing.controller';
import { LandingArtifactManifestRepository } from './repositories/landing-artifact-manifest.repository';
import { LandingArtifactRepository } from './repositories/landing-artifact.repository';
import { LandingEventRepository } from './repositories/landing-event.repository';
import { LandingMetadataRepository } from './repositories/landing-metadata.repository';
import { NoopLandingArtifactManifestRepository } from './repositories/noop-landing-artifact-manifest.repository';
import { NoopPublicationAnalyticsRepository } from './repositories/noop-publication-analytics.repository';
import { OutputRepositoryService } from './repositories/output-repository.service';
import { PrismaLandingArtifactManifestRepository } from './repositories/prisma-landing-artifact-manifest.repository';
import { PrismaLandingEventRepository } from './repositories/prisma-landing-event.repository';
import { PrismaLandingMetadataRepository } from './repositories/prisma-landing-metadata.repository';
import { PrismaPublicationAnalyticsRepository } from './repositories/prisma-publication-analytics.repository';
import { PublicationAnalyticsRepository } from './repositories/publication-analytics.repository';
import { TemplateRepositoryService } from './repositories/template-repository.service';
import { ConfigurablePdfRendererService } from './services/configurable-pdf-renderer.service';
import { JsonNormalizationService } from './services/json-normalization.service';
import { JsonValidationService } from './services/json-validation.service';
import { LandingRenderService } from './services/landing-render.service';
import { AnalyticsReportingService } from './services/analytics-reporting.service';
import { PdfRendererService } from './services/pdf-renderer.service';
import { PlaceholderPdfRendererService } from './services/placeholder-pdf-renderer.service';
import { PuppeteerPdfRendererService } from './services/puppeteer-pdf-renderer.service';
import { PortoPolicyTemplateContextBuilder } from './services/porto-policy-template-context.builder';
import { PublicLandingService } from './services/public-landing.service';
import { TemplateContextService } from './services/template-context.service';
import { TrackingService } from './services/tracking.service';
import { ArtifactCleanupService } from './services/artifact-cleanup.service';

@Module({
  imports: [ObservabilityModule],
  controllers: [LandingRenderController, PublicLandingController, AnalyticsReportingController],
  providers: [
    JsonValidationService,
    JsonNormalizationService,
    LocalFilesystemStorageService,
    S3CompatibleArtifactStorageService,
    {
      provide: StorageService,
      useExisting: LocalFilesystemStorageService,
    },
    {
      provide: ArtifactStorageService,
      useFactory: (
        filesystemStorage: LocalFilesystemStorageService,
        s3Storage: S3CompatibleArtifactStorageService,
      ) => (getArtifactStorageBackend() === 's3' ? s3Storage : filesystemStorage),
      inject: [LocalFilesystemStorageService, S3CompatibleArtifactStorageService],
    },
    TemplateRepositoryService,
    OutputRepositoryService,
    {
      provide: LandingArtifactRepository,
      useExisting: OutputRepositoryService,
    },
    {
      provide: LandingArtifactManifestRepository,
      useFactory: (
        prismaRepository: PrismaLandingArtifactManifestRepository,
        noopRepository: NoopLandingArtifactManifestRepository,
      ) => (usePrismaRepositories() ? prismaRepository : noopRepository),
      inject: [PrismaLandingArtifactManifestRepository, NoopLandingArtifactManifestRepository],
    },
    {
      provide: LandingMetadataRepository,
      useFactory: (
        outputRepository: OutputRepositoryService,
        prismaRepository: PrismaLandingMetadataRepository,
      ) => (usePrismaRepositories() ? prismaRepository : outputRepository),
      inject: [OutputRepositoryService, PrismaLandingMetadataRepository],
    },
    {
      provide: LandingEventRepository,
      useFactory: (
        outputRepository: OutputRepositoryService,
        prismaRepository: PrismaLandingEventRepository,
      ) => (usePrismaRepositories() ? prismaRepository : outputRepository),
      inject: [OutputRepositoryService, PrismaLandingEventRepository],
    },
    LandingRenderService,
    AnalyticsReportingService,
    PuppeteerPdfRendererService,
    {
      provide: PdfRendererService,
      useClass: ConfigurablePdfRendererService,
    },
    ConfigurablePdfRendererService,
    PlaceholderPdfRendererService,
    PrismaService,
    NoopLandingArtifactManifestRepository,
    PrismaLandingArtifactManifestRepository,
    PrismaLandingMetadataRepository,
    PrismaLandingEventRepository,
    NoopPublicationAnalyticsRepository,
    PrismaPublicationAnalyticsRepository,
    {
      provide: PublicationAnalyticsRepository,
      useFactory: (
        prismaRepository: PrismaPublicationAnalyticsRepository,
        noopRepository: NoopPublicationAnalyticsRepository,
      ) => (usePrismaRepositories() ? prismaRepository : noopRepository),
      inject: [PrismaPublicationAnalyticsRepository, NoopPublicationAnalyticsRepository],
    },
    PortoPolicyTemplateContextBuilder,
    PublicLandingService,
    TemplateContextService,
    TrackingService,
    ArtifactCleanupService,
  ],
})
export class LandingModule {}
