# Platform Hardening

## Status and context

**Active: M1 implemented and validated; M2–M6 not started.** Inspection baseline: 2026-10-04. The user subsequently authorized production backend build work only. This update changes build configuration and adds focused validation; application source, schemas, architecture, and API behavior remain unchanged.

SIAKAD is approximately 60% implemented by project estimate. Its production foundation needs attention before architectural cleanup. See [architecture](../../../ARCHITECTURE.md), [quality](../../QUALITY.md), [security](../../SECURITY.md), [reliability](../../RELIABILITY.md), and the [debt tracker](../tech-debt-tracker.md).

## Goal

Make backend build/startup reproducible, deployment configuration safe, validation repeatable, and runtime failures observable without broad domain refactoring or breaking existing API consumers.

## Non-goals

No StudentController decomposition (requires a separate execution plan), repository-wide Controller → Service migration, KRS redesign, database schema changes, Redux migration, frontend folder cleanup, filename corrections, global response normalization, or Swagger/OpenAPI rollout. Leave `errHendler.ts` and `bycript.ts` named as they are.

## Constraints

Preserve existing API paths, status codes, response fields, auth/session behavior, and consumers. New backend business flows use Router → Middleware → Controller → Service → Prisma. Existing direct controller persistence may remain. Migrate only significantly affected legacy flows; no opportunistic refactoring.

Use isolated test configuration and disposable data. Do not run seeds/migrations against shared databases, print secrets, or rotate credentials during this planning task. An incompatible 404 or error-contract change requires an explicit decision before its dependent implementation; elapsed time does not resolve that decision.

## Current state at initial inspection

- `server/package.json`: build runs `tsc`, start runs `node dist/server.js`; lint/typecheck/test scripts are absent.
- `server/tsconfig.json`: `noEmit: true`, with no active `outDir`. The configured production artifact cannot be produced by this build.
- `server/src/config/s3.ts`: explicit environment-key credentials; broader deployment requirements are not documented here. Signing-secret validation already exists in `auth/config.ts` and must be preserved.
- `server/tests/`: existing heterogeneous `.cjs` tests, some with custom TypeScript loading and mocked dependencies; test tooling is not absent.
- `server/src/middleware/errHendler.ts`: centralized error mapping already exists, alongside plain thrown objects and inconsistent usage.
- `server/src/server.ts` and `router/index.ts`: console logging, no explicit probes/API catch-all, and no shutdown lifecycle; shared auth placement influences unknown-route responses.

These are source/configuration inspection findings. Runtime checks were not run during the documentation-only bootstrap.

## Target state

A clean checkout can produce and start compiled backend output, validate deployment configuration, and run all required quality gates. Existing contracts stay compatible. Safe error handling, probes, correlated redacted logs, and bounded shutdown make production failures diagnosable. Broad legacy cleanup remains deferred.

## Milestones and acceptance

### M1 — Restore production build and startup (TD-01)

Separate no-emit typechecking from compilation, configure output paths, and align the start command with emitted output. Verify dependency/runtime compatibility, including Prisma generation requirements, from the actual package setup. Do not upgrade dependencies broadly as a shortcut.

Acceptance: in a clean isolated checkout, install locked dependencies, perform required generation without schema migration, run `npm run typecheck` and `npm run build` from `server/`, confirm the emitted entry point, and run `npm start` using isolated configuration. Record Node/npm versions and setup steps. Startup must use compiled output without ts-node or stale artifacts. Never delete a developer's existing artifacts just to stage a clean test.

### M2 — Harden deployment configuration and AWS (TD-02)

Inventory required variables by reading configuration code, documenting names and safe placeholders only. Preserve existing JWT checks. Add clear fail-fast validation where needed and support the deployment's intended AWS credential provider/temporary role credentials. Review least-privilege permissions and local development compatibility.

Acceptance: isolated tests cover missing/invalid required configuration, safe diagnostics, existing auth initialization, and intended credential-provider selection without embedding production keys. Validate S3 access in an authorized non-production environment with restricted permissions. Deployment-specific IAM and environment assumptions must be resolved before rollout; do not assume an AWS hosting platform.

### M3 — Establish repeatable validation and compatibility baselines (TD-11; supports TD-03–05)

Inventory every existing backend test, its loader, and external dependencies. Add meaningful lint/typecheck/test scripts and a repeatable validation procedure. Preserve useful existing tests. Characterize representative API responses, authentication failures, plain-object error mappings, unknown routes, and critical transaction behavior before shared error/routing changes.

