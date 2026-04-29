import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { AnalyticsReportingService } from './analytics-reporting.service';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';

function createRepositoryStub(): PublicationAnalyticsRepository {
  return {
    recordPublicationAccess: async () => undefined,
    incrementAggregateMetric: async () => undefined,
    getReportingStatus: async () => ({ enabled: false, backend: 'noop' }),
    listMetricTotals: async () => [],
    getMetricSeries: async () => [],
  } as PublicationAnalyticsRepository;
}

test('AnalyticsReportingService devuelve rango por defecto y reporting deshabilitado en noop', async () => {
  const service = new AnalyticsReportingService(createRepositoryStub());

  const result = await service.getMetricTotals();

  assert.equal(result.enabled, false);
  assert.equal(result.backend, 'noop');
  assert.deepEqual(result.items, []);
  assert.match(result.from, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(result.to, /^\d{4}-\d{2}-\d{2}$/);
});

test('AnalyticsReportingService rechaza fechas invalidas', async () => {
  const service = new AnalyticsReportingService(createRepositoryStub());

  await assert.rejects(() => service.getMetricTotals({ from: 'no-date' }), (error: unknown) => {
    assert.ok(error instanceof BadRequestException);
    assert.match(error.message, /from debe ser una fecha ISO valida/);
    return true;
  });
});

test('AnalyticsReportingService rechaza rango invertido', async () => {
  const service = new AnalyticsReportingService(createRepositoryStub());

  await assert.rejects(
    () => service.getMetricSeries('render_requests_total', { from: '2026-04-18', to: '2026-04-10' }),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.match(error.message, /from no puede ser mayor que to/);
      return true;
    },
  );
});