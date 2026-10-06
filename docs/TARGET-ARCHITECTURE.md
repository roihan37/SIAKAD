# TARGET-ARCHITECTURE.md

## Purpose

This document defines the intended long-term architecture of the SIAKAD project.

It describes the architecture the repository should evolve toward.

It does **not** mean every component documented here is already implemented.

The actual current implementation is described by:

```text
ARCHITECTURE.md
```

The implementation sequence is controlled by:

```text
docs/TECHNOLOGY-ROADMAP.md
docs/exec-plans/active/
```

The target architecture is:

> **Hybrid Architecture: Modular Monolith Core REST API + Separate AI Assistant Service + Asynchronous Workers + Observability + AWS Deployment**

---

# 1. Target Architecture Goals

The target architecture should provide:

1. maintainable academic business logic
2. secure authentication and authorization
3. clear separation between Core SIAKAD and AI
4. incremental scalability
5. asynchronous background processing
6. caching without compromising correctness
7. AI tool calling without direct database authority
8. RAG over academic documents
9. production observability
10. containerized deployment
11. AWS production readiness
12. reliable CI/CD
13. strong security boundaries
14. controlled infrastructure complexity

---

# 2. Architectural Style

The Core SIAKAD remains a:

> **Modular Monolith**

The AI Assistant becomes a:

> **Separate Application Service**

Background work is handled by:

> **Independent Workers**

This is intentionally not a full microservices architecture.

Target:

```text
Core SIAKAD
=
Modular Monolith

AI
=
Separate Service

Async Jobs
=
Workers
```

Avoid unnecessary decomposition into many small services.

---

# 3. High-Level Target Architecture

```text
                                 USERS
                                   │
                                   ▼
                           React Frontend
                                   │
                         HTTPS / REST / SSE
                                   │
                                   ▼
                         Application Load Balancer
                          ┌────────┴────────┐
                          │                 │
                       /api/*             /ai/*
                          │                 │
                          ▼                 ▼
                ┌────────────────┐  ┌────────────────┐
                │ Core SIAKAD API│  │ AI Assistant   │
                │                │  │ Service        │
                │ Node.js        │  │                │
                │ Express        │  │ Node.js        │
                │ Controllers    │◄─│ LangChain.js   │
                │ Services       │  │ Ollama/Hermes  │
                │ Prisma         │  │ Tool Calling   │
                └───────┬────────┘  └───────┬────────┘
                        │                   │
                        │         Approved Core API Calls
                        ◄───────────────────┘
                        │
                        ▼
                PostgreSQL + pgvector
                        │
            ┌───────────┼────────────┐
            │           │            │
            ▼           ▼            ▼
          Redis      RabbitMQ        S3
                        │
              ┌─────────┼─────────┐
              │         │         │
              ▼         ▼         ▼
          AI Worker  Report    Notification
                     Worker      Worker
```

---

# 4. Frontend Target

Approved frontend technologies:

```text
React
TypeScript
Vite
React Router
Redux Toolkit
Tailwind CSS
shadcn/ui
```

The frontend remains a React SPA.

Target responsibility:

```text
Frontend
├── Presentation
├── User Interaction
├── Client State
├── Redux State
├── REST API Consumption
└── AI Chat UI
```

The frontend must not contain trusted authorization logic.

---

# 5. Frontend Request Flow

Normal application request:

```text
React
  ↓
Redux / Feature Logic
  ↓
API Service
  ↓
Core SIAKAD REST API
```

AI request:

```text
React AI Chat
     ↓
AI API
     ↓
SSE Response Stream
```

The frontend should not call Ollama directly.

---

# 6. Core SIAKAD API

The Core SIAKAD API is the central business system.

It owns:

```text
Authentication
Authorization
Students
Lecturers
Academic Rules
KRS
Grades
Attendance
Schedule
Tuition
Payments
Master Data
Academic Reporting
```

The Core API remains authoritative even after AI is introduced.

---

# 7. Core Backend Architecture

