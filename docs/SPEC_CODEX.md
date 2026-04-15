# SPEC.md — MVP PORTO Landing Renderer

## 1. Objetivo
Construir un servicio backend en NestJS/Node.js que reciba un JSON de entrada y un template HTML/Handlebars, valide y normalice el JSON a un modelo canónico, genere un `landing.html` final con los datos reemplazados, lo almacene en un output repository y lo publique mediante un token o URL segura.

La solución debe estar orientada a un flujo batch y online, preservando la interactividad de la landing base (`landing-poliza-mvp-ptbr-v2.html`), incluyendo navegación, acordeones, mapa, gráfico y tracking de eventos.

---

## 2. Objetivos funcionales

### 2.1 Recepción de solicitudes
El sistema debe permitir:
- recibir una solicitud individual de render vía API REST
- recibir múltiples solicitudes en lote vía API REST batch
- permitir que cada solicitud indique el `templateCode` y el `data` del documento

### 2.2 Validación del JSON
El sistema debe validar:
- que el body tenga `templateCode`
- que el body tenga `data`
- que `data` contenga o pueda mapearse a los atributos mínimos del modelo canónico
- tipos básicos correctos: string, number, arrays, objetos
- fechas, montos y arreglos con estructura válida

### 2.3 Normalización del JSON
El sistema debe convertir el JSON de entrada a un modelo canónico interno, independiente del origen.

Modelo canónico esperado:
- `branding`
- `cliente`
- `poliza`
- `vehiculo`
- `residencia`
- `corredor`
- `beneficios[]`
- `coberturas[]`
- `pagos`
- `canalesAtencion[]`

### 2.4 Resolución del template
El sistema debe resolver el template a partir de `templateCode` desde un template repository.

Debe soportar:
- templates versionados
- lectura desde filesystem en MVP
- evolución a MinIO/S3/Azure Blob

### 2.5 Generación del HTML final
El sistema debe:
- compilar el template con Handlebars
- reemplazar los datos dinámicos
- generar un HTML final listo para ser servido
- mantener la interactividad de la landing base

### 2.6 Persistencia de artefactos
Por cada render exitoso se deben guardar:
- `input.json`
- `canonical.json`
- `landing.html`
- `metadata.json`
- `landing.pdf` opcional
- `events.json` o persistencia equivalente de eventos

### 2.7 Publicación segura
El sistema debe:
- generar un token único por landing
- permitir publicación vía `GET /api/v1/public/landing/:token`
- opcionalmente usar expiración del token
- permitir futura firma de URL o integración con portal autenticado

### 2.8 Tracking de eventos
El sistema debe permitir registrar eventos de uso de la landing:
- apertura
- click
- accordion_open
- download_pdf
- custom events

---

## 3. Objetivos no funcionales

### 3.1 Mantenibilidad
- arquitectura modular en NestJS
- separación clara entre validación, normalización, render, persistencia y publicación

### 3.2 Escalabilidad
- diseño preparado para batch y evolución a colas
- soporte futuro para múltiples templates y tenants

### 3.3 Observabilidad
- logs estructurados
- correlación por `renderId`, `token`, `templateCode`
- healthchecks futuros

### 3.4 Seguridad
- no exponer rutas internas de storage
- tokens suficientemente aleatorios
- sanitizar datos antes del render cuando aplique
- política configurable de expiración

### 3.5 Trazabilidad
- guardar input original, modelo canónico y metadatos
- poder regenerar una landing a partir de datos persistidos

---

## 4. Casos de uso

### CU-01: Render individual
Como sistema origen,
quiero enviar un JSON y un `templateCode`,
para obtener y publicar una landing HTML final.

### CU-02: Render batch
Como proceso batch,
quiero enviar una lista de solicitudes,
para generar múltiples landings y sus tokens.

### CU-03: Visualización pública
Como usuario final,
quiero abrir una URL segura,
para visualizar mi landing con la información de la póliza.

### CU-04: Registro de eventos
Como sistema analítico,
quiero registrar eventos de interacción,
para medir uso y comportamiento de la landing.

### CU-05: Regeneración futura
Como operador,
quiero conservar input, canonical y template version,
para regenerar salidas si cambia el diseño.

---

## 5. API esperada

### POST `/api/v1/landings/render`
Render individual.

#### Request
```json
{
  "templateCode": "landing-poliza-mvp-ptbr-v2",
  "data": {
    "branding": { "empresa": "Porto Seguro", "produto": "Auto Private" },
    "cliente": { "nome": "Maria Silva" }
  }
}
```

#### Response
```json
{
  "renderId": "uuid",
  "token": "public-token",
  "templateCode": "landing-poliza-mvp-ptbr-v2",
  "publicUrl": "/api/v1/public/landing/public-token",
  "artifacts": {
    "html": true,
    "input": true,
    "canonical": true,
    "metadata": true,
    "pdf": false
  }
}
```

### POST `/api/v1/landings/render-batch`
Render batch.

### GET `/api/v1/public/landing/:token`
Retorna el `landing.html` final renderizado.

### POST `/api/v1/public/landing/:token/events`
Registra eventos asociados a la landing.

### GET `/api/v1/public/landing/:token/pdf`
Retorna PDF si fue generado.

---

## 6. Persistencia esperada

### 6.1 Output repository
Estructura lógica sugerida:
```text
outputs/
  {renderId}/
    input.json
    canonical.json
    landing.html
    metadata.json
    events.json
    landing.pdf
```

### 6.2 Metadata mínima
`metadata.json` debe incluir:
- `renderId`
- `token`
- `templateCode`
- `templateVersion`
- `createdAt`
- `expiresAt` opcional
- `storagePaths`
- `status`
- `customerId` opcional
- `tenantId` opcional

---

## 7. Criterios de aceptación
- se puede invocar un endpoint individual y generar un `landing.html`
- el HTML queda persistido en output repository
- el HTML ya contiene los datos reemplazados
- también se persisten `input.json`, `canonical.json` y `metadata.json`
- existe una URL pública basada en token que sirve la landing
- se puede registrar al menos un evento por token
- la landing mantiene comportamiento interactivo base

---

## 8. Fuera de alcance del MVP
- portal autenticado completo
- expiración avanzada de tokens con revocación masiva
- multi-tenant duro con aislamiento físico
- workflow completo SFTP productivo
- colas y reintentos distribuidos
- motor de reglas de negocio avanzado

---

## 9. Evolución posterior
- integración con SFTP watcher
- almacenamiento en MinIO/S3/Azure Blob
- metadatos en PostgreSQL con Prisma
- generación PDF con Puppeteer
- batch asincrónico con cola
- observabilidad con OpenTelemetry
- firmas temporales y URLs expiráveis
