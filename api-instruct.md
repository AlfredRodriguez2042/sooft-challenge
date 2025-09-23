# Instructivo mínimo para probar la API

## 1. Crear una company

```sh
curl -X POST 'http://localhost:3000/api/v1/companies' \
  -H 'accept: application/json' -H 'Content-Type: application/json' \
  -d '{
    "kind": "PYME",
    "socialNumber": 111111,
    "cuit": 111111
  }'

```

Respuesta esperada (201):

```json
{
  "data": {
    "cuit": 111111,
    "socialNumber": 111111,
    "joinedAt": null,
    "disabledAt": null,
    "statusChangedAt": null,
    "id": "399cfc56-c917-4ad2-9301-918464bc6998",
    "status": "CREATED",
    "createdAt": "2025-09-22T12:16:29.000Z"
  },
  "statusCode": 201,
  "errors": null
}
```

## 2. Crear una wallet/balance para esa company

```sh
curl -X POST 'http://localhost:3000/api/v1/balances' \
  -H 'accept: application/json' -H 'Content-Type: application/json' \
  -d '{
    "companyId": "399cfc56-c917-4ad2-9301-918464bc6998",
    "currency": "ARS",
    "balance_minor": 100000
  }'

```

Respuesta (201):

```json
{
  "data": {
    "companyId": "399cfc56-c917-4ad2-9301-918464bc6998",
    "currency": "ARS",
    "balance_minor": 100000,
    "active": true,
    "id": "cb399394-c3ff-4c71-9e0c-8a13a39fa564"
  },
  "statusCode": 201,
  "errors": null
}
```

# 3. Repetir pasos 1–2 para una segunda company y su wallet

> Necesitas dos cuentas activas (debit y credit) en la misma moneda.

## 4.Crear una transferencia

> Nota: amount se envía como string decimal y el backend lo convierte a unidades menores.

```sh
curl -X POST 'http://localhost:3000/api/v1/transfers' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": "10.25",
    "currency": "ARS",
    "debitAccountId": "d1146164-7942-4f3a-9b4c-8d27dff01e16",
    "creditAccountId": "cb399394-c3ff-4c71-9e0c-8a13a39fa564",
    "debitCompanyId": "9a9b0492-c20f-4dd9-9050-d5c997e629c8",
    "creditCompanyId": "399cfc56-c917-4ad2-9301-918464bc6998",
    "idempotencyKey": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }'

```

Respuesta típica (201, envuelta por el interceptor):

```json
{
  "data": {
    "id": "f4b6c2af-5a9a-4a0b-9b8f-2e9b0f2f9f10",
    "debitAccountId": "d1146164-7942-4f3a-9b4c-8d27dff01e16",
    "creditAccountId": "cb399394-c3ff-4c71-9e0c-8a13a39fa564",
    "debitCompanyId": "9a9b0492-c20f-4dd9-9050-d5c997e629c8",
    "creditCompanyId": "399cfc56-c917-4ad2-9301-918464bc6998",
    "currency": "ARS",
    "amountMinor": 1025,
    "status": "COMPLETED",
    "createdAt": "2025-09-22T12:30:00.000Z"
  },
  "statusCode": 201,
  "errors": null,
  "meta": {}
}
```

## 5. Listar transferencias (filtros por rango y empresa)

### Query params

from (ISO 8601, requerido)

to (ISO 8601, requerido, to >= from)

orderField (enum: createdAt | id, requerido)

sortBy (enum: ASC | DESC, requerido)

limit (int 1–100, opcional, default 10)

cursor (string opaco, opcional)

```sh
curl -X GET 'http://localhost:3000/api/v1/transfers?limit=2&sortBy=ASC&orderField=createdAt&to=2025-09-30T23%3A59%3A59Z&from=2025-09-01T00%3A00%3A00Z' \
  -H 'accept: application/json'
```

Respuesta típica (201):

