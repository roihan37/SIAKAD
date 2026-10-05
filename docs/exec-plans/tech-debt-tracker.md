# Technical Debt Tracker

| ID | Priority | Description | Status |
| --- | --- | --- | --- |
| TD-13 | P1 | ~~Structured logging is missing; entry point and error middleware use console logging.~~ | **Resolved 2026-10-05 (M6):** Pino-based structured logger with redaction, request correlation via requestId, HTTP request logging middleware, and error handler integration. Remaining console.error in domain controllers recorded separately. |
| TD-17 | P1 | ~~Graceful shutdown is absent in `server/src/server.ts`.~~ | **Resolved 2026-10-05 (M6):** Added `setupGracefulShutdown` function with SIGTERM/SIGINT handling, bounded request draining (30s timeout), and Prisma database cleanup. Test coverage added in `tests/graceful-shutdown.test.cjs`. |
| TD-18 | P1 | M3 lint exposes existing `userController.ts:130` Dosen switch fall-through into default HTTP 400 (`no-fallthrough`). | Separate scoped application fix with a Dosen retrieval regression test; preserve unrelated behavior. No production fix in M3. |
| TD-19 | P2 | M3 lint exposes two empty blocks in `userController.ts:235,237` (`deleteUserById`). | Determine intended delete behavior/route exposure under a separate task; do not fill in a domain flow during tooling work. |
| TD-20 | P2 | M3 lint exposes `prefer-const` at `userController.ts:103`, missing diagnostic cause at `lib/prisma.ts:15`, and an unused suppression warning at `lib/prisma.ts:10`. | Scoped cleanup and safe diagnostic-cause decision; retain failures visibly until fixed. Do not weaken rules to declare M3 green. |

"Platform M#" refers to [platform-hardening.md](completed/platform-hardening.md). A foundational improvement does not close every legacy instance: record residual scope explicitly. Close an item only with implementation and validation evidence, and preserve its ID and history.

| TD-21 | P3 | ~~Canonical API response contract not established.~~ | **Resolved 2026-10-05 (M7):** Response helpers (`sendData`, `sendCreated`, `sendPaginated`, `sendWithData`) created; health endpoints migrated to canonical `{ data: {...} }` shape; API contract documented with LEGACY/MIGRATED distinction; no domain behavior changed. |
