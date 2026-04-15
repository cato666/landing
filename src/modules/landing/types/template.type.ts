import { CanonicalLandingModel } from './canonical-landing.model';

export interface ResolvedTemplate {
  code: string;
  version: string;
  content: string;
}

export interface TemplateContextBuilder {
  supports(templateCode: string, templateVersion: string): boolean;
  build(canonical: CanonicalLandingModel): Record<string, unknown>;
}
