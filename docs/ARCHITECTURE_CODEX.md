# ARCHITECTURE.md — MVP PORTO Landing Renderer

## 1. Visión general
La solución se compone de un pipeline backend que toma una entrada JSON, la valida, la normaliza a un modelo canónico, resuelve un template versionado, genera un HTML final y lo persiste junto con artefactos relacionados para posterior publicación mediante token o URL segura.

---

## 2. Principios arquitectónicos
- separar claramente template repository y output repository
- no renderizar a partir del JSON crudo del origen sin normalización previa
- persistir artefactos de trazabilidad además del HTML final
- hacer que el HTML final sea el artefacto publicado
- mantener independencia entre pipeline interno y canal público

---

## 3. Componentes

### 3.1 Ingestion Layer
Responsable de recibir solicitudes individuales o batch.

Responsabilidades:
- exponer endpoints REST
- generar correlation ids
- delegar procesamiento

### 3.2 JSON Validation Service
Responsable de validar estructura y tipos del input.

Tecnología sugerida:
- Zod

Entradas:
- `templateCode`
- `data`

Salida:
- request validada o error de validación

### 3.3 JSON Normalization Service
Responsable de transformar diferentes formatos de entrada a un modelo canónico único.

Salida esperada:
```json
{
  "branding": {},
  "cliente": {},
  "poliza": {},
  "vehiculo": {},
  "residencia": {},
  "corredor": {},
  "beneficios": [],
  "coberturas": [],
  "pagos": {},
  "canalesAtencion": []
}
```

### 3.4 Template Repository
Responsable de obtener templates versionados.

MVP:
- filesystem local

Evolución:
- MinIO
- S3
- Azure Blob

No debe guardar outputs renderizados.

### 3.5 Render Engine
Responsable de compilar template y generar `landing.html`.

Tecnología sugerida:
- Handlebars

Responsabilidades:
- compilar template
- aplicar helpers
- renderizar HTML final

### 3.6 Output Repository
Responsable de persistir artefactos generados.

Debe almacenar:
- `input.json`
- `canonical.json`
- `landing.html`
- `metadata.json`
- `landing.pdf` opcional
- `events.json` o equivalente

MVP:
- filesystem local

Evolución:
- MinIO/S3/Blob para archivos
- PostgreSQL para metadatos y eventos

### 3.7 Publisher / Public Landing Service
Responsable de publicar el HTML final usando un token.

Responsabilidades:
- resolver token a artefactos
- servir `landing.html`
- validar expiración opcional
- registrar acceso

### 3.8 Event Tracking Service
Responsable de guardar interacciones del usuario final.

Eventos sugeridos:
- `landing_open`
- `accordion_open`
- `download_pdf`
- `cta_click`
- `custom`

---

## 4. Flujo principal

### 4.1 Generación
1. cliente envía `templateCode` + `data`
2. ingestion layer recibe request
3. validation service valida el request
4. normalization service construye modelo canónico
5. template repository obtiene template por código
6. render engine genera `landing.html`
7. output repository guarda artefactos
8. publisher genera token público
9. API retorna token y URL pública

### 4.2 Consumo público
1. usuario final abre URL con token
2. public landing service resuelve token
3. obtiene `landing.html`
4. retorna HTML listo al navegador
5. opcionalmente registra evento de apertura

---

## 5. Decisiones clave

### 5.1 HTML final pre-renderizado
Decisión:
- generar el HTML final antes de publicar

Razones:
- menor complejidad en runtime
- mejor experiencia para visualización pública
- facilita PDF
- facilita auditoría y trazabilidad

### 5.2 Separación template/output repository
Decisión:
- templates y outputs no se mezclan

Razones:
- claridad operacional
- versionado más limpio
- evita contaminación entre inputs y salidas

### 5.3 Persistencia de canonical.json
Decisión:
- guardar modelo canónico además del input

Razones:
- regeneración futura
- trazabilidad
- desacople entre origen y template

### 5.4 Publicación por token
Decisión:
- publicar vía token o URL segura

Razones:
- desacople entre storage y acceso público
- simple para MVP
- evolucionable a firma temporal o autenticación

---

## 6. Estructura sugerida de proyecto NestJS
```text
src/
  modules/
    landing/
      controllers/
        landing-render.controller.ts
        public-landing.controller.ts
      dtos/
        render-landing.dto.ts
        track-event.dto.ts
      services/
        json-validation.service.ts
        json-normalization.service.ts
        landing-render.service.ts
        batch-render.service.ts
        public-landing.service.ts
        tracking.service.ts
      repositories/
        template-repository.service.ts
        output-repository.service.ts
      templates/
        helpers/
          handlebars-helpers.ts
      landing.module.ts
  common/
    storage/
    utils/
templates/
  landing-poliza-mvp-ptbr-v2.hbs
outputs/
```

---

## 7. Contratos principales

### 7.1 Request de render
```json
{
  "templateCode": "landing-poliza-mvp-ptbr-v2",
  "data": {}
}
```

### 7.2 Metadata sugerida
```json
{
  "renderId": "uuid",
  "token": "random-token",
  "templateCode": "landing-poliza-mvp-ptbr-v2",
  "templateVersion": "v1",
  "createdAt": "2026-04-13T12:00:00Z",
  "status": "generated",
  "artifacts": {
    "input": "outputs/.../input.json",
    "canonical": "outputs/.../canonical.json",
    "html": "outputs/.../landing.html",
    "pdf": null
  }
}
```

---

## 8. Almacenamiento

### MVP
- templates: filesystem local
- outputs: filesystem local
- metadata: `metadata.json`
- eventos: `events.json`

### Evolución productiva
- templates: bucket MinIO/S3/Blob
- outputs: bucket MinIO/S3/Blob
- metadata: PostgreSQL
- eventos: PostgreSQL
- índices por token/renderId/templateCode

---

## 9. Seguridad
- token aleatorio de longitud suficiente
- no exponer paths internos
- validar que templateCode exista
- sanitizar strings si el negocio lo requiere
- futura expiración y revocación de token

---

## 10. Observabilidad
- logs estructurados con `renderId`
- tiempo de render
- errores por etapa: validación, normalización, template, storage
- contador de renders exitosos/fallidos

---

## 11. MVP vs evolución

### MVP
- render individual
- render batch simple
- filesystem local
- Handlebars
- token público
- tracking básico

### Evolución
- PostgreSQL + Prisma
- MinIO/S3/Blob
- PDF con Puppeteer
- batch asincrónico
- colas y reintentos
- multi-tenant
- expiração de token
- observabilidad avanzada
