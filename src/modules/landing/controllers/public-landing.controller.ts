import { Body, Controller, Get, Header, NotFoundException, Param, Post } from '@nestjs/common';
import { JsonValidationService } from '../services/json-validation.service';
import { PublicLandingService } from '../services/public-landing.service';
import { TrackingService } from '../services/tracking.service';

@Controller('public/landing')
export class PublicLandingController {
  constructor(
    private readonly validationService: JsonValidationService,
    private readonly publicLandingService: PublicLandingService,
    private readonly trackingService: TrackingService,
  ) {}

  @Get(':token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getLanding(@Param('token') token: string): Promise<string> {
    return this.publicLandingService.getLandingByToken(token);
  }

  @Post(':token/events')
  async trackEvent(@Param('token') token: string, @Body() body: unknown) {
    const event = this.validationService.validateTrackEventRequest(body);
    const events = await this.trackingService.track(token, event);

    return {
      token,
      eventsCount: events.length,
      lastEventType: event.type,
    };
  }

  @Get(':token/pdf')
  async getPdf(@Param('token') token: string) {
    await this.publicLandingService.getMetadataByToken(token);
    throw new NotFoundException('PDF todavia no generado para esta landing');
  }
}
