import assert from 'node:assert/strict';
import test from 'node:test';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MetricsService } from '../observability/metrics.service';

test('HealthController expone liveness simple', () => {
  const controller = new HealthController(new MetricsService(), {
    getReadiness: async () => ({ status: 'ready' }),
  } as HealthService);

  const response = controller.getLiveness();

  assert.equal(response.status, 'alive');
});

test('HealthController devuelve estado y metricas actuales', () => {
  const metrics = new MetricsService();
  metrics.incrementRenderRequests();
  metrics.incrementTrackingEvents();
  const controller = new HealthController(metrics, {
    getReadiness: async () => ({ status: 'ready' }),
  } as HealthService);

  const response = controller.getHealth();

  assert.equal(response.status, 'ok');
  assert.equal(response.metrics.renderRequests, 1);
  assert.equal(response.metrics.trackingEvents, 1);
});

test('HealthController expone metricas en formato Prometheus', () => {
  const metrics = new MetricsService();
  metrics.incrementPdfRequests();
  const controller = new HealthController(metrics, {
    getReadiness: async () => ({ status: 'ready' }),
  } as HealthService);

  const response = controller.getMetrics();

  assert.match(response, /porto_pdf_requests_total 1/);
});

test('HealthController expone readiness', async () => {
  const controller = new HealthController(new MetricsService(), {
    getReadiness: async () => ({
      status: 'ready',
      checks: { storage: 'ok', artifactStorageBackend: 'filesystem', templates: 'ok', database: 'disabled' },
    }),
  } as HealthService);

  const response = await controller.getReadiness();

  assert.equal(response.status, 'ready');
});