import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateRuntimeConfig } from './common/config/runtime-config';
import { GlobalExceptionFilter } from './common/observability/global-exception.filter';
import { LoggingInterceptor } from './common/observability/logging.interceptor';

async function bootstrap() {
  validateRuntimeConfig(process.env);

  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  Logger.log(`PORTO MVP escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
