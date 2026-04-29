import assert from 'node:assert/strict';
import test from 'node:test';
import { PuppeteerPdfRendererService } from './puppeteer-pdf-renderer.service';
import { RenderMetadata } from '../types/render-metadata.type';

function createMetadata(): RenderMetadata {
  return {
    renderId: 'render-1',
    token: 'token-1',
    templateCode: 'landing-poliza-mvp-ptbr-v2',
    templateVersion: 'v1',
    createdAt: '2026-04-18T10:00:00.000Z',
    expiresAt: null,
    status: 'generated',
    artifacts: {
      input: '',
      canonical: '',
      html: '',
      metadata: '',
      events: '',
      pdf: null,
    },
  };
}

test('PuppeteerPdfRendererService genera PDF real cuando el modo es puppeteer', { timeout: 30000 }, async () => {
  process.env.LANDING_PDF_MODE = 'puppeteer';
  const service = new PuppeteerPdfRendererService();

  const pdf = await service.render('<html><body><h1>Porto</h1></body></html>', createMetadata());

  assert.ok(pdf);
  assert.match(pdf?.toString('utf8', 0, 8) ?? '', /%PDF-1.4|%PDF-1.7/);
  delete process.env.LANDING_PDF_MODE;
});