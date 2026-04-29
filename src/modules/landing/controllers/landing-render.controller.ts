import { Body, Controller, Post } from '@nestjs/common';
import { JsonValidationService } from '../services/json-validation.service';
import { LandingRenderService } from '../services/landing-render.service';

@Controller('landings')
export class LandingRenderController {
  constructor(
    private readonly validationService: JsonValidationService,
    private readonly landingRenderService: LandingRenderService,
  ) {}

  @Post('render')
  async render(@Body() body: unknown) {
    const request = this.validationService.validateRenderRequest(body);
    const metadata = await this.landingRenderService.render(request);

    return {
      renderId: metadata.renderId,
      token: metadata.token,
      templateCode: metadata.templateCode,
      templateVersion: metadata.templateVersion,
      expiresAt: metadata.expiresAt,
      publicUrl: `/api/v1/public/landing/${metadata.token}`,
      artifacts: {
        html: true,
        input: true,
        canonical: true,
        metadata: true,
        events: true,
        pdf: false,
      },
    };
  }

  @Post('render-batch')
  async renderBatch(@Body() body: unknown) {
    const request = this.validationService.validateRenderBatchRequest(body);
    return {
      items: await this.landingRenderService.renderBatch(request.items),
    };
  }
}