Target backend flow:

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
→ transport wiring

Middleware
→ cross-cutting HTTP concerns

Controller
→ HTTP adaptation

Service
→ domain/business logic

Prisma
→ database access

PostgreSQL
→ authoritative data
```

---

# 8. No Repository Layer

The target architecture does not include a Repository Pattern.

Preferred:

```text
Service
  ↓
Prisma
```

Avoid:

```text
Service
  ↓
Repository
  ↓
Prisma
```

unless future complexity provides a concrete reason.

---

# 9. Modular Core Domains

The Core API should evolve toward clear domain boundaries.

Potential structure:

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
├── notifications/
└── dashboard/
```

Module boundaries should reduce unnecessary coupling.

This does not mean each module becomes a microservice.

---

# 10. Core Database

Primary database:

```text
PostgreSQL
```

ORM:

```text
Prisma
```

PostgreSQL remains the authoritative source of truth.

Target:

```text
Core API
    ↓
Prisma
    ↓
PostgreSQL
```

---

# 11. pgvector

The target PostgreSQL installation may include:

```text
pgvector
```

Purpose:

```text
RAG embeddings
document similarity search
semantic retrieval
```

This allows SIAKAD to avoid adding a dedicated vector database initially.

Target:

```text
PostgreSQL
├── relational academic data
└── RAG vector data
```

---

# 12. AI Assistant Service

The AI Assistant is a separate deployable service.

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

Responsibilities:

```text
Natural-language interaction
LLM orchestration
Tool selection
Tool execution coordination
RAG retrieval
Answer generation
Streaming
AI conversation management
```

It does not own academic business truth.

---

# 13. AI Core Rule

The primary AI architecture rule is:

```text
AI
  ↓
Tool
  ↓
Core API
  ↓
Domain Service
  ↓
Prisma
  ↓
Database
```

Avoid:

```text
AI
  ↓
Direct Prisma
```

and:

```text
AI
  ↓
Arbitrary SQL
```

---

# 14. AI Provider Architecture

The target AI Service should not tightly couple all application logic to one model implementation.

Conceptual provider boundary:

```text
AIService
   ↓
LLMProvider
   ├── Ollama / Hermes
   └── Future Cloud Provider
```

Ollama + Hermes is the primary local development target.

Cloud provider support may be introduced later if required.

---

# 15. LangChain

LangChain.js is the target AI orchestration framework.

It may coordinate:

```text
Chat model
Tools
Messages
Retrievers
RAG context
Streaming
```

LangChain must not become:

```text
authorization authority
business rule engine
database abstraction
```

---

# 16. Ollama

Ollama is the target local inference runtime.

Target development architecture:

```text
AI Service
    ↓
Ollama
    ↓
Hermes
```

Ollama should remain private and not be exposed directly to public internet traffic.

---

# 17. Hermes

Hermes is the initial target local chat/tool model.

Primary use:

```text
Natural language
Tool selection
Tool arguments
Response generation
```

Hermes is not used as:

```text
database
authorization engine
source of academic truth
```

---

# 18. AI Tool Calling

Tools provide narrow access to SIAKAD functionality.

Student examples:

```text
get_my_profile
get_my_schedule
get_my_krs
get_my_grades
get_my_attendance
get_my_tuition
```

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

Tool registries must remain role-aware.

---

# 19. AI Identity Flow

Trusted identity comes from authenticated context.

Target:

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
```

Avoid:

```text
LLM selects userId
```

For "my" operations:

```text
get_my_grades()
```

should not accept arbitrary target student identity.

---

# 20. AI Authorization

Authorization remains enforced by the Core API.

Target:

```text
AI Service
    ↓
Core API
    ↓
RBAC
    ↓
Ownership
    ↓
Service
```

System prompts do not replace backend authorization.

---

# 21. AI Streaming

Target user experience uses:

```text
Server-Sent Events
```

Flow:

```text
Hermes
   ↓
LangChain
   ↓
AI Service
   ↓
