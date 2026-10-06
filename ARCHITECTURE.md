# ARCHITECTURE.md

## Purpose

This document describes the current and target architecture of the SIAKAD project.

SIAKAD is a brownfield system. The architecture must evolve incrementally without unnecessary rewrites or disruption of existing behavior.

The target architecture is:

> **Hybrid Architecture: Modular Monolith Core REST API + Separate AI Assistant Service**

The Core SIAKAD API remains the source of truth for all academic business logic.

The AI Assistant is a separate service that consumes controlled Core API capabilities through approved tools.

---

# 1. Architectural Principles

The project follows these principles:

1. Preserve existing working behavior.
2. Refactor incrementally.
3. Keep academic business logic inside the Core API.
4. Keep authorization inside trusted backend code.
5. Do not allow the LLM to become a source of truth.
6. Separate synchronous and asynchronous workloads.
7. Introduce infrastructure only when there is a concrete use case.
8. Prefer simple architecture before distributed architecture.
9. Maintain strong validation gates during refactors.
10. Keep the system observable and deployable.

---

# 2. High-Level Architecture

The target architecture is:

```text
                           USERS
                             │
                             ▼
                     React Frontend
                             │
                    REST API + SSE
                             │
                             ▼
                            ALB
                  ┌──────────┴──────────┐
                  │                     │
               /api/*                 /ai/*
                  │                     │
                  ▼                     ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ CORE SIAKAD API  │   │   AI ASSISTANT   │
        │                  │   │     SERVICE      │
        │ Node.js          │   │                  │
        │ Express          │   │ Node.js          │
        │ Controllers      │◄──│ Express          │
        │ Services         │   │ LangChain.js     │
        │ Prisma           │   │ Ollama           │
        └────────┬─────────┘   │ Hermes           │
                 │             └────────┬─────────┘
                 │                      │
                 │                Tool Calling
                 │                      │
                 ◄──────────────────────┘
                 │
                 ▼
             PostgreSQL
               Prisma
                 │
        ┌────────┼────────┐
        │        │        │
     pgvector   Redis   RabbitMQ
                           │
                   ┌───────┼───────┐
                   │       │       │
                 AI     Report  Notification
               Worker   Worker     Worker
```

The system is not intended to become full microservices at this stage.

---

# 3. Core SIAKAD Architecture

The Core SIAKAD backend remains a modular monolith.

Its responsibility includes:

- authentication
- authorization
- student management
- lecturer management
- KRS
- grades
- attendance
- scheduling
- tuition
- payments
- academic rules
- master data
- academic reporting

The backend target flow is:

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

There is no Repository layer in the current target architecture.

Prisma remains the data access layer.

---

# 4. Backend Responsibility Boundaries

## Route

Routes define:

- HTTP method
- path
- middleware
- controller binding

Routes must not contain domain business logic.

---

## Middleware

Middleware handles cross-cutting transport concerns such as:

- authentication
- authorization
- request ID
- request logging
- CORS
- body parsing
- validation
- rate limiting

Middleware must not become the location for domain-specific business logic.

---

## Controller

Controllers are HTTP transport adapters.

Controllers should:

- read request input
- read authentication context
- call services
- map service results to HTTP responses

Controllers should not:

- own large Prisma workflows
- contain complex domain logic
- own long transactions
- contain reusable business rules

---

## Service

Services contain business behavior.

Examples:

```text
StudentService
KRSService
AttendanceService
GradeService
TuitionService
PaymentService
ScheduleService
```

Services may call Prisma directly.

Services must remain independent of Express request and response objects.

Preferred:

```text
Controller
   ↓
Service
   ↓
Prisma
```

Avoid:

```text
Service(req, res)
```

---

# 5. Student Domain

Student Service Extraction has been completed.

The Student domain should now serve as one architectural reference for future backend refactors.

Typical responsibilities may be split by domain concern:

