# TASKS.md — MVP PORTO Landing Renderer

## Objetivo
Implementar el scaffold técnico completo en NestJS/Node.js para generar landings HTML finales a partir de JSON + template, almacenar artefactos y publicar por token.

---

## Fase 1 — Base del proyecto

### T1. Crear proyecto NestJS
- crear estructura base del proyecto
- configurar TypeScript
- configurar scripts `start:dev`, `build`, `start`
- dejar carpeta `templates/` y `outputs/`

### T2. Instalar dependencias
Instalar:
- `@nestjs/common`
- `@nestjs/core`
- `reflect-metadata`
- `rxjs`
- `zod`
- `handlebars`
- `uuid`
- `fs-extra`
- `mime-types`
- opcionalmente `puppeteer`

### T3. Configurar estructura modular
Crear módulo `landing` con:
- controllers
- services
- repositories
- dtos

---

## Fase 2 — Contratos y validación

### T4. Crear DTO de render
Crear DTO para:
- `templateCode`
- `data`

### T5. Implementar JSON validation service
- usar Zod
- validar request completo
- lanzar errores HTTP claros

### T6. Definir contrato canónico
Crear interfaz o tipo `CanonicalLandingModel` con:
- branding
- cliente
- poliza
- vehiculo
- residencia
- corredor
- beneficios
- coberturas
- pagos
- canalesAtencion

---

## Fase 3 — Normalización

### T7. Implementar JSON normalization service
- recibir JSON validado
- mapear al modelo canónico
- aplicar defaults seguros
- formatear estructuras faltantes

### T8. Crear mapeadores auxiliares
- mapper de coberturas
- mapper de pagos
- mapper de beneficios
- mapper de canales

---

## Fase 4 — Template repository

### T9. Implementar template repository
- buscar template por `templateCode`
- leer desde filesystem local
- lanzar error si no existe

### T10. Versionado básico de template
- permitir devolver `templateVersion`
- usar convención simple por nombre o metadata

---

## Fase 5 — Conversión del template

### T11. Convertir `landing-poliza-mvp-ptbr-v2.html` a Handlebars
- mantener estructura visual
- mantener CSS y JS
- reemplazar datos hardcoded por placeholders
- resolver listas con `each`
- resolver secciones opcionales con `if`

### T12. Crear helpers Handlebars
Helpers sugeridos:
- `formatCurrency`
- `formatDateBR`
- `json`
- `default`

---

## Fase 6 — Render engine

### T13. Implementar landing render service
Debe:
- cargar template
- compilar template
- renderizar HTML final
- devolver HTML y metadatos de render

### T14. Generar token
- usar `uuid` o token aleatorio seguro
- token debe ser apto para URL pública

---

## Fase 7 — Output repository

### T15. Implementar output repository
Debe guardar:
- `input.json`
- `canonical.json`
- `landing.html`
- `metadata.json`
- `events.json`

Estructura sugerida:
```text
outputs/{renderId}/
```

### T16. Crear metadata.json
Incluir:
- renderId
- token
- templateCode
- templateVersion
- createdAt
- status
- artifact paths

---

## Fase 8 — Endpoints

### T17. Implementar POST `/api/v1/landings/render`
Debe:
- validar request
- normalizar JSON
- renderizar HTML
- guardar artefactos
- devolver token y URL

### T18. Implementar POST `/api/v1/landings/render-batch`
Debe:
- procesar una lista de solicitudes
- devolver resumen por item
- tolerar errores por item sin caer todo el lote

### T19. Implementar GET `/api/v1/public/landing/:token`
Debe:
- resolver token
- encontrar `landing.html`
- devolver HTML con `Content-Type: text/html`

### T20. Implementar POST `/api/v1/public/landing/:token/events`
Debe:
- validar body de evento
- guardar evento en `events.json` o equivalente

### T21. Implementar GET `/api/v1/public/landing/:token/pdf`
- devolver 404 si no existe
- dejar listo el contrato para futura integración con Puppeteer

---

## Fase 9 — Tracking y publicación

### T22. Crear tracking service
- append de eventos por token/renderId
- registrar `landing_open`
- registrar eventos manuales

### T23. Crear public landing service
- resolver token a metadata
- localizar artefactos
- validar expiración futura si aplica

---

## Fase 10 — Calidad y ejemplos

### T24. Crear JSON de ejemplo
- request individual
- request batch
- evento de tracking

### T25. Crear README técnico
Debe incluir:
- cómo ejecutar
- estructura de carpetas
- endpoints
- ejemplo de request
- ejemplo de respuesta

### T26. Agregar manejo de errores consistente
- 400 validación
- 404 template/token no encontrado
- 500 fallas de render/storage

### T27. Agregar logs estructurados
- inicio render
- fin render
- token generado
- fallas por etapa

---

## Fase 11 — Evolución opcional inmediata

### T28. Preparar interfaz de storage abstracta
- para filesystem MVP
- futura implementación MinIO/S3

### T29. Preparar generación PDF opcional
- interfaz `PdfRenderer`
- implementación stub inicialmente

### T30. Preparar metadatos persistibles en PostgreSQL
- definir entidad lógica
- dejar ready para Prisma después

---

## Definition of Done
- endpoint individual funcionando
- HTML final generado y persistido
- JSON original y canónico persistidos
- metadata persistida
- endpoint público por token funcionando
- evento básico persistido
- template Handlebars operativo
- README y ejemplos listos
