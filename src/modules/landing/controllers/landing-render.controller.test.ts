import assert from 'node:assert/strict';
import test from 'node:test';
import { LandingRenderController } from './landing-render.controller';

test('LandingRenderController devuelve contrato de render esperado', async () => {
  const controller = new LandingRenderController(
    {
      validateRenderRequest: (body: unknown) => body,
      validateRenderBatchRequest: (body: unknown) => body,
    } as never,
    {
      render: async () => ({
        renderId: 'render-1',
        token: 'token-1',
        templateCode: 'landing-poliza-mvp-ptbr-v2',
        templateVersion: 'v1',
        createdAt: '2026-04-18T00:00:00.000Z',
        expiresAt: '2027-04-18T00:00:00.000Z',
        status: 'generated',
        artifacts: {
          input: '',
          canonical: '',
          html: '',
          metadata: '',
          events: '',
          pdf: null,
        },
      }),
      renderBatch: async () => [],
    } as never,
  );

  const response = await controller.render({ templateCode: 'landing-poliza-mvp-ptbr-v2', data: {} });

  assert.equal(response.renderId, 'render-1');
  assert.equal(response.token, 'token-1');
  assert.equal(response.expiresAt, '2027-04-18T00:00:00.000Z');
  assert.equal(response.publicUrl, '/api/v1/public/landing/token-1');
  assert.equal(response.artifacts.pdf, false);
});

test('LandingRenderController devuelve resultado batch validado', async () => {
  const controller = new LandingRenderController(
    {
      validateRenderRequest: (body: unknown) => body,
      validateRenderBatchRequest: (body: unknown) => body,
    } as never,
    {
      render: async () => ({}) as never,
      renderBatch: async () => [{ index: 0, success: true }],
    } as never,
  );

  const response = await controller.renderBatch({ items: [{ templateCode: 'landing-poliza-mvp-ptbr-v2', data: {} }] });

  assert.deepEqual(response, { items: [{ index: 0, success: true }] });
});