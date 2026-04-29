import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import * as fs from 'fs-extra';
import { OutputRepositoryService } from './output-repository.service';
import { RenderMetadata } from '../types/render-metadata.type';
import { LocalFilesystemStorageService } from '../../../common/storage/local-filesystem-storage.service';

function createMetadata(renderId: string, token: string): RenderMetadata {
  return {
    renderId,
    token,
    templateCode: 'landing-poliza-mvp-ptbr-v2',
    templateVersion: 'v1',
    createdAt: '2026-04-18T10:00:00.000Z',
    expiresAt: null,
    status: 'generated',
    artifacts: {
      input: `outputs/${renderId}/input.json`,
      canonical: `outputs/${renderId}/canonical.json`,
      html: `outputs/${renderId}/landing.html`,
      metadata: `outputs/${renderId}/metadata.json`,
      events: `outputs/${renderId}/events.json`,
      pdf: null,
    },
  };
}

test('OutputRepositoryService persiste y resuelve por token usando indice', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'porto-output-repo-'));
  const repository = new OutputRepositoryService(new LocalFilesystemStorageService()) as any;

  repository.outputsRoot = tempRoot;
  repository.tokenIndexPath = path.join(tempRoot, 'token-index.json');

  const metadata = createMetadata('render-1', 'token-1');
  await repository.persistRenderArtifacts({
    renderId: metadata.renderId,
    input: { sample: true },
    canonical: { sample: true },
    html: '<html></html>',
    metadata,
  });

  const resolved = await repository.readMetadataByToken('token-1');
  const index = await fs.readJson(path.join(tempRoot, 'token-index.json')) as Record<string, string>;

  assert.equal(resolved.renderId, 'render-1');
  assert.equal(index['token-1'], 'render-1');

  await fs.remove(tempRoot);
});

test('OutputRepositoryService reconstruye indice al leer datos anteriores', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'porto-output-repo-'));
  const repository = new OutputRepositoryService(new LocalFilesystemStorageService()) as any;

  repository.outputsRoot = tempRoot;
  repository.tokenIndexPath = path.join(tempRoot, 'token-index.json');

  const metadata = createMetadata('render-legacy', 'token-legacy');
  const legacyDir = path.join(tempRoot, metadata.renderId);
  await fs.ensureDir(legacyDir);
  await fs.writeJson(path.join(legacyDir, 'metadata.json'), metadata, { spaces: 2 });

  const resolved = await repository.readMetadataByToken('token-legacy');
  const index = await fs.readJson(path.join(tempRoot, 'token-index.json')) as Record<string, string>;

  assert.equal(resolved.renderId, 'render-legacy');
  assert.equal(index['token-legacy'], 'render-legacy');

  await fs.remove(tempRoot);
});

test('OutputRepositoryService persiste PDF y actualiza metadata', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'porto-output-repo-'));
  const repository = new OutputRepositoryService(new LocalFilesystemStorageService()) as any;

  repository.outputsRoot = tempRoot;
  repository.tokenIndexPath = path.join(tempRoot, 'token-index.json');

  const metadata = createMetadata('render-pdf', 'token-pdf');
  await repository.persistRenderArtifacts({
    renderId: metadata.renderId,
    input: { sample: true },
    canonical: { sample: true },
    html: '<html></html>',
    metadata,
  });

  await repository.persistPdf(metadata.renderId, Buffer.from('%PDF-1.4 test', 'utf8'));
  const updatedMetadata = await repository.readMetadataByToken('token-pdf');
  const pdf = await repository.readPdf(metadata.renderId);

  assert.equal(updatedMetadata.artifacts.pdf, 'outputs/render-pdf/landing.pdf');
  assert.match(pdf?.toString('utf8') ?? '', /%PDF-1.4/);

  await fs.remove(tempRoot);
});