```text
student.service
student-management.service
student-account.service
student-academic.service
student-attendance.service
student-finance.service
```

The exact structure should follow the current repository implementation rather than being recreated from this document.

Student controllers should remain thin and delegate domain logic to services.

---

# 6. Brownfield Migration Policy

Legacy code may still use patterns such as:

```text
Controller
   ↓
Prisma
```

This is allowed temporarily.

Migration policy:

```text
New code
→ must follow target architecture

Significantly modified legacy code
→ migrate when safe and relevant

Unrelated legacy code
→ leave unchanged
```

Do not perform repository-wide architecture cleanup without an approved ExecPlan.

---

# 7. Frontend Architecture

The frontend remains a React SPA.

Approved stack:

```text
React
TypeScript
Vite
React Router
Redux Toolkit
Tailwind CSS
shadcn/ui
```

TanStack Query is not part of the target architecture.

The frontend should continue using the existing Redux and API service approach.

Target flow:

```text
React Page / Component
        │
        ▼
Redux / Feature Logic
        │
        ▼
API Service Layer
        │
        ▼
Core REST API
```

Local component state should remain local where appropriate.

Redux should not be used for every temporary UI state.

---

# 8. Frontend Structural Direction

Target organization should gradually move toward feature-oriented structure:

```text
src/

app/
├── router/
├── store/
└── providers/

features/
├── auth/
├── students/
├── lecturers/
├── krs/
├── attendance/
├── grades/
├── tuition/
├── payments/
├── schedule/
└── ai/

components/
├── ui/
└── shared/

services/
├── api/
└── http/

hooks/
lib/
types/
```

This migration must be incremental.

Do not move the entire frontend structure in one change.

---

# 9. API Architecture

The Core API uses REST.

Preferred route style:

```text
GET    /api/students
GET    /api/students/:id
POST   /api/students
PATCH  /api/students/:id
DELETE /api/students/:id
```

The API contract should gradually become consistent.

New or explicitly migrated endpoints should follow the canonical response format.

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

Existing legacy endpoints do not require immediate mass migration.

---

# 10. API Documentation

OpenAPI and Swagger UI are approved target technologies.

They should document:

- routes
- authentication
- parameters
- request bodies
- response bodies
- pagination
- error responses

OpenAPI should be introduced through a dedicated ExecPlan.

---

# 11. Authentication Architecture

The existing authentication architecture remains part of the Core API.

Current concepts include:

```text
JWT access token
refresh token
token rotation
session validation
password hashing
RBAC
```

The Core API remains responsible for authorization.

Frontend role checks are for presentation only.

The backend remains authoritative.

---

# 12. AI Assistant Architecture

The AI Assistant will be implemented as a separate service.

Target stack:

```text
Node.js
Express
TypeScript
LangChain.js
Ollama
Hermes
SSE
```

High-level flow:

```text
React
  ↓
AI Assistant Service
  ↓
LangChain
  ↓
Ollama / Hermes
  ↓
Tool Selection
  ↓
Core REST API
  ↓
Domain Service
  ↓
Prisma
  ↓
PostgreSQL
```

The AI Assistant must not directly own academic business logic.

---

# 13. AI Service Boundary

The AI Assistant may:

- interpret natural language
- decide which approved tool is needed
- coordinate tool execution
- generate user-facing explanations
- retrieve academic documents
- stream responses
- create asynchronous AI jobs

The AI Assistant must not:

- directly bypass Core API authorization
- directly execute arbitrary SQL
- become the source of academic truth
- decide whether a user has permission
- trust model-generated user identity
- directly modify protected data without backend validation

---

# 14. AI Authentication and Authorization

Authentication context must originate from trusted backend authentication.

Example:

```text
JWT
 ↓
Authenticated User
 ↓
AI Service
 ↓
Tool Context
 ↓
Core API
 ↓
RBAC
```

For operations such as:

```text
get_my_grades
get_my_krs
get_my_tuition
```

