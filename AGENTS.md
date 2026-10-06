# AGENTS.md

## Purpose

This file is the primary engineering instruction for coding agents working in the SIAKAD repository.

It defines:

- how agents should inspect the repository
- which architecture rules must be preserved
- how scope is controlled
- when ExecPlans are required
- how backend and frontend work should be performed
- how AI-related changes must respect security boundaries
- how technical debt is handled
- how changes are validated before completion

This file is intentionally concise compared with specialized documents.

Detailed rules live in the referenced documentation.

---

# 1. Repository Context

SIAKAD is a brownfield academic information system.

The project is evolving toward:

> **Hybrid Architecture: Modular Monolith Core REST API + Separate AI Assistant Service + Background Workers**

Core principles:

```text
Core SIAKAD
=
source of truth for academic and financial business logic

AI Assistant
=
natural-language interface and orchestration layer

Workers
=
background processing

PostgreSQL
=
authoritative persistent data
```

The project must evolve incrementally.

Do not perform unnecessary repository-wide rewrites.

---

# 2. Repository Structure

Target/current repository direction:

```text
SIAKAD/

├── AGENTS.md
├── ARCHITECTURE.md
├── BACKEND.md
├── FRONTEND.md
│
├── client/
├── server/
│
├── ai-service/        # future / incremental
├── workers/           # future / incremental
│
└── docs/
    ├── TARGET-ARCHITECTURE.md
    ├── TECHNOLOGY-ROADMAP.md
    ├── PLANS.md
    ├── QUALITY.md
    ├── SECURITY.md
    ├── RELIABILITY.md
    │
    ├── design-docs/
    │   ├── api-contract.md
    │   ├── ai-architecture.md
    │   ├── observability.md
    │   └── deployment-architecture.md
    │
    └── exec-plans/
        ├── active/
        ├── completed/
        └── tech-debt-tracker.md
```

Do not create future directories merely because they appear in architecture documents.

Create them only when implementation work actually requires them.

---

# 3. Read Before Editing

Always begin by reading the relevant repository documentation.

At minimum:

```text
AGENTS.md
ARCHITECTURE.md
```

For backend changes:

```text
BACKEND.md
docs/QUALITY.md
docs/SECURITY.md
docs/RELIABILITY.md
```

For frontend changes:

```text
FRONTEND.md
docs/QUALITY.md
docs/SECURITY.md
```

For API changes:

```text
docs/design-docs/api-contract.md
```

For AI changes:

```text
docs/design-docs/ai-architecture.md
```

For observability:

```text
docs/design-docs/observability.md
```

For deployment/infrastructure:

```text
docs/design-docs/deployment-architecture.md
```

For large planned work:

```text
docs/PLANS.md
docs/exec-plans/active/<relevant-plan>.md
```

Also inspect the actual repository.

Documentation never replaces source inspection.

---

# 4. Brownfield Rule

This repository contains existing working code.

Use:

```text
New code
→ target architecture

Significantly modified legacy code
→ improve architecture when safe

Unrelated legacy code
→ leave unchanged
```

Do not use a feature request as permission to refactor unrelated areas.

---

# 5. Scope Discipline

Every task must have a clear scope.

Before editing:

```text
1. Identify requested behavior.

2. Identify affected files.

3. Identify relevant architecture rules.

4. Identify required validation.

5. Avoid unrelated cleanup.
```

If unrelated technical debt is discovered:

```text
record it
```

in:

```text
docs/exec-plans/tech-debt-tracker.md
```

Do not automatically fix it.

---

# 6. No "While I'm Here" Refactors

Do not perform:

```text
feature work
+
architecture rewrite
+
naming cleanup
+
dependency replacement
+
formatting cleanup
```

in one change unless the ExecPlan explicitly requires it.

Keep diffs focused and reviewable.

---

# 7. Backend Architecture

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

Responsibilities:

```text
Route
→ HTTP wiring

Middleware
→ cross-cutting HTTP concerns

Controller
→ transport adaptation

Service
→ business/domain logic

Prisma
→ database access
```

---

# 8. Thin Controllers

Controllers should primarily:

```text
read request input

read auth context

call service

return response
```

