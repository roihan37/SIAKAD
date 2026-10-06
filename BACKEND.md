# BACKEND.md

## Purpose

This document defines backend engineering conventions for the SIAKAD Core REST API.

It is intended for developers and engineering agents modifying code inside:

```text
server/
```

The Core SIAKAD backend is a brownfield modular monolith.

Its primary responsibilities are:

- authentication
- authorization
- academic business logic
- student management
- lecturer management
- KRS
- attendance
- grades
- scheduling
- tuition
- payments
- authoritative database access

The backend must remain the source of truth for protected academic and financial operations.

---

# 1. Read Before Editing

Before modifying backend production code, read:

```text
AGENTS.md
ARCHITECTURE.md
BACKEND.md
docs/QUALITY.md
docs/SECURITY.md
docs/RELIABILITY.md
```

When relevant also read:

```text
docs/TARGET-ARCHITECTURE.md
docs/TECHNOLOGY-ROADMAP.md
docs/PLANS.md
docs/design-docs/api-contract.md
docs/design-docs/ai-architecture.md
```

If the task has an active ExecPlan, read it before implementation.

Do not rely only on documentation.

Inspect the actual repository before changing code.

---

# 2. Backend Stack

Current approved backend technologies:

```text
Node.js
Express
TypeScript
Prisma
PostgreSQL
JWT
bcrypt
Pino
```

Approved future backend/infrastructure technologies include:

```text
OpenAPI
Swagger UI
pgvector
RabbitMQ
Redis
Prometheus
OpenTelemetry
Docker
AWS
```

These future technologies must be introduced according to the Technology Roadmap and relevant ExecPlans.

---

# 3. Technologies Not Currently Used

Do not introduce without an explicit architecture revision:

```text
backend Zod

Repository Pattern

GraphQL

Kafka

Kubernetes

full microservices
```

Do not add a technology merely because it is commonly used elsewhere.

---

# 4. Core Backend Architecture

New or migrated backend code should follow:

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
  ↓
PostgreSQL
```

Responsibilities must remain clearly separated.

---

# 5. Routes

Routes are responsible for HTTP wiring.

A route may define:

```text
HTTP method

URL path

middleware

controller
```

Example:

```ts
router.get(
  "/students/:id",
  authenticate,
  authorizeAdmin,
  StudentController.getById,
);
```

Routes should not contain:

```text
domain business rules

Prisma queries

transactions

complex data transformations
```

Keep route files declarative.

---

# 6. Middleware

Middleware handles cross-cutting HTTP concerns.

Examples:

```text
authentication

authorization

request ID

request logging

CORS

body parsing

validation

rate limiting
```

Middleware should not contain reusable domain business logic.

Bad:

```text
middleware
→ calculate KRS eligibility
```

Preferred:

```text
middleware
→ authenticate request

service
→ calculate KRS eligibility
```

---

# 7. Middleware Ordering

Ordering matters.

Typical global flow:

```text
Request
  ↓
Request ID
  ↓
Request Logging
  ↓
CORS / Parsing
  ↓
Routes
  ↓
404 Handler
  ↓
Global Error Handler
```

Changes to global middleware ordering require focused integration tests.

---

# 8. Controllers

Controllers are HTTP transport adapters.

Controllers should primarily:

```text
read route params

read query params

read request body

read authenticated context

call service

map service result to HTTP response
```

Preferred:

```text
Controller
   ↓
Service
```

Controllers should not own domain workflows.

---

# 9. Thin Controller Rule

Avoid:

```text
Controller
  ↓
validation
  ↓
transaction
  ↓
Prisma query
  ↓
business rule
  ↓
file cleanup
  ↓
response
```

Prefer:

```text
Controller
  ↓
Service
  ↓
business workflow
```

A controller becoming very large is a signal that business logic may belong in a service.

---

# 10. Services

Services contain domain and application business logic.

Examples:

```text
StudentService

KRSService

AttendanceService

GradeService

TuitionService

PaymentService
```

Services may:

```text
apply business rules

coordinate Prisma operations

manage transactions

