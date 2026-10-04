# Platform Hardening

## Status and context

**Active: M1 complete; M2 implementation/local validation complete, deployment acceptance pending; M3 tooling implemented with legacy lint blockers; M4 complete; M5 implemented (integration tests blocked by sandbox EPERM); M6 not started.** Baseline: 2026-10-04. The user authorized M3 testing/quality tooling after M2. Domain controllers, architecture, schemas, and API contracts remain unchanged.

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
- [ ] M2: Code and local validation complete (2026-10-04); actual restricted non-production S3/workload-role verification remains pending.
- [ ] M3: Tooling baseline implemented and all 52 tests pass; five legacy lint errors prevent the original all-gates-pass acceptance (TD-18–TD-20).
- [ ] M4: Error foundation.
- [ ] M5: Health and API fallback.
- [ ] M6: Logging and shutdown.
- [ ] Final validation, rollout/rollback evidence, and debt reconciliation.

Decision: production reliability and credential safety precede architectural cleanup. Existing central error handling and tests will be strengthened, not treated as missing. API conventions do not authorize breaking legacy consumers. StudentController work stays in a separate future plan.

## Outcome

M1 is implemented and the clean typecheck → build → start sequence passed. M2 now has a validated environment boundary and default AWS credential chain with passing local tests. Its live deployment acceptance remains pending. M3 now exposes all four commands and passes the full test suite, but legacy lint failures block M3 all-green acceptance. M4–M6 remain pending. No production deployment or live database/S3 verification was performed. Keep this plan active.


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

## M2 implementation record — 2026-10-04

### Initial findings

- Runtime reads were spread across auth, Prisma, S3 client, and avatar/storage services. dotenv was loaded by auth, Prisma, server, CLI configuration, and the seed entry point. No server `.env.example` or backend environment-validation library existed; dotenv already supplied loading, while frontend Zod was not a backend dependency.
- Only JWT signing-secret length was checked early. DATABASE_URL, AWS_REGION, and AWS_BUCKET_NAME could fail later or produce invalid URLs. TypeScript non-null assertions supplied no runtime validation.
- S3 explicitly received AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY, preventing normal provider-chain selection and omitting temporary session-token handling.
- The ignored local server `.env` contains DATABASE_URL, JWT_SECRET, AWS_REGION, AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY keys. Values were neither printed nor copied. NODE_ENV and CLIENT_ORIGIN were absent there; existing development defaults applied unless injected externally.
- Existing optional tooling variables are SEED_PASSWORD and SEED_TRIAL_PASSWORD. NODE_ENV controls secure cookies and the seed production guard. CLIENT_ORIGIN defaults to localhost:5173. Port 4000 is hardcoded, not an environment setting.
- No real environment file is tracked. Server ignore rules previously covered `.env` only, not `.env.production` and similar variants.
- A targeted current tracked-tree scan found demo passwords in seed code/docs and frontend login shortcuts, test fixture secrets, and an intentional auth timing placeholder. It found no apparent production AWS key literals/private-key blocks. This is not proof that repository history or all possible secret formats are clean. Seed startup printed a demo password; controllers and the central error handler log raw error objects, which remain a potential disclosure risk.

### Decisions and behavior

- Added `src/config/env.ts`, using existing dotenv plus a small dependency-free validator. It loads the working-directory `.env` quietly, does not override injected values, and is the only backend application/tooling boundary reading process.env.
- Full HTTP startup validates DATABASE_URL, JWT_SECRET (minimum 32 bytes), AWS_REGION, and AWS_BUCKET_NAME, including lightweight format checks. CLIENT_ORIGIN retains its localhost default but validates a supplied HTTP(S) origin. NODE_ENV retains development fallback and existing literal-production semantics. Validation errors contain names/rules only; raw URL parser errors and their values are discarded.
- Preserve `AWS_BUCKET_NAME`; do not introduce AWS_S3_BUCKET or new required credentials. S3Client receives only validated region. The SDK default chain supports local profiles/environment credentials, temporary tokens, and runtime IAM roles. No custom credential loader, credential resolution at startup, or live credential preflight was added. Reference: [AWS credential provider chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).
- Prisma generation/DB-only work uses a narrow database accessor within the same boundary, without requiring JWT/S3 values. Storage uses a narrow accessor for the existing optional storage seed operations. Seed overrides/defaults are centralized without changing demo passwords. Optional seed storage imports now occur only when requested and before writes, preventing new HTTP/S3 requirements on DB-only seeding. The seed production guard remains and the default password is no longer printed.
- Added a placeholders-only server `.env.example`; ignore all real server `.env.*` variants while allowing that example. No dependency, data-model, controller, frontend, or API-contract changes.

