import assert from 'node:assert/strict';
import test from 'node:test';
import { NotFoundException, StreamableFile } from '@nestjs/common';
import { PublicLandingController } from './public-landing.controller';

test('PublicLandingController sirve HTML y registra landing_open', async () => {
  const tracked: string[] = [];
  const controller = new PublicLandingController(
    {
      validateTrackEventRequest: (body: unknown) => body,
    } as never,
    {
      getLandingByToken: async () => ({ renderId: 'render-1', html: '<html></html>' }),
      getMetadataByToken: async () => ({ renderId: 'render-1' }),
      getPdfByToken: async () => null,
    } as never,
    {
      trackByRenderId: async (renderId: string) => {
        tracked.push(renderId);
        return [];
      },
      track: async () => [],
    } as never,
  );

  const html = await controller.getLanding('token-1');

  assert.equal(html, '<html></html>');
  assert.deepEqual(tracked, ['render-1']);
});

test('PublicLandingController registra evento manual', async () => {
  const controller = new PublicLandingController(
    {
      validateTrackEventRequest: () => ({ type: 'cta_click' }),
    } as never,
    {
      getLandingByToken: async () => ({ renderId: 'render-1', html: '<html></html>' }),
      getMetadataByToken: async () => ({ renderId: 'render-1' }),
      getPdfByToken: async () => null,
    } as never,
    {
      trackByRenderId: async () => [],
      track: async () => [{ type: 'cta_click' }],
    } as never,
  );

  const response = await controller.trackEvent('token-1', { type: 'cta_click' });

  assert.deepEqual(response, {
    token: 'token-1',
    eventsCount: 1,
    lastEventType: 'cta_click',
  });
});

test('PublicLandingController devuelve PDF si existe', async () => {
  const controller = new PublicLandingController(
    {
      validateTrackEventRequest: (body: unknown) => body,
    } as never,
    {
      getLandingByToken: async () => ({ renderId: 'render-1', html: '<html></html>' }),
      getMetadataByToken: async () => ({ renderId: 'render-1' }),
      getPdfByToken: async () => Buffer.from('%PDF-1.4', 'utf8'),
    } as never,
    {
      trackByRenderId: async () => [],
      track: async () => [],
    } as never,
  );

  const pdf = await controller.getPdf('token-1');

  assert.ok(pdf instanceof StreamableFile);
});

test('PublicLandingController mantiene 404 cuando no hay PDF', async () => {
  const controller = new PublicLandingController(
    {
      validateTrackEventRequest: (body: unknown) => body,
    } as never,
    {
      getLandingByToken: async () => ({ renderId: 'render-1', html: '<html></html>' }),
      getMetadataByToken: async () => ({ renderId: 'render-1' }),
      getPdfByToken: async () => null,
    } as never,
    {
      trackByRenderId: async () => [],
      track: async () => [],
    } as never,
  );

  await assert.rejects(() => controller.getPdf('token-1'), (error: unknown) => {
    assert.ok(error instanceof NotFoundException);
    return true;
  });
});