call approved infrastructure abstractions

return domain-oriented results
```

---

# 11. Service Independence From Express

Services must not depend directly on:

```text
Request

Response
```

Avoid:

```ts
service(req, res);
```

Prefer:

```ts
service(input, context);
```

This makes services reusable from:

```text
REST controllers

tests

future internal workflows
```

---

# 12. Prisma

Prisma is the primary database access layer.

Preferred:

```text
Service
  ↓
Prisma
```

Do not add another repository abstraction without a demonstrated need.

---

# 13. No Repository Pattern

Current architecture intentionally does not use:

```text
Service
  ↓
Repository
  ↓
Prisma
```

because Prisma already provides sufficient data-access abstraction for the current project.

A Repository layer should only be reconsidered through an explicit architecture decision.

---

# 14. Brownfield Policy

Some existing backend code may still use legacy patterns.

Example:

```text
Controller
  ↓
Prisma
```

Do not perform a repository-wide migration.

Use:

```text
New code
→ target architecture

Significantly modified legacy code
→ migrate when safe and useful

Unrelated legacy code
→ leave unchanged
```

---

# 15. Student Domain Reference

Student Service Extraction has already been completed.

The Student domain may serve as one reference for future domain refactors.

Possible responsibility separation includes:

```text
student.service

student-management.service

student-account.service

student-academic.service

student-attendance.service

student-finance.service
```

Do not recreate this structure blindly.

Inspect the current implementation first.

---

# 16. KRS Domain

KRS is a high-risk academic domain.

Before restructuring KRS:

```text
inspect existing behavior

map state transitions

review authorization

review tests

add characterization tests where needed
```

Do not rename or redesign KRS states based only on naming preference.

Known concepts may include separate:

```text
KRS header state

KRS detail state
```

Their semantics must be verified through the KRS Domain Audit.

---

# 17. Authentication

Authentication remains owned by the Core API.

Current concepts may include:

```text
JWT access token

refresh token

token rotation

session validation

revocation

password hashing
```

Authentication code is security-sensitive.

Do not simplify it during unrelated refactors.

---

# 18. Authorization

Authentication and authorization are different.

```text
Authentication
→ who is the user?

Authorization
→ what may the user do?
```

Protected operations must enforce backend authorization.

Frontend role checks do not replace backend authorization.

---

# 19. RBAC

Current domain roles may include:

```text
ADMIN

DOSEN

MAHASISWA
```

Backend code must enforce role requirements.

Example:

```text
Student UI hides admin action
+
Core API still rejects unauthorized request
```

---

# 20. Ownership

Role checks alone may not be enough.

Example:

```text
MAHASISWA
→ may read academic data

but

only their own protected academic data
```

Ownership must be enforced using trusted authenticated identity.

---

# 21. Trusted Identity

Do not trust identity from:

```text
request body

query parameter

frontend Redux state

AI output

tool argument
```

for authorization.

Trusted identity must originate from verified authentication context.

---

# 22. "My" Operations

Where appropriate, prefer identity-safe domain operations.

Concept:

```text
authenticated user
      ↓
resolve student
      ↓
get own grades
```

rather than:

```text
client supplies arbitrary studentId
```

This becomes especially important for AI tools.

---

# 23. Validation

All external input is untrusted.

Validate relevant:

```text
params

query

body

headers

file metadata

webhooks

queue messages

internal API payloads
```

Use the project's existing validation approach.

Do not introduce backend Zod.

---

# 24. Explicit Allowed Fields

Avoid mass assignment.

Bad:

```ts
await prisma.user.update({
  where: { id },
  data: req.body,
});
```

Prefer explicit allowed field mapping.

This protects internal fields such as:

```text
role

ownership

system statuses

timestamps

internal IDs
```

---

# 25. TypeScript

TypeScript errors should be treated as engineering signals.

Avoid unnecessary:

```ts
any
```

Prefer:

```ts
unknown
```

for untrusted data until it has been checked.

Do not solve typing issues primarily with:

```ts
as any
```

---

# 26. Type Boundaries

Important backend boundaries should have explicit types.

Examples:

```text
controller input

