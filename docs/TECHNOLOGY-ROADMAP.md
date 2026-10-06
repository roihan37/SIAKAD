# TECHNOLOGY-ROADMAP.md

## Purpose

This document defines the implementation sequence for technologies and architecture capabilities in the SIAKAD project.

It answers:

- what technology is approved
- why it is needed
- when it should be introduced
- what must exist before it
- what success looks like
- which technologies are intentionally postponed
- which technologies are intentionally excluded

This document is a roadmap, not an implementation status report.

Actual implementation status must be verified against the repository.

The target architecture is defined in:

```text
docs/TARGET-ARCHITECTURE.md
```

Implementation work is executed through:

```text
docs/exec-plans/active/
```

---

# 1. Roadmap Principle

Technology must be introduced because it solves a concrete problem.

Do not introduce technology only because:

```text
it is popular

it appears in enterprise architectures

it improves the portfolio visually

it may be useful someday
```

Preferred progression:

```text
Problem
  ↓
Architecture Need
  ↓
ExecPlan
  ↓
Small Implementation
  ↓
Validation
  ↓
Production Readiness
```

---

# 2. Architecture Direction

The project evolves toward:

> Hybrid Architecture: Modular Monolith Core REST API + Separate AI Assistant Service + Async Workers + Observability + AWS Deployment.

Target:

```text
React Frontend
      │
      ▼
     ALB
   /     \
/api/*   /ai/*
  │        │
  ▼        ▼
Core API  AI Service
  │        │
  │      LangChain
  │        │
  │   Ollama / Hermes
  │        │
  ◄── Approved Tools
  │
Prisma
  │
PostgreSQL + pgvector
  │
  ├── Redis
  ├── RabbitMQ
  └── S3
```

---

# 3. Status Definitions

Roadmap items use:

```text
COMPLETED
Implemented and validated.

CURRENT
Current engineering focus.

NEXT
Expected after current work.

PLANNED
Approved but not yet scheduled.

LATER
Approved long-term capability.

OPTIONAL
Only implement if a real requirement appears.

NOT PLANNED
Explicitly excluded from current architecture.
```

---

# 4. Current Technology Baseline

Current approved foundation includes:

## Frontend

```text
React
TypeScript
Vite
React Router
Redux Toolkit
Tailwind CSS
shadcn/ui
```

## Backend

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

## Engineering

```text
Git
GitHub
GitHub Actions
Harness documentation
Automated tests
```

---

# 5. Technologies Intentionally Not Planned

The following are not part of the current roadmap:

```text
TanStack Query
backend Zod
Repository Pattern
GraphQL
Kafka
Kubernetes
full microservices
Next.js migration
dedicated vector database
```

They may only be reconsidered through an explicit architecture decision.

---

# 6. Roadmap Overview

```text
PHASE 0
Backend Foundation
COMPLETED
      │
      ▼
PHASE 1
Service Architecture Cleanup
COMPLETED
      │
      ▼
PHASE 2
KRS Domain Audit
CURRENT / NEXT
      │
      ▼
PHASE 3
API Contract + OpenAPI
      │
      ▼
PHASE 4
Frontend Cleanup
      │
      ▼
PHASE 5
AI Assistant Foundation
      │
      ▼
PHASE 6
AI Tool Calling
      │
      ▼
PHASE 7
AI Lecturer/Admin Capabilities
      │
      ▼
PHASE 8
RAG + pgvector
      │
      ▼
PHASE 9
Docker Infrastructure Foundation
      │
      ▼
PHASE 10
RabbitMQ + Workers
      │
      ▼
PHASE 11
Redis
      │
      ▼
PHASE 12
Observability
      │
      ▼
PHASE 13
Payment Gateway
      │
      ▼
PHASE 14
Production Containers
      │
      ▼
PHASE 15
AWS Deployment
      │
      ▼
PHASE 16
Production Hardening
      │
      ▼
PHASE 17
Terraform
```

---

# 7. Important Roadmap Adjustment

Docker infrastructure should be introduced before RabbitMQ, Redis, and the full observability stack.

Reason:

```text
RabbitMQ
Redis
Prometheus
Grafana
Loki
Tempo
```

are easier and safer to learn locally through containers.

