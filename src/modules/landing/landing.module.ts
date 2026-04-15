import { Module } from '@nestjs/common';
import { LandingRenderController } from './controllers/landing-render.controller';
import { PublicLandingController } from './controllers/public-landing.controller';
import { OutputRepositoryService } from './repositories/output-repository.service';
import { TemplateRepositoryService } from './repositories/template-repository.service';
import { JsonNormalizationService } from './services/json-normalization.service';
import { JsonValidationService } from './services/json-validation.service';
import { LandingRenderService } from './services/landing-render.service';
import { PortoPolicyTemplateContextBuilder } from './services/porto-policy-template-context.builder';
import { PublicLandingService } from './services/public-landing.service';
import { TemplateContextService } from './services/template-context.service';
import { TrackingService } from './services/tracking.service';

@Module({
  controllers: [LandingRenderController, PublicLandingController],
  providers: [
    JsonValidationService,
    JsonNormalizationService,
    TemplateRepositoryService,
    OutputRepositoryService,
    LandingRenderService,
    PortoPolicyTemplateContextBuilder,
    PublicLandingService,
    TemplateContextService,
    TrackingService,
  ],
})
export class LandingModule {}
