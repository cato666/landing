# PROMPT_MAESTRO_CODEX.md

Actúa como un Ingeniero de Software Senior experto en NestJS, Node.js, Handlebars, Zod y arquitectura backend modular. Debes implementar un MVP técnico llamado **MVP PORTO Landing Renderer**.

## Objetivo general
Construir una solución backend que:
1. reciba un JSON y un `templateCode`
2. valide el JSON
3. normalice el JSON a un modelo canónico
4. resuelva un template Handlebars basado en `landing-poliza-mvp-ptbr-v2.html`
5. genere un `landing.html` final con los datos ya reemplazados
6. guarde `input.json`, `canonical.json`, `landing.html`, `metadata.json` y `events.json`
7. publique la landing mediante `GET /api/v1/public/landing/:token`
8. permita registrar eventos vía `POST /api/v1/public/landing/:token/events`

## Reglas importantes
- Usa NestJS con arquitectura modular.
- Separa claramente `template repository` y `output repository`.
- No uses reemplazos simples de string como diseño principal; usa Handlebars.
- El HTML final debe quedar renderizado y persistido antes de ser publicado.
- Mantén la interactividad base del HTML original.
- Agrega manejo de errores claro.
- Agrega logs estructurados mínimos.
- El storage MVP puede ser filesystem local.
- Deja puntos de extensión para MinIO/S3/PostgreSQL/PDF.

## Entregables esperados
1. scaffold completo del proyecto
2. template `.hbs` parametrizable
3. endpoints REST funcionales
4. ejemplos JSON de request
5. README técnico

## Endpoints obligatorios
- `POST /api/v1/landings/render`
- `POST /api/v1/landings/render-batch`
- `GET /api/v1/public/landing/:token`
- `POST /api/v1/public/landing/:token/events`
- `GET /api/v1/public/landing/:token/pdf`

## Artefactos obligatorios por render
Guardar en `outputs/{renderId}/`:
- `input.json`
- `canonical.json`
- `landing.html`
- `metadata.json`
- `events.json`
- `landing.pdf` opcional

## Metadata mínima
`metadata.json` debe contener:
- `renderId`
- `token`
- `templateCode`
- `templateVersion`
- `createdAt`
- `status`
- `artifacts`

## Modelo canónico
El JSON debe normalizarse a:
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

## Orden de trabajo obligatorio
1. crear estructura base del proyecto
2. instalar dependencias
3. definir DTOs y validación Zod
4. definir modelo canónico
5. implementar normalización
6. implementar template repository
7. convertir HTML original a Handlebars
8. implementar render service
9. implementar output repository
10. implementar endpoints
11. agregar ejemplos y README

## Criterios de aceptación
- un request individual genera un HTML final válido
- el HTML queda almacenado en `outputs/{renderId}/landing.html`
- también se almacenan `input.json`, `canonical.json` y `metadata.json`
- el token permite abrir la landing final
- existe tracking básico de eventos

## Forma de responder
- genera código completo, no pseudocódigo
- crea archivos concretos
- explica brevemente decisiones importantes
- si una parte no puede cerrarse, deja TODOs explícitos y funcionales
