# Backend Hexagonal (NestJS)

Servicio backend en **TypeScript + NestJS** organizado con **Arquitectura Hexagonal (Ports & Adapters)** y **DDD ligera**. Incluye validación con **Zod**, persistencia **SQLite** (proveedor intercambiable), y un **Unit of Work** para operaciones de consistencia en _transfers_.

> Este README resume decisiones, estructura, cómo ejecutar, cómo extender módulos y pautas de calidad.

---

## 🧱 Stack

- **Runtime:** Node.js 20+
- **Framework:** NestJS
- **Lenguaje:** TypeScript
- **Validación:** Zod + `ZodValidationPipe`
- **Persistencia:** SQLite (puede cambiarse por otro provider)
- **Pruebas:** Jest

---

## 📁 Estructura del proyecto

```
./src
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── balances
│   ├── application
│   │   ├── dtos
│   │   │   └── balance.ts
│   │   └── services
│   │       └── balance.ts
│   ├── balances.module.ts
│   ├── domain
│   │   ├── entities
│   │   │   └── balance.ts
│   │   └── ports
│   │       └── balance.ts
│   └── infrastructure
│       ├── controllers
│       │   └── balance.ts
│       └── repositories
│           └── balance.ts
├── companies
│   ├── application
│   │   ├── dtos
│   │   │   └── company.ts
│   │   └── services
│   │       ├── company.ts
│   │       └── lambda.ts
│   ├── company.module.ts
│   ├── domain
│   │   ├── entities
│   │   │   ├── company.ts
│   │   │   └── suscriber.ts
│   │   └── ports
│   │       ├── company.ts
│   │       └── lambda.ts
│   └── infrastructure
│       ├── adapters
│       │   └── lambda.ts
│       ├── controllers
│       │   └── company.ts
│       └── repositories
│           └── company.ts
├── main.ts
├── shared
│   ├── infrastructure
│   │   └── persistence
│   │       ├── shutdown.ts
│   │       └── sqlite.ts
│   └── pipes
│       └── zodValidation.ts
└── transfers
    ├── application
    │   ├── dtos
    │   │   └── transfer.ts
    │   └── services
    │       └── transfer.ts
    ├── domain
    │   ├── entities
    │   │   ├── ledger.ts
    │   │   └── transfers.ts
    │   └── ports
    │       └── transfer.ts
    ├── infrastructure
    │   ├── controllers
    │   │   └── transfer.ts
    │   └── repositories
    │       ├── transfer.ts
    │       └── unitOfWork.ts
    └── transfer.module.ts
```

### Capas por módulo

- **domain/**: modelos puros (entities, value objects) + contratos (**ports/**). Sin dependencias del framework.
- **application/**: casos de uso/servicios orquestando puertos y entidades; DTOs de entrada/salida.
- **infrastructure/**: implementaciones de puertos (repositorios, adapters), controladores HTTP y wiring.

> **Regla:** `domain` no depende de `application`, y ninguna de estas depende de detalles de infraestructura.

---

## 🚀 Cómo correr el proyecto

### 1) Requisitos

- Node.js 20+
- pnpm (o npm/yarn)

### 2) Variables de entorno

Crear un archivo `.env` en la raíz (ejemplo):

```env
NEST_AWS_REGION=us-east-1
NEST_AWS_ENDPOINT_URL=
NEST_AWS_MAX_ATTEMPTS=3
NEST_AWS_ACCESS_KEY_ID=
NEST_AWS_SECRET_ACCESS_KEY=
```

### 3) Instalación y scripts

```bash
pnpm install          # instalar deps
pnpm start:dev        # modo watch (Nest CLI)
pnpm start            # build + start
pnpm build            # compilar TS → JS
pnpm test             # correr tests
pnpm lint && pnpm fmt # calidad de código
```

> Si usas npm: reemplaza `pnpm` por `npm run`/`npm i`.

---

## 🌐 Endpoints (convención)

Los controladores definen rutas REST por recurso (convención Nest):

- `balances/infrastructure/controllers/balance.ts` → **/balances**
- `companies/infrastructure/controllers/company.ts` → **/companies**
- `transfers/infrastructure/controllers/transfer.ts` → **/transfers**