Acceptance: all four backend gates run and pass, with explicit test discovery accounting for `.cjs` naming variations. Database/S3-dependent tests use isolated resources or controlled substitutes. No empty runner, silent skipped suite, or weakened check counts as completion. Missing gates encountered in M1/M2 remain recorded until this milestone resolves them.

### M4 — Strengthen the existing error foundation (TD-04, TD-05)

Introduce an Error-derived application error foundation and safe central mapping. Retain existing named-object and Prisma mappings until callers are intentionally migrated. Change only scoped infrastructure/callers; do not rewrite all controllers or response envelopes.

Acceptance: regression tests verify legacy statuses/codes/bodies, Prisma conflicts, validation/auth errors, and safe unexpected 500 responses. Preserve authentication codes used by `client/src/api/axios.ts`, including token-expiry behavior. No stack, SQL, path, or secret leaks. Document remaining plain-object callers rather than declaring the entire debt resolved.

### M5 — Add probes and API fallback safely (TD-14, TD-15)

Add liveness/readiness routes and bounded dependency checks. Place probes deliberately relative to shared auth middleware. Design the API 404 fallback after known routes and before error handling, using the compatibility baseline.

Acceptance: liveness works while PostgreSQL is unavailable; readiness reports a non-ready status within a bounded time. Healthy readiness succeeds. Responses disclose no internals. Known routes/auth remain unchanged. Test unknown routes with and without valid credentials; if standardization changes existing behavior, stop that portion until a compatible design or explicitly approved contract migration is documented. Limit fallback scope to intended API paths.

### M6 — Add operational visibility and shutdown (TD-13, TD-17)

Introduce structured infrastructure logging and request correlation without mass replacement of domain code. Redact sensitive data, sanitize untrusted request IDs and URL data, and document log fields. Add bounded SIGTERM/SIGINT draining and resource closure.

Acceptance: inspect captured success/failure logs for correlation, status, duration, and redaction; automated tests ensure tokens, passwords, credentials, and student-sensitive payloads are absent. Signal tests demonstrate requests drain or time out predictably and resources close without hanging. Validate all prior milestone checks against the final compiled artifact.

## Validation and completion criteria

Run from `server/` before closing implementation:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Then verify isolated compiled startup (`npm start`), configuration failures, API compatibility, probes during dependency failure, log redaction, and shutdown. Record actual commands, environment prerequisites, exit codes, and failures here. Any required missing script or failing gate blocks closure. Frontend changes are outside scope; if an explicitly approved change later touches consumers, add the frontend checks from QUALITY.md.

Completion requires all six milestone acceptance criteria, resolved deployment/compatibility decisions, documented operational setup and rollback evidence, and updated debt statuses with residual work retained. Do not mark StudentController, KRS, or frontend debt complete through this plan.

## Risks and open decisions

- Deployment host, Node version, secret injection, AWS role setup, and probe access policy must be established from the actual deployment before release.
- Compile success alone does not prove dependency loading or database connectivity at runtime; require artifact startup evidence.
- Standardizing 404/errors can alter auth handling and frontend retry behavior; characterize first and retain compatibility.
- Existing tests may need different loaders and generated Prisma prerequisites; inventory before runner selection.
- A server-state replacement and KRS domain rules are intentionally unresolved, and do not block platform infrastructure work.

## Rollback and recovery

Deliver milestones as small independent changes. Before deployment, retain a verified deployable artifact and compatible configuration; the current broken build must not be assumed to be a valid rollback target. Revert the relevant infrastructure change or redeploy the verified artifact if startup, auth, readiness, or error compatibility regresses. Keep any prior credential path only when still secure and authorized; never restore exposed credentials as rollback. Coordinate probe/log configuration changes with the deployment. No schema migration is planned, so rollback should not require data reversal. Verify rollback in a non-production environment before rollout.

## Progress and decision log

- [x] 2026-10-04: Inspected repository and documented current/target architecture and debt.
- [x] 2026-10-04: Prepared this plan; implementation remains outside bootstrap scope.
- [x] M1: Production build and startup (2026-10-04); scoped validation below. Missing lint/test gates remain M3 blockers to overall plan closure.
- [ ] M2: Deployment configuration and AWS credentials.
- [ ] M3: Validation tooling and compatibility baselines.
- [ ] M4: Error foundation.
- [ ] M5: Health and API fallback.
- [ ] M6: Logging and shutdown.
- [ ] Final validation, rollout/rollback evidence, and debt reconciliation.

