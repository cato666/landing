# MVP PORTO Landing Renderer

Backend NestJS para renderizar landings HTML a partir de `templateCode` + `data`, persistiendo artefactos en filesystem local.

## Arranque local rápido

1. Copiar variables base:

```bash
copy .env.example .env
```

2. Para desarrollo local simple, dejar al menos estos valores en `.env`:

```bash
NODE_ENV=development
REPOSITORY_BACKEND=filesystem
ARTIFACT_STORAGE_BACKEND=filesystem
LANDING_PDF_MODE=placeholder
```

3. Instalar dependencias y levantar la app:

```bash
npm install
npm run start:dev
```

4. Abrir la demo comercial local:

```text
http://localhost:3000/demo.html
```

La demo local toma por defecto el endpoint del mismo origen (`/api/v1/landings/render`) y queda con auto-demo desactivado para pruebas manuales.

## Comandos mínimos

```bash
npm install
npm run start:dev
```

```bash
npm install
npm run prisma:generate
npm run check
npm test
npm run build
npm start
```

Con PostgreSQL local vía Docker:

```bash
docker compose up -d postgres
set DATABASE_URL=postgresql://porto:porto@localhost:5432/porto_mvp
npm run prisma:migrate:deploy
```

Stack completo app + PostgreSQL:

```bash
docker compose up --build
```

Por defecto el stack Docker publica la app en `http://localhost:3001` para no chocar con un `npm run start:dev` local ya corriendo en `3000`.

Variables base recomendadas:

```bash
copy .env.example .env
```

## Demo local validada

Flujo manual recomendado para validar la demo que vive en `public/demo.html`:

1. Ejecutar `npm run start:dev`
2. Abrir `http://localhost:3000/demo.html`
3. Verificar que el campo de endpoint apunte a `http://localhost:3000/api/v1/landings/render`
4. Usar el payload de ejemplo y ejecutar `Gerar demo e continuar`
5. Confirmar que la respuesta devuelve `renderId`, `token`, `templateVersion` y `publicUrl`
6. Verificar que el preview o la apertura directa cargan la landing publicada

Validación ya comprobada en este estado del proyecto:

- el render devuelve `renderId`, `token`, `templateVersion` y `publicUrl`
- la landing pública responde HTML real
- el contenido publicado contiene `<!DOCTYPE html>` y datos esperados del ejemplo como `Maria Silva`

## Endpoints disponibles en esta fase

- `POST /api/v1/landings/render`
- `POST /api/v1/landings/render-batch`
- `GET /api/v1/public/landing/:token`
- `POST /api/v1/public/landing/:token/events`
- `GET /api/v1/public/landing/:token/pdf`
- `GET /api/v1/health`
- `GET /api/v1/live`
- `GET /api/v1/ready`
- `GET /api/v1/metrics`
- `GET /api/v1/analytics/metrics`
- `GET /api/v1/analytics/metrics/:metricName`

## Template real del MVP

La landing publicada usa como base real `templates/landing-poliza-mvp-ptbr-v2.html`, convertida a `templates/landing-poliza-mvp-ptbr-v2.hbs`.

## Motor genérico de templates

El motor de render no depende del HTML de Porto de forma rígida.

Parte genérica:

- request con `templateCode`, `templateVersion` opcional, `expiresAt` opcional y `data`
- normalización a `CanonicalLandingModel`
- storage abstracto vía `StorageService` con implementación local para filesystem
- repositorios separados por responsabilidad: artifacts, metadata y events
- `TemplateRepositoryService` desacoplado del render
- `OutputRepositoryService` desacoplado del template repository
- render Handlebars a partir de un contexto de template

Parte específica del template actual:

- `PortoPolicyTemplateContextBuilder`, que transforma el modelo canónico en un contexto de presentación para `landing-poliza-mvp-ptbr-v2`
- el archivo `templates/landing-poliza-mvp-ptbr-v2.hbs`

Regla de extensibilidad:

- un template nuevo puede reutilizar directamente el modelo canónico
- si necesita derivaciones visuales propias, registra su propio context builder sin cambiar la normalización base

Partes resueltas server-side:

- branding, hero, cliente, vehículo, corredor y ubicación
- beneficios, coberturas y tabla de cuotas
- URL embebida del mapa
- payload inicial del gráfico

Partes resueltas client-side:

- menú móvil
- estado activo de navegación por scroll
- render del gráfico con `Chart.js`

Cambio deliberado respecto del HTML fuente:

- se removió la sección de demo con textarea/manual JSON porque no corresponde al flujo productivo publicado

## Prueba rápida con PowerShell

Render individual:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/v1/landings/render `
  -ContentType 'application/json' `
  -InFile .\examples\render-request.json
