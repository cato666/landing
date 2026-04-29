import assert from 'node:assert/strict';
import test from 'node:test';
import { getRuntimeConfig, validateRuntimeConfig } from './runtime-config';

test('validateRuntimeConfig acepta configuracion filesystem minima', () => {
  assert.doesNotThrow(() =>
    validateRuntimeConfig({
      NODE_ENV: 'development',
      PORT: '3000',
      REPOSITORY_BACKEND: 'filesystem',
      LANDING_PDF_MODE: 'placeholder',
    }),
  );
});

test('getRuntimeConfig aplica defaults del perfil test', () => {
  const config = getRuntimeConfig({ NODE_ENV: 'test' });

  assert.equal(config.ARTIFACT_STORAGE_BACKEND, 'filesystem');
  assert.equal(config.LANDING_PDF_MODE, 'placeholder');
  assert.equal(config.LANDING_TOKEN_TTL_DAYS, 1);
});

test('validateRuntimeConfig exige DATABASE_URL en modo prisma', () => {
  assert.throws(
    () =>
      validateRuntimeConfig({
        NODE_ENV: 'production',
        PORT: '3000',
        REPOSITORY_BACKEND: 'prisma',
        LANDING_PDF_MODE: 'placeholder',
      }),
    /DATABASE_URL es obligatorio/,
  );
});

test('validateRuntimeConfig exige variables S3 cuando ARTIFACT_STORAGE_BACKEND=s3', () => {
  assert.throws(
    () =>
      validateRuntimeConfig({
        NODE_ENV: 'production',
        PORT: '3000',
        REPOSITORY_BACKEND: 'filesystem',
        ARTIFACT_STORAGE_BACKEND: 's3',
        LANDING_PDF_MODE: 'placeholder',
      }),
    /S3_ENDPOINT es obligatorio/,
  );
});