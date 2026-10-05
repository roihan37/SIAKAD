# Platform regression repair

## Status and scope — 2026-10-05

Active. Student extraction is paused at the user's request. Repair only the six platform failures (TD-26); no Student code, schema, frontend, authorization rule, or build architecture changes. The completed platform-hardening plan remains historical evidence, not reopened.

## Evidence before implementation

| Failure | Classification and evidence |
| --- | --- |
| Health live body unusable | D — `health-endpoints.test.cjs` eagerly awaits `res.text()` in the assertion message even when status matches, then calls `res.json()`. The status assertion succeeds before the second read fails. |
| Health ready body unusable / about 30 seconds | D/E plus A — same double read; test guard synchronously throws from `pg.Client.connect(callback)`. Installed pg-pool adds the client before connect and removes it only in the error callback, so disconnect can hang until the 30-second shutdown deadline. Separately the readiness handler awaits an unbounded Prisma query; its bounded-timeout comment is unimplemented. |
| Unknown route HTML 500 | A/B — `errorHandler.length` is 3; installed Express router layer handles errors only when length is 4. Trace: request ID → root router → global auth → `next({name: TokenInvalid})` → handler skipped → Express fallback HTML 500. Unknown paths also cannot reach the terminal notFound handler without authentication. |
| Protected resource HTML 500 | A — auth correctly forwards TokenInvalid; same handler arity defect skips canonical mapping to 401. |
| Request ID JSON parse failure | A — request-ID middleware runs before router and sets the header; the skipped error handler produces HTML, so body correlation assertions cannot execute. No generator defect. |
| Compiled server JSON parse failure | A plus latent D — same source handler signature is emitted into dist; source and production share server.ts wiring. Smoke assertion also omits the already documented requestId field. No distinct compilation/module-resolution defect found. |

The previously recorded full baseline is 168/174 passing. A focused fresh-build reproduction is underway; sandbox execution failed explicitly with listener EPERM and is being rerun with localhost permission. No application or test edits precede this record.

## Decisions and target

- Restore four-argument Express error-handler registration; retain all existing mappings.
- Register authentication on each existing protected domain mount. Known endpoints keep identical auth and role middleware; unknown top-level API paths reach the existing 404 as requested. Unknown subpaths inside a protected namespace still authenticate first. This intentionally repairs the documented unknown-route contract, without changing access to any resource.
- Move request ID/logging before parsers so early parser failures also have correlation headers.
- Bound readiness response at one second; share one in-flight database probe until it settles, avoiding unbounded accumulation. This does not cancel Prisma work or alter transaction/pool settings. Keep safe 503 payload.
- Repair eager double reads, assert the established requestId contract, and preserve pg callback failure semantics in the isolation guard. Never permit a real database connection.

## Milestones and acceptance

- [x] Record diagnosis before edits.
- [ ] Repair middleware wiring and harness defects; add actual Express HTTP regression coverage.
- [ ] Bound readiness; test healthy, rejected, hanging, concurrent, and late-settling probes.
- [ ] Run focused tests, then lint, typecheck, full tests, build; record individual results.
- [ ] Update reliability and TD-26, preserving historical records.

## Validation and risks

Run all commands from server with the isolated runner and dummy credentials; no live database/S3, seeds, migrations or deployment. Focused runner is a temporary copy of scripts/test.cjs selecting platform files, retaining fresh compilation and isolation. Production smoke uses compiled server.js; source HTTP fixtures additionally verify Express error propagation. Remaining risk: a timed-out Prisma query is not cancellable here; one pending probe is retained until settlement. Real PostgreSQL/network failure and deployment settings remain unverified.

## Rollback

Revert only this scoped middleware, readiness, and test-guard patch; no data migration is involved. Retain the failing regression assertions and this incident history. Do not resume Student work automatically.
