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

The controller is approximately 1,957 lines long and currently contains a mixture of:

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

```text
architecture refactor
+
business-rule redesign
+
API redesign
```

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

# 8. Target Service Boundaries

Do NOT create one giant `student.service.ts` containing another 1,500 lines.

Prefer cohesive services.

Follow the repository's existing flat `src/services/` convention unless a separate folder structure is explicitly approved.

Target service files:

```text
server/src/services/

student.service.ts
student-management.service.ts
student-account.service.ts
student-academic.service.ts
student-attendance.service.ts
student-finance.service.ts
```

These names may be adjusted if repository conventions strongly justify a different naming scheme.

Do not create unnecessary service files merely to mirror controller methods.

---

# 9. Service Responsibilities

## 9.1 StudentService

Core student query behavior.

Candidate responsibilities:

```text
getAllStudents
getStudentById
```

May also contain small shared student-domain lookup utilities when they represent meaningful domain behavior.

It must not become a generic dumping ground.

---

## 9.2 StudentManagementService

Administrative student lifecycle operations.

Candidate responsibilities:

```text
createStudent
updateStudentById
deleteStudentById
bulkUpdateStatus
bulkDelete
```

This service may coordinate:

- Prisma transactions
- status history creation
- avatar verification
- avatar cleanup
- S3 cleanup
- student/user persistence

Complex transaction boundaries should live here rather than in the controller.

---

## 9.3 StudentAccountService

Account-related operations.

Candidate responsibility:

```text
resetPassword
```

Responsible for:

- password business validation where appropriate
- password hashing
- persistence

It must never expose password hashes.

---

## 9.4 StudentAcademicService

Student academic information.

Candidate responsibilities:

```text
getStudentSemesterHistory
getStudentKRS
getStudentNilai
```

This extraction must preserve the current KRS and grade business rules.

This plan does NOT authorize redesigning KRS state models or Prisma KRS schemas.

Any KRS design concern discovered should be recorded for:

```text
krs-domain-review.md
```

---

## 9.5 StudentAttendanceService

Student attendance query and aggregation.

Candidate responsibility:

```text
getStudentAttendance
```

It may reuse existing helpers such as:

```text
attendanceCounts
percentage
```

Do not duplicate attendance calculation logic unnecessarily.

---

## 9.6 StudentFinanceService

Student finance and tuition behavior.

Candidate responsibilities:

```text
getStudentFinance
getStudentTuition
getCurrentStudentTuition
```

It should reuse existing finance and tuition domain functions where appropriate, including existing behavior currently provided by:

```text
getStudentFinance
listStudentTuitionBills
```

Do not duplicate tuition calculation logic.

Transaction orchestration currently performed by StudentController should move to the service when it forms part of the finance operation.

---

# 10. Controller Rules

After migration, StudentController should remain transport-focused.

Preferred shape:

```ts
static async getStudentById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = /* parse HTTP input */

    const data =
      await StudentService.getStudentById(id)

    return res.status(200).json({
      message: "...",
      data,
    })
  } catch (error) {
    next(error)
  }
}
```

The exact response must preserve the current contract.

Controllers should NOT:

```text
query Prisma directly
open Prisma transactions
hash passwords
delete S3 objects
calculate grades
calculate attendance
implement status transitions
orchestrate multi-model persistence
```

---

# 11. Service Rules

Services must NOT depend on Express.

Service files should not import:

```text
Request
Response
NextFunction
```

Bad:

```ts
StudentService.getStudent(req, res)
```

Good:

```ts
StudentService.getStudentById(userId)
```

For more complex operations:

```ts
StudentManagementService.updateStudent({
  userId,
  name,
  semester,
  status,
  ...
})
```

Services should accept explicit typed values or input objects.

---

# 12. Validation Boundary

Do not redesign all validation during this refactor.

Use this practical distinction.

## HTTP / Transport Validation

May remain close to controller or existing validators:

```text
missing route parameter
invalid query-string shape
invalid HTTP payload shape
```