> Revisa cada controlador para métodos disponibles (`GET/POST/PUT/DELETE`) y esquemas de request/response.

### Validación de requests

Todas las rutas deberían utilizar `ZodValidationPipe` (`shared/pipes/zodValidation.ts`).

- Define tu esquema Zod en el DTO correspondiente (`application/dtos/*.ts`).
- El pipe transforma y valida antes de llegar al caso de uso.

### Manejo de errores

- Usa excepciones de Nest (`BadRequestException`, `NotFoundException`, etc.).
- Mapea errores de dominio a códigos HTTP en los controladores.

---

## 🧩 Persistencia y UoW

- `shared/infrastructure/persistence/sqlite.ts`: proveedor de acceso a SQLite. Encapsula conexión/queries.
- `shared/infrastructure/persistence/shutdown.ts`: _hook_ para cierre ordenado.
- `transfers/infrastructure/repositories/unitOfWork.ts`: **Unit of Work** para coordinar múltiples repositorios en una transacción atómica (p. ej., debitar/ acreditar en un ledger + registrar transfer).

> La capa **domain** sólo conoce interfaces (ports). La capa **infrastructure** inyecta implementaciones concretas (SQLite hoy, otro motor mañana).

---

## 🧠 Arquitectura (Hexagonal)

- **Ports (Domain/Ports):** contratos que exponen lo que el dominio necesita (p. ej., `BalancePort`, `TransferPort`, `CompanyPort`, `LambdaPort`).
- **Adapters (Infrastructure):** implementaciones concretas de esos contratos (repositorios, integraciones externas, adaptador AWS Lambda).
- **Application Services:** orquestan el flujo usando puertos y entidades; no conocen _framework details_.
- **Controllers:** traducen HTTP ↔️ DTOs ↔️ casos de uso.

Beneficios:

- Testeable: mocks/stubs en ports.
- Evolutivo: cambiar DB o integrar colas/externos sin tocar dominio.
- Claro: separación de responsabilidades explícita.

---

## 🏢 Módulo `companies`

- **Casos de uso:** alta/gestión de compañías y suscriptores.
- **Integración:** `infrastructure/adapters/lambda.ts` implementa el **LambdaPort**, y `application/services/lambda.ts` orquesta la interacción (útil para _events_ o _async tasks_).
- **Entidades:** `company` y `suscriber`.

## 💰 Módulo `balances`

- **Objetivo:** exponer el balance por entidad/empresa.
- **Entidades/DTOs:** `balance.ts` (dominio) y DTO homónimo (aplicación).
- **Repositorio:** implementación infra que lee/escribe en SQLite.

## 🔁 Módulo `transfers`

- **Objetivo:** registrar movimientos entre cuentas/ledgers.
- **Entidades:** `ledger.ts`, `transfers.ts`.
- **UoW:** `infrastructure/repositories/unitOfWork.ts` asegura consistencia.

---

## 🧪 Pruebas

- Ejemplo base: `app.controller.spec.ts`.
- Recomendado:
  - **Unit tests** en `domain` y `application` (mocks de ports).
  - **Integration tests** en `infrastructure` (repos reales contra SQLite/DB de test).
  - Usa _fixtures_ y _factories_ para entidades/DTOs.

```bash
pnpm test          # unitarias
pnpm test:watch    # modo watch
pnpm test:e2e      # si agregas e2e con supertest
```

---

## ➕ Cómo crear un módulo nuevo (plantilla)

1. **Dominio**: crea `domain/entities/<recurso>.ts` y `domain/ports/<recurso>.ts` (interfaces).
2. **Aplicación**: crea DTOs en `application/dtos` y casos de uso en `application/services`.
3. **Infra**: implementa repos/adapters en `infrastructure/...` y el **controller** HTTP.
4. **Module**: define `<recurso>.module.ts` y registra providers (puertos ↔ adapters) + controller.
5. **Tests**: unit + integration.

> Tip: mantén DTOs minimalistas y _mapea_ a entidades en los servicios de aplicación.

---

## 👤 Autor & Licencia

- Autor: Alfred Rodriguez
- Licencia: MIT

¿Dudas o mejoras? Abre un issue o PR con tu propuesta ✨
