import assert from 'node:assert/strict';
import test from 'node:test';
import { LandingRenderService } from './landing-render.service';
import { JsonNormalizationService } from './json-normalization.service';
import { LandingArtifactManifestRepository } from '../repositories/landing-artifact-manifest.repository';
import { LandingMetadataRepository } from '../repositories/landing-metadata.repository';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';
import { TemplateContextService } from './template-context.service';
import { RenderMetadata } from '../types/render-metadata.type';
import { MetricsService } from '../../../common/observability/metrics.service';

test('LandingRenderService persiste artefactos y metadata con expiracion', async () => {
  const persisted: Array<{
    renderId: string;
    html: string;
    metadata: RenderMetadata;
  }> = [];
  const savedManifests: RenderMetadata[] = [];
  const savedMetadata: RenderMetadata[] = [];

  const service = new LandingRenderService(
    new JsonNormalizationService(),
    {
      getTemplate: async () => ({
        code: 'landing-poliza-mvp-ptbr-v2',
        version: 'v1',
        content: '<html><body>{{cliente.nome}}</body></html>',
      }),
    } as never,
    {
      persistRenderArtifacts: async (payload: {
        renderId: string;
        html: string;
        metadata: RenderMetadata;
      }) => {
        persisted.push(payload);
      },
    } as any,
    {
      saveArtifactManifest: async (metadata: RenderMetadata) => {
        savedManifests.push(metadata);
      },
    } as LandingArtifactManifestRepository,
    {
      saveMetadata: async (metadata: RenderMetadata) => {
        savedMetadata.push(metadata);
      },
      readMetadataByToken: async () => {
        throw new Error('not needed');
      },
    } as LandingMetadataRepository,
    {
      incrementAggregateMetric: async () => undefined,
      recordPublicationAccess: async () => undefined,
      getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
      listMetricTotals: async () => [],
      getMetricSeries: async () => [],
    } as PublicationAnalyticsRepository,
    new TemplateContextService({
      supports: () => false,
      build: () => ({}),
    } as never),
    new MetricsService(),
  );

  const metadata = await service.render({
    templateCode: 'landing-poliza-mvp-ptbr-v2',
    expiresAt: '2027-04-18T23:59:59.000Z',
    data: {
      cliente: { nome: 'Maria Silva' },
      poliza: {
        numero: 'PS-1',
        vigenciaDesde: '2026-04-13',
        vigenciaHasta: '2027-04-12',
      },
      vehiculo: { modelo: 'Corolla', placa: 'ABCD123' },
      coberturas: [{ titulo: 'Cobertura total' }],
    },
  });

  assert.equal(persisted.length, 1);
  assert.equal(savedManifests.length, 1);
  assert.equal(savedMetadata.length, 1);
  assert.equal(metadata.expiresAt, '2027-04-18T23:59:59.000Z');
  assert.equal(persisted[0]?.metadata.expiresAt, '2027-04-18T23:59:59.000Z');
  assert.equal(savedMetadata[0]?.token, metadata.token);
  assert.match(persisted[0]?.html ?? '', /Maria Silva/);
  assert.equal(persisted[0]?.metadata.artifacts.pdf, null);
});

test('LandingRenderService calcula expiracion desde LANDING_TOKEN_TTL_DAYS', async () => {
  process.env.LANDING_TOKEN_TTL_DAYS = '2';

  const service = new LandingRenderService(
    new JsonNormalizationService(),
    {
      getTemplate: async () => ({
        code: 'landing-poliza-mvp-ptbr-v2',
        version: 'v1',
        content: '<html></html>',
      }),
    } as never,
    {
      persistRenderArtifacts: async () => undefined,
    } as any,
    {
      saveArtifactManifest: async () => undefined,
    } as LandingArtifactManifestRepository,
    {
      saveMetadata: async () => undefined,
      readMetadataByToken: async () => {
        throw new Error('not needed');
      },
    } as LandingMetadataRepository,
    {
      incrementAggregateMetric: async () => undefined,
      recordPublicationAccess: async () => undefined,
      getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
      listMetricTotals: async () => [],
      getMetricSeries: async () => [],
    } as PublicationAnalyticsRepository,
    new TemplateContextService({
      supports: () => false,
      build: () => ({}),
    } as never),
    new MetricsService(),
  );

  const metadata = await service.render({
    templateCode: 'landing-poliza-mvp-ptbr-v2',
    data: {
      cliente: { nome: 'Maria Silva' },
      poliza: {
        numero: 'PS-1',
        vigenciaDesde: '2026-04-13',
        vigenciaHasta: '2027-04-12',
      },
      vehiculo: { modelo: 'Corolla', placa: 'ABCD123' },
      coberturas: [{ titulo: 'Cobertura total' }],
    },
  });

  assert.ok(metadata.expiresAt);
  delete process.env.LANDING_TOKEN_TTL_DAYS;
});