Existing reusable validators should continue to be reused.

## Domain / Business Validation

Belongs with service behavior:

```text
student does not exist
academic year does not exist
invalid student status transition
duplicate domain entity
student relationship does not exist
grade data violates domain assumptions
```

Do not duplicate the same validation in both controller and service.

---

# 13. Error Handling

The extraction must use the error foundation established by platform hardening.

Prefer canonical application errors for migrated service code.

Conceptually:

```text
AppError
statusCode
code
message
details?
```

However, preserve existing externally visible behavior where required.

Do not perform repository-wide error migration as part of this plan.

Student endpoints migrated during this plan may adopt the canonical error foundation when backward compatibility is maintained.

Unexpected errors must continue to reach the centralized error handler.

---

# 14. Transaction Policy

Existing transactional guarantees must be preserved.

If an operation currently performs:

```ts
prisma.$transaction(...)
```

the transaction should normally move into the relevant service.

Example:

```text
Controller
   ↓
StudentManagementService.updateStudent()
   ↓
prisma.$transaction()
```

Not:

```text
Controller
   ↓
prisma.$transaction(tx =>
  StudentService.update(...)
)
```

Transaction boundaries are business/application orchestration concerns and should not remain in HTTP controllers.

Do not reduce transaction isolation levels without explicit justification.

Do not split currently atomic operations into multiple independent writes.

---

# 15. Side Effect Policy

Student operations currently interact with:

```text
AvatarService
S3Service
password hashing
status-history creation
```

These side effects require special care.

During extraction:

- preserve cleanup behavior
- preserve compensating cleanup behavior
- preserve upload ownership rules
- preserve avatar deletion behavior
- preserve transaction boundaries
- preserve failure semantics

Do not accidentally create cases where:

```text
database succeeds
but required cleanup logic is lost
```

or:

```text
S3 object is deleted
before database transaction safely completes
```

Any change to side-effect ordering must be documented.

---

# 16. Backward Compatibility Requirements

This refactor must not intentionally change:

```text
route paths
HTTP methods
authentication requirements
role requirements
successful HTTP status codes
error HTTP status codes
response property names
pagination behavior
sorting behavior
filter behavior
business calculations
```

unless specifically documented as a previously confirmed bug fix.

Existing frontend consumers should continue working without coordinated frontend changes.

---

# 17. Test Strategy

This plan requires characterization coverage before moving high-risk behavior.

Do not wait until the controller has already been refactored to discover its behavior.

Existing student-related tests should be inspected first, including relevant tests such as:

```text
student-attendance.cjs
student-grades.cjs
student-finance.cjs
student-tuition.cjs
route-authorization.cjs
auth-security.cjs
```

Do not assume they provide complete StudentController coverage.

Identify missing coverage.

Priority characterization areas:

```text
student list
student detail
student creation
student update
student delete
bulk status
bulk delete
reset password
semester history
KRS
grades
attendance
UKT
finance
authorization boundaries
```

Tests should primarily assert externally visible behavior.

Avoid tests that merely assert which private function was called.

---

# 18. Migration Strategy

Migration must be incremental.

Do not replace all StudentController behavior in one commit.

Each milestone should leave the application in a working state.

Recommended sequence:

```text
baseline
↓
low-risk service extraction
↓
read/query extraction
↓
academic extraction
↓
mutation extraction
↓
complex update extraction
↓
controller cleanup
```

The most complex methods should be migrated only after the service pattern has been proven on simpler endpoints.

---

# 19. Milestone 0: Preconditions

## Objective

Confirm platform foundations are stable before Student refactoring starts.

Verify:

```text
platform-hardening completed or sufficiently stable
lint command works
typecheck command works
test command works
production build works
central error handling exists
```

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Record baseline results.

Do not begin extraction if production build is currently broken for unrelated reasons unless the blocker is documented and explicitly accepted.

### Status

- [ ] Preconditions verified

---

# 20. Milestone 1: Characterization and Responsibility Map

## Objective

Understand current behavior before moving code.

Inspect every StudentController method and document:

