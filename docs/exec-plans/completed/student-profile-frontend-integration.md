# Student Profile Frontend Integration

## Status

Completed.

## Context

The student profile and password pages currently render hard-coded data and simulate mutations locally. Authenticated student profile endpoints are available under `/api/v1/student/me`.

## Goal

Connect the existing student profile UI to the authenticated profile read/update and password-change endpoints, and remove its dummy data source.

## Non-Goals

- Changing backend behavior or the Prisma schema.
- Adding an unsupported student avatar upload flow.
- Refactoring unrelated frontend state or navigation.
- Adding dependencies.

## Constraints

- Student identity continues to come from the authenticated backend context.
- Only backend-supported personal fields are editable.
- Existing Axios authentication/session handling and canonical `{ data }` envelopes are preserved.

## Plan

- [x] Inspect repository guidance, the existing pages, API client, and backend contract.
- [x] Add typed student profile API access.
- [x] Replace profile and password simulations with live endpoint calls.
- [x] Remove dummy profile data.
- [x] Run focused and full applicable validation, then review the final diff.

## Validation Result

- Focused profile API tests passed (3/3).
- Focused ESLint passed for every changed TypeScript/TSX file.
- Production build passed.
- Full frontend tests passed 34/36; two unrelated stale tests reference missing legacy format modules (TD-012).
- Full repository lint remains blocked by 49 pre-existing errors and 5 warnings outside this change (TD-011).

## Architecture Impact

No architecture change. The implementation follows Page → local feature state → API service → Core REST API.

## Security Considerations

The frontend sends no student identifier, whitelists profile fields through a typed request, and clears the local session after password change.

## Reliability Considerations

The initial request is abortable. Load failures remain retryable, and failed mutations preserve the current displayed data.

## Rollback

Revert the profile page, password page, API/types additions, and this plan. No persistent-data migration is involved.