Decision: production reliability and credential safety precede architectural cleanup. Existing central error handling and tests will be strengthened, not treated as missing. API conventions do not authorize breaking legacy consumers. StudentController work stays in a separate future plan.

## Outcome

M1 is implemented and the clean typecheck → build → start sequence passed. Overall platform hardening remains incomplete: M2–M6 and full quality gates are still pending. No production deployment or live database/S3 verification was performed. Keep this plan active.


## M1 implementation record — 2026-10-04

### Findings and decisions

- Baseline source typechecking passed. The production defect was configuration: `tsc` inherited `noEmit: true`, while start expected `dist/server.js`.
- Preserve the existing base TypeScript configuration and CommonJS module format. A small extending build configuration enables emission with explicit source/output roots and `noEmitOnError`; no application refactor or dependency upgrade is necessary.
- Add separate `typecheck` and `build` commands; retain `start: node dist/server.js`. Prisma generation is an explicit preparation command, not a schema migration or implicit startup operation.
- Select Node 24.x as the supported runtime major, matching installed Node type definitions and the verified runtime. Installed Prisma engine constraints permit it; Node's official [release table](https://nodejs.org/en/about/previous-releases) lists it as LTS. Tested Node 24.18.0 / npm 11.16.0; other majors are not claimed as tested.
- Existing dotenv loading and signing-secret validation work with compiled output. Deployment must supply production configuration; no environment validation or AWS provider changes were made. Port remains 4000.
- Keep standard lint/test tooling deferred to M3. Add a directly runnable Node smoke test without presenting it as the full test suite.

### Files changed

- `server/package.json`: separate typecheck/build commands, explicit Prisma generation command, Node engine range.
- `server/package-lock.json`: synchronize root engine metadata only; no dependency resolution changes.
- `server/tsconfig.build.json`: emission overrides, `src` root, `dist` output, no emission on type errors.
- `server/.nvmrc`: Node 24 selection.
- `server/.gitignore`: ignore compiled `dist/`.
- `server/tests/production-build.test.cjs`: compiled startup, missing-secret rejection, and unauthenticated response smoke coverage with isolated dummy configuration.
- `server/docs/production-build.md`: installation, generation, command sequence, runtime/environment prerequisites, artifact contents, and validation limitations.
- This plan plus M1 status corrections in ARCHITECTURE.md, QUALITY.md, RELIABILITY.md, and TD-01 in the debt tracker.

### Validation performed

Working directory for package commands: `server/`, then a fresh temporary backend copy containing manifests, TypeScript configs, Prisma config/schema, and source, with no `.env`, node_modules, or dist copied from the developer checkout.

| Validation | Result |
| --- | --- |
| Baseline `./node_modules/.bin/tsc --noEmit` | Exit 0 before changes. |
| `npm run lint` | Failed: missing script. Pre-existing M3 gap; not fixed or counted as passing. |
| `npm test` | Failed: missing script. Pre-existing M3 gap; not fixed or counted as passing. |
| `npm run typecheck` in working checkout | Exit 0. |
| `npm run build` in working checkout | Exit 0; emits `dist/server.js`. |
| Clean-copy `npm ci --cache /tmp/siakad-npm-cache --no-audit --no-fund` | Initial sandbox run failed with registry ENOTFOUND; approved network retry exited 0, installing 342 locked packages. npm reported existing crypto deprecation and lifecycle-script policy warnings; no dependencies were changed to address them. |
| Clean-copy `npm run prisma:generate` with dummy DATABASE_URL | Exit 0; Prisma Client 7.9.1 generated from existing split schema. No migration/seed or DB connection. |
| Clean-copy `npm run typecheck` → `npm run build` → `npm start` | Passed in sequence. Confirmed no dist after typecheck, then emitted `dist/server.js`, then live npm-start process returning expected HTTP 401 for unauthenticated `/api/v1/students`. Used explicit dummy environment; stopped the launched process afterward. |
| `node --test tests/production-build.test.cjs` | Initial sandbox run: missing-secret case passed; listener case denied with EPERM. Approved listener retry: 2 tests passed, exit 0. |

The compiled server loads real runtime dependencies without ts-node. Smoke requests reject before database access. These checks establish build/startup behavior, not database readiness, S3 access, full domain regression coverage, or deployment readiness. Missing lint/test scripts still block closing the overall plan. Clean-build instructions prevent relying on stale output; the build does not destructively clean the developer's dist directory.