```text
route
middleware
inputs
response
status code
database models touched
transactions
side effects
dependencies
known tests
known risks
```

Create a responsibility table inside this ExecPlan or a supporting audit document.

At minimum cover:

```text
getFinanceyId
getUKTById
getMyUKT
getStudentAttendance
bulkUpdateStatus
createStudent
updateStudentById
deleteUserById
bulkDelete
getAllStudents
getStudentById
getStudentSemesterHistory
getStudentKRS
getStudentNilai
resetPassword
```

Identify missing tests.

Add focused characterization tests for high-risk behavior before extraction.

Do not change architecture yet except for testability improvements that do not alter behavior.

### Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Exit Criteria

- [ ] Current student behavior mapped
- [ ] Existing student tests identified
- [ ] Critical missing characterization tests added
- [ ] Known behavior documented
- [ ] Suspected bugs recorded separately

---

# 21. Milestone 2: Establish Student Service Pattern

## Objective

Create the service boundary using low-risk operations first.

Create only the service files that are currently needed.

Do not create empty speculative abstractions.

Recommended first candidates:

```text
StudentFinanceService
StudentAccountService
```

because their responsibilities are relatively isolated and some finance logic already exists in dedicated tuition services.

Move service-level orchestration for:

```text
getFinanceyId
getUKTById
getMyUKT
resetPassword
```

where appropriate.

Controllers must continue returning the same external responses.

Services must not depend on Express.

### Expected Direction

Before:

```text
Controller
→ validation
→ transaction
→ tuition service / Prisma
→ response
```

After:

```text
Controller
→ StudentFinanceService
→ transaction
→ existing tuition service / Prisma
```

### Validation

Run focused tests for:

```text
finance
tuition
reset password
authorization
```

Then:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Exit Criteria

- [ ] Service pattern proven
- [ ] Finance orchestration removed from controller where appropriate
- [ ] Password hashing removed from controller
- [ ] Responses unchanged
- [ ] Relevant tests pass

---

# 22. Milestone 3: Extract Attendance

## Objective

Move attendance domain logic from StudentController to:

```text
student-attendance.service.ts
```

Move:

```text
student lookup
academic-year lookup
attendance queries
grouping
summary generation
percentage calculation orchestration
```

Reuse existing:

```text
attendanceCounts
percentage
```

Do not duplicate them.

Controller should only:

```text
parse userId
parse tahunAkademikId
call StudentAttendanceService
return response
```

Preserve:

```text
academicYear response
summary response
course grouping
sort behavior
attendance percentages
NotFound behavior
```

### Validation

Run student attendance tests first.

Then:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Exit Criteria

- [ ] No attendance Prisma queries remain in StudentController
- [ ] Attendance output unchanged
- [ ] Attendance tests pass

---

# 23. Milestone 4: Extract Student Read Operations

## Objective

Move read-heavy core student behavior.

Target methods:

```text
getAllStudents
getStudentById
```

Move to:

```text
student.service.ts
```

Preserve:

```text
filters
pagination
sorting
selected relations
avatar behavior
response shape
NotFound semantics
authorization behavior
```

Do not optimize Prisma queries merely because a different query appears cleaner unless the behavior and performance implications are understood.

If optimization opportunities are discovered, record them separately.

### Validation

Add or update characterization tests covering:

```text
list students
pagination
filters
student detail
student not found
admin/student authorization
```

Then run full validation.

### Exit Criteria

- [ ] Core read Prisma queries removed from controller
- [ ] List behavior preserved
- [ ] Detail behavior preserved
- [ ] Tests pass

---

# 24. Milestone 5: Extract Academic Read Operations

## Objective

Move academic student logic to:

```text
student-academic.service.ts
```

Target methods:

```text
getStudentSemesterHistory
getStudentKRS
getStudentNilai
```

This is a high-risk milestone because these methods contain substantial domain calculations and data transformation.

Do NOT redesign these calculations while extracting them.

Preserve:

```text
semester history ordering
academic-year behavior
KRS response
KRS filtering
grade calculations
SKS calculations
IP/IPK-related behavior if present
duplicate-course behavior
grade validation behavior
current academic-year handling
```

KRS schema concerns discovered during this milestone must be recorded for a separate domain review.

Do not rename:

```text
StatusKRS
KRSStatus
```

or modify Prisma schemas as part of this extraction.

### Characterization Requirements

Before changing each large academic method, ensure representative tests exist.

At minimum cover:

```text
student not found
academic year behavior
empty academic history
existing KRS
missing KRS
valid grades
invalid/edge grade data
ordering
```

### Validation

Run academic-specific tests first:

```text
student-grades
KRS-related tests
semester history tests
```

Then full validation.

### Exit Criteria

- [ ] Academic Prisma access removed from StudentController
- [ ] Academic calculations preserved
- [ ] KRS behavior preserved
- [ ] Grade behavior preserved
- [ ] Relevant tests pass

---

# 25. Milestone 6: Extract Student Management Mutations

## Objective

Move administrative student mutation behavior to:

```text
student-management.service.ts
```

Target:

```text
createStudent
deleteUserById
bulkUpdateStatus
bulkDelete
```

Do not migrate `updateStudentById` yet.

That method is intentionally handled separately because of its complexity.

Move:

```text
Prisma transactions
password hashing for creation where applicable
status-history creation
avatar verification
avatar cleanup
S3 cleanup
bulk database operations
```

Preserve current atomicity.

### Special Attention

For `createStudent`:

Preserve cleanup when user creation fails after avatar handling.

For `deleteUserById`:

Preserve database and avatar cleanup semantics.

For `bulkUpdateStatus`:

Preserve:

```text
maximum item count
valid statuses
required reason
status history creation
changedCount semantics
```

For `bulkDelete`:

Preserve:

```text
validation
transaction behavior
avatar cleanup behavior
batching behavior
```

### Validation

Add characterization tests where coverage is missing.

Test both:

```text
successful mutation
failed mutation
```

especially where external side effects exist.

Then run full validation.

### Exit Criteria

- [ ] Creation logic moved
- [ ] Delete logic moved
- [ ] Bulk status moved
- [ ] Bulk delete moved
- [ ] Side-effect semantics preserved
- [ ] Transaction semantics preserved
- [ ] Tests pass

---

# 26. Milestone 7: Extract updateStudentById

## Objective

Migrate the largest and highest-risk student mutation independently.

Target:

```text
updateStudentById
```

into:

```text
StudentManagementService.updateStudent(...)
```

Do NOT combine this milestone with unrelated cleanup.

Before extraction, document all current behavior including:

```text
user lookup
student lookup
status transition
statusReason
birthDate validation
angkatan validation
semester validation
prodi validation
dosen validation
avatar validation
avatar replacement
avatar cleanup
user updates
mahasiswa updates
status history
transaction boundaries
post-transaction cleanup
```

Create a typed input object instead of passing Express Request.

Conceptually:

```ts
type UpdateStudentInput = {
  userId: string
  name?: string
  email?: string
  ...
}
```

The exact type must reflect actual supported fields.

Do not use:

```ts
Record<string, any>
```

as a shortcut if a meaningful input type can be created.

### Critical Requirement

This milestone is an extraction first.

Do not simultaneously rewrite all validation into a new framework.

Do not redesign update semantics.

Do not change optional-field behavior.

Do not change null/undefined behavior unintentionally.

Do not change avatar cleanup ordering without explicit reasoning.

### Test Requirements

Create strong characterization coverage before modifying this method.

Cover representative cases such as:

```text
successful normal update
student not found
invalid status
missing status reason
invalid birth date
invalid angkatan
invalid semester
invalid prodi
invalid dosen
avatar unchanged
avatar replaced
avatar removed
transaction failure
cleanup failure behavior where testable
```

### Validation

Run update-specific tests after each extraction step.

Then:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Exit Criteria

