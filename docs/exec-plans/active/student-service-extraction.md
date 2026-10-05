# Student Service Extraction

## Status

Active

## Type

Incremental brownfield refactor.

## Priority

P2: Maintainability / architecture hotspot.

---

# 1. Context

The current student domain is primarily implemented inside:

```text
server/src/controllers/studentController.ts
```

The controller is approximately 1,090 lines long and currently contains a mixture of:
- HTTP request handling
- request validation
- authentication/authorization-related checks
- business rules
- Prisma queries
- Prisma transactions
- password hashing
- avatar handling
- S3 cleanup
- student CRUD
- bulk operations
- academic history
- KRS queries
- grade calculations
- attendance aggregation
- tuition queries
- financial queries

This makes the controller difficult to:
- understand
- test
- modify safely
- reuse
- review
- maintain

The repository target architecture for new and migrated backend code is:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Prisma
```

A repository layer is intentionally NOT part of the current target architecture.

Services may access Prisma directly.

This plan migrates the Student domain toward that architecture without performing a repository-wide backend refactor.

---

# 2. Current Student Routes

The current student router exposes behavior equivalent to:

```text
GET    /api/v1/students/
POST   /api/v1/students/

GET    /api/v1/students/:id
PATCH  /api/v1/students/:id
DELETE /api/v1/students/:id

PATCH  /api/v1/students/bulk/status
DELETE /api/v1/students/bulk

PATCH  /api/v1/students/:userId/reset-password

GET    /api/v1/students/:id/history-semester
GET    /api/v1/students/:id/krs
GET    /api/v1/students/:id/nilai
GET    /api/v1/students/:id/presensi

GET    /api/v1/students/me/ukt
GET    /api/v1/students/:id/ukt
GET    /api/v1/students/:id/keuangan
```

Current route paths, HTTP methods, authentication behavior, authorization behavior, status codes, and response contracts must be preserved unless an explicit bug is discovered and separately approved.

---

# 3. Current Controller Responsibilities

The current controller contains methods including:

```text
getFinanceyId
getUKTById
getMyUKT

getStudentAttendance

bulkUpdateStatus
bulkDelete

createStudent
updateStudentById
deleteUserById

getAllStudents
getStudentById

getStudentSemesterHistory
getStudentKRS
getStudentNilai

resetPassword
```

These responsibilities should not remain inside one controller implementation.

---

# 4. Goal

Refactor the Student domain so that:

```text
studentController
       ↓
focused student services
       ↓
Prisma
```

The final StudentController should primarily be responsible for:
1. reading HTTP request values
2. invoking the appropriate service
3. returning the existing HTTP response
4. forwarding errors to centralized error handling

Business logic should live in services.

Database access should live in services.

Transaction boundaries associated with business operations should live in services.

---

# 5. Non-Goals

This plan MUST NOT become a general backend cleanup.

The following are explicitly outside this plan:
- redesigning the entire backend architecture
- introducing a Repository layer
- changing existing student routes
- changing API versioning
- changing existing response shapes without necessity
- redesigning authentication
- redesigning authorization globally
- redesigning the KRS domain
- changing Prisma models
- creating database migrations
- migrating Redux
- restructuring frontend folders
- migrating every legacy controller
- introducing new student features
- performing unrelated naming cleanup
- redesigning all validation architecture
- rewriting existing tuition services
- rewriting existing attendance helpers
- changing business rules merely because they appear unusual

If unrelated problems are discovered, record them in:

```text
docs/exec-plans/tech-debt-tracker.md
```

Do not expand the scope automatically.

---

# 6. Refactoring Principle

This is a behavior-preserving extraction.

The main rule is:

```text
MOVE behavior
before
CHANGE behavior
```

Do not combine:
- architecture refactor
- business-rule redesign
- API redesign

inside the same change.

When unclear whether an existing behavior is correct:
1. document the current behavior
2. protect it with a characterization test where practical
3. move it unchanged
4. record suspected bugs separately

Do not silently "fix" questionable business behavior during extraction.

---

# 7. Target Architecture

Target request flow:

```text
HTTP Request
     ↓
Student Router
     ↓
Auth / Role Middleware
     ↓
Student Controller
     ↓
Student Service Layer
     ↓
Prisma
     ↓
PostgreSQL
```

The controller must eventually have no direct dependency on:

```text
prisma
Prisma transaction APIs
hashPassword
AvatarService
S3Service
tuition database functions
attendance aggregation implementation
```

Those dependencies should belong to the appropriate service.

---

# 8. Target Services

The StudentController will be split across these focused services:

```text
StudentFinanceService
  - getFinance (getFinanceyId)
  - getUKTBills (getUKTById)
  - getMyUKT (getMyUKT)

