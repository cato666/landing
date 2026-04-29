import * as path from 'path';
import { getArtifactStorageBackend } from './database-config';

export function resolveOutputsRoot(): string {
  if (getArtifactStorageBackend() === 's3') {
    return (process.env.OUTPUTS_ROOT ?? 'outputs').replace(/\\/g, '/');
  }

  return path.resolve(process.env.OUTPUTS_ROOT ?? path.resolve(process.cwd(), 'outputs'));
}

export function resolveTemplatesRoot(): string {
  return path.resolve(process.env.TEMPLATES_ROOT ?? path.resolve(process.cwd(), 'templates'));
}

export function resolvePublicRoot(): string {
  return path.resolve(process.env.PUBLIC_ROOT ?? path.resolve(process.cwd(), 'public'));
}