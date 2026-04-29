import { Injectable, Logger } from '@nestjs/common';
import { LandingEventRepository } from '../repositories/landing-event.repository';
import { LandingMetadataRepository } from '../repositories/landing-metadata.repository';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';
import { TrackEventDto } from '../dtos/track-event.dto';
import { LandingEvent } from '../types/render-metadata.type';
import { MetricsService } from '../../../common/observability/metrics.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly metadataRepository: LandingMetadataRepository,
    private readonly eventRepository: LandingEventRepository,
    private readonly analyticsRepository: PublicationAnalyticsRepository,
    private readonly metricsService: MetricsService,
  ) {}

  async track(token: string, input: TrackEventDto): Promise<LandingEvent[]> {
    const metadata = await this.metadataRepository.readMetadataByToken(token);
    await this.analyticsRepository.recordPublicationAccess({
      renderId: metadata.renderId,
      token,
      accessType: 'tracking_event',
    });
    return this.trackByRenderId(metadata.renderId, input);
  }

  async trackByRenderId(renderId: string, input: TrackEventDto): Promise<LandingEvent[]> {
    const event: LandingEvent = {
      type: input.type,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      payload: input.payload ?? {},
    };

    const events = await this.eventRepository.appendEvent(renderId, event);
    await this.analyticsRepository.incrementAggregateMetric('tracking_events_total');
    this.metricsService.incrementTrackingEvents();
    this.logger.log(`Evento registrado renderId=${renderId} type=${event.type}`);
    return events;
  }
}