the authenticated user identity must be used.

Avoid:

```text
LLM decides studentId
```

Prefer:

```text
studentId derived from trusted auth context
```

The LLM is never an authorization layer.

---

# 15. AI Tool Architecture

Example student tools:

```text
get_my_profile
get_my_schedule
get_my_krs
get_my_grades
get_my_attendance
get_my_tuition
```

Lecturer tools may include:

```text
get_my_classes
get_class_students
get_class_attendance
get_grade_summary
```

Admin tools may include:

```text
get_student_statistics
get_payment_summary
get_academic_statistics
```

All tools should ultimately consume approved Core API capabilities.

---

# 16. AI Streaming

AI responses should use Server-Sent Events.

Target flow:

```text
Ollama / Hermes
      ↓
LangChain
      ↓
AI Service
      ↓
SSE
      ↓
React Chat UI
```

WebSockets are not required unless future requirements justify bidirectional real-time communication.

---

# 17. RAG Architecture

RAG will support academic policy and document questions.

Examples:

```text
Pedoman Akademik
Panduan KRS
Kalender Akademik
Peraturan Kampus
FAQ
```

Target ingestion flow:

```text
Document
   ↓
Amazon S3
   ↓
RabbitMQ
   ↓
Document Worker
   ↓
Text Extraction
   ↓
Chunking
   ↓
Embedding
   ↓
PostgreSQL + pgvector
```

Retrieval flow:

```text
Question
   ↓
Embedding
   ↓
Vector Search
   ↓
Relevant Chunks
   ↓
Hermes
   ↓
Answer + Source
```

---

# 18. pgvector

PostgreSQL remains the primary database.

pgvector may be added to support vector similarity search for RAG.

A separate vector database is not currently required.

Do not introduce:

```text
Pinecone
Qdrant
Weaviate
```

unless evidence shows PostgreSQL + pgvector is insufficient.

---

# 19. RabbitMQ Architecture

RabbitMQ is the approved asynchronous message broker.

It should be used for work that does not need to complete during the originating HTTP request.

Potential queues:

```text
ai.document.index
ai.report.generate
notification.email
academic.batch
```

Architecture:

```text
Core API ─────┐
              │
AI Service ───┼──→ RabbitMQ
              │
              ▼
            Worker
```

RabbitMQ must not be introduced for ordinary synchronous CRUD operations.

---

# 20. Worker Architecture

Workers should be independent from HTTP request handling.

Possible workers:

```text
Document Worker
Embedding Worker
Report Worker
Notification Worker
```

Workers should be:

- idempotent where appropriate
- retry-aware
- safe against duplicate messages
- observable
- gracefully stoppable

---

# 21. Redis Architecture

Redis is an approved future cache and short-lived state store.

Potential uses:

```text
rate limiting
expensive query caching
dashboard aggregation
active academic year cache
temporary AI state
```

Redis must not become the primary system of record.

PostgreSQL remains authoritative.

Every cache must define its invalidation strategy.

---

# 22. File Storage

Amazon S3 is the target object storage.

Potential use cases:

```text
student avatars
academic documents
AI source documents
generated reports
payment proof files
```

The database stores metadata and references.

Large binary files should not be stored directly in PostgreSQL unless explicitly justified.

---

# 23. Payment Architecture

A future payment gateway may use:

```text
Midtrans
or
Xendit
```

Only one payment provider should initially be integrated.

Target flow:

```text
Student
   ↓
Core API
   ↓
Payment Gateway
   ↓
Payment
   ↓
Webhook
   ↓
PaymentService
   ↓
PostgreSQL
```

Payment design must include:

- webhook validation
- idempotency
- transaction handling
- payment state transitions
- audit trail

---

# 24. Logging Architecture

Structured application logging uses Pino.

Target log flow:

```text
Core API ──────┐
               │
AI Service ────┼──→ Pino
               │
Workers ───────┘
```