### Files changed in M2

- `server/src/config/env.ts`: loading, typed immutable application configuration, validation and narrow tooling/storage accessors.
- `server/src/config/s3.ts`: SDK default credential chain.
- `server/src/auth/config.ts`, `server/src/lib/prisma.ts`, `server/src/server.ts`: consume validated settings and remove duplicated dotenv loading.
- `server/src/services/s3.service.ts`, `server/src/services/avatar.service.ts`: validated bucket/region wiring only.
- `server/prisma.config.ts`: shared database validation for the Prisma CLI; no schema change.
- `server/prisma/seed.ts`, `server/prisma/seed-data/campus.ts`, `server/prisma/seed-data/trial-student.ts`: central environment access, optional storage initialization, and removal of password output. Seed defaults/domain operations unchanged.
- `server/.env.example`, `server/.gitignore`: safe example and environment-file exclusion.
- `server/tests/environment.test.cjs`, `server/tests/production-build.test.cjs`: environment/provider/compiled-startup coverage.
- `server/docs/production-build.md`, ARCHITECTURE.md, SECURITY.md, RELIABILITY.md, this plan and the debt tracker: current configuration behavior, validation evidence, and remaining deployment checks.

### Validation performed and exact command record

From `server/`:

```sh
npm run typecheck
npm run build
npm run lint
npm test
node --test tests/environment.test.cjs tests/production-build.test.cjs
```

- Typecheck and production build: exit 0, including the final code changes.
- Lint and npm test: exit 1, existing missing scripts. No M3 scripts/tooling added, and these are not treated as passed gates.
- Focused tests: final run 13/13 passed, exit 0. Tests cover missing/blank/malformed settings, diagnostics without sensitive values, dotenv precedence, immutable config, DB-only configuration, unchanged production/development cookie behavior, temporary environment credentials with a session token, local AWS profile credentials, and simulated container-role credentials with no static environment keys. Compiled server rejects each missing required setting before listening, and starts without static AWS keys with the existing unauthenticated HTTP 401 response.
- The first sandbox test run passed 11 cases but local listeners were denied with EPERM in two cases. The authorized retry and final run passed all 13. AWS role resolution used only a local HTTP fixture; no live AWS calls or database operations were made.
- An initial typecheck/build invocation from repository root failed ENOENT because there is no root package.json; rerunning from server/ passed. No code workaround was made for that invocation error.

Additional existing regression and CLI checks used the following exact child command arguments (absolute paths), launched by a Python subprocess harness from an empty temporary working directory:

```sh
node -r /Users/amiramilin/Documents/ROIHAN/project/SIAKAD/server/node_modules/ts-node/register /Users/amiramilin/Documents/ROIHAN/project/SIAKAD/server/tests/auth-security.cjs
node -r /Users/amiramilin/Documents/ROIHAN/project/SIAKAD/server/node_modules/ts-node/register /Users/amiramilin/Documents/ROIHAN/project/SIAKAD/server/tests/seed.cjs
node /Users/amiramilin/Documents/ROIHAN/project/SIAKAD/server/node_modules/prisma/build/index.js generate --config /Users/amiramilin/Documents/ROIHAN/project/SIAKAD/server/prisma.config.ts
```

The subprocess environment was explicitly constructed: PATH, NODE_ENV=test, dummy DATABASE_URL, TS_NODE_PROJECT pointing to server/tsconfig.json, and TS_NODE_FILES=true; the auth case also received a test-only JWT secret, region, and bucket. No developer `.env` was loaded. All three checks ultimately exited 0. The seed test initially failed because it resolves modules relative to cwd; providing temporary `src`/`prisma` symlinks to the checkout corrected the harness and it passed with no JWT/storage environment values. Seed tests mock the database; no actual seed command or migrations ran. Prisma generation required only the dummy database URL and did not connect to a database.

Repository checks (from repository root):

```sh
rg -n 'process\.env|dotenv' server/src server/prisma server/prisma.config.ts
git ls-files '*env*'
git check-ignore server/.env server/.env.production server/.env.local
git check-ignore server/.env.example
git diff --exit-code -- server/src/controllers server/prisma/schema client server/package.json server/package-lock.json
git diff --check
```