This does not mean the entire application must immediately run inside Docker.

Initial Docker use may be infrastructure-only.

---

# 8. Phase 0 - Backend Foundation

Status:

```text
COMPLETED
```

Implemented foundation includes:

```text
TypeScript production build

environment validation

AppError

centralized error handler

standard 404 handling

request IDs

health/live

health/ready

bounded readiness checks

Pino structured logging

graceful shutdown

backend test infrastructure
```

Quality baseline:

```text
lint
typecheck
tests
build
```

must remain green.

---

# 9. Phase 1 - Service Architecture Cleanup

Status:

```text
COMPLETED for Student domain
```

Student Service Extraction has been completed.

Target architecture:

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

No Repository layer.

The Student domain becomes a reference for future domain cleanup.

Do not mass-refactor all controllers automatically.

---

# 10. Phase 2 - KRS Domain Audit

Status:

```text
CURRENT / NEXT
```

Purpose:

Understand and validate the KRS domain before exposing it to AI or expanding features.

Review:

```text
KRS lifecycle

KRS header status

KRS detail status

submission

approval

rejection

semester rules

maximum SKS

course prerequisites

schedule conflicts

ownership

lecturer/admin authority
```

Current known status concepts may include:

```text
StatusKRS

DRAFT
DIAJUKAN
DISETUJUI
DITOLAK
```

and detail-level status such as:

```text
MENUNGGU
DISETUJUI
DITOLAK
```

The audit must determine whether these represent legitimate separate state machines or unnecessary duplication.

Do not rename or redesign them before inspection.

---

# 11. Phase 2 Exit Criteria

```text
KRS responsibilities documented

state transitions understood

authorization rules documented

characterization tests added where needed

service boundaries identified

legacy behavior preserved

lint passes

typecheck passes

tests pass

build passes
```

---

# 12. Phase 3 - API Contract

Status:

```text
PLANNED
```

Technologies:

```text
REST
OpenAPI 3.x
Swagger UI
```

Purpose:

Make Core API contracts explicit and easier for:

```text
Frontend

AI Service

future integrations

testing

developers
```

---

# 13. Canonical API Direction

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

Do not mass-migrate all legacy endpoints.

Apply canonical contracts to:

```text
new endpoints

explicitly migrated endpoints
```

---

# 14. Phase 3 Deliverables

```text
OpenAPI definition

Swagger UI

auth documentation

common error definitions

pagination documentation

Student API documentation

KRS API documentation

AI-facing Core API contract foundation
```

---

# 15. Phase 4 - Frontend Cleanup

Status:

```text
PLANNED
```

No major technology replacement.

Remain on:

```text
React
TypeScript
Vite
Redux Toolkit
React Router
Tailwind
shadcn/ui
```

Do not introduce TanStack Query.

---

# 16. Frontend Cleanup Goals

Focus on:

```text
feature-oriented structure

API service consistency

Redux slice cleanup

shared loading states

shared error states

typing

duplicate API call reduction

component boundaries

reusable UI
```

Do not combine:

```text
folder migration

Redux rewrite

UI redesign

API rewrite
```

into one large refactor.

---

# 17. Phase 5 - AI Assistant Foundation

Status:

```text
PLANNED
```

Technologies:

```text
Node.js
Express
TypeScript
LangChain.js
Ollama
Hermes
SSE
```

Target repository component:

```text
ai-service/
```

---

# 18. AI Foundation Goals

Initial AI must provide:

```text
health endpoints

Ollama connectivity

Hermes chat

LangChain integration

basic conversation handling

SSE streaming

authentication context foundation

structured logging
```

No RAG yet.

No RabbitMQ yet.

No write actions yet.

---

# 19. AI Provider Boundary

Introduce a thin provider abstraction.

Concept:

```text
AIService
    ↓
LLMProvider
    ↓
OllamaProvider
    ↓
Hermes
```

This prevents business orchestration from becoming permanently coupled to one model runtime.

Do not over-engineer multi-provider support initially.

---

# 20. AI Foundation Exit Criteria

```text
AI Service starts independently

health/live works

health/ready works

Ollama failure handled safely

Hermes basic conversation works

SSE streaming works

Core API remains independent

tests exist

lint passes

typecheck passes

build passes
```

