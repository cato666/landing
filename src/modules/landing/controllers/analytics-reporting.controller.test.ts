import assert from 'node:assert/strict';
import test from 'node:test';
import { AnalyticsReportingController } from './analytics-reporting.controller';

test('AnalyticsReportingController devuelve listado de metricas', async () => {
  const controller = new AnalyticsReportingController({
    getMetricTotals: async () => ({
      enabled: true,
      backend: 'prisma',
      from: '2026-04-01',
      to: '2026-04-18',
      items: [{ metricName: 'render_requests_total', total: 3, buckets: 2, lastBucketDate: '2026-04-18' }],
    }),
    getMetricSeries: async () => ({
      enabled: true,
      backend: 'prisma',
      metricName: 'render_requests_total',
      from: '2026-04-01',
      to: '2026-04-18',
      points: [],
    }),
  } as never);

  const response = await controller.getMetricTotals('2026-04-01', '2026-04-18');

  assert.equal(response.enabled, true);
  assert.equal(response.items[0]?.metricName, 'render_requests_total');
});

test('AnalyticsReportingController devuelve serie por metrica', async () => {
  const controller = new AnalyticsReportingController({
    getMetricTotals: async () => ({ enabled: false, backend: 'noop', from: '2026-04-01', to: '2026-04-18', items: [] }),
    getMetricSeries: async () => ({
      enabled: true,
      backend: 'prisma',
      metricName: 'public_landing_views_total',
      from: '2026-04-01',
      to: '2026-04-18',
      points: [{ bucketDate: '2026-04-18', value: 2 }],
    }),
  } as never);

  const response = await controller.getMetricSeries('public_landing_views_total', '2026-04-01', '2026-04-18');

  assert.equal(response.metricName, 'public_landing_views_total');
  assert.equal(response.points[0]?.value, 2);
});