Avoid putting:

```text
transactions

large Prisma queries

business rules

state transitions

complex workflows
```

inside new controllers.

---

# 9. Service Layer

Services should:

```text
contain business logic

coordinate Prisma

own domain transactions where appropriate

remain independent from Express Request/Response
```

Do not pass `req` or `res` into domain services.

---

# 10. No Repository Pattern

The approved backend dependency flow is:

```text
Service
 ↓
Prisma
```

Do not introduce:

```text
Service
 ↓
Repository
 ↓
Prisma
```

unless an explicit architecture decision changes this rule.

---

# 11. Validation

Use the backend's existing validation approach.

Do not introduce backend Zod.

External input remains untrusted and must be validated.

Examples:

```text
params
query
body
headers
files
webhooks
queue messages
internal service payloads
```

---

# 12. Frontend Stack

Approved frontend:

```text
React
TypeScript
Vite
React Router
Redux Toolkit
Tailwind CSS
shadcn/ui
```

Do not introduce TanStack Query.

Do not migrate to Next.js or another frontend framework without explicit architecture approval.

---

# 13. Frontend State

Redux Toolkit remains the approved global state solution.

Use local component state for local UI concerns.

Do not move every state value into Redux.

Do not globally rewrite Redux architecture.

Improve feature-by-feature.

---

# 14. Frontend API Access

Prefer:

```text
Component
 ↓
Feature Logic
 ↓
API Service
 ↓
Backend
```

Avoid scattered raw HTTP calls throughout unrelated components.

Use the existing HTTP client approach unless there is a concrete reason to change it.

---

# 15. Backend Is Security Authority

Frontend role checks are presentation logic only.

Security must remain enforced by the backend.

Never assume:

```text
button hidden
=
operation protected
```

Backend must enforce:

```text
authentication
authorization
ownership
business rules
```

---

# 16. API Contract

New and intentionally migrated endpoints should follow:

```text
docs/design-docs/api-contract.md
```

Canonical single resource:

```json
{
  "data": {}
}
```

Canonical collection:

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

Canonical error:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource not found",
  "requestId": "..."
}
```

Do not mass-convert legacy APIs.

Preserve compatibility unless migration is explicitly planned.

---

# 17. HTTP Semantics

Use appropriate status codes.

Common rules:

```text
200
successful read/update

201
created

202
accepted for async work

204
success with no body

400
invalid input

401
unauthenticated

403
forbidden

404
not found

409
business/resource conflict

429
rate limited

500
unexpected server failure

503
temporarily unavailable
```

Do not return 200 for new failure responses unless compatibility requires it.

---

# 18. Authentication

Authentication is owned by Core SIAKAD.

Security-sensitive areas include:

```text
JWT access tokens

refresh tokens

rotation

revocation

password hashing

session validation
```

Do not change authentication behavior casually during unrelated work.

---

# 19. Authorization

Authentication answers:

```text
Who is the user?
```

Authorization answers:

```text
What may the user do?
```

A valid token does not grant access to every protected resource.

---

# 20. Ownership

For protected user-owned data, enforce ownership.

Examples:

```text
student grades

KRS

attendance

tuition

AI conversations
```

Trusted identity must come from authenticated backend context.

Do not trust arbitrary client-provided IDs for "my" operations.

---

# 21. AI Architecture Rule

The AI Assistant is not a second backend.

Required flow:

```text
User
 ↓
AI Service
 ↓
LLM
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
 ↓
PostgreSQL
```

---

# 22. AI Prohibited Patterns

Do not implement:

```text
LLM
→ direct Prisma

LLM
→ arbitrary SQL

LLM
→ unrestricted internal endpoint

LLM
→ authorization decision
```

The model is an untrusted reasoning component.

---

# 23. AI Identity

For tools such as:

```text
get_my_grades

get_my_krs

get_my_tuition
```

the LLM should not choose an arbitrary student ID.

Identity must come from trusted authentication context.

Preferred:

```text
get_my_grades()
```

not:

```text
get_student_grades(studentId)
```

for personal-data use cases.

---

# 24. AI Read-Only First

Initial AI tooling should prefer read-only operations.

Examples:

```text
get_my_profile

