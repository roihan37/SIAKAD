# Student Self-Service Integration

## Scope

Add authenticated student endpoints for payments, transcript, semester grades, and dashboard, then connect the corresponding student pages to those endpoints and remove their remaining dummy-data dependencies.

## Constraints

- Resolve the student only from the authenticated user.
- Reuse the existing controller, service, Prisma, response, and frontend API patterns.
- Preserve existing schema and enum values; do not add dependencies or unrelated refactors.
- Keep controllers thin and avoid N+1 queries.

## Milestones

- [x] Confirm current schema, services, routes, and frontend contracts.
- [x] Implement the four `/api/v1/student/me/*` endpoints.
- [x] Integrate Nilai & KHS, Transkrip, Riwayat Pembayaran, and Dashboard.
- [x] Run focused and project quality gates.
- [x] Review status and diff; record contract limitations.

## Validation

- Backend focused tests, lint, typecheck, test, and build.
- Frontend lint and production build using the scripts defined by the project.
- `git status`, `git diff --stat`, and scoped diff review.

## Outcome

- Added owned student endpoints for payments, transcript, grades by academic year, and dashboard.
- Replaced the affected frontend dummy datasets with feature API services and backend-derived summaries.
- No requested response field required a Prisma schema change.
- Repository-wide frontend lint remains limited by the existing TD-011 baseline; backend HTTP integration tests that open local sockets remain limited by the execution sandbox.
