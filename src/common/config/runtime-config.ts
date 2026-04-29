import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

const profileDefaults = {
  development: {
    PORT: 3000,
    REPOSITORY_BACKEND: 'filesystem',
    ARTIFACT_STORAGE_BACKEND: 'filesystem',
    LANDING_PDF_MODE: 'placeholder',
    LANDING_TOKEN_TTL_DAYS: 30,
  },
  test: {
    PORT: 3000,
    REPOSITORY_BACKEND: 'filesystem',
    ARTIFACT_STORAGE_BACKEND: 'filesystem',
    LANDING_PDF_MODE: 'placeholder',
    LANDING_TOKEN_TTL_DAYS: 1,
  },
  production: {
    PORT: 3000,
    REPOSITORY_BACKEND: 'filesystem',
    ARTIFACT_STORAGE_BACKEND: 'filesystem',
    LANDING_PDF_MODE: 'puppeteer',
    LANDING_TOKEN_TTL_DAYS: 30,
  },
} as const;

const runtimeConfigSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  REPOSITORY_BACKEND: z.enum(['filesystem', 'prisma']).default('filesystem'),
  ARTIFACT_STORAGE_BACKEND: z.enum(['filesystem', 's3']).default('filesystem'),
  DATABASE_URL: z.string().min(1).optional(),
  LANDING_PDF_MODE: z.enum(['placeholder', 'puppeteer']).default('puppeteer'),
  LANDING_TOKEN_TTL_DAYS: z.coerce.number().int().positive().optional(),
  OUTPUTS_ROOT: z.string().min(1).optional(),
  TEMPLATES_ROOT: z.string().min(1).optional(),
  PUBLIC_ROOT: z.string().min(1).optional(),
  PUPPETEER_EXECUTABLE_PATH: z.string().min(1).optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).optional(),
});

export interface S3StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export interface RuntimeConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT?: number | string;
  REPOSITORY_BACKEND?: 'filesystem' | 'prisma';
  ARTIFACT_STORAGE_BACKEND?: 'filesystem' | 's3';
  DATABASE_URL?: string;
  LANDING_PDF_MODE?: 'placeholder' | 'puppeteer';
  LANDING_TOKEN_TTL_DAYS?: number | string;
  OUTPUTS_ROOT?: string;
  TEMPLATES_ROOT?: string;
  PUBLIC_ROOT?: string;
  PUPPETEER_EXECUTABLE_PATH?: string;
  S3_ENDPOINT?: string;
  S3_REGION?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_FORCE_PATH_STYLE?: 'true' | 'false';
}

export function getRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const nodeEnv = nodeEnvSchema.parse(env.NODE_ENV ?? 'development');
  const defaults = profileDefaults[nodeEnv];

  return {
    ...defaults,
    ...env,
    NODE_ENV: nodeEnv,
  };
}

export function validateRuntimeConfig(env: NodeJS.ProcessEnv): void {
  const parsed = runtimeConfigSchema.safeParse(getRuntimeConfig(env));

  if (!parsed.success) {
    throw new Error(`Configuracion invalida: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`);
  }

  if (parsed.data.REPOSITORY_BACKEND === 'prisma' && !parsed.data.DATABASE_URL) {
    throw new Error('Configuracion invalida: DATABASE_URL es obligatorio cuando REPOSITORY_BACKEND=prisma');
  }

  if (parsed.data.ARTIFACT_STORAGE_BACKEND === 's3') {
    const requiredKeys = ['S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const;
    for (const key of requiredKeys) {
      if (!parsed.data[key]) {
        throw new Error(`Configuracion invalida: ${key} es obligatorio cuando ARTIFACT_STORAGE_BACKEND=s3`);
      }
    }
  }
}

export function getS3StorageConfig(): S3StorageConfig {
  const config = getRuntimeConfig(process.env);

  return {
    endpoint: config.S3_ENDPOINT ?? '',
    region: config.S3_REGION ?? 'us-east-1',
    bucket: config.S3_BUCKET ?? '',
    accessKeyId: config.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: config.S3_SECRET_ACCESS_KEY ?? '',
    forcePathStyle: config.S3_FORCE_PATH_STYLE !== 'false',
  };
}