The real server environment paths are ignored; the example is not (expected exit 1 for that check). Only the central boundary reads process.env. No controller/schema/frontend/dependency diff exists. Diff whitespace checks pass. The secret scan reported candidate paths/line numbers/categories without printing candidate values; local `.env` inspection reported keys only.

### Remaining risks and milestone status

**M2 implementation and local validation complete; live deployment acceptance pending.** Keep M2 open until its original acceptance criterion for restricted non-production S3 access is met. No deployment host, authorized test bucket, workload role, or IAM policy was supplied. Actual role trust/permissions, bucket ownership/region, least privilege, network reachability, and any KMS requirements remain unverified. Startup deliberately does not resolve credentials or test external services.

Operators must remove stale static AWS variables from role-based deployments because provider precedence can select them over role credentials. Valid configuration values must be provisioned before rollout; services that previously started with missing storage settings will now fail early as requested. Production operators must explicitly set NODE_ENV=production and the real CLIENT_ORIGIN; defaults are preserved for compatibility.

Configuration/startup test output contains no test secrets, and seed startup no longer prints the default password. This is not a global no-secret-logging guarantee: raw legacy error logs and committed demo login defaults remain outside the scoped configuration change. No production keys were rotated, and Git history was not exhaustively scanned. The overall plan remains active. **M3–M6 were not started.**

## M3 implementation record — 2026-10-04

### Tooling discovered

- Sixteen existing backend `.cjs` files: thirteen standalone assertion scripts and three files using Node test cases. Existing loaders were ts-node direct imports and a custom VM/TypeScript loader in master-data tests. No backend Jest, Vitest, Supertest, shared test setup, or ESLint configuration existed. No tests were renamed or replaced wholesale.
- The suite mixes unit-style validation/mapping assertions, mocked controller/service/transaction tests, router-stack checks, mocked seed idempotency, and local process/HTTP credential/startup integration tests. No existing suite requires a real database or cloud account. Current inventory is in QUALITY.md.
- Some legacy tests import the real Prisma singleton then replace methods, and `seed.cjs` resolves source paths from cwd. Ad-hoc execution could load the developer's `.env`, and partial mocks could attempt live connections. The M1/M2 tests had explicit child environments but required a compiled dist and local listener access.
- TypeScript already has strict/noEmit checks and a separate production compile config. Preserve those. Frontend tooling was inspected only to reuse compatible ESLint package versions; no frontend file changed.

### Decisions and commands established

- Retain Node's built-in test runner/assertions and existing ts-node/TypeScript loaders. Add no test framework or Supertest dependency. Reference: [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html).
- `npm test` invokes `scripts/test.cjs`. It discovers every `.cjs` test recursively except support directories, prints the inventory, rejects an empty suite, creates a temporary workspace without `.env`, links installed dependencies, and compiles fresh test artifacts there. It never needs a pre-existing production dist. All 16 originals remain discovered; one new tooling test file makes 17.
- Each test file runs in its own Node process, sequentially, with an explicit dummy environment and temporary HOME/AWS config paths. A test-only guard prevents remote sockets and actual pg connections; subprocess tests inherit it through NODE_OPTIONS. A 30-second Node test timeout and 180-second subprocess bound prevent unbounded command execution. Child errors/non-zero status propagate; no skip/xfail or success-forcing logic was added.
- Existing tests retain their mock/VM styles. The loader uses ts-node transpileOnly to execute them; separate strict typecheck/build gates remain unchanged.
- Add standalone `npm run lint` using ESLint 10.8.0, @eslint/js 10.0.1, typescript-eslint 8.65.0, and globals 17.8.0 (versions already installed by the frontend). These are backend dev dependencies only; no existing dependency version changed. Core recommended rules plus TypeScript compatibility and Node globals form the baseline. TypeScript no-undef is handled by tsc; unused-variable/explicit-any/style campaigns are not enabled in this initial baseline. Detected legacy errors were not suppressed or downgraded.
- Preserve `npm run typecheck` and `npm run build`. No root command aggregator, CI service, application source change, schema change, or M4 work was added.

### Failure classifications and repairs