StudentAccountService
  - resetPassword (resetPassword)

StudentAttendanceService
  - getStudentAttendance (getStudentAttendance)

StudentManagementService
  - getAllStudents (getAllStudents)
  - getStudentById (getStudentById)
  - bulkUpdateStatus (bulkUpdateStatus) ← M6 extracted
  - createStudent (createStudent) ← M6 extracted
  - updateUser (updateStudentById) ← TODO
  - deleteUserById (deleteUserById) ← M6 extracted
  - bulkDelete (bulkDelete) ← M6 extracted

StudentAcademicService
  - getStudentSemesterHistory (getStudentSemesterHistory)
  - getStudentKRS (getStudentKRS)
  - getStudentNilai (getStudentNilai)
```

---

# 9. Current File State

| File | Lines | Status |
|------|-------|--------|
| server/src/controllers/studentController.ts | ~1,090 | Partially migrated |
| server/src/services/student-finance.service.ts | ~80 | Complete |
| server/src/services/student-account.service.ts | ~75 | Complete |
| server/src/services/student-attendance.service.ts | ~110 | Complete |
| server/src/services/student-management.service.ts | ~356 | Partial (needs mutations) |
| server/src/services/student-academic.service.ts | ~445 | Complete |

---

# 10. Migration Milestones

## Milestone 0: Preconditions ✅ COMPLETED
- Verified platform foundation
- Ran quality gates (lint/typecheck/test/build all green)
- Established baseline
- All tests passing (102 pass, 9 EPERM sandbox failures)

## Milestone 1: Characterization ✅ COMPLETED
- Responsibility map created at `docs/audits/student-controller-responsibility-map.md`
- Characterization tests added for high-risk methods
- Test coverage matrix created
- Suspected bugs recorded

## Milestone 2: Finance + Account ✅ COMPLETED
- Created `student-finance.service.ts`
- Created `student-account.service.ts`
- Migrated: getFinanceyId, getUKTById, getMyUKT, resetPassword

## Milestone 3: Attendance ✅ COMPLETED
- Created `student-attendance.service.ts`
- Migrated: getStudentAttendance
- Transaction boundary remains in controller (recorded as tech debt)

## Milestone 4: Core Read ✅ COMPLETED
- Extended `student-management.service.ts`
- Migrated: getAllStudents, getStudentById
- Response shapes preserved exactly

## Milestone 5: Academic ✅ COMPLETED
- Extended `student-academic.service.ts`
- Migrated: getStudentSemesterHistory, getStudentKRS, getStudentNilai
- User lookup handled inside service

## Milestone 6: Management Mutations — implemented; baseline validation failures remain

2026-10-05 scope: only `createStudent`, `deleteUserById`, `bulkUpdateStatus`, and `bulkDelete`.

- [x] Extended the existing Express-independent `StudentManagementService`; retained existing database operations as private transaction helpers.
- [x] Moved all four RepeatableRead transaction boundaries into public service methods; no affected controller opens a transaction.
- [x] Moved bulk-status validation, ID normalization, changed-count orchestration and history writes into the service.
- [x] Moved create avatar verification/hash dependencies and failure cleanup, single-delete cleanup, and bulk cleanup orchestration into the service.
- [x] Kept delete request validation and direct 400 envelopes in the controller. IDs still deduplicate after the original 100-item limit, and single-delete IDs remain untrimmed after validation.
- [x] Added focused mutation/service/controller tests with mocked transactions and storage; repaired the existing bulk-status characterization test that previously swallowed a missing mock dependency and asserted only the default response status.
- [x] Record focused tests and all four backend validation gates below (full-suite gate remains failing on unchanged baseline).

Inspection evidence and compatibility decisions:

- The responsibility map is historical and differs from executable code. Create currently has no explicit required-field/strength checks, duplicate preflight, or initial status-history write; bcrypt, avatar verification, and Prisma enforce existing failures. Preserve those behaviors and propagate duplicate/other database errors unchanged. Do not add new validation or history during extraction.
- Create hashes and verifies the supplied avatar inside the transaction, creates user then mahasiswa with the existing optional dosen/prodi linkage, and attempts avatar deletion after any transaction failure. Cleanup failure never replaces the original error. The legacy catch also cleaned the avatar if response writing failed after commit: retain that unusual behavior through a service cleanup method invoked by the controller only after successful creation. No response callback or Express dependency enters the service.
- Delete checks the student relation, deletes transkrip → KRSDetail → KRS → user in one transaction, retaining existing database cascades. Storage cleanup occurs only after successful commit. Storage failures are logged/swallowed and still produce the success response; a failed commit never triggers deletion of the avatar.
- Bulk delete validates all selected students before writes, checks deleted count inside the same transaction, then deduplicates avatar keys and processes sequential batches of at most five concurrent cleanup calls. No chunked database transactions or selected-user changes were introduced.
- Status writes and history stay atomic, skip unchanged students, require a trimmed reason for every status, and retain existing messages/status values/count output.

Remaining management logic: `updateStudentById` is unchanged and reserved for Milestone 7. Other controller transactions/imports belong to later milestones and remain untouched. Milestones 7–9 have not started.

Rollback: revert the M6 controller/service/test changes together; no schema, dependency, route, or data migration is required. Tests use mocked transaction boundaries and failure ordering; they do not establish live PostgreSQL rollback or S3 integration behavior.

Validation results (2026-10-05, commands run from `server/`):

- `node --test tests/student-management-mutations.test.cjs`: PASS, 27 tests, no skips. Covers success responses, validation boundaries, duplicate/database errors, transaction failure ordering, status history, cleanup failures and bulk cleanup concurrency.
- `npm run lint`: PASS (exit 0).
- `npm run typecheck`: PASS (exit 0).
- `npm test`: FAIL (exit 1), 139 tests: 133 pass, 6 fail, no skips after allowing local test servers. Initial sandbox run had 9 localhost EPERM failures; these are not counted as passing checks.
- Unchanged `HEAD` exported to a temporary directory and tested with the same installed dependencies: FAIL, 112 tests: 106 pass, the same 6 failures. Two health tests consume response bodies twice; unknown-route/authentication tests receive HTML 500 responses; request-ID and compiled-server smoke tests then fail JSON parsing. These pre-existing failures remain outside M6; the full-suite gate is not green.
- `npm run build`: PASS (exit 0).
- `git diff --check`: PASS. Compared the complete `updateStudentById` method against `HEAD`: byte-for-byte unchanged.

M6 extraction and its focused validation are complete. Full-suite acceptance remains constrained by the six reproduced baseline failures; no unrelated health/error-handler/test-tooling fixes or Milestone 7 work were attempted.

## Milestone 7: updateStudentById — EXTRACTION COMPLETE (2026-10-05)

Scope: only update extraction; no schema/frontend changes or Milestone 8 cleanup. Full-suite acceptance retains the six documented baseline failures below.

- [x] Inspect complete method before editing production code; correct and expand responsibility map section 7.
- [x] Add and run 27 pre-extraction characterization tests covering validation, partial-value semantics, transaction and S3 failure ordering against the original controller (27/27 PASS).
- [x] Define explicit `UpdateStudentInput`; focused tests 27/27 and typecheck PASS before moving behavior.
- [x] Move pure validation and user/prodi/dosen reads into private `prepareStudentUpdate`; focused tests 27/27 and typecheck PASS at that checkpoint.
- [x] Move transaction/history and guarded avatar orchestration together into `StudentManagementService.updateStudent(input: UpdateStudentInput)`; focused update + M6 mutation tests 54/54 and typecheck PASS.
- [x] Thin HTTP controller; add two post-extraction tests for direct service use/first avatar and controller field allow-list/error forwarding. Final focused run 56/56 PASS (29 update + 27 M6 mutation tests).
- [x] Run lint/typecheck/full suite/build; record evidence and TD-22 risks.

Final API: `StudentManagementService.updateStudent(input: UpdateStudentInput)` returns the existing response data fields (`id`, `nama`, `email`, `username`, `avatarUrl`, `mahasiswa`, `statusHistory`). The controller String-converts the path ID, explicitly copies only the supported fields, invokes the service and sends the unchanged 200 message/data envelope or forwards errors. It has no Prisma, transaction, relation checks, history or S3 calls. No Express dependency is introduced into the service.

Input decision: explicit optional scalar properties for user/NIM/password writes, generated Gender/Status types, nullable supported fields; fields already coerced with Number/String use `unknown` to preserve the existing runtime conversion/validation behavior. No Request, raw body object, catch-all record or new `any` crosses the service API. Undefined/null/empty values are not defaulted. The type describes supported scalar writes; it does not add a new HTTP validator or prevent malformed runtime values from reaching the same legacy Prisma checks. Required scalar nulls still reach Prisma at runtime; nullable clear operations remain supported.

Transaction decision: preserve the single default-options interactive transaction, nested user/mahasiswa update and password-triggered refresh-token revocation, followed by status history inside that same transaction. Reads and validation remain before it. No isolation-level change, split writes, status allow-list, duplicate preflight, new reason limit, or normalization. Invalid status remains a Prisma error when a reason is present; missing reason still takes precedence.

Avatar decision: preserve verification before hashing/transaction; register compensation only for a verified different key; hash/write/history/commit failure attempts deletion of that key, preserving the original error if deletion fails. Clear compensation immediately after commit; delete replaced/removed old key best-effort; then sign the resulting key. Same key is verified but never compensated. Removal skips verification/signing. Signing or HTTP response failure after commit does not delete the committed new key. No uploads or external calls were added inside transactions.

Validation from `server/` (2026-10-05):

- `node --test tests/student-update.test.cjs tests/student-management-mutations.test.cjs`: PASS, 56/56. Prisma/S3 doubles assert payloads, failure propagation and event order; no live DB/S3 was used.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: initial sandbox run 168 tests, 159 pass / 9 fail, with localhost listen/connect EPERM. Rerun with local listener permission: **168 tests, 162 pass / 6 fail**. Milestone 1 `student-characterization.cjs` reports PASS, including existing update/status-reason checks.
- Six full-suite failures match the M6 baseline: health live/ready tests consume response bodies twice; unknown route returns HTML 500 instead of 404; known unauthenticated route returns 500 instead of 401; request-ID and compiled-server smoke tests receive HTML rather than JSON. No new update failure. These are not counted as passed gates or fixed under M7.
- `npm run build`: PASS.
- `git diff --check`: PASS. Scope comparison against HEAD confirms all other controller/service methods remain unchanged. Controller import adds only the input type; unused legacy imports are reserved for M8.

Remaining risks: TD-22 records pre-transaction stale reads, concurrent avatar-key reuse/compensation, orphaned objects after cleanup/verification failures, and error responses after successful commits. Isolated tests verify orchestration but not real database rollback or cloud availability. Retained cleanup console logging also belongs to later logging work. No behavior change was required or approved. Milestones 8–9 have not started.

## Milestone 8: Thin Controller ❌ NOT STARTED
- Remove direct prisma imports from controller
- Remove direct hashPassword import
- Remove direct AvatarService/S3Service imports (where possible)
- Only imports remaining: Request, Response, NextFunction, service classes

## Milestone 9: Final Regression ❌ NOT STARTED
- Full test suite
- Final documentation
- Move execplan to completed/

---

# 11. Validation Commands

All commands run from `server/`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

# 12. Decision Log

Record meaningful decisions during implementation.

Do not rely on chat history.

Format:

```text
YYYY-MM-DD