```json
{
  "data": {
    "items": [
      {
        "id": "274b0d72-8e76-44b9-a06e-52250a560669",
        "debitAccountId": "d1146164-7942-4f3a-9b4c-8d27dff01e16",
        "creditAccountId": "cb399394-c3ff-4c71-9e0c-8a13a39fa564",
        "debitCompanyId": "9a9b0492-c20f-4dd9-9050-d5c997e629c8",
        "creditCompanyId": "399cfc56-c917-4ad2-9301-918464bc6998",
        "currency": "ARS",
        "amount_minor": 1025,
        "status": "COMPLETED",
        "idempotencyKey": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "metadata": null,
        "createdAt": "2025-09-22T12:30:17.000Z"
      }
    ],
    "hasNextPage": false
  },
  "statusCode": 200,
  "errors": null
}
```

## 6. Lista compañías “adheridas” en un rango de fechas, con orden y paginación.

### Query params

from (ISO 8601, requerido)

to (ISO 8601, requerido, to >= from)

orderField (enum: createdAt | id, requerido)

sortBy (enum: ASC | DESC, requerido)

limit (int 1–100, opcional, default 10)

cursor (string opaco, opcional)

```sh
curl -X GET 'http://localhost:3000/api/v1/companies/joined?limit=2&sortBy=ASC&orderField=createdAt&to=2025-09-30T23%3A59%3A59Z&from=2025-09-01T00%3A00%3A00Z' \
  -H 'accept: application/json'

```

Respuesta esperada

```json
{
  "data": {
    "items": [
      {
        "id": "399cfc56-c917-4ad2-9301-918464bc6998",
        "cuit": 111111,
        "socialNumber": 111111,
        "status": "CREATED",
        "joinedAt": null,
        "disabledAt": null,
        "statusChangedAt": null,
        "createdAt": "2025-09-22T12:16:29.000Z"
      },
      {
        "id": "9a9b0492-c20f-4dd9-9050-d5c997e629c8",
        "cuit": 22222,
        "socialNumber": 222222,
        "status": "CREATED",
        "joinedAt": null,
        "disabledAt": null,
        "statusChangedAt": null,
        "createdAt": "2025-09-22T12:23:49.000Z"
      }
    ],
    "hasNextPage": false
  },
  "statusCode": 200,
  "errors": null
}
```

## Rate limiting / Throttling

#### Encabezados de respuesta

Siempre en 429:

- X-RateLimit-Limit: 2

- X-RateLimit-Remaining: 0

Solo si hay ventana/TTL conocido (timeToExpire > 0):

- Retry-After: <segundos>

- X-RateLimit-Reset: <segundos>

Encabezados de trazabilidad siempre presentes:

- X-Request-Id

- X-Correlation-Id

### Notas de implementación

1. Guard (CustomThrottlerGuard):
   - Fija X-RateLimit-\* siempre.
   - Solo agrega Retry-After y X-RateLimit-Reset si timeToExpire > 0.
   - Genera/propaga X-Request-Id y X-Correlation-Id.

2. ExceptionFilter global:
   - Estructura errors como array con code y message.
   - No expone stack en producción.
   - Copia Retry-After a meta.retryAfter si está presente.

3. Producción vs dev:
   - Producción: cuerpo mínimo (sin stack ni timestamp).
   - No prod: se puede incluir meta.debug (p. ej. path, timestamp).

### Reproducir (prueba manual)

```sh
# Dos requests válidos (201)
curl -s -X POST 'http://localhost:3000/api/v1/companies' -H 'content-type: application/json' -d '{"kind":"PYME","socialNumber":111111,"cuit":111111}'
curl -s -X POST 'http://localhost:3000/api/v1/companies' -H 'content-type: application/json' -d '{"kind":"PYME","socialNumber":222222,"cuit":222222}'
# Tercer request (<30s) → 429 con headers y body anteriores
curl -i -X POST 'http://localhost:3000/api/v1/companies' -H 'content-type: application/json' -d '{"kind":"PYME","socialNumber":333333,"cuit":333333}'

```
