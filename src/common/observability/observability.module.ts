import { Global, Module } from '@nestjs/common';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { GlobalExceptionFilter } from './global-exception.filter';
import { LoggingInterceptor } from './logging.interceptor';
import { MetricsService } from './metrics.service';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  providers: [
    RequestContextService,
    MetricsService,
    CorrelationIdMiddleware,
    LoggingInterceptor,
    GlobalExceptionFilter,
  ],
  exports: [
    RequestContextService,
    MetricsService,
    CorrelationIdMiddleware,
    LoggingInterceptor,
    GlobalExceptionFilter,
  ],
})
export class ObservabilityModule {}