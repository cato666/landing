export type RepositoryBackend = 'filesystem' | 'prisma';
export type ArtifactStorageBackend = 'filesystem' | 's3';

export function getRepositoryBackend(): RepositoryBackend {
  return process.env.REPOSITORY_BACKEND === 'prisma' ? 'prisma' : 'filesystem';
}

export function usePrismaRepositories(): boolean {
  return getRepositoryBackend() === 'prisma';
}

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function getArtifactStorageBackend(): ArtifactStorageBackend {
  return process.env.ARTIFACT_STORAGE_BACKEND === 's3' ? 's3' : 'filesystem';
}