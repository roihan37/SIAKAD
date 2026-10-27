# Midtrans UKT Payment Gateway

## Scope

Add a Midtrans Sandbox payment flow for student-owned UKT bills while preserving the existing manual/admin verification flow.

## Constraints

- Resolve bill and payment ownership from the authenticated user.
- Keep provider access behind a reusable service with bounded HTTP calls.
- Treat verified Midtrans notifications as the only gateway status authority.
- Reuse existing payment status and source enums, services, controllers, and response conventions.
- Add only provider metadata required for Snap creation, repeated payment access, webhook lookup, and expiry.

## Milestones

- [x] Inspect the current payment schema, routes, services, authorization, and error handling.
- [x] Add the minimal Prisma migration and Midtrans configuration/client.
- [x] Implement owned payment creation/detail and transactional webhook handling.
- [x] Add focused coverage for signatures, mappings, ownership, idempotency, and duplicate payment protection.
- [x] Run relevant quality gates and review the final diff.

## Validation

- Prisma formatting, validation, client generation, and migration status/deploy where the environment permits.
- Focused payment tests, followed by backend lint, typecheck, test, and build.
- `git status`, `git diff --stat`, `git diff --check`, and scoped diff review.

## Outcome

Completed on 2026-10-27. The migration was deployed successfully. Focused tests, Prisma validation/client generation, lint, typecheck, and build passed. The full suite passed 184 of 195 tests; the remaining 11 tests require localhost sockets, which the managed sandbox rejects with `EPERM`.

## Rollback

Remove the new routes and services, then reverse the nullable provider columns and indexes in a follow-up migration. Existing manual payment rows and APIs remain valid because no existing column or enum is changed.