Production logs should be structured.

Logs should include relevant correlation fields such as:

```text
requestId
traceId
service
method
path
statusCode
duration
errorCode
```

Sensitive information must not be logged.

---

# 25. Observability Architecture

Target observability stack:

```text
                     SERVICES
                         │
          ┌──────────────┼──────────────┐
          │              │              │
         Logs          Metrics        Traces
          │              │              │
         Pino        Prometheus    OpenTelemetry
          │                             │
          ▼                             ▼
         Loki                          Tempo
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                      Grafana
```

Responsibilities:

```text
Pino
→ structured application logs

Loki
→ centralized log storage/search

Prometheus
→ metrics collection/storage

OpenTelemetry
→ instrumentation and trace propagation

Tempo
→ distributed trace storage

Grafana
→ dashboards and investigation
```

---

# 26. Distributed Tracing

Distributed tracing becomes especially useful because the target architecture contains multiple processes.

Example:

```text
React
 ↓
AI Service
 ↓
Core API
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

A single trace should eventually be able to correlate:

```text
AI request
LLM inference
tool execution
Core API request
database query
```

OpenTelemetry should propagate trace context between services.

Tempo stores these traces.

---

# 27. Health Architecture

Each deployable service should eventually expose health checks.

Examples:

```text
Core API
/health/live
/health/ready
```

Future AI Service:

```text
/health/live
/health/ready
```

Liveness means the process is alive.

Readiness means the process can serve traffic.

Dependency checks must be bounded.

---

# 28. Graceful Shutdown

All long-running processes should eventually support graceful shutdown.

This includes:

```text
Core API
AI Service
Workers
RabbitMQ consumers
Redis clients
database clients
```

Shutdown should:

1. stop accepting new work
2. complete or safely stop active work
3. close connections
4. disconnect database/cache/queue clients
5. exit within a bounded timeout

---

# 29. Local Development Architecture

Local development should remain lightweight.

Not every target service must always run.

Potential local environment:

```text
Host

React
Core API
AI Service
Ollama


Docker Compose

PostgreSQL + pgvector
Redis
RabbitMQ
Prometheus
Grafana
Loki
Tempo
```

Infrastructure services should only be started when required.

Ollama may run directly on the host rather than inside Docker.

---

# 30. Container Architecture

Docker is the target container technology.

Potential images:

```text
siakad-core-api
siakad-ai
siakad-worker
```

Infrastructure such as PostgreSQL, RabbitMQ, Redis, Prometheus, Grafana, Loki, and Tempo may use existing official container images during development.

---

# 31. CI/CD Architecture

Target pipeline:

```text
Developer
   ↓
Git Push
   ↓
GitHub
   ↓
GitHub Actions
   ↓
Install
   ↓
Lint
   ↓
Typecheck
   ↓
Tests
   ↓
Build
   ↓
Docker Build
   ↓
Amazon ECR
   ↓
