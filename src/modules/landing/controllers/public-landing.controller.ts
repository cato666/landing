import { Body, Controller, Get, Header, Logger, NotFoundException, Param, Post, StreamableFile } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JsonValidationService } from '../services/json-validation.service';
import { PublicLandingService } from '../services/public-landing.service';
import { TrackingService } from '../services/tracking.service';

@Controller('public/landing')
export class PublicLandingController {
  private readonly logger = new Logger(PublicLandingController.name);

  constructor(
    private readonly validationService: JsonValidationService,
    private readonly publicLandingService: PublicLandingService,
    private readonly trackingService: TrackingService,
  ) {}

  @Get(':token')
  @Throttle({ short: { limit: 60, ttl: 60000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getLanding(@Param('token') token: string): Promise<string> {
    const landing = await this.publicLandingService.getLandingByToken(token);

    try {
      await this.trackingService.trackByRenderId(landing.renderId, {
        type: 'landing_open',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`No se pudo registrar landing_open para renderId=${landing.renderId}: ${message}`);
    }

    return landing.html;
  }

  @Post(':token/events')
  @Throttle({ short: { limit: 100, ttl: 60000 } })
  async trackEvent(@Param('token') token: string, @Body() body: unknown) {
    await this.publicLandingService.getMetadataByToken(token, true);
    const event = this.validationService.validateTrackEventRequest(body);
    const events = await this.trackingService.track(token, event);

    return {
      token,
      eventsCount: events.length,
      lastEventType: event.type,
    };
  }

  @Get(':token/pdf')
  @Throttle({ long: { limit: 20, ttl: 900000 } })
  @Header('Content-Type', 'application/pdf')
  async getPdf(@Param('token') token: string): Promise<StreamableFile> {
    const pdf = await this.publicLandingService.getPdfByToken(token);

    if (!pdf) {
      throw new NotFoundException('PDF todavia no generado para esta landing');
    }

    return new StreamableFile(pdf);
  }
}
