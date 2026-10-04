# Engineering Quality

## Current commands

Run backend commands from `server/` on Node 24.x. There is no root package.json. After a locked dependency install (`npm ci`), generate the Prisma client with `npm run prisma:generate`; configuration requires DATABASE_URL, but generation does not connect to the database or run migrations. An isolated placeholder URL is sufficient for generation in CI.

| Command | Actual behavior | Latest M3 result (2026-10-04) |
| --- | --- | --- |
| `npm run lint` | Standalone ESLint over backend `.ts`/`.cjs`, excluding generated output and dependencies. | **Fails:** 5 legacy source errors and 1 warning; see below. |
| `npm run typecheck` | Strict `tsc --project tsconfig.json --noEmit` over application source. | Pass; verified existing dist contents unchanged. |
| `npm test` | Discover all test `.cjs` files, compile fresh temporary artifacts, run Node's test runner with isolated configuration. | Pass: 17 files, 52 reported tests, no skips. |
| `npm run build` | Compile `src/` into production `dist/` using `tsconfig.build.json`. | Pass; `dist/server.js` emitted. |

Always run all four gates and report individual exit status. A failing lint command is not a passing overall validation result. Do not add success-only scripts, silently skip failures, or fix unrelated domain behavior to get green checks.

Frontend tooling remains separate and unchanged: `client/` exposes lint and build (including TypeScript), but no standalone typecheck or test script. Do not claim root commands or frontend gates were established by M3.

## Test framework and isolation

Use the existing Node built-in `node:test` / `node:assert/strict`, plus existing ts-node and TypeScript. No Jest, Vitest, or Supertest is installed for the backend. Legacy standalone assertion scripts remain executable under Node's test runner; files without named test cases count as file-level tests, so the reported count is not an assertion or coverage count.

`server/scripts/test.cjs`:

- Recursively discovers `.cjs` tests under `tests/`, excluding `support/` helper directories; prints the full file list and fails if empty. Put helpers in support, and tests in discoverable paths.
- Copies source, Prisma files, tests, and compile config into a temporary workspace; links installed dependencies. It does not copy `.env` or reuse the developer's dist directory.
- Compiles fresh artifacts there before tests. `npm test` works before `npm run build`; compile failure returns non-zero. It needs installed dependencies and a generated Prisma client.
- Provides an explicit environment with dummy database/JWT/storage values, temporary HOME and AWS config paths, UTC timezone, and metadata lookup disabled. Real environment values and credentials are not inherited.
- Runs test files in separate processes with concurrency 1, the existing ts-node transpile-only loader, a 30-second Node test timeout and 180-second subprocess bound. Type safety remains the separate typecheck/build gate; this does not weaken compiler options.
- Propagates failure status and removes its temporary workspace after execution.

The test-only network guard blocks non-loopback socket connections and real `pg.Client.connect` calls. Existing subprocess-based tests propagate that guard through NODE_OPTIONS. Only local HTTP fixtures are needed; port 4000 must be free for the compiled startup smoke test. Sandboxed runners must allow local listeners; a denied listener is an explicit failure, not a skipped test. This guard prevents accidental service use by these tests; it is not a security sandbox for hostile test code. New subprocess tests must preserve the guard.

No current suite requires live PostgreSQL, S3, migrations, or seed writes. Database logic is exercised with mocks, including the seed suite. Integration coverage consists of compiled app startup/local HTTP and credential-provider fixtures, not real database or cloud integration. Use `npm test` for the safe complete suite; direct ad-hoc test commands do not automatically provide all runner isolation.

## Existing test inventory

| Tests | Style and dependencies |
| --- | --- |
| `attendance.cjs`, `student-attendance.cjs`, `student-grades.cjs` | Validation/mapping/controller and authorization checks; mocked Prisma. |
| `auth-security.cjs`, `route-authorization.cjs` | JWT/session/role checks; mocked persistence and inspected Express router stacks. |
| `grades.cjs`, `payments.cjs`, `schedule-create.cjs` | Business/controller behavior and transactions; mocked Prisma and storage. |
| `student-finance.cjs`, `student-tuition.cjs`, `tuition-generation.cjs`, `tuition-list.cjs` | Financial mapping, SQL parameter construction, boundaries and errors; mocked persistence. |
| `seed.cjs` | Two mock seed runs and relation/idempotency assertions; no real database. |
| `master-data.test.cjs` | Node test cases with an existing VM/TypeScript loader and injected imports. |
| `environment.test.cjs` | Isolated compiled config subprocesses, temporary profile files, local container-role fixture. |
| `production-build.test.cjs` | Missing-config failure, compiled startup, existing known/unknown unauthenticated API behavior; local HTTP. |
| `tooling.test.cjs` | Explicit environment and network/database guard checks. |

## ESLint baseline and known failures

Backend ESLint uses core recommended rules, the TypeScript parser/plugin and its core-rule compatibility preset, and Node globals. `no-undef` is disabled for TypeScript because tsc handles names; `no-unused-vars` is deliberately not enabled in this initial brownfield baseline. Explicit-any/type-aware/style campaigns are not part of M3. This is a correctness baseline, not the frontend React rules or a repository-wide cleanup policy.

Current source failures remain visible; no baseline ignore file, inline suppression, auto-fix, or warning downgrade was added:

| Location | Finding | Follow-up |
| --- | --- | --- |
| `server/src/controllers/userController.ts:103` | `prefer-const` | Scoped legacy cleanup. |
| `server/src/controllers/userController.ts:130` | `no-fallthrough`: Dosen case reaches default 400 | Existing application defect; separate behavioral fix and regression test. |
| `server/src/controllers/userController.ts:235`, `:237` | Two `no-empty` errors in deleteUserById | Existing unimplemented flow; requires scoped behavior decision. |
| `server/src/lib/prisma.ts:15` | `preserve-caught-error` | Diagnostic-cause policy needs scoped review without exposing secrets. |
| `server/src/lib/prisma.ts:10` | Unused eslint-disable warning | Existing stale suppression; not silently removed in tooling work. |

See TD-18–TD-20 in the [debt tracker](exec-plans/tech-debt-tracker.md). No legacy test failures remain after three documented stale-test repairs; no production source changed. Classify future failures as A: tooling/configuration, B: application regression/defect, C: stale/broken test, or D: unavailable external dependency/runtime capability. Preserve failing application assertions until their behavior is resolved.

## Engineering standards

Prefer explicit types and focused functions; do not suppress compiler errors with unsafe casts. New HTTP controllers call services; legacy code follows the incremental migration policy. Add meaningful behavior regression tests for scoped changes, especially authorization, sessions, compatibility and transactions. Do not attempt repository-wide coverage in an infrastructure task.

For documentation-only work, check required paths, relative links, consistency, whitespace, and change scope. For implementation work, record actual command results in its execution plan. The [platform plan](exec-plans/active/platform-hardening.md) remains open while its required acceptance gates fail.