SSE
   ↓
React
```

WebSocket is not required unless future bidirectional realtime requirements emerge.

---

# 22. RAG Architecture

RAG provides answers based on authoritative academic documents.

Sources may include:

```text
Academic Guide
KRS Guide
Academic Calendar
University Rules
FAQ
```

Target ingestion:

```text
Document
   ↓
S3
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

---

# 23. RAG Retrieval

Target query path:

```text
User Question
      ↓
Embedding
      ↓
pgvector Search
      ↓
Relevant Authorized Chunks
      ↓
LLM
      ↓
Answer + Source
```

RAG answers should preserve document authorization boundaries.

---

# 24. RAG Source Metadata

Document chunks should eventually contain useful metadata.

Example:

```text
documentId
documentName
documentVersion
page
section
visibility
chunkId
```

This supports:

```text
citation
document lifecycle
authorization
reindexing
```

---

# 25. File Storage

Target object storage:

```text
Amazon S3
```

Potential objects:

```text
student avatars
academic documents
payment proofs
generated reports
AI source files
```

PostgreSQL stores metadata.

S3 stores the binary objects.

---

# 26. RabbitMQ

RabbitMQ is the target asynchronous message broker.

Purpose:

```text
background processing
retryable work
batch jobs
long-running tasks
decoupled workers
```

Target local:

```text
RabbitMQ Docker
```

Target AWS production:

```text
Amazon MQ for RabbitMQ
```

---

# 27. RabbitMQ Use Cases

Approved candidate workloads:

```text
ai.document.index
ai.report.generate
notification.email
academic.batch
```

RabbitMQ is not intended for ordinary synchronous REST requests.

---

# 28. Worker Architecture

Workers are independent long-running processes.

Target:

```text
RabbitMQ
    │
    ├── Document Worker
    ├── Report Worker
    ├── Notification Worker
    └── Future Batch Worker
```

Workers should use domain-safe APIs or carefully defined database access based on their responsibility.

AI workers must not bypass required authorization or integrity rules.

---

# 29. Redis

Redis is the target cache and ephemeral state technology.

Potential purposes:

```text
rate limiting
expensive query cache
dashboard cache
active academic-year cache
temporary AI state
```

Target local:

```text
Redis / Valkey Docker
```

Target AWS:

```text
ElastiCache
```

---

# 30. Redis Architecture Principle

Redis is not authoritative.

Target:

```text
Redis
→ performance

PostgreSQL
→ truth
```

When Redis fails, critical academic correctness should remain intact where practical.

---

# 31. Payment Gateway

Target payment gateway:

```text
Midtrans
OR
Xendit
```

Only one should initially be integrated.

Target flow:

```text
Student
  ↓
Core API
  ↓
Payment Gateway
  ↓
Provider Processing
  ↓
Webhook
  ↓
Core API
  ↓
PaymentService
  ↓
PostgreSQL
```

---

# 32. Payment Reliability Requirements

Target payment architecture must support:

```text
webhook verification
idempotency
transaction state machine
audit trail
duplicate webhook handling
provider timeout handling
```

Frontend payment status is never authoritative.

---

# 33. Logging

Application logging uses:

```text
Pino
```

All deployable services should eventually use structured logs.

Target fields:

```text
service
requestId
traceId
method
route
status
duration
errorCode
jobId
toolName
```

---

# 34. Metrics

Target metrics technology:

```text
Prometheus
```

Candidate metrics:

```text
http_requests_total
http_request_duration_seconds
http_errors_total

ai_requests_total
ai_request_duration_seconds
ai_tool_calls_total
ai_tool_errors_total

worker_jobs_total
worker_job_failures_total

cache_hits_total
cache_misses_total
```

---

# 35. Grafana

Grafana is the target visualization layer.

Target dashboards may include:

```text
Core API Overview
AI Assistant Overview
Database Health
RabbitMQ Workers
Redis Cache
Payment Health
```

---

# 36. Loki

