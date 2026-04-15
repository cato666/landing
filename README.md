# MVP PORTO Landing Renderer

Backend NestJS para renderizar landings HTML a partir de `templateCode` + `data`, persistiendo artefactos en filesystem local.

## Comandos mínimos

```bash
npm install
npm run start:dev
```

```bash
npm run check
npm run build
npm start
```

## Endpoints disponibles en esta fase

- `POST /api/v1/landings/render`
- `POST /api/v1/landings/render-batch`
- `GET /api/v1/public/landing/:token`
- `POST /api/v1/public/landing/:token/events`
- `GET /api/v1/public/landing/:token/pdf`

## Template real del MVP

La landing publicada usa como base real `templates/landing-poliza-mvp-ptbr-v2.html`, convertida a `templates/landing-poliza-mvp-ptbr-v2.hbs`.

## Motor genérico de templates

El motor de render no depende del HTML de Porto de forma rígida.

Parte genérica:

- request con `templateCode`, `templateVersion` opcional y `data`
- normalización a `CanonicalLandingModel`
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

## Flujo mínimo de validación manual

1. Ejecutar `npm run start:dev`
2. Invocar `POST /api/v1/landings/render` con `examples/render-request.json`
3. Tomar el `token` de la respuesta
4. Abrir `GET /api/v1/public/landing/:token`
5. Revisar `outputs/{renderId}/landing.html` y `outputs/{renderId}/metadata.json`

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