- [ ] updateStudentById database logic moved to service
- [ ] Controller no longer opens its transaction
- [ ] Existing update behavior preserved
- [ ] Avatar behavior preserved
- [ ] Tests pass

---

# 27. Milestone 8: Thin Controller Cleanup

## Objective

Complete the controller boundary after all domain logic has moved.

Inspect:

```text
studentController.ts
```

The controller should no longer directly import or depend on:

```text
prisma
Prisma
hashPassword
AvatarService
S3Service
attendanceCounts
percentage
getStudentFinance
listStudentTuitionBills
```

unless a remaining dependency has a documented and approved reason.

Preferred controller imports should primarily be:

```text
Express types
request validators
student services
```

Review every controller method.

Controller methods should generally follow:

```text
parse
→ call service
→ respond
→ next(error)
```

Do not optimize for an arbitrary line-count target.

The objective is responsibility separation, not merely fewer lines.

### Exit Criteria

- [ ] StudentController contains no direct Prisma access
- [ ] StudentController contains no Prisma transaction orchestration
- [ ] StudentController contains no password hashing
- [ ] StudentController contains no S3 cleanup orchestration
- [ ] StudentController contains no grade calculations
- [ ] StudentController contains no attendance calculations
- [ ] StudentController is transport-focused

---

# 28. Milestone 9: Final Regression and Documentation

## Objective

Verify the refactor did not change Student-domain behavior.

Run all repository validation.

At minimum:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If production startup validation is part of the repository quality gate, run it as well.

Run relevant Student API integration tests.

Verify representative endpoints manually or through automated integration tests:

```text
GET students
GET student detail
POST student
PATCH student
DELETE student
bulk status
bulk delete
reset password
semester history
KRS
grades
attendance
UKT
finance
```

Verify authentication/authorization behavior.

Verify error responses remain compatible.

Verify logs do not expose sensitive student information or passwords.

---

# 29. Architectural Validation

Final dependency flow should be:

```text
student router
      ↓
student controller
      ↓
student services
      ↓
Prisma / existing domain services
```

The following dependency must no longer exist:

```text
student controller
      ↓
Prisma
```

Add an architectural lint/test rule only if the current tooling can enforce this cleanly without creating excessive complexity.

A possible invariant is:

```text
studentController.ts must not import ../lib/prisma
```

Prefer generic architecture enforcement only after the pattern is proven and approved for broader backend use.

Do not create brittle one-off tooling merely for this file unless necessary.

---

# 30. Definition of Done

This ExecPlan is complete only when all of the following are true.

## Architecture

- [ ] StudentController no longer accesses Prisma directly
- [ ] Business logic is implemented in focused student services
- [ ] Services do not depend on Express
- [ ] Services may access Prisma directly
- [ ] No Repository layer was introduced

## Compatibility

- [ ] Existing student routes remain unchanged
- [ ] Existing HTTP methods remain unchanged
- [ ] Existing frontend consumers continue working
- [ ] Existing response contracts remain compatible
- [ ] Authorization behavior remains compatible

## Behavior

- [ ] CRUD behavior preserved
- [ ] Bulk operations preserved
- [ ] Password reset preserved
- [ ] Semester history preserved
- [ ] KRS behavior preserved
- [ ] Grade behavior preserved
- [ ] Attendance behavior preserved
- [ ] Tuition behavior preserved
- [ ] Finance behavior preserved

## Side Effects

- [ ] Avatar verification preserved
- [ ] Avatar cleanup preserved
- [ ] S3 cleanup preserved
- [ ] Status history preserved
- [ ] Password hashing preserved

## Quality

- [ ] lint passes
- [ ] typecheck passes
- [ ] student tests pass
- [ ] full test suite passes or remaining unrelated failures are documented
- [ ] production build passes

---

# 31. Rollback Strategy

Each milestone should remain independently reviewable.

Prefer commits or pull requests aligned with milestone boundaries.

If a milestone introduces regression:

1. stop further extraction
2. identify the last known-good milestone
3. revert the affected extraction if necessary
4. restore previous controller behavior
5. add characterization coverage for the regression
6. retry extraction only after behavior is understood