```

Si no enviás `expiresAt`, también podés definir expiración automática con la variable de entorno `LANDING_TOKEN_TTL_DAYS`.
Si definís `LANDING_PDF_MODE=placeholder`, el endpoint de PDF genera un PDF simple de prueba y lo persiste en el output repository.
Si dejás `LANDING_PDF_MODE=puppeteer` o no definís nada, el backend intenta generar el PDF real con Puppeteer.
Para Puppeteer podés definir `PUPPETEER_EXECUTABLE_PATH` si necesitás usar un Chrome ya instalado.

Render batch:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/v1/landings/render-batch `
  -ContentType 'application/json' `
  -InFile .\examples\render-batch-request.json
```

Abrir landing publicada por token:

```powershell
Invoke-WebRequest `
  -Uri http://localhost:3000/api/v1/public/landing/<TOKEN> `
  -OutFile .\landing-preview.html
```

Tracking:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/v1/public/landing/<TOKEN>/events `
  -ContentType 'application/json' `
  -InFile .\examples\tracking-event.json
```

## Artefactos generados

Cada render persiste en `outputs/{renderId}/`:

- `input.json`
- `canonical.json`
- `landing.html`
- `metadata.json`
- `events.json`
- `token-index.json`
- `landing.pdf` cuando el renderer PDF devuelve contenido

`metadata.json` ahora incluye `expiresAt` cuando la landing vence por request o por política global.
`token-index.json` acelera la resolución pública por token sin recorrer todos los renders en cada request.

## Evolución técnica actual

- `StorageService` permite cambiar filesystem local por otro backend sin tocar servicios de dominio.
- `ArtifactStorageService` soporta `filesystem` o `s3` para artifacts de salida, compatible con S3/MinIO por configuración.
- `LandingArtifactRepository`, `LandingMetadataRepository` y `LandingEventRepository` dejan listo el corte para mover metadata y eventos a PostgreSQL/Prisma.
- `PdfRendererService` soporta renderer real con Puppeteer y fallback placeholder por configuración.
- `LandingMetadataRepository.saveMetadata` mantiene sincronizada la metadata también cuando se genera `landing.pdf`.
- `LandingArtifactManifestRepository` persiste un manifest relacional de artifacts en Prisma para desacoplar lookup operativo del filesystem.
- El manifest ahora guarda backend de storage y content-types por artifact para operación e integración futura con object storage.
- `PublicationAnalyticsRepository` persiste accesos públicos y métricas agregadas por día cuando el backend es Prisma.

## Prisma

- Schema base en `prisma/schema.prisma`
- Migración inicial en `prisma/migrations/20260418_init/migration.sql`
- Migración de manifest en `prisma/migrations/20260418_artifact_manifest/migration.sql`
- Migración de metadata de storage del manifest en `prisma/migrations/20260418_artifact_manifest_storage/migration.sql`
- Generar cliente con `npm run prisma:generate`
- Aplicar migraciones con `npm run prisma:migrate:deploy`
- Activar repositorios Prisma con `REPOSITORY_BACKEND=prisma`
- Requiere `DATABASE_URL` apuntando a PostgreSQL
- En modo Prisma, el render persiste metadata en PostgreSQL y mantiene artefactos en filesystem local o S3 según `ARTIFACT_STORAGE_BACKEND`
- En modo Prisma, también se persiste un manifest de paths de artifacts por `renderId`
- En modo Prisma, también se persisten accesos públicos y agregados diarios de métricas

## Observabilidad

- Header `x-correlation-id` aceptado o generado automáticamente por request
- Logs estructurados para requests y errores
- `GET /api/v1/live` responde liveliness sin dependencias externas
- Filtro global que devuelve `correlationId`, `timestamp` y `path` en errores HTTP
- `GET /api/v1/health` para estado básico del servicio
- `GET /api/v1/ready` valida storage, templates y PostgreSQL cuando Prisma está activo
- `GET /api/v1/metrics` en formato Prometheus con contadores de render, vistas, eventos y PDFs
- `GET /api/v1/analytics/metrics` expone agregados persistidos por métrica cuando `REPOSITORY_BACKEND=prisma`
- `GET /api/v1/analytics/metrics/:metricName` expone serie diaria persistida por nombre de métrica cuando `REPOSITORY_BACKEND=prisma`

En modo filesystem, los endpoints de analytics reporting responden con `enabled=false`, backend `noop` y colecciones vacías. Esto permite mantener el contrato HTTP estable aunque no exista persistencia analítica.

## Entorno

- `.env.example` contiene la base de variables soportadas
- `docker-compose.yml` levanta PostgreSQL, MinIO y la app en modo productivo básico
- `docker-compose.override.yml` deja un modo de desarrollo con bind mount y `start:dev`
- `NODE_ENV` aplica defaults explícitos por perfil para `development`, `test` y `production`
- La app valida configuración al arranque y falla temprano si `REPOSITORY_BACKEND=prisma` no tiene `DATABASE_URL`
- `ARTIFACT_STORAGE_BACKEND=s3` requiere `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`
- `APP_PORT` controla el puerto host del contenedor app en Docker Compose
- `MINIO_CONSOLE_PORT` controla el puerto host de la consola web de MinIO en Docker Compose