service input

service result

API DTO

RabbitMQ message

AI internal contract

payment webhook
```

Avoid passing loosely typed generic objects between major layers.

---

# 27. Transactions

Use Prisma transactions when multiple database operations represent one atomic business operation.

Target:

```text
all writes succeed
or
all writes rollback
```

Examples may include:

```text
KRS state update
+
status history
```

---

# 28. Transaction Scope

Do not keep database transactions open while waiting for slow external operations such as:

```text
AI inference

payment provider

S3

email

RabbitMQ network operations
```

Keep transaction scope as short and deterministic as practical.

---

# 29. External Side Effects

Database and external infrastructure do not share a normal atomic transaction.

Examples:

```text
PostgreSQL + S3

PostgreSQL + RabbitMQ

PostgreSQL + Payment Gateway
```

Define:

```text
operation ordering

failure behavior

retry

compensation

idempotency
```

where needed.

---

# 30. Error Foundation

Use the centralized application error foundation.

Domain/service errors should be explicit.

Conceptual fields:

```text
statusCode

code

message

details
```

Unexpected errors are handled centrally.

---

# 31. Safe Error Responses

Unexpected server errors should not expose:

```text
stack traces

Prisma internals

SQL

database URLs

filesystem paths

AWS credentials

payment secrets
```

Preferred public response:

```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "requestId": "..."
}
```

---

# 32. API Contract

For complete rules, see:

```text
docs/design-docs/api-contract.md
```

New or explicitly migrated endpoints should use the canonical contract.

Single resource:

```json
{
  "data": {}
}
```

Collection:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource not found",
  "requestId": "..."
}
```

---

# 33. Legacy API Compatibility

Do not mass-convert old APIs.

Use:

```text
Existing endpoint
→ preserve by default

New endpoint
→ canonical contract

Explicitly migrated endpoint
→ canonical contract after consumer migration
```

Frontend compatibility is more important than cosmetic response consistency.

---

# 34. HTTP Status Codes

Use appropriate semantics.

Common:

```text
200
successful read/update

201
created

202
accepted for async processing

204
successful with no body

400
invalid input

401
unauthenticated

403
forbidden

404
not found

409
state/resource conflict

413
payload too large

429
rate limited

500
unexpected failure

503
temporarily unavailable
```

Do not return HTTP 200 for new application failures unless compatibility requires it.

---

# 35. Pagination

Potentially large collections should use pagination.

Canonical query direction:

```text
?page=1&limit=20
```

Set:

```text
default page

default limit

maximum limit
```

Do not allow arbitrary unlimited collection retrieval.

---

# 36. Filtering

Allow explicit known filters.

Example:

```text
?status=ACTIVE
```

Do not expose raw Prisma filter objects to clients.

---

# 37. Sorting

Allow only approved sort fields.

Concept:

```text
?sortBy=name&sortOrder=asc
```

Do not directly trust arbitrary database property names from user input.

---

# 38. Sensitive Fields

Do not return complete Prisma entities blindly.

Explicitly exclude sensitive fields such as:

```text
password hash

refresh token

secret metadata

internal security fields
```

API DTOs should expose only required information.

---

# 39. Date and Time

Use ISO 8601 timestamps for API timestamp values.

Example:

```text
2026-10-06T09:00:00.000Z
```

For date-only domain values:

```text
YYYY-MM-DD
```

may be more appropriate.

Avoid ambiguous date strings.

---

# 40. Logging

Backend logging uses Pino.

Prefer structured metadata.

Useful fields:

```text
service

requestId

traceId

method

route

statusCode

durationMs

errorCode
```

---

# 41. Sensitive Logging

Never intentionally log:

```text
password

JWT

refresh token

API key

AWS credential

database password

payment secret
```

Be careful with:

```text
student grades

financial data

request bodies

AI tool results
```

---

# 42. Request IDs

Every HTTP request should have a request ID.

Use it for:

```text
logs

errors

debugging

future distributed correlation
```

Include it in canonical errors where applicable.