| Category | Finding | Disposition |
| --- | --- | --- |
| A — tooling/configuration | Missing lint/test commands, no common loader/environment/discovery, smoke tests depending on prior dist, cwd-sensitive seed tests. | Resolved through scripts/config and temporary workspace. Existing assertions retained. |
| A — setup during implementation | ESLint preset objects were initially treated as iterable arrays. | Corrected config; lint now executes independently. |
| C — stale/broken test | `master-data.test.cjs` omitted `transkrip.count`, used by the existing SKS-change guard, causing undefined status instead of success. | Added the missing mock and a regression assertion that recorded transcripts prohibit credit changes without writes. No controller change. |
| C — stale/broken test | `student-attendance.cjs` expected admin-or-owner while the existing `/:id/presensi` route is admin-only. | Assert existing admin guard and explicitly verify a student is denied. No authorization change. |
| C — stale/broken test | `tuition-list.cjs` expected `studyProgram`; actual backend and frontend tuition type use `prodi` (backend history commit 16272ab). | Corrected the response assertion to current consumer contract, preserving the full object assertion. No API change. |
| D — unavailable runtime capability | Sandbox denied local listener fixtures (EPERM); initial npm registry lookup failed ENOTFOUND. | Authorized tool retries succeeded. These failures were reported, never skipped. Tests require local listeners, not live external services. |
| B — existing application defect exposed by lint | `userController.ts:130` Dosen case falls into the default HTTP 400 branch; `:235,237` delete handler is empty. | TD-18/TD-19. Left unchanged, outside tooling scope. No claim these are newly introduced regressions. |
| A — established lint policy versus legacy source | `prefer-const` at `userController.ts:103`; `preserve-caught-error` at `lib/prisma.ts:15`; unused old lint suppression at `:10`. | TD-20. Visible source-policy failures/warning, not a broken linter. Requires separate scoped cleanup/diagnostic decision. |

There are no remaining failing legacy tests after the C repairs. There are still five lint errors and one warning. No application bug was fixed to obtain green validation.

### Validation performed

Commands executed from `server/` unless explicitly noted:

```sh
npm install --save-dev --save-exact eslint@10.8.0 @eslint/js@10.0.1 typescript-eslint@8.65.0 globals@17.8.0 --cache /tmp/siakad-npm-cache --no-audit --no-fund --fetch-retries=0
npm run lint
npm run typecheck
npm test
npm run build
```

The installation initially failed with sandbox ENOTFOUND, then succeeded with authorized network access (72 added packages; existing npm lifecycle-policy warnings retained). No broad dependency upgrade was performed.

| Gate | Result |
| --- | --- |
| `npm run lint` | Exit 1: 5 errors, 1 warning at the exact source locations above. Tooling runs; gate is not green. |
| `npm run typecheck` | Exit 0. A before/after SHA-256 inventory confirms no dist file was added or changed; noEmit remains configured. |
| `npm test` | Final exit 0: 17 files, 52 reported tests, 52 pass, 0 failures/skips/cancellations, approximately 8 seconds of test-runner time plus temporary compilation. |
| `npm run build` | Exit 0; production `dist/server.js` exists. |

The initial full test run reported 48 tests, 43 passed and five failed (three stale tests plus two listener denials). Authorized retry reported 45 passed/three failed and exited 1: evidence that existing failures are discovered and propagate to the command. After documented test repairs, the added transcript-rule and isolation checks bring the count to 52; all pass. Existing standalone scripts appear as file-level tests, not a count of every assertion.

The production smoke test now characterizes both a known protected API path and an unknown API path: both remain the existing unauthenticated 401/TOKEN_INVALID response. No 404/error architecture was introduced. Environment tests prove default-chain local fixtures; safety tests prove dummy configuration, blocked remote sockets (including Node normalized arguments), and rejected real PostgreSQL connections. Mock seed tests perform no live writes.

Additional checks: `git diff --check`, production-source/schema/frontend diff checks, package-lock comparison confirming no existing package-version changes, and documentation relative-link checks. No full coverage target or live DB/S3 integration was claimed.

### Exact files changed in M3

- `server/package.json`
- `server/package-lock.json`
- `server/eslint.config.cjs`
- `server/scripts/test.cjs`
- `server/tests/support/setup.cjs`
- `server/tests/support/network-guard.cjs`
- `server/tests/tooling.test.cjs`
- `server/tests/environment.test.cjs`
- `server/tests/production-build.test.cjs`
- `server/tests/master-data.test.cjs`
- `server/tests/student-attendance.cjs`
- `server/tests/tuition-list.cjs`
- `docs/QUALITY.md`
- `docs/exec-plans/active/platform-hardening.md`
- `docs/exec-plans/tech-debt-tracker.md`
- `ARCHITECTURE.md`
- `docs/RELIABILITY.md`
- `server/docs/production-build.md`

### M3 status and limits

