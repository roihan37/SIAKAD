# SIAKAD Agent Guide

## Scope and source of truth

SIAKAD is a brownfield application, approximately 60% implemented (project estimate, not a coverage measurement). Preserve working behavior and prefer small, reviewable changes.

Read the relevant documentation before significant changes:

- [Architecture](ARCHITECTURE.md): current implementation and target boundaries.
- [Quality](docs/QUALITY.md): validation and known tooling gaps.
- [Security](docs/SECURITY.md): secrets, authorization, and storage.
- [Reliability](docs/RELIABILITY.md): production readiness.
- [Planning](docs/PLANS.md): execution-plan format and lifecycle.
- [Technical debt](docs/exec-plans/tech-debt-tracker.md): deferred work.
- [API contract](docs/design-docs/api-contract.md): conventions, subject to compatibility rules below.

The initial harness bootstrap is documentation-only. Do not modify production source, rename existing files, modify database schemas, change API behavior, or fix recorded debt during bootstrap. The platform-hardening plan describes future implementation; its presence does not authorize execution.

## Backend architecture

New backend flows must use:

`Router → Middleware → Controller → Service → Prisma`

Routers declare routes and register middleware. Middleware handles authentication, authorization, and request-level concerns. Controllers handle HTTP input/output and call services. Business rules, orchestration, transactions, and persistence belong in services. Services may access Prisma directly; do not introduce a repository layer without an approved architecture decision.

Existing `Controller → Prisma` code may remain. Gradually migrate affected flows when a legacy module is significantly modified. Do not perform repository-wide refactors or opportunistically refactor unrelated modules.

StudentController (`server/src/controllers/studentController.ts`) is a known hotspot reserved for a separate execution plan. Do not fold its decomposition into platform hardening.

## Frontend architecture

Redux currently holds client and server state. Do not rewrite Redux globally. Migrate server state feature by feature only under a scoped plan. A replacement server-state solution has not yet been selected in this repository; record that decision in ARCHITECTURE.md before adopting one. Preserve session reset, authentication, and stale-response protections.

## Compatibility

Preserve existing API paths, status codes, response fields, authentication behavior, and frontend expectations unless a breaking change is explicitly approved. New endpoints follow the API contract. Migrated endpoints adopt its conventions only where backward compatible or through an explicitly approved coordinated migration. Do not globally normalize existing responses.

## Validation

For backend implementation tasks, run from `server/`:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Do not ignore failures or describe missing scripts as passing gates. Current script gaps and documentation-only checks are recorded in docs/QUALITY.md. Run applicable frontend checks from `client/`; there is no root package command.

## Planning and scope control

Create an ExecPlan before complex, risky, or cross-cutting work. Keep it updated with evidence, decisions, validation failures, and remaining work. Prioritize reliability and production safety before architectural cleanup. No unrelated refactors, schema migrations, dependency changes, or naming cleanup without task scope that calls for them.