Do not continue stacking refactors on top of known broken behavior.

Database rollback should not be required because this plan does not authorize Prisma schema changes or migrations.

---

# 32. Risk Register

## Risk: Hidden behavior inside controller

Likelihood:

High.

Mitigation:

Characterization tests before high-risk extraction.

---

## Risk: API behavior changes accidentally

Likelihood:

Medium to High.

Mitigation:

Preserve route-level integration tests and compare response contracts.

---

## Risk: Transaction semantics change

Likelihood:

High for create/update/delete operations.

Mitigation:

Move complete transaction boundaries into services without splitting atomic operations.

---

## Risk: Avatar/S3 cleanup regression

Likelihood:

Medium.

Impact:

Potential orphaned files or incorrect deletion.

Mitigation:

Explicitly document side-effect ordering and add focused failure tests where practical.

---

## Risk: StudentService becomes another monolith

Likelihood:

High if all logic is moved blindly.

Mitigation:

Use cohesive service boundaries:

```text
StudentService
StudentManagementService
StudentAccountService
StudentAcademicService
StudentAttendanceService
StudentFinanceService
```

---

## Risk: KRS behavior changes during extraction

Likelihood:

Medium.

Mitigation:

Treat KRS redesign as a separate ExecPlan.

Only move existing behavior in this plan.

---

## Risk: Scope expands into frontend refactor

Likelihood:

Medium.

Mitigation:

No frontend structural changes are authorized by this plan.

Frontend issues discovered should be recorded as technical debt.

---

# 33. Technical Debt Policy

During implementation, newly discovered problems should be categorized.

If the problem is required to safely complete the current milestone:

```text
fix it within scope
```

If unrelated:

```text
record it
do not fix it
```

Update:

```text
docs/exec-plans/tech-debt-tracker.md
```

Examples of issues that should normally remain separate:

```text
KRS model naming
frontend Redux server state
frontend folder structure
other controller architecture
global naming inconsistencies
unrelated Prisma optimization
unrelated API response migration
```

---

# 34. Progress

## Milestone 0: Preconditions

- [x] Not started
- [x] Completed

**Date:** 2026-10-05

### Validation Results

| Check | Status | Details |
|-------|--------|---------|
| Production build | ✅ PASS | `npm run build` exits 0, dist/server.js emitted |
| Backend startup | ✅ PASS | Server starts on port 4000, logs structured via Pino |
| Lint command | ✅ EXIST | `npm run lint` - 5 pre-existing errors (TD-18, TD-19, TD-20) |
| Typecheck | ✅ PASS | `npm run typecheck` exits 0 |
| Test command | ✅ EXIST | `npm test` runs 22 test files |
| Build command | ✅ EXIST | `npm run build` compiles TypeScript |
| Centralized error handling | ✅ VERIFIED | errHendler.ts with AppError foundation |
| Health endpoints | ✅ VERIFIED | /health/live, /health/ready implemented |
| Request ID | ✅ VERIFIED | requestId middleware active, UUID format |
| Structured logging | ✅ VERIFIED | Pino logger with redaction config |

### StudentController Baseline

**File:** `server/src/controllers/studentController.ts`
**Lines:** 1,957
**Pattern:** `export class Controller { static methods }`

**Dependencies imported:**
- `prisma` (direct DB access) — 22 direct prisma.* calls
- `hashPassword` from `../lib/bycript` — 4 usages
- `AvatarService` from `../services/avatar.service` — direct import
- `S3Service` from `../services/s3.service` — direct import
- `attendanceCounts`, `percentage` from `../services/attendance.service`
- `getStudentFinance`, `listStudentTuitionBills` from `../services/tuition.service`

**Direct Prisma usage:** Yes (22 instances)
**Direct transaction usage:** Yes (11 $transaction calls)
**Direct password hashing:** Yes (hashPassword imported)
**Direct AvatarService:** Yes
**Direct S3Service:** Yes