Do not use request IDs for authentication.

---

# 43. Health Endpoints

Maintain:

```text
GET /health/live

GET /health/ready
```

Liveness means:

```text
process alive
```

Readiness means:

```text
able to serve traffic
```

---

# 44. Liveness

Liveness should not depend on PostgreSQL.

A database outage does not mean the Node process is dead.

Keep liveness lightweight.

---

# 45. Readiness

Readiness may check critical dependencies.

For the Core API, PostgreSQL is typically critical.

Readiness dependency checks must use bounded timeouts.

---

# 46. Graceful Shutdown

Backend runtime should support:

```text
SIGTERM

SIGINT
```

Expected direction:

```text
stop accepting new traffic
      ↓
complete active work within limit
      ↓
close HTTP server
      ↓
disconnect dependencies
      ↓
exit
```

---

# 47. External Timeouts

External operations must not wait indefinitely.

Examples:

```text
S3 request

payment provider

future RabbitMQ connection

future Redis connection

AI Service calls if any
```

Use bounded timeouts where appropriate.

---

# 48. Retry

Do not retry every error.

Generally do not retry:

```text
validation error

401

403

deterministic business conflict
```

Retries may be appropriate for genuine transient infrastructure failures.

Retries must be bounded.

---

# 49. Idempotency

Consider idempotency for operations that may be repeated.

Important future examples:

```text
payment webhooks

RabbitMQ consumers

report jobs

document indexing

AI write actions
```

Duplicate delivery must not silently corrupt business state.

---

# 50. AI Boundary

The target AI Assistant is a separate service.

Core rule:

```text
AI Service
    ↓
Approved Tool
    ↓
Core REST API
    ↓
Authorization
    ↓
Domain Service
    ↓
Prisma
```

Not:

```text
AI Service
    ↓
Core Prisma
```

---

# 51. Core API Remains Authority

The Core API remains authoritative for:

```text
user identity

RBAC

ownership

KRS rules

grades

attendance

tuition

payments

business state
```

The LLM must not override backend decisions.

---

# 52. AI Internal APIs

Future AI-facing Core APIs should:

```text
use narrow capabilities

enforce auth

enforce ownership

have explicit DTOs

use bounded timeouts

return structured errors
```

Do not create a generic endpoint that allows the AI to query arbitrary data.

---

# 53. AI "My" APIs

Potential safe internal capabilities:

```text
get own profile

get own schedule

get own grades

get own attendance

get own tuition

get own KRS
```

Trusted identity should come from authentication context.

---

# 54. RabbitMQ

RabbitMQ is the approved future message broker.

Good use cases:

```text
document indexing

report generation

notifications

batch processing
```

Do not use RabbitMQ for ordinary synchronous CRUD.

---

# 55. Queue Messages

Future queue messages should be:

```text
small

versioned

validated

idempotency-aware
```

Prefer identifiers instead of whole domain records.

Example:

```json
{
  "version": 1,
  "jobId": "job-123",
  "documentId": "document-123"
}
```

---

# 56. RabbitMQ Consumers

Consumers should consider:

```text
acknowledgement

retry

dead-letter handling

duplicate delivery

graceful shutdown
```

Do not assume exactly-once delivery.

---

# 57. Redis

Redis is approved for specific use cases such as:

```text
cache

rate limiting

ephemeral state
```

Do not use Redis as the system of record.

PostgreSQL remains authoritative.

---

# 58. Cache Requirements

Every cache must define:

```text
key

TTL

invalidation

fallback
```

Avoid cache implementation without a clear invalidation strategy.

Correct data is more important than fast stale data.

---

# 59. pgvector

pgvector is approved for AI RAG.

It should support:

```text
document embeddings

semantic search
```

It should not become a mechanism for directly querying protected relational business data.

---

# 60. S3

S3 is the target storage for binary objects such as:

```text
avatars

academic documents

payment proof files

generated reports
```

Database stores metadata.

S3 stores binary content.

---

# 61. File Upload

Uploads must validate:

```text
size

type

ownership

allowed usage

storage key
```