---

# 21. Phase 6 - AI Tool Calling

Status:

```text
PLANNED
```

Purpose:

Allow AI to use controlled SIAKAD capabilities.

Target:

```text
User
 ↓
AI Service
 ↓
Hermes
 ↓
Approved Tool
 ↓
Core REST API
 ↓
RBAC
 ↓
Domain Service
```

---

# 22. Student Tools First

Initial tools should be read-only.

Recommended order:

```text
get_my_profile

get_my_schedule

get_my_grades

get_my_attendance

get_my_tuition

get_my_krs
```

Each tool should have focused security tests.

---

# 23. Tool Security Rule

Never:

```text
LLM
 ↓
Prisma
```

Never:

```text
LLM
 ↓
arbitrary SQL
```

Never trust model-selected identity for "my" operations.

Use authenticated context.

---

# 24. AI Tool Calling Exit Criteria

```text
role-aware tool registry

student identity from auth context

cross-user access prevented

Core API remains authorization authority

tool timeout exists

controlled tool errors

tool tests pass

AI service tests pass

Core regression remains green
```

---

# 25. Phase 7 - Lecturer and Admin AI

Status:

```text
PLANNED
```

Only begin after Student AI tools are stable.

Lecturer examples:

```text
get_my_classes
get_class_students
get_class_attendance
get_grade_summary
```

Admin examples:

```text
get_student_statistics
get_payment_summary
get_academic_statistics
```

---

# 26. Early Warning Features

Potential later AI capability:

```text
attendance risk

low GPA

failed-course patterns
```

Initial decision logic should be deterministic.

Example:

```text
attendance < threshold
→ risk signal

GPA < configured threshold
→ risk signal
```

AI may explain the result.

AI should not arbitrarily decide risk classification without transparent rules.

---

# 27. Phase 8 - RAG + pgvector

Status:

```text
PLANNED
```

Technologies:

```text
PostgreSQL
pgvector
LangChain retriever
Embedding model
S3
```

Initial source documents:

```text
Academic Guide

KRS Guide

Academic Calendar

University Rules

FAQ
```

---

# 28. RAG Development Order

Start simple:

```text
Document metadata
      ↓
Text extraction
      ↓
Chunking
      ↓
Embedding
      ↓
pgvector
      ↓
Retrieval
      ↓
LLM answer
      ↓
Citation
```

Initial indexing may be synchronous for learning and validation.

RabbitMQ is added afterward.

---

# 29. Embedding Model Rule

Do not use Hermes as the embedding model.

Use a dedicated embedding model.

Embedding configuration must record:

```text
model

dimension

chunk strategy

similarity metric
```

Changing embedding model may require reindexing.

---

# 30. RAG Security

RAG must support document visibility.

Potential:

```text
PUBLIC
STUDENT
LECTURER
ADMIN
```

Retrieval must not leak unauthorized documents.

---

# 31. Phase 8 Exit Criteria

```text
pgvector works

documents can be indexed

authorized retrieval works

citations work

document metadata exists

embedding configuration documented

unauthorized document retrieval prevented

RAG failure does not cause hallucinated authoritative answers
```

---

# 32. Phase 9 - Docker Infrastructure Foundation

Status:

```text
PLANNED
```

Purpose:

Provide repeatable local infrastructure before adding multiple infrastructure dependencies.

Initial Docker Compose candidates:

```text
PostgreSQL + pgvector

RabbitMQ

Redis
```

Later:

```text
Prometheus
Grafana
Loki
Tempo
```

---

# 33. Docker Development Strategy

Do not force all application processes into Docker immediately.

Recommended early development:

```text
Native:

React
Core API
AI Service
Ollama


Docker:

PostgreSQL
RabbitMQ
Redis
```

This keeps local development understandable.

---

# 34. Phase 9 Exit Criteria

```text
docker compose configuration exists

services use persistent volumes where needed

health checks exist where practical

no secrets committed

developers can start required infrastructure consistently
```

---

# 35. Phase 10 - RabbitMQ + Workers

Status:

```text
PLANNED
```

Technology:

```text
RabbitMQ
amqplib or approved Node client
```

Local:

```text
Docker RabbitMQ
```

Production target:

```text
Amazon MQ for RabbitMQ
```