ECS Deployment
```

Core API and AI Service should eventually be independently buildable and deployable.

---

# 32. AWS Production Architecture

Target production architecture:

```text
                              Internet
                                 │
                              Route 53
                                 │
                                ACM
                                 │
                                ALB
                     ┌───────────┴───────────┐
                     │                       │
                  /api/*                   /ai/*
                     │                       │
                     ▼                       ▼
              ECS Fargate             ECS Fargate
               Core API                AI Service
                     │                       │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ▼               ▼               ▼
        RDS PostgreSQL      ElastiCache      Amazon MQ
          + pgvector           Redis          RabbitMQ
                 │
                 ▼
                 S3
```

Frontend:

```text
React Build
   ↓
S3
   ↓
CloudFront
   ↓
User
```

---

# 33. AWS Service Responsibilities

## ECS Fargate

Runs containerized applications without directly managing EC2 hosts.

Target workloads:

```text
Core API
AI Service
Workers
```

---

## Amazon ECR

Stores Docker images.

Example:

```text
siakad-core-api
siakad-ai
siakad-worker
```

---

## Amazon RDS PostgreSQL

Production PostgreSQL database.

Prisma continues to connect using a database URL.

---

## ALB

Routes HTTP traffic.

Target routing:

```text
/api/*
→ Core API

/ai/*
→ AI Service
```

---

## Route 53

Handles DNS.

Example:

```text
app.example.com
api.example.com
```

---

## ACM

Provides TLS certificates for HTTPS.

---

## CloudFront

Provides CDN delivery for frontend static assets.

---

## Amazon MQ

Managed RabbitMQ for production.

---

## ElastiCache

Managed Redis-compatible cache.

---

## CloudWatch

AWS infrastructure monitoring and logs.

---

## Secrets Manager / SSM

Stores production secrets and configuration.

---

## AWS WAF

Future production hardening layer.

Not required during early development.

---

# 34. Infrastructure as Code

Terraform is a future technology.

Do not introduce Terraform before the AWS infrastructure is understood and stable.

Recommended order:

```text
Understand AWS manually
      ↓
Deploy stable architecture
      ↓
Document resources
      ↓
Introduce Terraform
```

Terraform should reproduce an architecture that is already understood.

---

# 35. Security Boundaries

Trust boundaries should remain explicit.

```text
Browser
   │
   ▼
Public API Boundary
   │
   ├── Core API
   │
   └── AI Service
```

Neither client input nor AI-generated output should be trusted automatically.

Core API authorization remains authoritative.

Sensitive data must not be exposed to:

- unauthorized users
- unrelated AI tools
- logs
- public responses
- external model providers without explicit policy

---

# 36. AI Safety Boundary

The AI model must never be treated as trusted infrastructure.

Do not allow:

```text
LLM
→ arbitrary SQL

LLM
→ direct Prisma

LLM
→ unrestricted internal APIs

LLM
→ authorization decision
```

Approved model behavior:

```text
LLM
   ↓
Approved Tool
   ↓
Authenticated Context
   ↓
Core API
   ↓
RBAC
   ↓
Domain Service
```

State-changing AI actions should require confirmation when appropriate.

---

# 37. Technology Decisions

The following technologies are intentionally not part of the current architecture:

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

These choices may only change through an explicit architecture decision.

---

# 38. Current State

The backend foundation currently includes:

```text
TypeScript production build
environment validation
AWS credential hardening
AppError foundation
centralized error handling
API 404 handling
request IDs
health endpoints
Pino logging
test infrastructure
graceful shutdown
Student Service Extraction
```

The repository should remain the authoritative source for exact implementation status.

Documentation must not assume future technologies are already implemented.

---

# 39. Target Evolution

The intended evolution is:

```text
Backend Foundation
      ✅
       │
       ▼
Service Architecture Cleanup
       │
       ▼
KRS Domain Audit
       │
       ▼
API Contract + OpenAPI
       │
       ▼
Frontend Cleanup
       │
       ▼
AI Service
       │
       ▼
AI Tool Calling
       │
       ▼
RAG + pgvector
       │
       ▼
RabbitMQ Workers
       │
       ▼
Redis
       │
       ▼
Observability
       │
       ▼
Payment
       │
       ▼
Docker
       │
       ▼
AWS Deployment
       │
       ▼
Production Hardening
       │
       ▼
Terraform
```

Each major stage should have its own ExecPlan.

---

# 40. Architectural Rule of Thumb

When considering a new technology or architecture change, ask:

1. What problem does it solve?
2. Does that problem exist now?
3. Can the current architecture solve it?
4. What new operational burden does it introduce?
5. How will it be tested?
6. How will it be monitored?
7. How can it be rolled back?
8. Does it preserve compatibility?

Do not add technology only to make the architecture appear more advanced.

The architecture should become more complex only when the problem requires it.