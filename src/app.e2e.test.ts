import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import * as fs from 'fs-extra';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function createApp() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'porto-e2e-'));
  process.env.OUTPUTS_ROOT = path.join(tempRoot, 'outputs');
  process.env.TEMPLATES_ROOT = path.resolve(process.cwd(), 'templates');
  process.env.PUBLIC_ROOT = path.resolve(process.cwd(), 'public');
  process.env.LANDING_PDF_MODE = 'placeholder';
  process.env.PORT = '0';

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  await app.listen(0);

  const address = app.getHttpServer().address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    app,
    baseUrl: `http://127.0.0.1:${port}`,
    tempRoot,
  };
}

async function cleanupApp(app: Awaited<ReturnType<typeof createApp>>) {
  await app.app.close();
  await fs.remove(app.tempRoot);
  delete process.env.OUTPUTS_ROOT;
  delete process.env.TEMPLATES_ROOT;
  delete process.env.PUBLIC_ROOT;
  delete process.env.LANDING_PDF_MODE;
  delete process.env.PORT;
}

test('App HTTP flow renderiza, sirve landing, registra evento y genera PDF placeholder', async () => {
  const runtime = await createApp();

  try {
    const renderPayload = await fs.readJson(path.resolve(process.cwd(), 'examples', 'render-request.json'));
    const liveResponse = await fetch(`${runtime.baseUrl}/api/v1/live`);
    assert.equal(liveResponse.status, 200);

    const healthResponse = await fetch(`${runtime.baseUrl}/api/v1/health`);
    assert.equal(healthResponse.status, 200);

    const readinessResponse = await fetch(`${runtime.baseUrl}/api/v1/ready`);
    assert.equal(readinessResponse.status, 200);
    const readinessBody = await readinessResponse.json() as { status: string; checks: Record<string, string> };
    assert.equal(readinessBody.status, 'ready');
    assert.equal(readinessBody.checks.storage, 'ok');
    assert.equal(readinessBody.checks.templates, 'ok');

    const renderResponse = await fetch(`${runtime.baseUrl}/api/v1/landings/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(renderPayload),
    });

    assert.equal(renderResponse.status, 201);
    assert.ok(renderResponse.headers.get('x-correlation-id'));
    const renderResult = await renderResponse.json() as { token: string };
    assert.ok(renderResult.token);

    const landingResponse = await fetch(`${runtime.baseUrl}/api/v1/public/landing/${renderResult.token}`);
    assert.equal(landingResponse.status, 200);
    const landingHtml = await landingResponse.text();
    assert.match(landingHtml, /Maria Silva/);

    const eventResponse = await fetch(`${runtime.baseUrl}/api/v1/public/landing/${renderResult.token}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'cta_click' }),
    });
    assert.equal(eventResponse.status, 201);
    const eventResult = await eventResponse.json() as { eventsCount: number };
    assert.equal(eventResult.eventsCount, 2);

    const pdfResponse = await fetch(`${runtime.baseUrl}/api/v1/public/landing/${renderResult.token}/pdf`);
    assert.equal(pdfResponse.status, 200);
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    assert.match(pdfBuffer.toString('utf8'), /%PDF-1.4/);

    const metricsResponse = await fetch(`${runtime.baseUrl}/api/v1/metrics`);
    assert.equal(metricsResponse.status, 200);
    const metricsBody = await metricsResponse.text();
    assert.match(metricsBody, /porto_render_requests_total 1/);
    assert.match(metricsBody, /porto_public_landing_views_total 1/);

    const analyticsTotalsResponse = await fetch(`${runtime.baseUrl}/api/v1/analytics/metrics`);
    assert.equal(analyticsTotalsResponse.status, 200);
    const analyticsTotals = await analyticsTotalsResponse.json() as {
      enabled: boolean;
      backend: string;
      items: unknown[];
    };
    assert.equal(analyticsTotals.enabled, false);
    assert.equal(analyticsTotals.backend, 'noop');
    assert.deepEqual(analyticsTotals.items, []);

    const analyticsSeriesResponse = await fetch(`${runtime.baseUrl}/api/v1/analytics/metrics/render_requests_total`);
    assert.equal(analyticsSeriesResponse.status, 200);
    const analyticsSeries = await analyticsSeriesResponse.json() as {
      enabled: boolean;
      backend: string;
      metricName: string;
      points: unknown[];
    };
    assert.equal(analyticsSeries.enabled, false);
    assert.equal(analyticsSeries.backend, 'noop');
    assert.equal(analyticsSeries.metricName, 'render_requests_total');
    assert.deepEqual(analyticsSeries.points, []);
  } finally {
    await cleanupApp(runtime);
  }
});