Do not trust raw client filenames as storage object keys.

---

# 62. Payment Gateway

Future payment integration should choose one provider initially:

```text
Midtrans

or

Xendit
```

Payment state must remain backend-authoritative.

---

# 63. Payment Webhooks

Webhook handlers must consider:

```text
provider verification

idempotency

duplicate callbacks

state transitions

audit trail
```

Never trust the frontend to mark payment as successful.

---

# 64. OpenAPI

OpenAPI and Swagger UI are approved future capabilities.

OpenAPI should document:

```text
routes

authentication

params

request bodies

responses

errors

pagination
```

Implement through a dedicated ExecPlan.

---

# 65. Metrics

Future application metrics use Prometheus.

Initial examples:

```text
http_requests_total

http_request_duration_seconds

http_errors_total
```

Avoid high-cardinality labels.

Never use:

```text
studentId

userId

requestId
```

as Prometheus labels.

---

# 66. Tracing

Future tracing uses:

```text
OpenTelemetry
```

and:

```text
Tempo
```

Tracing becomes most valuable when requests cross:

```text
AI Service
→ Core API
→ Database
```

or:

```text
Core API
→ RabbitMQ
→ Worker
```

---

# 67. Observability Failure

Observability systems should not become critical dependencies.

If:

```text
Prometheus

Loki

Tempo

Grafana
```

fail, normal academic business functionality should continue where practical.

---

# 68. Backend Folder Direction

A target domain-oriented structure may resemble:

```text
server/src/

modules/
├── auth/
├── students/
├── lecturers/
├── academic/
├── krs/
├── attendance/
├── grades/
├── schedule/
├── tuition/
├── payments/
└── dashboard/
```

Do not perform a full directory migration in one change.

Move incrementally where justified.

---

# 69. Naming

Prefer predictable names.

Examples:

```text
student.controller.ts

student.service.ts

student.routes.ts
```

Avoid introducing new naming inconsistencies.

Do not rename unrelated legacy files during feature work.

---

# 70. Performance

Do not optimize without evidence.

Check actual bottlenecks before introducing:

```text
Redis

new indexes

background queues

query rewrites
```

Avoid obvious:

```text
N+1 queries

unbounded lists

huge nested includes
```

---

# 71. Bulk Operations

Bulk operations require explicit limits.

Large batches may need async processing.

Avoid:

```text
huge HTTP request
→ one extremely long DB transaction
```

when background processing is more appropriate.

---

# 72. Testing Philosophy

Tests protect behavior.

Use:

```text
unit tests

integration tests

characterization tests

regression tests
```

according to risk.

Do not write tests solely to increase coverage numbers.

---

# 73. Characterization Tests

Before high-risk brownfield refactoring:

```text
understand behavior
      ↓
characterization test
      ↓
refactor
```

Important areas:

```text
KRS

payments

transactions

authorization

file cleanup

academic state transitions
```

---

# 74. Bug Fixes

Preferred:

```text
reproduce

add or identify failing test

fix

validate regression
```

A bug fix should leave behind regression protection where practical.

---

# 75. Architecture Tests

Architecture tests may protect meaningful boundaries.

Examples:

```text
Service does not import Express Request/Response

AI Service does not import Core Prisma

new controllers do not directly use Prisma
```

Do not freeze every internal file structure.

---

# 76. Backend Validation Gate

For meaningful backend changes:

```bash
cd server

npm run lint
npm run typecheck
npm test
npm run build
```

Expected:

```text
lint
PASS

typecheck
PASS

tests
PASS

build
PASS
```

---

# 77. Focused Validation First

Before full regression, run focused tests relevant to the changed domain.

Example:

```text
KRS change
→ KRS tests first

Auth change
→ authentication tests first
```

Then run full quality gates.

---

# 78. Environment-Limited Tests

If an agent environment cannot run a test because of:

```text
network restriction

port restriction

Docker restriction
```

do not weaken the application test.

Record the limitation and run authoritative validation on host or CI.

---

# 79. Git Diff Review

Before completing backend work:

```bash
git status
git diff --stat
git diff
```

Review for:

```text
scope creep

accidental formatting

deleted tests

generated files

secrets

dependency changes
```

---

# 80. Dependency Policy

Before adding a dependency ask:

```text
Does the project already solve this?

Does the current milestone require it?

What runtime complexity does it add?

What maintenance burden does it add?
```

Do not add packages for hypothetical future use.

---

# 81. Generated Files

Do not manually edit generated output when source exists.

Example:

```text
src/
 ↓
build
 ↓
dist/
```

Fix source, then rebuild.

---

# 82. Technical Debt

When unrelated backend debt is discovered:

```text
record it
```

in:

```text
docs/exec-plans/tech-debt-tracker.md
```

Do not automatically fix it during unrelated work.

---

# 83. ExecPlan Rule

Substantial backend work should use an ExecPlan.

Examples:

```text
KRS domain redesign

OpenAPI rollout

RabbitMQ

Redis

payment gateway

major service extraction

database migration
```

Implement one milestone at a time.

---

# 84. Backend Milestone Workflow

Use:

```text
Read
 ↓
Inspect
 ↓
Baseline
 ↓
Implement
 ↓
Focused Validation
 ↓
Full Validation
 ↓
Review Diff
 ↓
Update ExecPlan
 ↓
Commit
```

Do not implement several future milestones at once.

---

# 85. Backend Definition of Done

A meaningful backend milestone is complete when applicable requirements pass:

```text
Implementation complete         ✅

Architecture boundary correct   ✅

Business behavior correct       ✅

Authentication preserved        ✅

Authorization preserved         ✅

Ownership preserved             ✅

Focused tests                   ✅

Regression tests                ✅

Lint                            ✅

Typecheck                       ✅

Production build                ✅

Errors reviewed                 ✅

Logging reviewed                ✅

Security reviewed               ✅

Diff reviewed                   ✅

Docs updated                    ✅
```

---

# 86. Production Direction

Target production backend:

```text
Internet
   ↓
ALB
   │
   ├── /api/*
   │      ↓
   │   ECS Fargate
   │   Core API
   │
   └── /ai/*
          ↓
       ECS Fargate
       AI Service
```

Core API data:

```text
Core API
   ↓
RDS PostgreSQL + pgvector
```

Future infrastructure:

```text
Redis
→ ElastiCache

RabbitMQ
→ Amazon MQ

Files
→ S3
```

---

# 87. AWS Runtime Credentials

Production application code should prefer AWS SDK default credential resolution and IAM task roles.

Avoid long-lived static:

```text
AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY
```

inside production containers.

---

# 88. Secrets

Production secrets should eventually use:

```text
AWS Secrets Manager
```

or appropriate secure configuration.

Potential secrets:

```text
JWT signing secret

payment secret

database credentials

external AI keys
```

Do not commit secrets to Git.

---

# 89. AI Dependency Direction

Core domain code must not become dependent on AI for basic business operations.

Preferred:

```text
AI
→ Core
```

Avoid:

```text
StudentService
→ AI
```

for normal academic CRUD.

This keeps Core SIAKAD functional when AI is unavailable.

---

# 90. Reliability Priority

For academic and financial information:

```text
correct but temporarily unavailable
```

is usually preferable to:

```text
available but incorrect
```

Preserve data integrity before availability.

---

# 91. Architecture Change Rule

Before changing backend architecture, answer:

```text
What concrete problem exists?

Why does the current pattern fail?

What complexity will the change introduce?

How will it be tested?

How does it fail?

How is it rolled back?
```

Do not change architecture merely because another pattern appears cleaner.

---

# 92. Final Backend Principle

The Core SIAKAD backend must remain understandable, secure, and authoritative.

The target dependency flow is:

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
```

For AI:

```text
AI Service
     ↓
Approved Core API
     ↓
Authorization
     ↓
Service
     ↓
Prisma
```

The final rule is:

> **Keep transport logic thin, business rules inside services, Prisma as the data-access layer, PostgreSQL as the source of truth, and authorization inside trusted backend code.**