## Despliegue y ejecución con Docker

### Desarrollo con Docker Compose

`docker-compose.override.yml` deja la app en modo desarrollo con bind mount, `npm run start:dev` y backend de repositorio en filesystem.

```bash
docker compose up --build
```

Resultado esperado en desarrollo:

- app en `http://localhost:3000`
- demo en `http://localhost:3000/demo.html`
- PostgreSQL en `localhost:5432`

### Producción básica con Docker Compose

`docker-compose.yml` levanta:

- `postgres` con base `porto_mvp`
- `minio` para pruebas de object storage compatible con S3
- `minio-init` para crear el bucket `porto-mvp` automáticamente
- `app` con `NODE_ENV=production`
- `REPOSITORY_BACKEND=prisma`
- migraciones ejecutadas al arranque con `npm run prisma:migrate:deploy`

Antes de levantar en modo productivo básico, revisar `.env` y definir los valores operativos reales que correspondan al ambiente.

```bash
docker compose -f docker-compose.yml up --build
```

Puertos por defecto del stack Docker:

- app en `http://localhost:3001`
- PostgreSQL en `localhost:5432`
- MinIO API en `http://localhost:9000`
- MinIO Console en `http://localhost:9001`

Si el despliegue usará PostgreSQL persistente externo, ajustar `DATABASE_URL` antes de iniciar la app.

### Validar Prisma persistente con Docker

Con el backend local de Node apagado o manteniendo `APP_PORT=3001`, levantar:

```bash
docker compose -f docker-compose.yml up -d --build
```

Luego validar:

```bash
curl http://localhost:3001/api/v1/ready
```

El readiness esperado debe mostrar PostgreSQL operativo y backend de artifacts activo.

### Validar artifacts sobre MinIO/S3

Para probar S3-compatible storage con el mismo stack:

```bash
set ARTIFACT_STORAGE_BACKEND=s3
docker compose -f docker-compose.yml up -d --build
```

El servicio `app` ya recibe en Docker Compose estos valores internos:

- `S3_ENDPOINT=http://minio:9000`
- `S3_BUCKET=porto-mvp`
- `S3_ACCESS_KEY_ID=minioadmin`
- `S3_SECRET_ACCESS_KEY=minioadmin`
- `S3_FORCE_PATH_STYLE=true`

Después del render, los artifacts dejan de persistirse en filesystem del contenedor y pasan a MinIO.

Para inspección manual, abrir la consola en:

```text
http://localhost:9001
```

Credenciales por defecto:

- usuario: `minioadmin`
- password: `minioadmin`

## Flujo mínimo de validación manual

1. Ejecutar `npm run start:dev`
2. Invocar `POST /api/v1/landings/render` con `examples/render-request.json`
3. Tomar el `token` de la respuesta
4. Abrir `GET /api/v1/public/landing/:token`
5. Revisar `outputs/{renderId}/landing.html` y `outputs/{renderId}/metadata.json`

Si el token venció, la API pública responde `410 Gone`.

## Datos canónicos consumidos por el template Porto

- `branding.empresa`, `branding.tagline`, `branding.navSubtitle`, `branding.heroTitle`, `branding.heroDescription`
- `cliente.nome`, `cliente.documento`, `cliente.telefone`, `cliente.email`
- `poliza.numero`, `poliza.vigenciaDesde`, `poliza.vigenciaHasta`, `poliza.estado`, `poliza.primaTotal`, `poliza.franquia`, `poliza.moneda`
- `vehiculo.marca`, `vehiculo.modelo`, `vehiculo.anio`, `vehiculo.patente`, `vehiculo.combustible`, `vehiculo.uso`, `vehiculo.fotoUrl`
- `residencia.direccion`
- `corredor.nombre`, `corredor.telefono`, `corredor.email`
- `beneficios[].titulo`
- `coberturas[].titulo`, `coberturas[].monto`, `coberturas[].detalle`
- `pagos.forma`, `pagos.cuotas[].numero`, `pagos.cuotas[].vencimiento`, `pagos.cuotas[].valor`
- `canalesAtencion[].valor`

## Helpers de Handlebars utilizados

- `formatCurrency`
- `formatDateBR`
- `default`
- `json`
- `concat`

## Nota importante

La conversión a Handlebars mantiene la estructura principal del HTML original. La experiencia interactiva se conserva en navegación, acordeones nativos, mapa embebido y gráfico, pero la demo local de edición JSON fue eliminada a propósito por no ser parte del flujo productivo.
