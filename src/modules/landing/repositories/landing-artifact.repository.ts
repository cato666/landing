import { RenderMetadata } from '../types/render-metadata.type';

export abstract class LandingArtifactRepository {
  abstract persistRenderArtifacts(params: {
    renderId: string;
    input: Record<string, unknown>;
    canonical: object;
    html: string;
    metadata: RenderMetadata;
  }): Promise<void>;

  abstract persistPdf(renderId: string, pdf: Buffer): Promise<string>;
  abstract readLandingHtml(renderId: string): Promise<string>;
  abstract readPdf(renderId: string): Promise<Buffer | null>;
}