get_my_schedule

get_my_grades

get_my_attendance

get_my_tuition

get_my_krs
```

Do not add irreversible AI actions during AI foundation work.

---

# 25. AI Write Actions

Future write actions require explicit design.

Potential requirements:

```text
confirmation

authorization

business validation

idempotency

auditability
```

Examples:

```text
submit KRS

approve KRS

change grade

change payment state
```

must never be executed simply because an LLM generated the intent.

---

# 26. AI and RAG

Use tool calling for authoritative personal/application data.

Example:

```text
"What is my GPA?"
→ Core API Tool
```

Use RAG for document-based information.

Example:

```text
"What are the thesis requirements?"
→ RAG
```

Do not use RAG as an authority for personal grades, payment status, or KRS state.

---

# 27. AI Model

Initial local model direction:

```text
Ollama
+
Hermes
```

Hermes is used for:

```text
chat
tool selection
tool arguments
response generation
```

Hermes is not an embedding model.

Use a dedicated embedding model when RAG is introduced.

---

# 28. RabbitMQ

RabbitMQ is approved for asynchronous workloads.

Appropriate examples:

```text
document indexing

report generation

email notification

academic batch processing
```

Do not use RabbitMQ for ordinary CRUD or interactive AI chat.

---

# 29. Queue Reliability

When RabbitMQ exists, design for:

```text
at-least-once delivery

acknowledgement

bounded retry

dead-letter handling

idempotency

graceful shutdown
```

Do not assume exactly-once processing.

---

# 30. Redis

Redis is approved for targeted uses such as:

```text
cache

rate limiting

ephemeral state
```

PostgreSQL remains authoritative.

Every cache must define:

```text
key

TTL

invalidation

fallback
```

Do not cache everything automatically.

---

# 31. PostgreSQL

PostgreSQL remains the source of truth.

Use Prisma for database access.

Protect:

```text
transactions

constraints

ownership

data integrity
```

Do not expose arbitrary database query capabilities to users or AI.

---

# 32. pgvector

pgvector is approved for RAG embeddings.

It does not replace normal relational access.

AI vector retrieval must respect document authorization.

---

# 33. Logging

Use Pino structured logging.

Useful metadata:

```text
service

requestId

traceId

method

route

statusCode

durationMs

errorCode

jobId

toolName
```

Never intentionally log:

```text
passwords

JWTs

refresh tokens

AWS secrets

database passwords

payment secrets
```

---

# 34. Request IDs

Maintain request IDs across HTTP handling.

Use them for:

```text
logs

error responses

debugging

future cross-service correlation
```

Request IDs are not authentication credentials.

---

# 35. Health Endpoints

Core API maintains:

```text
GET /health/live

GET /health/ready
```

Liveness:

```text
Is the process alive?
```

Readiness:

```text
Can the service safely receive traffic?
```

Do not make liveness depend on PostgreSQL.

---

# 36. Graceful Shutdown

Long-running services must support bounded graceful shutdown.

Applicable to:

```text
Core API

AI Service

Workers
```

Typical flow:

```text
SIGTERM
 ↓
stop new work
 ↓
finish active work within limit
 ↓
close connections
 ↓
exit
```

---

# 37. Timeouts

External calls must have bounded waits.

Examples:

```text
database readiness

AI model requests

AI → Core API

payment provider

Redis

RabbitMQ

S3
```

Unbounded external waits are reliability defects.

---

# 38. Retry

Retry only when failure may genuinely be transient.

Do not automatically retry:

```text
400
401
403
business validation
deterministic conflict
```

Retries must be bounded.

---

# 39. Idempotency

Consider idempotency for:

```text
payment webhooks

RabbitMQ consumers

document indexing

report jobs

AI write actions
```

Duplicate execution must not corrupt academic or financial state.

---

# 40. Observability

Approved observability direction:

```text
Pino
 ↓
Prometheus
 ↓
Grafana
 ↓
Loki
 ↓
OpenTelemetry
 ↓
Tempo
```

Introduce incrementally through ExecPlans.

Do not install the full stack during unrelated feature work.

---

# 41. Metrics

When Prometheus is introduced, avoid high-cardinality labels.

Do not use:

```text
userId

