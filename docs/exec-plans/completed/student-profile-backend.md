# Student Profile Backend

## Status

Completed.

## Scope

Implement authenticated student self-service profile read/update, avatar update, and password change endpoints using the existing controller, authentication, storage, Prisma, and response conventions.

## Repository Evidence

- Student identity is linked from authenticated `User.id` through the optional one-to-one `User.mahasiswa` relation.
- Personal/contact values live on `User`; academic values live on `Mahasiswa` and its `Prodi`, `Fakultas`, `Dosen`, and `Kurikulum` relations.
- Avatar objects use the `students/{userId}/` S3 key prefix and signed read URLs.
- Password changes already use current-password verification, bcrypt, serializable compare-and-swap updates, and refresh-token revocation.
- The schema has no account-status or last-login field.

## API Contract

- `GET /api/v1/student/me/profile`
- `PATCH /api/v1/student/me/profile`
- `PATCH /api/v1/student/me/avatar`
- `PATCH /api/v1/student/me/change-password`

All routes require an authenticated `Mahasiswa`, derive ownership from the auth context, and use the canonical `{ "data": ... }` envelope.

## Implementation

1. Added exact PATCH validators for supported profile fields and `avatarKey`.
2. Added a focused profile service that selects the aggregate without credentials and derives ownership from authenticated `User.id`.
3. Reused the existing student controller/router and student-management avatar flow.
4. Extracted the existing secure password-change transaction for reuse by both auth and student endpoints.
5. Added characterization/security tests for ownership, field whitelisting, route guards, avatar input, and password handling.

## Compatibility and Non-goals

- Do not change the Prisma schema, authentication token format, legacy admin student APIs, or existing frontend.
- Do not add an upload endpoint beyond the requested contract.
- Do not expose passwords or fabricate unsupported account fields.

## Validation Results

- Focused profile, route-authorization, authentication-security, and student mutation tests: 62 passed, 0 failed.
- Lint: passed.
- Typecheck: passed.
- Production build: passed.
- Full backend suite: 179 passed and 11 environment-limited socket/listener tests failed with the same `EPERM` baseline observed before implementation; no new test failures were introduced.
- `git diff --check`: passed.

## Contract Mismatches

- `User` has no account-status or last-login field, so those requested response values are omitted.
- The existing student avatar update flow consumes an already-uploaded owned `avatarKey`. Existing presigned upload-url routes are admin-only; adding a student upload-url endpoint is outside this plan's requested four-endpoint contract.

## Outcome

- Four student-only endpoints are mounted under `/api/v1/student/me` with canonical `{ "data": ... }` responses.
- Profile writes are explicitly whitelisted; official, academic, and account-control fields are rejected.
- Password changes verify the current password, hash the replacement, update with compare-and-swap semantics, revoke sessions, and clear the refresh cookie.