Loki is the target centralized log storage for the self-hosted observability environment.

Target:

```text
Pino Logs
   ↓
Loki
   ↓
Grafana
```

---

# 37. OpenTelemetry

OpenTelemetry is the target instrumentation standard for tracing.

Target instrumented areas:

```text
Core API HTTP requests
AI Service requests
AI model calls
Tool calls
Internal Core API calls
RabbitMQ publish/consume
Workers
```

---

# 38. Tempo

Tempo is the target trace backend.

Target:

```text
OpenTelemetry
      ↓
Tempo
      ↓
Grafana
```

Tempo becomes particularly useful after the AI Service is separated from the Core API.

---

# 39. Target Observability Architecture

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

---

# 40. Health Architecture

Every public deployable service should provide:

```text
/health/live
/health/ready
```

Core API:

```text
/health/live
/health/ready
```

AI Service:

```text
/health/live
/health/ready
```

Workers may expose operational health in a mechanism appropriate to deployment.

---

# 41. Graceful Shutdown

All long-running processes should support graceful shutdown.

Target:

```text
Core API
AI Service
Workers
RabbitMQ consumers
Redis clients
Prisma clients
Telemetry exporters
```

Shutdown must be bounded.

---

# 42. API Contract

The Core REST API should move incrementally toward predictable response contracts.

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

Legacy compatibility remains important.

---

# 43. OpenAPI

Target API documentation:

```text
OpenAPI
Swagger UI
```

OpenAPI should cover:

```text
Core REST API
authentication
parameters
request bodies
responses
errors
pagination
```

Internal AI/Core contracts should also be explicit.

---

# 44. Docker

Docker is the target container technology.

Target application images:

```text
siakad-core-api
siakad-ai
siakad-worker
```

Local infrastructure may use official container images.

---

# 45. Docker Compose

Target local infrastructure environment:

```text
PostgreSQL + pgvector
Redis
RabbitMQ
Prometheus
Grafana
Loki
Tempo
```

Application processes may be run either:

```text
native
```

or:

```text
containers
```

depending on development convenience.

Ollama may run natively on the host.

---

# 46. CI/CD

Target CI/CD platform:

```text
GitHub Actions
```

Target pipeline:

```text
Git Push
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
ECS Deploy
```

Core API and AI Service should eventually deploy independently.

---

# 47. AWS Production Architecture

```text
                                INTERNET
                                   │
                               Route 53
                                   │
                                  ACM
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
               CloudFront                      ALB
                     │                           │
                     ▼                 ┌─────────┴─────────┐
                     S3                │                   │
               React Frontend       /api/*              /ai/*
                                         │                 │
                                         ▼                 ▼
                                  ECS Fargate        ECS Fargate
                                    Core API          AI Service
                                         │                 │
                                         └────────┬────────┘
                                                  │
                          ┌───────────────────────┼──────────────────────┐
                          │                       │                      │
                          ▼                       ▼                      ▼
                  RDS PostgreSQL             ElastiCache             Amazon MQ
                    + pgvector                  Redis                RabbitMQ
                          │
                          ▼
                         S3
```

---

# 48. Amazon ECR

Amazon ECR stores production Docker images.

Potential repositories:

```text
siakad-core-api
siakad-ai
siakad-worker
```

Images should be versioned by release or commit.

---

# 49. ECS Fargate

Target runtime:

```text
Core API
AI Service
Workers
```

Fargate avoids directly managing EC2 hosts for these containers.

Each service can scale independently when needed.

---

# 50. ALB

Application Load Balancer is the target application routing layer.

Target routing:

```text
/api/*
→ Core API

/ai/*
→ AI Assistant Service
```

Each target group can have independent health status.

---

# 51. RDS PostgreSQL

Target production database:

```text
Amazon RDS PostgreSQL
```

Benefits include managed backups, recovery options, monitoring, and infrastructure management.

Prisma continues to access PostgreSQL through the configured database URL.

---

# 52. Amazon MQ