Decision:
...

Reason:
...

Alternatives considered:
...

Consequences:
...
```

Initial decisions:

## Decision 001

Student domain target architecture is:

```text
Controller
→ Service
→ Prisma
```

A Repository layer will not be introduced.

Reason:

The current SIAKAD target backend architecture intentionally allows services to access Prisma directly.

---

## Decision 002

StudentController will be split across multiple cohesive services rather than moved wholesale into one StudentService.

Reason:

Moving approximately 1,090 lines from one file into another would reduce no meaningful architectural complexity.

---

## Decision 003

This refactor is behavior-preserving.

Reason:

Changing business behavior while moving architectural boundaries would make regressions difficult to distinguish from intentional changes.

---

## Decision 004

KRS redesign is excluded.

Reason:

The StudentController extraction should not be coupled to the separate KRS domain-model concerns.

---

## Decision 005 (historical; superseded for the four M6 mutations on 2026-10-05)

Transaction boundaries previously remained in the controller for mutations.

Reason:

The existing pattern shows transactions wrapping service calls. Moving transaction boundaries to services would require careful analysis of isolation levels and error handling semantics.

Recorded as technical debt.

---

# 13. Technical Debt Tracked

See also: `docs/exec-plans/tech-debt-tracker.md`

Items touched by this refactor:

| ID | Description | Status |
|----|-------------|--------|
| TD-001 | Transaction boundaries in controller | Resolved for the four M6 mutations; other methods remain deferred |
| TD-002 | S3 cleanup ordering after commit | Preserved |
| TD-003 | Console logging in services | To be addressed in structured logging phase |

---

# 14. Completion

When all milestones and exit criteria pass:

Move:

```text
docs/exec-plans/active/student-service-extraction.md
```

to:

```text
docs/exec-plans/completed/student-service-extraction.md
```

Do not delete the completed plan.

It becomes part of the repository's engineering history.

Before moving it, record:

```text
final validation results
services created
controller responsibilities remaining
technical debt discovered
architectural decisions
known follow-up work
```

Recommended follow-up work should be evaluated separately and may include:

```text
KRS domain review
frontend server-state migration
frontend feature-folder migration
legacy backend controller migration
architecture lint enforcement
transaction boundary migration to services
```
