import { Injectable, Logger } from '@nestjs/common';
import { PdfRendererService } from './pdf-renderer.service';
import { RenderMetadata } from '../types/render-metadata.type';

@Injectable()
export class PuppeteerPdfRendererService implements PdfRendererService {
  private readonly logger = new Logger(PuppeteerPdfRendererService.name);

  async render(html: string, metadata: RenderMetadata): Promise<Buffer | null> {
    const mode = process.env.LANDING_PDF_MODE ?? 'puppeteer';
    if (mode !== 'puppeteer') {
      return null;
    }

    const puppeteerModule = await import('puppeteer');
    const launchOptions: Parameters<typeof puppeteerModule.default.launch>[0] = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteerModule.default.launch(launchOptions);

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm',
        },
      });

      this.logger.log(`PDF generado renderId=${metadata.renderId} template=${metadata.templateCode}@${metadata.templateVersion}`);
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}