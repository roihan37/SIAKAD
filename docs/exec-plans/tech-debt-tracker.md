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

| TD-22 | P2 | Student update reads status/avatar/relations before its transaction; best-effort S3 compensation can leave orphan files, and signing can fail after DB commit. Concurrent key reuse can make cleanup unsafe. | **Open:** Deferred behavior change, discovered in Student Service Extraction M7. Preserve ordering in extraction; design concurrency/retry/storage reconciliation separately. See [update audit](../audits/student-controller-responsibility-map.md#7-updatestudentbyid--milestone-7-pre-extraction-characterization-2026-10-05) and [ExecPlan](active/student-service-extraction.md). |


## Student extraction reconciliation (2026-10-05, Milestone 9)

Statuses distinguish completed architectural work from blocked plan acceptance. See the [active extraction plan](active/student-service-extraction.md).

| ID | Priority | Description | Status |
| --- | --- | --- | --- |
| TD-23 | P2 | StudentController mixes HTTP, persistence, transactions and domain behavior; baseline 1,957 lines and 22 direct Prisma usages. | **Resolved:** M2–M8 separated five domain services; M9 inspection finds 231 controller lines, zero Prisma/transaction/business-helper usages, no Express in services, and scoped lint guards. This resolves architecture debt, not the failing final regression gate. |
| TD-24 | P2 | KRS domain review remains outside extraction: semester-history cumulative calculations and transcript repeat-course policy need an explicit consistency decision; KRS projection retains existing semantics. | **Open:** Inspect invariants and intended academic policy before changing behavior. No demonstrated regression or redesign is asserted here. Consider a separately authorized `krs-domain-review.md` after closeout. |
| TD-25 | P2 | Student regression coverage was sparse at baseline; complete authenticated HTTP and live transaction/storage coverage remain absent. | **Partially Resolved:** Four Student files grew to eight; mutation/update/boundary cases and M1/component tests pass. Add dedicated list filter/sort/empty and semester-history/KRS read characterization, authenticated route-to-response tests, and isolated real DB rollback/storage reconciliation tests where practical. Existing grades/tuition tests are not dedicated history/KRS-read coverage. No coverage percentage is claimed. |
| TD-26 | P1 | Full regression and compiled startup cannot certify API error compatibility: six pre-existing health/error-response test failures reproduced in M6–M9. | **Resolved 2026-10-05 (post-M9):** Fixed Pino logger binding bug in  (detached method reference causing  TypeError), fixed test double-read in , verified all 178 tests pass with escalated permissions. Platform hardening validation complete. |

TD-22 remains open: M9 confirms stale pre-transaction reads, best-effort compensation and post-commit signing behavior were preserved. Additional retained lifecycle risks include create-response failure deleting a committed avatar and orphaned storage after failed delete cleanup. Residual cleanup `console.error` calls now live in StudentManagementService; TD-13's foundational logging resolution does not cover these instances. No retry, reconciliation, concurrency, or logging behavior was changed during extraction.
