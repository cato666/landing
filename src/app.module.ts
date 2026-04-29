import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './common/health/health.controller';
import { HealthService } from './common/health/health.service';
import { ObservabilityModule } from './common/observability/observability.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CorrelationIdMiddleware } from './common/observability/correlation-id.middleware';
import { resolvePublicRoot } from './common/config/path-config';
import { PrismaService } from './common/config/prisma.service';
import { ArtifactStorageService } from './common/storage/artifact-storage.service';
import { LocalFilesystemStorageService } from './common/storage/local-filesystem-storage.service';
import { StorageService } from './common/storage/storage.service';
import { LandingModule } from './modules/landing/landing.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolvePublicRoot(),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute (for general endpoints)
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 300, // 300 requests per 15 minutes (for intensive operations like PDF)
      },
    ]),
    ScheduleModule.forRoot(),
    ObservabilityModule,
    LandingModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    HealthService,
    PrismaService,
    LocalFilesystemStorageService,
    {
      provide: StorageService,
      useExisting: LocalFilesystemStorageService,
    },
    {
      provide: ArtifactStorageService,
      useExisting: LocalFilesystemStorageService,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
