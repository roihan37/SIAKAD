# SIAKAD Architecture

## Status and inspection baseline

Repository inspected on 2026-10-04. Approximately 60% implementation is a project estimate. This document distinguishes observed code from future policy; it does not certify production readiness.

## Current architecture

Two independently packaged applications live in `client/` and `server/`; no root package.json orchestrates them.

| Area | Current implementation and evidence |
| --- | --- |
| Backend runtime | Express 5 and TypeScript; `server/src/server.ts` initializes JSON/form parsing, cookies, credentialed CORS, routing, and the error handler, then listens on port 4000. |
| Routing | `server/src/router/index.ts` mounts `/api/v1/auth` before shared authentication middleware, then domain routers for students, lecturers, academic master data, KRS, administration, and avatars. Domain middleware adds authorization. |
| Business logic | Mixed `Router → Middleware → Controller → Prisma` and service-based flows. Controllers still contain business rules and transactions. `server/src/services/` contains tuition, payments, grades, attendance, scheduling, dashboard, avatar, and S3 logic; authentication services live in `server/src/auth/`. Some services accept a Prisma transaction client from a controller. |
| Persistence | PostgreSQL through Prisma and `@prisma/adapter-pg` in `server/src/lib/prisma.ts`. Models are split across `server/prisma/schema/`; migrations and seed tooling live under `server/prisma/`. |
| Authentication | JWT access tokens and persisted refresh-session logic in `server/src/auth/`; cookie settings and signing-secret validation in `auth/config.ts`. Authorization is also enforced by middleware and handlers. |
| Storage | AWS S3 via `server/src/config/s3.ts` and storage services. Region and bucket settings come from `src/config/env.ts`; S3 uses the AWS SDK default credential provider chain without explicit static keys. |
| Errors and responses | Central middleware already exists in `server/src/middleware/errHendler.ts`, with Prisma and named-error mappings. Plain thrown objects and inconsistent envelopes remain. KRS handlers illustrate `{ message, k }`, `{ message, data, k }`, and bare resource responses. |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind, Radix/Base UI components, React Hook Form, and Zod. Routes live in `client/src/router/`, screens in `pages/`, shared UI in `components/`, and schemas in `schemas/`. |
| State and transport | Redux Toolkit slices in `client/src/features/slice/` store auth and substantial fetched domain data. `client/src/app/store.ts` resets domain state on identity changes. Axios and `client/src/api/session-manager.ts` coordinate access tokens, refresh, and stale-session protection. |
| Tests and delivery | Both packages have `.cjs` tests. Backend tests mix custom TypeScript loaders, assertions, mocks, and Node test APIs. Backend exposes lint, typecheck, test, and build. Tests use an isolated Node runner; lint currently reports known legacy source failures. See QUALITY.md. |

M1 update (2026-10-04): production compilation now uses `server/tsconfig.build.json` to emit `dist/server.js`; the base config remains no-emit for typechecking. The clean typecheck/build/start sequence was validated on Node 24.18.0 with isolated dummy configuration. See [build instructions](server/docs/production-build.md) and the platform plan for limits; live database/S3 readiness is not established.

The entry point has console logging and no explicit health routes, standard API catch-all 404, or graceful-shutdown handlers. Swagger/OpenAPI and a structured logging foundation are missing. These remain tracked debt.

## Target backend architecture for new code

`Router → Middleware → Controller → Service → Prisma → PostgreSQL`

- Router: declare paths and register request middleware and controllers.
- Middleware: authentication, authorization, and request-level cross-cutting concerns.
- Controller: parse HTTP input, call services, and produce HTTP responses; no direct Prisma access in new controllers.
- Service: business rules, orchestration, transaction boundaries, and database access through Prisma. Services should not depend on Express request/response objects.
- Prisma: persistence and database transactions. A separate repository layer is not required or approved.

Existing service and transaction patterns are transitional, not a mandate to refactor working flows.

## Incremental migration and compatibility

Existing Controller → Prisma implementations may remain. Significant modifications should gradually move the affected flow toward the target. Unrelated legacy modules must remain outside scope; no repository-wide refactoring.

Preserve paths, status codes, response shapes, and authentication behavior. [API conventions](docs/design-docs/api-contract.md) apply to new endpoints. For existing endpoints, compatibility takes precedence over normalization; record any coordinated contract migration explicitly in its plan.

StudentController is a separate planning hotspot: `server/src/controllers/studentController.ts` mixes student data, finance, attendance, and persistence. A future plan should identify domain-focused service boundaries and characterize existing behavior before extraction. Platform hardening does not include this decomposition.

KRS requires a separate domain review before any schema proposal. Its current model relates a student and academic year, includes status and details, and uniquely constrains `(mahasiswaId, tahunAkademikId)`; the correctness of those rules must be validated with domain stakeholders, not inferred from naming.

## Target frontend architecture

Retain Redux for appropriate client/session state. Move server-state caching and synchronization incrementally to an explicitly selected solution. No server-state replacement is approved by the inspected documents or configured in the current store; selection is an open decision, not an instruction to install a library. TanStack Table is a table dependency, not evidence of TanStack Query adoption.

Improve feature organization only as scoped features change. Preserve session isolation, reset behavior, and existing API adapters. Do not combine folder cleanup with production hardening.

## Order of work

[Platform hardening](docs/exec-plans/completed/platform-hardening.md) first: production build, credential/configuration safety, repeatable validation, errors, health, and observability. StudentController, KRS, frontend state, naming, and broader API documentation follow through separately scoped work. See the [debt tracker](docs/exec-plans/tech-debt-tracker.md).