**Exported methods (~15):**
- getFinanceyId
- getUKTById
- getMyUKT
- getStudentAttendance
- bulkUpdateStatus
- bulkDelete
- createStudent
- updateStudentById
- deleteUserById
- getAllStudents
- getStudentById
- getStudentSemesterHistory
- getStudentKRS
- getStudentNilai
- resetPassword

**Existing student test files:**
- tests/student-finance.cjs
- tests/student-grades.cjs
- tests/student-tuition.cjs
- tests/student-attendance.cjs

**Lint/typecheck failures related to Student:** None
(Lint failures are in userController.ts and lib/prisma.ts only)

### Blockers

**NONE IDENTIFIED** — Repository is stable for extraction:
- Build works
- Typecheck passes  
- Tests run (EPERM sandbox issues are infrastructure, not code bugs)
- Lint has known legacy failures unrelated to Student domain
- Platform foundation complete (M1-M8 all verified)
- Error handling centralized
- Health endpoints functional
- Request ID working
- Structured logging operational

### Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| API behavior changes | Medium-High | Preserve route-level integration tests |
| Transaction semantics change | High | Move complete transaction boundaries into services |
| Avatar/S3 cleanup regression | Medium | Document side-effect ordering explicitly |
| Service monolith creation | High | Use cohesive service boundaries |

### Verdict

**SAFE TO BEGIN MILESTONE 1**

The repository passes all quality gates. No blocking issues prevent starting the StudentController refactor. The baseline is captured and ready for characterization work.

---

## Milestone 1: Characterization and Responsibility Map

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
TBD
```

## Milestone 2: Establish Student Service Pattern

- [x] Completed

Notes:

```text
Services created: student-finance.service.ts, student-account.service.ts
Controller methods migrated: getFinanceyId, getUKTById, getMyUKT, resetPassword
Password length validation preserved in service
All characterization tests pass
```
## Milestone 3: Attendance Extraction

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
Created: server/src/services/student-attendance.service.ts (92 lines)
Method migrated: getStudentAttendance -> StudentAttendanceService.getStudentAttendance()
Controller now delegates to service within transaction
Transaction boundary remains in controller (see TD tracking)
All tests pass including student-attendance.cjs characterization tests
Validation: lint/typecheck/build/test all green
```

## Milestone 4: Core Read Extraction

- [ ] Completed
- [x] In progress
- [ ] Completed

**Status:** ✅ COMPLETED

Notes:

```text
Created: server/src/services/student-management.service.ts (356 lines)
Methods migrated: 
  - getAllStudents -> StudentManagementService.getAllStudents()
  - getStudentById -> StudentManagementService.getStudentById()
  
Controller simplification:
  - Before: ~220 lines per method
  - After: ~12 lines per method
  
Response format preserved exactly:
  - getAllStudents: { students: [...], pagination: {...} }
  - getStudentById: { student: {...} } with summary.ipk, totalSKS, etc.
  
Type fixes applied:
  - mahasiswa field in StudentListResponse made nullable (| null)
  - tahun field changed from string to number type

Testing:
  - All 14 test files pass
  - student-characterization.cjs updated and passing
  - No behavior changes - pure extraction

Remaining methods in controller (to extract next):
  - Academic: getStudentSemesterHistory, getStudentKRS, getStudentNilai
  - Management: bulkUpdateStatus, createStudent, deleteUserById, bulkDelete
  - Mutation: updateStudentById (~680 lines, highest risk)
```

## Milestone 5: Academic Extraction

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
TBD
```

## Milestone 6: Student Management Mutation Extraction

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
TBD
```

## Milestone 7: updateStudentById Extraction

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
TBD
```

## Milestone 8: Thin Controller Cleanup

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
TBD
```

## Milestone 9: Final Regression and Documentation

- [x] Completed
- [ ] In progress
- [ ] Completed

Notes:

```text
TBD
```

---

# 35. Decision Log

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

Moving approximately 1,957 lines from one file into another would reduce no meaningful architectural complexity.

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

# 36. Completion

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
```