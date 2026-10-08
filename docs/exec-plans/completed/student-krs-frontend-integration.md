# Student KRS Frontend Integration

## Status

Completed.

## Context

The student KRS page previously rendered hard-coded profile, course, status, credit-limit, capacity, and rejection-note data. The authenticated student KRS backend is available under `/api/v1/student/me/krs`.

## Problem Statement

Students could not load, save, or submit their actual KRS from the existing page because all interactions were local-only.

## Goal

Connect the existing student KRS page to the authenticated backend read, draft-save, and submit endpoints and remove the dummy data source.

## Non-Goals

- Changing the backend or Prisma schema.
- Adding unsupported credit limits, seat capacity, course metadata, or rejection notes.
- Refactoring unrelated frontend state or API architecture.
- Adding dependencies.

## Constraints

- The backend remains authoritative for identity, permissions, status, and validation.
- The page uses `kelasMataKuliahId` for selections.
- Existing UI primitives, Axios client, authentication handling, and canonical `{ data }` response envelope are preserved.

## Result

- A typed KRS API service calls the authenticated read, draft-save, and submit endpoints.
- The page handles loading, errors, retries, draft saving, submission, and backend-derived permissions.
- Unsupported dummy-only values were removed from the page.
- Unsaved duplicate-course and schedule-conflict checks provide immediate UX feedback; the backend revalidates mutations.

## Architecture Impact

No architecture change. The implementation follows Page → local feature state → API service → Core REST API.

## Validation

- Focused ESLint for the changed TypeScript files passed.
- `npm run build` passed, including TypeScript project compilation.
- Full `npm run lint` remains blocked by pre-existing errors outside this scope; it reported no issue in the changed KRS files.
- `git diff --check` passed and the final diff was reviewed.

## Security Considerations

No student identifier is sent by the frontend. Existing authenticated Axios behavior is reused, and UI permission checks remain presentation-only.

## Reliability Considerations

Initial requests are abortable. Mutations prevent duplicate submission, preserve current data on failure, and present persistent errors plus retry for page-load failures.

## Rollback

Revert the frontend page, KRS API/types, and this plan. No schema or persistent-data migration is involved.

## Progress

- [x] Inspected repository instructions, frontend conventions, existing page, Axios client, and backend response contract.
- [x] Integrated live KRS API and removed dummy data.
- [x] Completed validation and diff review.
