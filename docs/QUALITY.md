# Engineering Quality

## Current baseline

Inspected 2026-10-04. Commands run from their package directories; no root package.json exists.

| Package | Existing scripts | Gaps |
| --- | --- | --- |
| `server/` | `dev`, `typecheck`, `build`, `start`, `prisma:generate`, `seed` | No `lint` or `test` script. M1 now emits `dist/server.js` through a separate build config; focused startup tests are directly runnable (see server/docs/production-build.md). |
| `client/` | `dev`, `build`, `lint`, `preview` | No standalone `typecheck` or `test` script. `build` includes `tsc -b` before Vite. |

Both `server/tests/` and `client/tests/` contain `.cjs` tests. Backend testing is immature, not absent: loaders and invocation styles vary. Audit and preserve useful tests before choosing a common runner. Do not blindly run seed/reset scripts or database-dependent tests against shared data.

## Required implementation gates

For backend tasks, run in `server/`:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Missing scripts are known blockers, not successful checks. Record command, working directory, result, and actionable failure in the execution plan. Do not hide pre-existing failures or add empty scripts to make validation appear green. Platform hardening must establish real gates before being closed.

For frontend tasks, run `npm run lint`, `npm run typecheck`, and `npm run build` in `client/`, and relevant behavioral tests. Until the standalone typecheck script exists, report the gap explicitly; the build's TypeScript phase is useful evidence but does not create the missing command.

For documentation-only work, validate required paths, relative links, internal consistency, whitespace, and the final change scope. Application validation is not required for this bootstrap because no backend or frontend implementation changes are made; no runtime or test pass is implied.

## Engineering standards

Prefer explicit domain types and focused functions. Avoid `any` and unsafe casts used solely to suppress failures. New controllers handle HTTP concerns; services hold business rules and Prisma access. Legacy code remains under the incremental policy in ARCHITECTURE.md.

Add meaningful regression coverage for changed behavior, especially authorization, session handling, error compatibility, and transactions. Preserve current response contracts with characterization tests before changing shared infrastructure. Test failure cases as well as success paths using isolated dependencies and disposable test data.

Keep changes small and reviewable. Avoid unrelated abstractions and cleanup. Record unresolved issues in [technical debt](exec-plans/tech-debt-tracker.md); fix them only under scoped implementation work.