studentId

requestId

conversationId
```

as normal metric labels.

Prefer bounded fields such as:

```text
service

route

method

status

tool

queue
```

---

# 42. Deployment Direction

Target production frontend:

```text
React
 ↓
S3
 ↓
CloudFront
```

Backend:

```text
ALB
 ├── /api/*
 │      ↓
 │   ECS Fargate Core API
 │
 └── /ai/*
        ↓
     ECS Fargate AI Service
```

Data/infrastructure:

```text
RDS PostgreSQL + pgvector

ElastiCache Redis

Amazon MQ RabbitMQ

S3

ECR

CloudWatch
```

---

# 43. AI Model Hosting Is Separate

Do not assume Ollama/Hermes should automatically run on ECS Fargate.

The Node AI Service and model inference runtime have different resource requirements.

Production model hosting requires separate evaluation.

---

# 44. Docker

Docker is approved.

Use it incrementally.

Local infrastructure may run in Docker first:

```text
PostgreSQL + pgvector

RabbitMQ

Redis

Prometheus

Grafana

Loki

Tempo
```

React, Core API, AI Service, and Ollama may initially run natively for easier development.

---

# 45. AWS

Approved target AWS services include:

```text
ECR

ECS Fargate

RDS PostgreSQL

ALB

S3

CloudFront

Route 53

ACM

Amazon MQ

ElastiCache

CloudWatch

IAM

Secrets Manager / SSM
```

Introduce according to the Technology Roadmap.

---

# 46. Terraform

Terraform is intentionally late.

Sequence:

```text
Understand AWS
 ↓
Deploy manually
 ↓
Stabilize architecture
 ↓
Document resources
 ↓
Terraform
```

Do not add Terraform before the AWS architecture is understood.

---

# 47. Explicitly Excluded Technologies

Do not introduce without an approved architecture revision:

```text
TanStack Query

backend Zod

Repository Pattern

GraphQL

Kafka

Kubernetes

full microservices

dedicated vector database
```

These are not banned forever.

They are simply not justified by current requirements.

---

# 48. ExecPlan Requirement

Use an ExecPlan for substantial work.

Examples:

```text
large domain refactor

KRS domain work

OpenAPI rollout

AI foundation

AI tool calling

RAG

RabbitMQ

Redis

observability

payment integration

production containerization

AWS deployment
```

Small isolated fixes usually do not need an ExecPlan.

---

# 49. One Major Active Problem

Prefer one major active engineering plan at a time.

Avoid having multiple large architectural migrations running concurrently unless there is a clear dependency reason.

This reduces:

```text
conflicting changes

scope confusion

validation difficulty

merge risk
```

---

# 50. ExecPlan Workflow

For major work:

```text
Read Plan
   ↓
Inspect Repository
   ↓
Establish Baseline
   ↓
Implement One Milestone
   ↓
Focused Tests
   ↓
Full Validation
   ↓
Inspect Diff
   ↓
Update Plan
   ↓
Commit
```

Do not implement several future milestones in one pass.

---

# 51. Baseline Before Refactor

Before substantial refactoring:

```text
run relevant tests

understand current behavior

record existing failures

add characterization coverage where required
```

Do not refactor high-risk code without knowing its existing behavior.

---

# 52. Characterization Tests

Use characterization tests before modifying complex brownfield behavior.

High-risk examples:

```text
KRS

payments

authentication

transactions

attendance

academic status

file cleanup
```

The purpose is to preserve behavior while internal structure changes.

---

# 53. Backend Quality Gate

For meaningful backend work:

```bash
cd server

npm run lint
npm run typecheck
npm test
npm run build
```

All relevant gates should pass before milestone completion.

---

# 54. Frontend Quality Gate

Use scripts actually defined in the frontend project.

Typical:

```bash
cd client

npm run lint
npm run typecheck
npm test
npm run build
```

Do not invent scripts that do not exist.

Production build must pass.

---

# 55. Focused Tests First

Run the narrowest useful validation before the full suite.

Example:

```text
KRS change
→ KRS tests

Student change
→ Student tests

AI tool
→ tool/security tests
```

Then run full relevant quality gates.

---

# 56. Environment-Limited Validation

Agent environments may restrict:

```text
ports

networking

Docker

external services
```

If a test cannot run because of environment restrictions:

```text
prove the limitation where practical

run all non-blocked validation

record the limitation

run authoritative validation on host or CI
```

Do not weaken tests merely to satisfy a restricted sandbox.

---

# 57. Test Failures

When validation fails, classify the failure.

Possible categories:

```text
application bug

test bug

environment limitation

pre-existing failure

current regression
```

Do not hide failing tests.

Do not label failures as pre-existing without evidence.

---

# 58. Diff Review

Before completing work:

```bash
git status
git diff --stat
git diff
```

Review for:

```text
scope creep

unrelated formatting

accidental deletions

generated files

secrets

dependency changes

test removal
```

A green test suite does not replace diff review.

---

# 59. Generated Files

Do not patch generated output when source exists.

Example:

```text
src/
 ↓
build
 ↓
dist/
```

Fix the source and rebuild.

---

# 60. Dependency Changes

Before adding a package, ask:

```text
Is it required by the current task?

Does the repository already solve this problem?

What complexity does it add?

Is it maintained?

Does it conflict with architecture decisions?
```

Do not add dependencies for hypothetical future use.

---

# 61. Technical Debt

When unrelated debt is discovered:

```text
docs/exec-plans/tech-debt-tracker.md
```

Add:

```text
problem

area

impact

priority

evidence

target plan if known
```

Do not automatically implement it.

---

# 62. Technical Debt Priority

Use:

```text
P0
critical security/data/production risk

P1
high correctness/security/reliability risk

P2
important maintainability/architecture debt

P3
low-impact cleanup
```

Do not inflate priorities because code looks untidy.

---

# 63. P0 Handling

Verified P0 issues may interrupt current feature work.

Examples:

```text
authorization bypass

secret exposure

data corruption

cross-user data leak

payment manipulation
```

Fix the critical boundary before proceeding when necessary.

---

# 64. Commit Discipline

Commits should represent logical changes.

Good:

```text
refactor: extract KRS approval service

feat: add student AI grade tool

fix: preserve request id in errors
```

Avoid:

```text
update

changes

fix stuff
```

---

# 65. Documentation Updates

Update documentation when implementation changes architecture or contract behavior.

Potential files:

```text
ARCHITECTURE.md

BACKEND.md

FRONTEND.md

QUALITY.md

SECURITY.md

RELIABILITY.md

design docs

active ExecPlan
```

Do not mark future technology as implemented until it exists.

---

# 66. Current Engineering Direction

Current completed foundations include:

```text
Backend platform hardening

Student Service Extraction
```

The next major domain focus should be driven by the current Technology Roadmap and active ExecPlan.

Do not infer that every roadmap phase should start immediately.

---

# 67. Architecture Decision Rule

Before introducing a new technology or major pattern, answer:

```text
What concrete problem exists?

Why is the current architecture insufficient?

What complexity will this add?

How will it be tested?

How will it fail?

How will it be monitored?

How will it be rolled back?
```

If these answers are unclear, the change is probably premature.

---

# 68. Definition of Done

For meaningful engineering milestones, confirm applicable requirements:

```text
Implementation complete          ✅

Scope preserved                  ✅

Architecture respected           ✅

Security reviewed                ✅

Reliability reviewed             ✅

Focused tests                    ✅

Regression tests                 ✅

Lint                             ✅

Typecheck                        ✅

Production build                 ✅

Diff reviewed                    ✅

Technical debt recorded          ✅

Documentation updated            ✅
```

---

# 69. Final Agent Principle

The goal is not to maximize the number of technologies, abstractions, files, or refactors.

The goal is to improve SIAKAD safely and incrementally.

Use this default engineering loop:

```text
Understand
   ↓
Inspect
   ↓
Change the smallest useful scope
   ↓
Prove behavior
   ↓
Review the diff
   ↓
Document decisions
   ↓
Commit
```

The final rule is:

> **Make the smallest architecture-consistent change that solves the current problem, prove that it works, and leave unrelated complexity for a properly scoped future plan.**