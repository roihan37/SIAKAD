# Student KRS Backend

## Status

Complete.

## Scope

Implement the authenticated student KRS read, draft-save, and submit workflow without changing the Prisma schema or legacy admin KRS contract.

## Repository Evidence

- `KRS.status` uses `StatusKRS`: `DRAFT`, `DIAJUKAN`, `DISETUJUI`, `DITOLAK`.
- `KRSDetail.status` uses `KRSStatus`: `MENUNGGU`, `DISETUJUI`, `DITOLAK`.
- Student ownership is derived through `User.mahasiswa`.
- Offerings are `KelasMataKuliah` records scoped through `Kelas.prodiId` and `Kelas.tahunAkademikId`.
- KRS periods contain `mulai`, `selesai`, and `isActive`.
- The schema does not contain a KRS credit-limit field, course type, rejection reason, or an unambiguous current-curriculum relation for course semester.

## API Contract

- `GET /api/v1/student/me/krs`
- `PUT /api/v1/student/me/krs/draft`
- `POST /api/v1/student/me/krs/submit`

All three routes require an authenticated `Mahasiswa`. Responses use the canonical `{ "data": ... }` envelope. Student identity comes only from the authenticated user context.

## Implementation

1. Added an exact validator for the draft body.
2. Added student-only middleware and mounted a student KRS router under `/api/v1`.
3. Added thin static controller methods to the existing KRS controller.
4. Added a focused service that:
   - loads the active or explicitly selected academic year for reads;
   - derives period state, totals, permissions, offerings, and selected details;
   - validates ownership, active-student state, period state, editable status, offering scope, duplicate IDs, duplicate course selections, and schedule conflicts;
   - saves drafts and submits KRS in serializable transactions.
5. Added focused characterization and contract tests.

## Compatibility and Non-goals

- The legacy admin KRS endpoints and response shapes remain unchanged.
- No Prisma fields, migrations, dependencies, or enum members were added.
- No credit limit was fabricated. `maxCredits` and `remainingCredits` are omitted until the domain has an authoritative source; `selectedCredits` is derived from course credits.
- Course semester/type and a rejection explanation are not exposed because the current relations do not support those values unambiguously.

## Validation Results

- Focused Student KRS tests: 8 passed.
- Lint: passed.
- Typecheck: passed.
- Production build: passed.
- Full test suite: 175 passed and 11 environment-limited failures. The same 11 tests failed at baseline because the sandbox denies socket/listen operations with `EPERM`; no new non-environment failure was introduced.
- Diff whitespace check: passed.

## Outcome

- The three endpoints are mounted and student-only.
- Draft and submit mutations are transactional and revalidate server-owned state.
- Available and selected offerings are loaded without N+1 queries.
- Unsupported contract fields are omitted and recorded above.
