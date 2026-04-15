# AGENTS.md

## Proyecto
MVP PORTO - Motor de generación de landings interactivas a partir de JSON y template HTML.

## Objetivo
Construir una solución backend en NestJS/Node.js que:
1. reciba un JSON de póliza/cliente
2. valide y normalice el JSON a un modelo canónico
3. resuelva un template HTML/Handlebars
4. genere un `landing.html` final con datos reemplazados
5. guarde artefactos y metadatos
6. publique la landing por token o URL segura
7. registre eventos de tracking

## Fuente de verdad del proyecto
Antes de implementar, revisar obligatoriamente:

- `docs/SPEC_CODEX.md`
- `docs/ARCHITECTURE_CODEX.md`
- `docs/TASKS_CODEX.md`
- `docs/PROMPT_MAESTRO_CODEX.md`

Referencia funcional y visual:
- `landing-poliza-mvp-ptbr-v2.html`

No desviarse de la arquitectura y alcance definidos en esos documentos sin documentar la razón.

---

## Principios de trabajo
- Trabajar por fases pequeñas, verificables y fáciles de probar.
- No hacer cambios innecesarios fuera del alcance.
- Mantener consistencia de nombres, carpetas y estilo.
- Preferir soluciones simples, claras y mantenibles.
- Documentar decisiones cuando exista ambigüedad.
- Antes de cambios grandes, inspeccionar el repositorio completo.
- Al final de cada fase, resumir:
  - qué cambió
  - qué archivos fueron modificados
  - cómo se prueba
  - qué quedó pendiente

---

## Stack objetivo
- **Backend:** NestJS / Node.js
- **Validación:** Zod
- **Templates:** Handlebars
- **ORM / metadatos:** Prisma + PostgreSQL
- **Storage:** MinIO / S3
- **PDF:** Puppeteer en evolución
- **Contenedores:** Docker / Docker Compose

---

## Arquitectura esperada
Debe existir separación explícita entre:

- **Template Repository**
  - responsable de obtener templates versionados
  - no debe mezclarse con outputs generados

- **Output Repository**
  - responsable de guardar:
    - `landing.html`
    - `input.json`
    - `canonical.json`
    - `metadata.json`
    - `events.json`
    - `landing.pdf` opcional

Módulos lógicos esperados:
- validation
- normalization
- template resolution
- rendering
- publication
- tracking
- batch processing

---

## Flujo funcional esperado
1. recibir JSON
2. validar JSON
3. normalizar a modelo canónico
4. resolver template vigente
5. renderizar HTML final
6. guardar artefactos en output repository
7. generar/publicar token o URL segura
8. exponer landing pública por token
9. registrar eventos de tracking

---

## Endpoints esperados
Base mínima:

- `POST /api/v1/landings/render`
- `POST /api/v1/landings/render-batch`
- `GET /api/v1/public/landing/:token`
- `POST /api/v1/public/landing/:token/events`

Opcional o evolución:
- `GET /api/v1/public/landing/:token/pdf`

---

## Estructura recomendada
Usar una estructura clara tipo:

```text
src/
  modules/
    landing/
      controllers/
      services/
      repositories/
      dtos/
      mappers/
      templates/
    tracking/
    publication/
    batch/
  common/
    storage/
    config/
    utils/
prisma/
docs/
templates/