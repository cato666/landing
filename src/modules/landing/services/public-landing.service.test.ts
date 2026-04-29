import assert from 'node:assert/strict';
import test from 'node:test';
import { GoneException } from '@nestjs/common';
import { PublicLandingService } from './public-landing.service';
import { PdfRendererService } from './pdf-renderer.service';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';
import { RenderMetadata } from '../types/render-metadata.type';
import { MetricsService } from '../../../common/observability/metrics.service';

function createMetadata(expiresAt: string | null): RenderMetadata {
  return {
    renderId: 'render-1',
    token: 'token-1',
    templateCode: 'landing-poliza-mvp-ptbr-v2',
    templateVersion: 'v1',
    createdAt: '2026-04-18T10:00:00.000Z',
    expiresAt,
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

test('PublicLandingService permite token vigente', async () => {
  const metadata = createMetadata('2099-01-01T00:00:00.000Z');
  const outputRepository = {
    readMetadataByToken: async () => metadata,
    readLandingHtml: async () => '<html></html>',
  };
  const service = new PublicLandingService(
    outputRepository as any,
    outputRepository as any,
    { saveArtifactManifest: async () => undefined } as any,
    {
      recordPublicationAccess: async () => undefined,
      incrementAggregateMetric: async () => undefined,
      getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
      listMetricTotals: async () => [],
      getMetricSeries: async () => [],
    } as PublicationAnalyticsRepository,
    { render: async () => null } as PdfRendererService,
    new MetricsService(),
  );

  const landing = await service.getLandingByToken('token-1');

  assert.equal(landing.renderId, 'render-1');
  assert.equal(landing.html, '<html></html>');
});

test('PublicLandingService bloquea token vencido con GoneException', async () => {
  const metadata = createMetadata('2020-01-01T00:00:00.000Z');
  const outputRepository = {
    readMetadataByToken: async () => metadata,
    readLandingHtml: async () => '<html></html>',
  };
  const service = new PublicLandingService(
    outputRepository as any,
    outputRepository as any,
    { saveArtifactManifest: async () => undefined } as any,
    {
      recordPublicationAccess: async () => undefined,
      incrementAggregateMetric: async () => undefined,
      getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
      listMetricTotals: async () => [],
      getMetricSeries: async () => [],
    } as PublicationAnalyticsRepository,
    { render: async () => null } as PdfRendererService,
    new MetricsService(),
  );

  await assert.rejects(() => service.getLandingByToken('token-1'), (error: unknown) => {
    assert.ok(error instanceof GoneException);
    return true;
  });
});

test('PublicLandingService genera y persiste PDF cuando no existe', async () => {
  const metadata = createMetadata('2099-01-01T00:00:00.000Z');
  let persistedPdf: Buffer | null = null;
  const outputRepository = {
    readMetadataByToken: async () => metadata,
    readLandingHtml: async () => '<html></html>',
    readPdf: async () => null,
    persistPdf: async (_renderId: string, pdf: Buffer) => {
      persistedPdf = pdf;
      return 'outputs/render-1/landing.pdf';
    },
  };
  const service = new PublicLandingService(
    {
      readMetadataByToken: async () => metadata,
      saveMetadata: async () => undefined,
    } as any,
    outputRepository as any,
    { saveArtifactManifest: async () => undefined } as any,
    {
      recordPublicationAccess: async () => undefined,
      incrementAggregateMetric: async () => undefined,
      getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
      listMetricTotals: async () => [],
      getMetricSeries: async () => [],
    } as PublicationAnalyticsRepository,
    { render: async () => Buffer.from('%PDF-1.4', 'utf8') } as PdfRendererService,
    new MetricsService(),
  );

  const pdf = await service.getPdfByToken('token-1');

  assert.match(pdf?.toString('utf8') ?? '', /%PDF-1.4/);
  assert.ok(persistedPdf);
});

test('PublicLandingService sincroniza metadata cuando genera PDF', async () => {
  const metadata = createMetadata('2099-01-01T00:00:00.000Z');
  let savedMetadata: any = null;
  const outputRepository = {
    readLandingHtml: async () => '<html></html>',
    readPdf: async () => null,
    persistPdf: async () => 'outputs/render-1/landing.pdf',
  };
  const metadataRepository = {
    readMetadataByToken: async () => metadata,
    saveMetadata: async (value: RenderMetadata) => {
      savedMetadata = value;
    },
  };
  const service = new PublicLandingService(
    metadataRepository as any,
    outputRepository as any,
    { saveArtifactManifest: async () => undefined } as any,
    {
      recordPublicationAccess: async () => undefined,
      incrementAggregateMetric: async () => undefined,
      getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
      listMetricTotals: async () => [],
      getMetricSeries: async () => [],
    } as PublicationAnalyticsRepository,
    { render: async () => Buffer.from('%PDF-1.4', 'utf8') } as PdfRendererService,
    new MetricsService(),
  );

  await service.getPdfByToken('token-1');

  assert.equal(savedMetadata?.artifacts.pdf, 'outputs/render-1/landing.pdf');
});