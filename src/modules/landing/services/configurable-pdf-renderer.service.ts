import { Injectable } from '@nestjs/common';
import { PdfRendererService } from './pdf-renderer.service';
import { RenderMetadata } from '../types/render-metadata.type';
import { PlaceholderPdfRendererService } from './placeholder-pdf-renderer.service';
import { PuppeteerPdfRendererService } from './puppeteer-pdf-renderer.service';

@Injectable()
export class ConfigurablePdfRendererService implements PdfRendererService {
  constructor(
    private readonly puppeteerRenderer: PuppeteerPdfRendererService,
    private readonly placeholderRenderer: PlaceholderPdfRendererService,
  ) {}

  async render(html: string, metadata: RenderMetadata): Promise<Buffer | null> {
    const mode = process.env.LANDING_PDF_MODE ?? 'puppeteer';

    if (mode === 'placeholder') {
      return this.placeholderRenderer.render(html, metadata);
    }

    return this.puppeteerRenderer.render(html, metadata);
  }
}