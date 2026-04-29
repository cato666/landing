import assert from 'node:assert/strict';
import test from 'node:test';
import { TrackingService } from './tracking.service';
import { MetricsService } from '../../../common/observability/metrics.service';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';

test('TrackingService resuelve token a renderId y persiste evento', async () => {
  const appendedEvents: Array<{ renderId: string; event: { type: string } }> = [];
  const service = new TrackingService({
    readMetadataByToken: async () => ({ renderId: 'render-1' }),
  } as any, {
    appendEvent: async (renderId: string, event: { type: string }) => {
      appendedEvents.push({ renderId, event });
      return [event];
    },
  } as any, {
    recordPublicationAccess: async () => undefined,
    incrementAggregateMetric: async () => undefined,
    getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
    listMetricTotals: async () => [],
    getMetricSeries: async () => [],
  } as PublicationAnalyticsRepository, new MetricsService());

  const events = await service.track('token-1', { type: 'cta_click' });

  assert.equal(events.length, 1);
  assert.equal(appendedEvents[0]?.renderId, 'render-1');
  assert.equal(appendedEvents[0]?.event.type, 'cta_click');
});

test('TrackingService completa payload y occurredAt por defecto', async () => {
  const service = new TrackingService({
    readMetadataByToken: async () => ({ renderId: 'render-1' }),
  } as any, {
    appendEvent: async (_renderId: string, event: { occurredAt: string; payload: Record<string, unknown> }) => [event],
  } as any, {
    recordPublicationAccess: async () => undefined,
    incrementAggregateMetric: async () => undefined,
    getReportingStatus: async () => ({ enabled: false, backend: 'noop' as const }),
    listMetricTotals: async () => [],
    getMetricSeries: async () => [],
  } as PublicationAnalyticsRepository, new MetricsService());

  const events = await service.trackByRenderId('render-1', { type: 'landing_open' });

  assert.equal(events[0]?.payload && Object.keys(events[0].payload).length, 0);
  assert.ok(events[0]?.occurredAt);
});