**Tooling implementation complete; original all-gates-pass acceptance remains blocked by legacy lint debt TD-18–TD-20.** Leave M3 unchecked rather than claim a green gate. The user explicitly limited this task to tooling; domain and error-behavior fixes were not performed. M2's live deployment acceptance also remains pending. M4 complete. M5 implemented. M6 not started.

A fresh CI job needs Node 24, installed locked development dependencies, a generated Prisma client, writable temporary storage, and local HTTP listener permission with port 4000 free. No production environment or external account should be supplied to tests. The network guard is protection against accidental service use, not a sandbox against malicious tests; new subprocess tests must retain it. Real PostgreSQL/S3 integration coverage remains separate work. Existing source lint defects keep any all-gates CI job red until resolved in scope.

### M5 — API Reliability Foundation (404 handling, health endpoints, request ID)

**Status: Implemented; integration tests blocked by sandbox EPERM (pre-existing from M3/M4).**

Add standard API 404 for unknown routes, process liveness probe, dependency readiness probe, and request ID propagation through the middleware stack.

#### Acceptance

- Unknown API routes return `{ code: "ROUTE_NOT_FOUND", message: "API route not found", requestId: "..." }` at HTTP 404
- Resource-not-found errors (e.g. `GET /api/v1/students/nonexistent`) remain distinct from route-not-found
- `GET /health/live` returns 200 with `{ status: "ok" }` without checking dependencies
- `GET /health/ready` returns 200 when PostgreSQL responds to `SELECT 1`, 503 otherwise
- Every response includes `X-Request-Id` header and `requestId` in error body
- Request ID accepts valid UUID or legacy `req_` prefix headers; rejects unsafe values
- Health endpoints placed before auth middleware (publicly accessible for ALB/Docker probes)

#### Validation performed

Commands executed from `server/`:

```sh
npm run build
npm run typecheck
npm run lint
npm test
```

| Gate | Result |
| --- | --- |
| `npm run build` | Exit 0 ✅ |
| `npm run typecheck` | Exit 0 ✅ |
| `npm run lint` | Exit 1 ⚠️ (same 5 pre-existing TD-18–TD-20; no new failures) |
| `npm test` | 88 pass / 9 fail — **1 pre-existing EPERM** (environment.test), **7 sandbox EPERM** on localhost:4000 (health-endpoints + production-build), **8 request-id unit tests pass** |

The 7 integration test failures are all `EPERM: operation not permitted` on `127.0.0.1:4000` — a sandbox restriction documented in M3/M4. Unit tests for the request ID middleware pass (8/8). Error foundation tests pass (30/30). No domain controllers were modified. No existing business endpoints changed.

| Type | Count |
| --- | --- |
| New source files | `middleware/requestId.ts`, `router/health.ts`, `middleware/notFound.ts` |
| Modified source files | `router/index.ts`, `middleware/errHendler.ts`, `server.ts`, `types/express.d.ts` |
| New test files | `tests/health-endpoints.test.cjs`, `tests/request-id.test.cjs` |

#### Middleware/router ordering (critical)

```
app.use(requestIdMiddleware)          // Every request gets an ID
app.use(router)                       // Router internally:
  → /health/*                         // Public, no auth (before auth middleware)
  → /api/v1/auth/*                    // Public
  → authMiddleware                    // Blocks unauthenticated on everything else
  → /api/v1/* domain routers
  → notFoundHandler                   // Catch-all 404 for unknown API routes
app.use(errorHandler)
```

#### Key decisions

- Health endpoints intentionally placed before auth middleware so ALB/Docker health checks work without credentials
- Readiness checks only `SELECT 1` via Prisma — lightweight, bounded, no schema exposure
- Request ID accepts UUID v4 format OR legacy `req_` prefix; rejects anything else (no injection vector)
- The `X-Request-Id` header is echoed back to clients and exposed via CORS `exposedHeaders`
- Did NOT add structured logging (deferred to M6 per instructions)
- Did NOT modify any domain controllers or existing business endpoints

#### Items deferred to M6 (structured logging)

- Add timestamp, level, method, sanitized path, status, duration to log lines
- Use `req.requestId` as correlation key in log output
- Ensure log redaction of credentials/tokens/personal data

### M5 status and limits

**Implementation complete; integration tests blocked by pre-existing sandbox EPERM restrictions.** All unit tests pass. Build, typecheck pass. Lint unchanged from M4 (same 5 errors + 1 warning). No domain behavior was altered. Ready for deployment acceptance once sandbox listener permissions are available.

