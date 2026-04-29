import { RenderMetadata } from '../types/render-metadata.type';

export abstract class PdfRendererService {
  abstract render(html: string, metadata: RenderMetadata): Promise<Buffer | null>;
}