# Midtrans UKT Payment Gateway

## Scope

Add a Midtrans Sandbox payment flow for student-owned UKT bills, including the student frontend handoff to Snap, while preserving the existing manual/admin verification flow.

## Constraints

- Resolve bill and payment ownership from the authenticated user.
- Keep provider access behind a reusable service with bounded HTTP calls.
- Treat verified Midtrans notifications and Midtrans's authenticated status API as the only gateway status authorities.
- Reuse existing payment status and source enums, services, controllers, and response conventions.
- Add only provider metadata required for Snap creation, repeated payment access, webhook lookup, and expiry.

## Milestones

- [x] Inspect the current payment schema, routes, services, authorization, and error handling.
- [x] Add the minimal Prisma migration and Midtrans configuration/client.
- [x] Implement owned payment creation/detail and transactional webhook handling.
- [x] Add focused coverage for signatures, mappings, ownership, idempotency, and duplicate payment protection.
- [x] Run relevant quality gates and review the final diff.
- [x] Connect the student bill and payment-history pages to the gateway flow and validate the frontend build.
- [x] Reconcile pending payments from the authenticated student page when a webhook was delayed or missed.

## Validation

- Prisma formatting, validation, client generation, and migration status/deploy where the environment permits.
- Focused payment tests, followed by backend lint, typecheck, test, and build.
- Scoped frontend lint and the frontend production build.
- `git status`, `git diff --stat`, `git diff --check`, and scoped diff review.

## Outcome

Completed on 2026-10-27. The migration was deployed successfully. Focused tests, Prisma validation/client generation, backend lint, typecheck, build, scoped frontend lint, and the frontend production build passed. Pending gateway payments can also be reconciled against Midtrans's authenticated status API when the student revisits or refreshes the bill page. The full backend suite passes all feature tests; its host run remains affected by a developer server already using port 4000. The full frontend lint gate remains blocked by the 49 pre-existing errors recorded as TD-011.

## Rollback

Remove the new routes and services, then reverse the nullable provider columns and indexes in a follow-up migration. Existing manual payment rows and APIs remain valid because no existing column or enum is changed.