Target managed RabbitMQ:

```text
Amazon MQ for RabbitMQ
```

Used by:

```text
Core API
AI Service
Workers
```

as required by approved async workflows.

---

# 53. ElastiCache

Target managed Redis:

```text
Amazon ElastiCache
```

Used for approved cache/rate-limit/ephemeral-state use cases.

It is not the source of truth.

---

# 54. Route 53

Route 53 is the target DNS solution when AWS-managed DNS is used.

Potential domains:

```text
app.example.com
api.example.com
```

Exact DNS structure will be defined during deployment planning.

---

# 55. ACM

AWS Certificate Manager provides production TLS certificates.

Public SIAKAD traffic should use HTTPS.

---

# 56. CloudFront

CloudFront is the target CDN for the React frontend.

Target:

```text
User
 ↓
CloudFront
 ↓
S3
```

It may also contribute to production security and performance.

---

# 57. AWS WAF

AWS WAF is a later production-hardening component.

Potential purposes:

```text
rate-based blocking
managed malicious-request rules
IP restrictions
HTTP filtering
```

WAF does not replace application security.

---

# 58. CloudWatch

CloudWatch is the target AWS infrastructure monitoring solution.

Potential monitoring:

```text
ECS
ALB
RDS
Amazon MQ
ElastiCache
AWS infrastructure logs
alarms
```

The application observability stack may coexist with CloudWatch where justified.

---

# 59. Secrets Manager / SSM

Production configuration should be separated from application source.

Secrets Manager candidates:

```text
JWT secret
payment secret
external AI API keys
database credentials
```

SSM Parameter Store candidates:

```text
environment name
log level
model configuration
feature configuration
```

---

# 60. IAM

IAM must follow least privilege.

Each runtime should receive only the permissions it requires.

Example:

```text
Core API
→ required S3 / configuration access

Worker
→ required document/report storage

AI Service
→ only resources it actually needs
```

Production ECS tasks should prefer IAM Task Roles.

---

# 61. Network Boundary

Target AWS network direction:

```text
PUBLIC

CloudFront
ALB


PRIVATE

ECS internal traffic
RDS
Redis
RabbitMQ
```

PostgreSQL, Redis, and RabbitMQ should not require direct public internet access.

---

# 62. Secrets Boundary

Secrets must not live in:

```text
Git
frontend bundles
Docker images
logs
source code
```

Production secrets should be injected at runtime through trusted infrastructure.

---

# 63. Terraform

Terraform is the target Infrastructure as Code solution.

However, it is intentionally late in the roadmap.

Target progression:

```text
Understand AWS
     ↓
Deploy manually
     ↓
Stabilize resources
     ↓
Document architecture
     ↓
Terraform
```

Terraform codifies understood infrastructure.

---

# 64. Security Target

Target trust flow:

```text
User
 ↓
Authentication
 ↓
Authorization
 ↓
Core API
 ↓
Domain Service
 ↓
Data
```

For AI:

```text
User
 ↓
Authentication
 ↓
AI Service
 ↓
Approved Tool
 ↓
Core API
 ↓
Authorization
 ↓
Domain Service
```

The AI model never receives authority simply because it selected a tool.

---

# 65. Reliability Target

Target architecture should tolerate partial failure.

Examples:

```text
AI unavailable
→ Core API remains available

Redis unavailable
→ fallback where practical

Grafana unavailable
→ application remains available

Tempo unavailable
→ application remains available

RabbitMQ unavailable
→ synchronous unrelated APIs remain available
```

PostgreSQL remains critical to most Core API functionality.

---

# 66. Scalability Target

Scale only where demand requires.

Potential independent scaling:

```text
Core API
AI Service
Workers
```

Example:

```text
High AI traffic

Core API
2 tasks

AI Service
4 tasks
```

The architecture allows this without splitting the academic Core into many microservices.

---

# 67. Data Ownership

Target ownership:

