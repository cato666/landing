import { Injectable, Logger } from '@nestjs/common';
import { OutputRepositoryService } from '../repositories/output-repository.service';
import { TrackEventDto } from '../dtos/track-event.dto';
import { LandingEvent } from '../types/render-metadata.type';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly outputRepository: OutputRepositoryService) {}

  async track(token: string, input: TrackEventDto): Promise<LandingEvent[]> {
    const metadata = await this.outputRepository.readMetadataByToken(token);
    const event: LandingEvent = {
      type: input.type,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      payload: input.payload ?? {},
    };

    const events = await this.outputRepository.appendEvent(metadata.renderId, event);
    this.logger.log(`Evento registrado renderId=${metadata.renderId} type=${event.type}`);
    return events;
  }
}