---

# 36. First RabbitMQ Use Case

Do not start with generic broker infrastructure.

First use case:

```text
AI document indexing
```

Target:

```text
Document Upload
      ↓
Database Metadata
      ↓
RabbitMQ
      ↓
ai.document.index
      ↓
Document Worker
      ↓
Embedding
      ↓
pgvector
```

---

# 37. RabbitMQ Milestone Order

Recommended:

```text
M1 connection foundation

M2 publisher

M3 document indexing queue

M4 worker

M5 acknowledgement

M6 retry

M7 dead-letter handling

M8 graceful shutdown

M9 observability
```

---

# 38. Future Queue Candidates

After indexing is stable:

```text
ai.report.generate

notification.email

academic.batch
```

Do not use RabbitMQ for ordinary synchronous CRUD.

---

# 39. RabbitMQ Exit Criteria

```text
messages versioned

consumer validates messages

acknowledgement correct

duplicate delivery considered

retry bounded

dead-letter strategy defined

worker shutdown safe

queue failures observable
```

---

# 40. Phase 11 - Redis

Status:

```text
PLANNED
```

Technology:

```text
Redis / Valkey-compatible client
```

Local:

```text
Docker
```

Production:

```text
ElastiCache
```

---

# 41. Redis First Use Cases

Choose one concrete use case first.

Recommended candidates:

```text
AI rate limiting

active academic year cache

expensive dashboard aggregation
```

Do not immediately cache every API response.

---

# 42. Redis Requirements

Every cache must define:

```text
key

TTL

invalidation

fallback

source of truth
```

PostgreSQL remains authoritative.

---

# 43. Redis Exit Criteria

```text
one measured use case implemented

fallback works

cache isolation correct

TTL documented

invalidation documented

Redis outage does not corrupt academic state
```

---

# 44. Phase 12 - Observability

Status:

```text
PLANNED
```

Technologies:

```text
Pino
Prometheus
Grafana
Loki
OpenTelemetry
Tempo
```

Pino already exists.

Do not install the remainder simultaneously.

---

# 45. Observability Sequence

```text
Pino
✅
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
 ↓
Correlation
 ↓
Alerting
```

---

# 46. Prometheus

First metrics:

```text
http_requests_total

http_request_duration_seconds

http_errors_total
```

Later AI:

```text
ai_requests_total

ai_request_duration_seconds

ai_tool_calls_total

ai_tool_errors_total
```

Later queues:

```text
worker_jobs_total

worker_job_failures_total
```

---

# 47. Grafana

First dashboard:

```text
Core API Overview
```

Then:

```text
AI Service

RabbitMQ Workers

Redis Cache
```

---

# 48. Loki

Target:

```text
Pino
 ↓
Loki
 ↓
Grafana
```

Do not log raw secrets or private academic payloads.

---

# 49. OpenTelemetry + Tempo

Introduce only after multiple runtime components justify distributed tracing.

Expected target:

```text
User
 ↓
AI Service
 ↓
LLM
 ↓
Tool
 ↓
Core API
 ↓
Prisma
```

OpenTelemetry creates/propagates traces.

Tempo stores them.

Grafana visualizes them.

---

# 50. Observability Exit Criteria

```text
Core metrics visible

dashboard usable

logs searchable

distributed traces work

requestId / traceId correlation exists where practical

telemetry failure does not break Core operations

basic actionable alerts defined
```

---

# 51. Phase 13 - Payment Gateway

Status:

```text
PLANNED
```

Choose one:

```text
Midtrans

OR

Xendit
```

Do not integrate both initially.

---

# 52. Payment Target Flow

```text
Student
 ↓
Core API
 ↓
Payment Provider
 ↓
Provider Event
 ↓
Webhook
 ↓
PaymentService
 ↓
PostgreSQL
```

---

# 53. Payment Requirements

Must implement:

```text
provider authentication

webhook verification

idempotency

payment state machine

duplicate webhook handling

audit trail

transaction safety

timeout handling
```

Frontend claims are not authoritative.

---

# 54. Phase 14 - Production Containerization

Status:

```text
PLANNED
```

Target application images:

```text
siakad-core-api

siakad-ai

siakad-worker
```

Requirements:

```text
production build

runtime-only dependencies

no secrets inside image

graceful shutdown

health checks

versioned image tags
```

---

# 55. Container Tags

Prefer:

```text
Git commit SHA

semantic release version
```

Avoid depending only on:

```text
latest
```

Production rollback must identify previous image versions.

---

# 56. Phase 15 - AWS Deployment

Status:

```text
PLANNED
```

Technologies:

```text
Amazon ECR

ECS Fargate

Amazon RDS PostgreSQL

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

---

# 57. AWS Deployment Order

Recommended learning/deployment order:

```text
M1
ECR

M2
RDS PostgreSQL

M3
Core API ECS Fargate

M4
ALB

M5
ACM / HTTPS

M6
Frontend S3

M7
CloudFront

M8
Route 53

M9
AI Service ECS

M10
Amazon MQ

M11
Workers

M12
ElastiCache

M13
CloudWatch
```

Do not deploy every service at once.

---

# 58. ECR

Purpose:

```text
store versioned Docker images
```

Repositories:

```text
siakad-core-api

siakad-ai

siakad-worker
```

---

# 59. ECS Fargate

Target runtime for:

```text
Core API

AI Service

Workers
```

No direct EC2 management required for initial architecture.

---

# 60. RDS PostgreSQL

Target production database.

Prisma continues to connect through:

```text
DATABASE_URL
```

Production planning should include:

```text
backup

monitoring

storage

recovery