```text
PostgreSQL
→ academic source of truth

S3
→ binary objects

Redis
→ ephemeral/cache

pgvector
→ semantic index

RabbitMQ
→ in-flight async messages

Loki
→ logs

Tempo
→ traces

Prometheus
→ metrics
```

Do not confuse operational stores with authoritative business data.

---

# 68. Failure Isolation

Target architecture should isolate failure domains.

Example:

```text
Hermes crashes
   ↓
AI Service affected

Core SIAKAD
   ✅ continues
```

or:

```text
Notification worker fails
   ↓
notification delayed

Student grade API
   ✅ continues
```

---

# 69. Internal Contracts

Separating AI from Core creates an internal API boundary.

Internal contracts should be:

```text
explicit
typed
documented
authorization-aware
timeout-aware
version-compatible
```

AI tools should not rely on undocumented Core implementation details.

---

# 70. Future Service Extraction

The architecture intentionally avoids premature microservices.

A Core module should only become a separate service if evidence supports it.

Possible evidence:

```text
independent scaling requirement
different runtime requirement
different availability requirement
clear ownership boundary
deployment independence need
operational evidence
```

Do not extract services because microservices appear more advanced.

---

# 71. Technologies Intentionally Excluded

The target architecture currently excludes:

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

These are architecture decisions, not statements that the technologies are bad.

They simply do not currently solve a necessary project problem.

---

# 72. Target Repository Shape

Long-term repository direction may resemble:

```text
SIAKAD/

├── AGENTS.md
├── ARCHITECTURE.md
├── BACKEND.md
├── FRONTEND.md
│
├── docs/
│   ├── TARGET-ARCHITECTURE.md
│   ├── TECHNOLOGY-ROADMAP.md
│   ├── PLANS.md
│   ├── QUALITY.md
│   ├── SECURITY.md
│   ├── RELIABILITY.md
│   │
│   ├── design-docs/
│   └── exec-plans/
│
├── client/
│
├── server/
│
├── ai-service/
│
├── workers/
│
└── infrastructure/
```

The repository should evolve toward this shape only as the relevant components are actually implemented.

---

# 73. Architecture Evolution Sequence

Target progression:

```text
Platform Foundation
       ✅
        ↓
Service Layer Cleanup
        ↓
KRS Domain Audit
        ↓
API Contract + OpenAPI
        ↓
Frontend Cleanup
        ↓
AI Assistant Foundation
        ↓
AI Tool Calling
        ↓
RAG + pgvector
        ↓
RabbitMQ + Workers
        ↓
Redis
        ↓
Observability
        ↓
Payment
        ↓
Docker
        ↓
AWS
        ↓
Production Hardening
        ↓
Terraform
```

The exact execution order is governed by the Technology Roadmap and active ExecPlans.

---

# 74. Architecture Change Policy

A new technology or architecture change should answer:

```text
What problem exists?

Why can the current architecture not solve it cleanly?

What complexity does the new technology add?

How is it tested?

How is failure handled?

How is it monitored?

How is it deployed?

How is it rolled back?
```

If these questions do not have clear answers, the change is probably premature.

---

# 75. Target Architecture Definition of Success

The target architecture is successful when SIAKAD can provide:

```text
stable Core academic features

clear domain services

secure AI integration

read-only AI tools initially

RAG over authorized documents

reliable async processing

safe caching

observable production behavior

repeatable builds

CI/CD

containerized deployments

secure AWS infrastructure

independent AI/Core scaling

controlled infrastructure cost
```

while avoiding unnecessary distributed-system complexity.

---

# 76. Final Architectural Principle

SIAKAD should evolve according to this rule:

```text
Add complexity only when the problem justifies it.
```

The Core academic system should remain understandable.

The AI Service should remain replaceable.

The database should remain authoritative.

Infrastructure should support the application rather than dictate its design.

The intended end state is:

> **A production-ready hybrid SIAKAD platform with a modular academic Core, a separately deployable AI Assistant, asynchronous workers, strong observability, and controlled AWS infrastructure.**