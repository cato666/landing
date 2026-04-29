import assert from 'node:assert/strict';
import test from 'node:test';
import { PlaceholderPdfRendererService } from './placeholder-pdf-renderer.service';
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
      input: 'outputs/render-1/input.json',
      canonical: 'outputs/render-1/canonical.json',
      html: 'outputs/render-1/landing.html',
      metadata: 'outputs/render-1/metadata.json',
      events: 'outputs/render-1/events.json',
      pdf: null,
    },
  };
}

test('PlaceholderPdfRendererService devuelve null si el modo no esta habilitado', async () => {
  delete process.env.LANDING_PDF_MODE;
  const service = new PlaceholderPdfRendererService();

  const pdf = await service.render('<html></html>', createMetadata());

  assert.equal(pdf, null);
});

test('PlaceholderPdfRendererService genera un PDF simple en modo placeholder', async () => {
  process.env.LANDING_PDF_MODE = 'placeholder';
  const service = new PlaceholderPdfRendererService();

  const pdf = await service.render('<html></html>', createMetadata());

  assert.ok(pdf);
  assert.match(pdf?.toString('utf8') ?? '', /%PDF-1.4/);
  delete process.env.LANDING_PDF_MODE;
});