network isolation
```

---

# 61. ALB

Target routing:

```text
/api/*
→ Core API

/ai/*
→ AI Service
```

Core and AI target groups remain independent.

---

# 62. ACM

Provides production HTTPS certificates.

Public production application traffic must use HTTPS.

---

# 63. S3 + CloudFront

Frontend:

```text
React build
 ↓
S3
 ↓
CloudFront
 ↓
User
```

S3 is also used for private application objects where appropriate.

---

# 64. Route 53

Target DNS when AWS-managed DNS is selected.

Possible future hostnames:

```text
app.example.com

api.example.com
```

Exact domain structure should be defined during deployment.

---

# 65. Amazon MQ

Production RabbitMQ target:

```text
Amazon MQ for RabbitMQ
```

Only introduce after local RabbitMQ architecture is stable.

---

# 66. ElastiCache

Production Redis target.

Only introduce after Redis has a proven application use case.

---

# 67. CloudWatch

Target AWS operational visibility:

```text
ECS metrics

ALB metrics

RDS metrics

Amazon MQ

ElastiCache

AWS alarms
```

It complements application-level observability.

---

# 68. IAM

Use least privilege.

Production runtime should prefer:

```text
ECS Task Roles
```

over long-lived static AWS credentials.

---

# 69. Secrets Manager / SSM

Secrets Manager:

```text
JWT secrets

payment secrets

external provider keys

sensitive credentials
```

SSM Parameter Store:

```text
runtime configuration

log level

feature configuration

model selection
```

---

# 70. Phase 15 Exit Criteria

```text
frontend publicly reachable through HTTPS

Core API deployed

AI Service independently deployed

RDS private

health checks integrated

rollback possible

images versioned

secrets not embedded

IAM least privilege reviewed

logs available

CI/CD can deploy validated builds
```

---

# 71. Phase 16 - Production Hardening

Status:

```text
LATER
```

Technologies/capabilities:

```text
AWS WAF

advanced CloudWatch alarms

rate limiting

security header hardening

backup verification

restore procedures

operational runbooks

cost monitoring
```

---

# 72. AWS WAF

Introduce after public production traffic exists.

Potential:

```text
managed rules

rate-based rules

IP restrictions

HTTP filtering
```

WAF does not replace backend validation.

---

# 73. Backup and Recovery

Production hardening must include:

```text
RDS backup

restore test

S3 recovery assumptions

deployment rollback

failed worker recovery

secret rotation procedure
```

A backup is not proven until recovery is understood.

---

# 74. Operational Runbooks

Create runbooks for:

```text
Core API unavailable

AI Service unavailable

database unavailable

RabbitMQ backlog

failed worker

Redis failure

payment provider problem

secret rotation

deployment rollback
```

---

# 75. Phase 17 - Terraform

Status:

```text
LATER
```

Technology:

```text
Terraform
```

Do not introduce before AWS architecture is understood.

---

# 76. Terraform Preconditions

Before Terraform:

```text
AWS resources understood

manual deployment successful

resource relationships documented

security boundaries understood

cost implications understood
```

Then:

```text
infrastructure/
├── network
├── ecs
├── rds
├── alb
├── storage
├── mq
├── cache
└── observability
```

may gradually become Infrastructure as Code.

---

# 77. Terraform Goal

Terraform should provide:

```text
repeatability

version control

reviewable infrastructure changes

environment reproducibility
```

It should not hide AWS concepts from the developer.

---

# 78. Dependency Map

Major dependencies:

```text
KRS Audit
   ↓
AI KRS tools


API Contract
   ↓
AI Service internal contracts


AI Foundation
   ↓
AI Tool Calling
   ↓
RAG


RAG
   ↓
RabbitMQ async indexing


Docker Infrastructure
   ↓
RabbitMQ
Redis
Observability


RabbitMQ local stable
   ↓
Amazon MQ


Redis local stable
   ↓
ElastiCache


Production Containers
   ↓
ECR / ECS


AWS understood
   ↓
Terraform
```

---

# 79. Technology Admission Rule

Before introducing any roadmap technology, answer:

```text
1. What concrete problem exists?

2. Is this technology approved by the roadmap?

3. Is the previous dependency ready?

4. Is an ExecPlan required?

5. What is the smallest useful first use case?

6. What happens if it fails?

7. How will it be tested?

8. How will it be observed?

9. How will it be rolled back?

10. What complexity does it add?
```

If these answers are unclear, do not implement yet.

---

# 80. Technology Exit Rule

A technology is not considered "implemented" because:

```text
dependency installed

Docker container started

package imported

hello-world example works
```

It becomes an accepted project capability when:

```text
real project use case works

tests exist

failure behavior exists

security considered

documentation updated

quality gates pass

operational behavior understood
```

---

# 81. Learning Principle

This project is also intended to demonstrate engineering competence.

The goal is not:

```text
"I used 20 technologies."
```

The preferred goal is:

```text
"I can explain why each technology exists,
how it works,
what fails without it,
and how the system behaves when it fails."
```

Depth is more valuable than technology count.

---

# 82. Portfolio Principle

Every major technology should eventually be explainable in an interview.

Examples:

```text
Why RabbitMQ instead of putting work inside HTTP?

Why Redis?

Why pgvector?

Why AI separate from Core API?

Why ALB?

Why ECS Fargate?

Why OpenTelemetry?

Why Terraform later rather than first?
```

If the implementation cannot be explained clearly, the architecture is probably too complex.

---

# 83. Current Immediate Sequence

Given the current project state:

```text
Backend Foundation
✅

Student Service Extraction
✅
```

the immediate recommended sequence is:

```text
1. KRS Domain Audit

2. API Contract + OpenAPI

3. Frontend Cleanup

4. AI Assistant Foundation

5. AI Tool Calling

6. Lecturer/Admin AI Tools

7. RAG + pgvector

8. Docker Infrastructure Foundation

9. RabbitMQ + Workers

10. Redis

11. Observability

12. Payment

13. Production Containerization

14. AWS Deployment

15. Production Hardening

16. Terraform
```

Do not create all implementation plans simultaneously.

Create an ExecPlan when a phase is close to execution.

---

# 84. Current Next ExecPlan

The next recommended ExecPlan is:

```text
docs/exec-plans/active/krs-domain-audit.md
```

It should focus only on:

```text
current KRS implementation

state model

business rules

authorization

service boundaries

characterization coverage

technical debt
```

It should not implement AI, Redis, RabbitMQ, AWS, or unrelated architecture changes.

---

# 85. Final Roadmap Principle

The roadmap is intentionally progressive.

Target evolution:

```text
Stable Core
   ↓
Clear Domains
   ↓
Explicit Contracts
   ↓
AI
   ↓
RAG
   ↓
Async
   ↓
Cache
   ↓
Observability
   ↓
Production Infrastructure
```

The project should become more sophisticated without becoming unnecessarily complicated.

The final rule is:

> Introduce one capability at a time, prove its value, validate it, then move to the next layer.