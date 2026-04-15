import { Injectable } from '@nestjs/common';
import { CanonicalLandingModel } from '../types/canonical-landing.model';
import { PortoPolicyTemplateContextBuilder } from './porto-policy-template-context.builder';

@Injectable()
export class TemplateContextService {
  constructor(private readonly portoPolicyBuilder: PortoPolicyTemplateContextBuilder) {}

  buildContext(
    templateCode: string,
    templateVersion: string,
    canonical: CanonicalLandingModel,
  ): Record<string, unknown> {
    const builders = [this.portoPolicyBuilder];
    const builder = builders.find((candidate) => candidate.supports(templateCode, templateVersion));

    return builder ? builder.build(canonical) : (canonical as unknown as Record<string, unknown>);
  }
}
