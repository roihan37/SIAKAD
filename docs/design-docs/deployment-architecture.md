# DEPLOYMENT ARCHITECTURE

## Purpose

This document defines the target deployment architecture for the SIAKAD platform.

It describes how the following components should eventually be deployed:

- React Frontend
- Core SIAKAD REST API
- AI Assistant Service
- Background Workers
- PostgreSQL
- pgvector
- Redis
- RabbitMQ
- Object Storage
- Observability
- CI/CD
- AWS Infrastructure

This document describes the **target deployment direction**.

It does not mean all infrastructure described here is already implemented.

Current implementation status must always be verified against the repository and active ExecPlans.

---

# 1. Deployment Principles

The deployment architecture follows these principles:

1. Keep Core SIAKAD and AI independently deployable.
2. Keep PostgreSQL as the authoritative data store.
3. Keep infrastructure private unless public access is required.
4. Do not expose Redis, RabbitMQ, or PostgreSQL directly to the internet.
5. Use containers for repeatable application deployment.
6. Use managed AWS services where they reduce operational burden.
7. Use HTTPS for all public production traffic.
8. Use IAM roles instead of long-lived AWS keys where possible.
9. Keep secrets outside source code and Docker images.
10. Introduce AWS infrastructure incrementally.
11. Preserve rollback capability.
12. Do not introduce Terraform before AWS infrastructure is understood.
13. Do not make optional AI functionality a hard dependency of Core SIAKAD.
14. Keep production model-hosting decisions separate from Node.js AI Service deployment.

---

# 2. Deployment Architecture Style

The target production architecture is:

> **Hybrid Application Deployment**

Where:

```text
Core SIAKAD API
=
independent application service

AI Assistant
=
independent application service

Workers
=
independent background processes

Frontend
=
static React application
```

This is not a full microservices platform.

---

# 3. High-Level Production Architecture

```text
                               INTERNET
                                  │
                                  ▼
                              Route 53
                                  │
                                  ▼
                         HTTPS / TLS via ACM
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
               CloudFront                     ALB
                    │                           │
                    ▼                 ┌─────────┴─────────┐
                   S3                 │                   │
             React Frontend        /api/*              /ai/*
                                        │                 │
                                        ▼                 ▼
                                ECS Fargate         ECS Fargate
                                  Core API           AI Service
                                        │                 │
                                        └────────┬────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
            RDS PostgreSQL                  ElastiCache                   Amazon MQ
              + pgvector                       Redis                     RabbitMQ
                    │
                    ▼
                   S3

                             Background Processing
                                      │
                                      ▼
                               ECS Fargate Workers
```

---

# 4. Frontend Deployment

The frontend is a React SPA built using:

```text
React
TypeScript
Vite
```

Production flow:

```text
Source
 ↓
npm build
 ↓
Static files
 ↓
Amazon S3
 ↓
CloudFront
 ↓
User
```

The frontend does not require a long-running Node.js server.

---

# 5. Frontend Build Artifact

Frontend deployment artifact includes:

```text
HTML
JavaScript
CSS
images
other static assets
```

The output of the Vite production build is deployed to S3.

The frontend build must not contain server-side secrets.

---

# 6. Frontend Environment Variables

Any variable compiled into the React application should be considered public.

Allowed examples:

```text
public API base URL

public application name

public environment marker
```

Never include:

```text
JWT signing secret

database credentials

AWS secret key

payment server secret

private AI provider key
```

inside the frontend bundle.

---

# 7. S3 Frontend Hosting

S3 stores the built React application.

The preferred production model is:

```text
CloudFront
 ↓
private or controlled S3 origin
```

rather than exposing the S3 bucket directly.

---

# 8. CloudFront

CloudFront is the target frontend CDN.

Responsibilities:

```text
static asset delivery

edge caching

HTTPS delivery

frontend performance

controlled S3 origin access
```

CloudFront should not become the Core API business gateway.

---

# 9. SPA Routing

React Router requires SPA fallback behavior.

A request such as:

```text
/students/123
```

should still serve the React application rather than producing an S3 object-not-found response.

CloudFront/S3 configuration must support SPA routing behavior.

---

# 10. Core API Deployment

The Core API is deployed as a container.

Target:

```text
Node.js
Express
TypeScript
compiled JavaScript
```

Production execution:

```text
TypeScript source
 ↓
npm run build
 ↓
dist
 ↓
Docker image
 ↓
ECR
 ↓
ECS Fargate
```

---

# 11. Core API Container

Example conceptual image:

```text
siakad-core-api:<version>
```

The image should contain:

```text
compiled application
production dependencies
runtime configuration hooks
```

It should not contain:

```text
real production secrets
local .env
AWS credentials
development-only files
```

---

# 12. AI Service Deployment

The AI Assistant Service is deployed separately from Core API.

Target:

```text
siakad-ai:<version>
```

Application stack:

```text
Node.js
Express
TypeScript
LangChain.js
```

It communicates with the model runtime and the Core API.

---

# 13. AI Service Independence

The AI Service must be independently deployable.

This allows:

```text
AI deployment
without
Core API deployment
```

and:

```text
Core API deployment
without
AI deployment
```

This reduces operational coupling.

---

# 14. AI Failure Isolation

If AI Service is unavailable:

```text
/ai/*
→ unavailable
```

while:

```text
/api/*
→ should continue functioning
```

where Core dependencies remain healthy.

The Core SIAKAD platform must not require AI availability for normal academic operations.

---

# 15. Application Load Balancer

ALB is the main backend HTTP routing layer.

Target routing:

```text
/api/*
→ Core API Target Group

/ai/*
→ AI Service Target Group
```

This provides:

```text
independent health checks

independent scaling

independent deployment

failure isolation
```

---

# 16. ALB Target Groups

Target groups:

```text
core-api-target-group

ai-service-target-group
```

Each target group has its own health check.

Example:

```text
Core API:
GET /health/ready

AI Service:
GET /health/ready
```

---

# 17. ALB Health Routing

ALB should route traffic only to healthy tasks.

Target:

```text
ECS task starts
 ↓
readiness check passes
 ↓
ALB sends traffic
```

A task that is alive but not ready should not receive production traffic.

---

# 18. HTTPS

All public production traffic must use HTTPS.

Target:

```text
User
 ↓
HTTPS
 ↓
CloudFront / ALB
```

Plain HTTP should redirect to HTTPS where appropriate.

---

# 19. ACM

AWS Certificate Manager is the target TLS certificate solution.

Potential certificates:

```text
app.example.com

api.example.com

*.example.com
```

Exact domain structure is decided during production deployment.

---

# 20. Route 53

Route 53 is the target AWS DNS solution when AWS-managed DNS is selected.

Possible architecture:

```text
app.example.com
→ CloudFront

api.example.com
→ ALB
```

Alternatively, ALB path routing may serve:

```text
/api/*
/ai/*
```

from the same backend hostname.

---

# 21. DNS Is Not Application Logic

Applications should not hardcode ALB IP addresses.

Use DNS names.

Infrastructure may change without requiring application code changes.

---

# 22. ECS Fargate

ECS Fargate is the target runtime for containerized application services.

Potential workloads:

```text
Core API

AI Service

Workers
```

Fargate removes the need to directly operate EC2 instances for these Node.js workloads.

---

# 23. ECS Service Model

Target services:

```text
ECS Cluster

├── Core API Service
├── AI Service
├── Document Worker Service
├── Report Worker Service
└── Notification Worker Service
```

Workers may also use scheduled tasks depending on their workload.

---

# 24. ECS Task Definitions

Each application type should have its own task definition.

Example:

```text
core-api-task

ai-service-task

document-worker-task
```

Task definition defines:

```text
image

CPU

memory

environment configuration

secrets

IAM role

logging

health behavior
```

---

# 25. Core API Scaling

Core API instances may scale independently.

Example:

```text
Core API Service

Task 1
Task 2
```

Future scaling may use:

```text
CPU

memory

ALB request metrics
```

Do not introduce complex autoscaling before real traffic justifies it.

---

# 26. AI Service Scaling

AI Service can scale independently from Core API.

Example:

```text
Core API
2 tasks

AI Service
4 tasks
```

if AI request load is significantly higher.

However, AI model inference capacity must also be considered separately.

---

# 27. Important AI Deployment Boundary

The AI Service and the AI model runtime are different deployment concerns.

Application:

```text
Node.js AI Service
```

Model inference:

```text
Ollama + Hermes
```

The Node.js AI Service may fit ECS Fargate well.

The model runtime may not.

---

# 28. Ollama / Hermes Production Hosting

Do not automatically assume:

```text
Ollama + Hermes
→ ECS Fargate
```

The appropriate runtime depends on:

```text
model size

RAM requirement

CPU requirement

GPU requirement

traffic

latency target

cost
```

Production model hosting requires a dedicated ExecPlan.

---

# 29. Local Model Development

Development target:

```text
Mac / Developer Machine

AI Service
 ↓
Ollama
 ↓
Hermes
```

This provides low-cost local AI development.

---

# 30. Future Model Hosting Options

Possible future production strategies may include:

```text
dedicated compute

GPU-enabled infrastructure

managed AI provider

approved cloud LLM provider
```

The choice must consider:

```text
privacy

cost

performance

operations

data policy
```

Do not select a production model-hosting platform solely for architectural symmetry.

---

# 31. ECR

Amazon ECR stores container images.

Target repositories:

```text
siakad-core-api

siakad-ai

siakad-worker
```

Images should be immutable and versioned where practical.

---

# 32. Image Tags

Prefer:

```text
Git commit SHA

release version
```

Example:

```text
siakad-core-api:a3f10c2
```

or:

```text
siakad-core-api:1.3.0
```

Avoid relying only on:

```text
latest
```

for production deployments.

---

# 33. Deployment Rollback

Versioned images allow rollback:

```text
new image
   ↓
deployment problem
   ↓
previous ECR image
   ↓
redeploy
```

The previous stable image must remain identifiable.

---

# 34. PostgreSQL Production Database

Target production database:

```text
Amazon RDS PostgreSQL
```

Application:

```text
Core API
 ↓
Prisma
 ↓
RDS PostgreSQL
```

---

# 35. PostgreSQL Remains Authoritative

RDS PostgreSQL is the source of truth for:

```text
academic data

authentication/session data where applicable

KRS

grades

attendance

tuition

payments

application metadata
```

Redis and RabbitMQ do not replace PostgreSQL.

---

# 36. pgvector

The production PostgreSQL architecture may include:

```text
pgvector
```

for AI RAG.

This allows:

```text
relational application data

and

vector embedding data
```

to remain within PostgreSQL initially.

---

# 37. RDS Network Access

RDS should normally remain inside private networking.

Target:

```text
ECS
 ↓
private network
 ↓
RDS
```

Avoid:

```text
Internet
 ↓
RDS public endpoint
```

unless there is a deliberate temporary development reason.

---

# 38. Database Credentials

Application database credentials must not be embedded in images.

Production configuration should use:

```text
Secrets Manager
```

or another approved secure mechanism.

---

# 39. RDS Backups

Production database planning must include:

```text
automated backups

retention policy

restore procedure

storage monitoring
```

A backup strategy is incomplete until restore behavior is understood.

---

# 40. Multi-AZ

Multi-AZ RDS may be considered later.

Do not enable purely because it is available.

Decision depends on:

```text
availability requirement

production importance

budget
```

Portfolio deployment may not need high-cost HA immediately.

---

# 41. Redis Deployment

Development:

```text
Docker Redis / Valkey
```

Production target:

```text
Amazon ElastiCache
```

Redis uses include:

```text
cache

rate limiting

ephemeral application state
```

---

# 42. Redis Is Not Source of Truth

Target:

```text
Redis unavailable
→ degraded performance where possible

PostgreSQL
→ still authoritative
```

Redis outage should not corrupt academic state.

---

# 43. ElastiCache Networking

ElastiCache should remain private.

Target:

```text
ECS applications
 ↓
private network
 ↓
ElastiCache
```

Do not expose Redis directly to the internet.

---

# 44. RabbitMQ Deployment

Development:

```text
RabbitMQ Docker
```

Production target:

```text
Amazon MQ for RabbitMQ
```

Use cases:

```text
document indexing

report generation

notifications

batch jobs
```

---

# 45. RabbitMQ Architecture

```text
Core API ─────┐
              │
AI Service ───┼──→ Amazon MQ
              │
              ▼
            Workers
```

RabbitMQ handles asynchronous workloads.

It is not the synchronous API gateway.

---

# 46. RabbitMQ Network

Amazon MQ should remain private where practical.

Only trusted application services and workers should access the broker.

Management interfaces should not be publicly exposed unnecessarily.

---

# 47. Worker Deployment

Background workers run independently.

Examples:

```text
Document Worker

Report Worker

Notification Worker
```

Workers may run as:

```text
ECS Fargate services
```

or task-based jobs depending on workload.

---

# 48. Worker Scaling

Workers may scale based on:

```text
queue backlog

processing duration

throughput
```

Do not autoscale before metrics and real workload justify it.

---

# 49. S3 Application Storage

S3 stores binary objects.

Potential buckets/prefixes:

```text
avatars

academic documents

payment proofs

generated reports

RAG source documents
```

PostgreSQL stores metadata and object references.

---

# 50. S3 Access

Public access depends on file type.

Private application documents should not automatically have public URLs.

Use controlled access.

Possible mechanism:

```text
pre-signed URL
```

when appropriate.

---

# 51. S3 IAM

Application tasks should receive only required S3 permissions.

Example:

```text
Core API
→ avatar/document operations

Document Worker
→ RAG source read

Report Worker
→ generated report write
```

Do not give every service unrestricted bucket administration.

---

# 52. IAM

Production AWS runtime uses IAM least privilege.

Prefer:

```text
ECS Task Role
```

for AWS service access.

Avoid static long-lived credentials inside application containers.

---

# 53. Core API Task Role

Potential permissions:

```text
specific S3 object actions

specific configuration access

specific secret retrieval
```

Do not use:

```text
AdministratorAccess
```

for the runtime application.

---

# 54. AI Service Task Role

AI Service should receive only permissions required by its architecture.

If AI Service does not access S3 directly:

```text
do not grant S3 access
```

Permissions should follow actual requirements.

---

# 55. Worker Task Roles

Each worker can have narrower access.

Example:

```text
Document Worker
→ read AI documents

Report Worker
→ write generated reports
```

This reduces blast radius.

---

# 56. Secrets Manager

Secrets Manager is the target store for sensitive production configuration.

Examples:

```text
JWT signing secret

database credentials

payment gateway secret

external LLM API key
```

Secrets should be injected at runtime.

---

# 57. SSM Parameter Store

Parameter Store may hold operational configuration.

Examples:

```text
APP_ENV

LOG_LEVEL

AI_MODEL

CORE_API_URL

feature flags
```

Sensitive values may use secure storage where appropriate.

---

# 58. Secret Rotation

Production architecture should eventually support secret rotation.

A secret change should not require editing application source code.

---

# 59. Environment Configuration

Configuration should be separated by environment.

Example:

```text
development

test

staging

production
```

Do not mix production credentials into local development configuration.

---

# 60. Networking Target

Conceptual AWS network:

```text
                         INTERNET
                            │
                 ┌──────────┴──────────┐
                 │                     │
             CloudFront               ALB
                                       │
                               Public Entry Layer
                                       │
                           ┌───────────┴───────────┐
                           │                       │
                       Core API                AI Service
                           │                       │
                           └───────────┬───────────┘
                                       │
                                Private Layer
              ┌────────────────────────┼───────────────────────┐
              │                        │                       │
             RDS                 ElastiCache               Amazon MQ
```

Exact VPC/subnet design is deferred to AWS deployment ExecPlan.

---

# 61. Public Components

Potential public-facing components:

```text
CloudFront

ALB

Route 53 DNS
```

Backend containers themselves should generally not require direct public IP exposure if ALB can reach them privately.

---

# 62. Private Components

Prefer private network placement for:

```text
RDS PostgreSQL

ElastiCache

Amazon MQ

workers

internal infrastructure
```

---

# 63. Security Groups

Security groups should restrict communication.

Concept:

```text
Internet
→ ALB : HTTPS

ALB
→ Core API ECS : application port

ALB
→ AI ECS : application port

Core API ECS
→ RDS : PostgreSQL port

approved services
→ Redis / RabbitMQ
```

Avoid broad:

```text
0.0.0.0/0
```

access to private infrastructure.

---

# 64. CI/CD Platform

Target CI/CD:

```text
GitHub Actions
```

Pipeline direction:

```text
git push
 ↓
GitHub Actions
 ↓
npm ci
 ↓
lint
 ↓
typecheck
 ↓
tests
 ↓
build
 ↓
Docker build
 ↓
ECR push
 ↓
ECS deploy
```

---

# 65. CI Quality Gate

Deployment must not occur before validation succeeds.

Expected:

```text
lint PASS

typecheck PASS

tests PASS

build PASS
```

Container build follows application validation.

---

# 66. Independent Pipelines

Core API and AI Service should eventually have independent build/deployment triggers where practical.

Example:

```text
server/**
→ Core API pipeline

ai-service/**
→ AI pipeline
```

Do not deploy every service when an unrelated component changes unless simplicity initially justifies a shared pipeline.

---

# 67. Worker Pipeline

Worker images should be independently buildable when workers become separate deployable processes.

Example:

```text
workers/**
→ Worker image
```

---

# 68. CI AWS Authentication

CI should avoid permanent AWS access keys where possible.

Target direction:

```text
GitHub Actions
 ↓
OIDC / short-lived AWS identity
 ↓
AWS
```

If temporary static credentials are used during early learning, they should eventually be replaced.

---

# 69. GitHub Secrets

CI-specific secrets belong in secure GitHub/AWS secret management.

Never print them in workflow logs.

---

# 70. Deployment Strategy

Initial ECS deployments may use rolling updates.

Concept:

```text
old tasks
+
new tasks
      ↓
new tasks healthy
      ↓
old tasks removed
```

Readiness endpoints are essential.

---

# 71. Zero Downtime Direction

Absolute zero downtime is not required for every portfolio stage.

Target behavior:

```text
minimize avoidable downtime
```

using:

```text
healthy replacement tasks

ALB health checks

graceful shutdown
```

---

# 72. Graceful Shutdown

Containers must respond to termination signals.

Core API target:

```text
SIGTERM
 ↓
stop new requests
 ↓
finish active requests
 ↓
disconnect dependencies
 ↓
exit
```

Same principle applies to AI Service and workers.

---

# 73. Database Migration Deployment

Database migration should be explicit.

Do not blindly run destructive schema changes on every container startup.

Migration strategy must consider:

```text
backward compatibility

old/new application overlap

rollback

data loss
```

---

# 74. Expand and Contract

For risky schema evolution:

```text
1. Add new schema

2. Deploy compatible code

3. Migrate usage/data

4. Remove old schema later
```

Avoid breaking old tasks during rolling deployment.

---

# 75. Health Architecture

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

Liveness and readiness must remain distinct.

---

# 76. Liveness

Liveness answers:

```text
Is the process alive?
```

It should not perform expensive dependency checks.

---

# 77. Readiness

Readiness answers:

```text
Can the service receive production traffic?
```

Core API may depend on PostgreSQL readiness.

AI Service may depend on model availability depending on its deployment design.

---

# 78. AI Readiness Does Not Affect Core

Even if:

```text
AI Service readiness = failing
```

Core API target group should remain independently healthy.

This is one of the key advantages of ALB path-based separation.

---

# 79. Observability in AWS

Initial AWS infrastructure visibility uses:

```text
CloudWatch
```

Potential sources:

```text
ECS

ALB

RDS

Amazon MQ

ElastiCache
```

Application observability remains:

```text
Pino

Prometheus

OpenTelemetry
```

as introduced through the roadmap.

---

# 80. CloudWatch Logs

Production ECS container logs may be sent to CloudWatch initially.

This provides a simpler production starting point than immediately operating Loki in AWS.

---

# 81. CloudWatch Metrics

Infrastructure metrics may include:

```text
ECS CPU

ECS memory

ALB request rate

ALB target health

ALB errors

RDS CPU

RDS connections

Amazon MQ metrics

ElastiCache metrics
```

---

# 82. Application Observability vs CloudWatch

Use each for its strength.

Example:

```text
CloudWatch
→ AWS infrastructure

Prometheus
→ application metrics

OpenTelemetry
→ distributed application traces
```

Do not duplicate everything without a reason.

---

# 83. Production Logging Progression

Practical progression:

```text
Phase 1
Pino → CloudWatch Logs

Phase 2
centralized application log strategy

Phase 3
Loki if operationally justified
```

The local learning stack can still use Loki earlier.

---

# 84. WAF

AWS WAF is a later production-hardening component.

Potential placement:

```text
Internet
 ↓
WAF
 ↓
CloudFront / ALB
```

Potential rules:

```text
rate-based rules

managed threat rules

IP restrictions

malicious request filtering
```

---

# 85. WAF Is Not Application Authorization

WAF does not replace:

```text
JWT

RBAC

ownership checks

request validation
```

Application security remains mandatory.

---

# 86. Rate Limiting

Application-level rate limiting may use Redis.

Important endpoints:

```text
login

AI chat

password reset

file upload

payment operations
```

WAF and application rate limiting may complement each other.

---

# 87. Production Backup Strategy

At minimum:

```text
RDS automated backups

defined retention

restore understanding
```

Potential later:

```text
manual snapshots before high-risk changes
```

---

# 88. Application Rollback

Rollback layers:

```text
Application:
previous ECR image

Infrastructure:
previous configuration

Database:
migration recovery strategy
```

Database rollback is often harder than application rollback.

Design schema changes carefully.

---

# 89. Failed Deployment

If new tasks fail health checks:

```text
new version
❌ unhealthy
```

ALB should avoid sending production traffic to them.

Deployment should retain or restore stable tasks according to ECS configuration.

---

# 90. Deployment Version Metadata

Applications should expose or log deployment metadata where practical.

Potential:

```text
service version

Git commit SHA

environment
```

This helps incident investigation.

---

# 91. Local Development Deployment

Local development should remain lighter than production.

Recommended:

```text
Native:

React
Core API
AI Service
Ollama


Docker Compose:

PostgreSQL + pgvector
RabbitMQ
Redis
Prometheus
Grafana
Loki
Tempo
```

Not every infrastructure service needs to run at all times.

---

# 92. Why Infrastructure-Only Docker First

Running application code natively initially makes:

```text
debugging

hot reload

learning

Codex-assisted development
```

simpler.

Docker is still valuable for:

```text
PostgreSQL

RabbitMQ

Redis

observability
```

because those services benefit from repeatable setup.

---

# 93. Production Containerization

Before AWS deployment, application services should have production-ready Docker images.

Target:

```text
Core API Image

AI Service Image

Worker Image
```

Each must support:

```text
production startup

health behavior

graceful shutdown

runtime configuration
```

---

# 94. Production Docker Image Quality

Images should:

```text
build reproducibly

avoid dev dependencies where unnecessary

avoid secret files

use compiled production output

have predictable startup commands
```

Avoid huge images without reason.

---

# 95. Infrastructure Cost Awareness

Managed AWS services add recurring cost.

Potential higher-cost components include:

```text
ECS continuously running tasks

RDS

Amazon MQ

ElastiCache

NAT Gateway

CloudWatch data volume
```

Do not deploy every target service permanently only because it exists in the architecture document.

---

# 96. Portfolio Deployment Strategy

For a portfolio environment, a lean AWS architecture may be preferable.

Potential first production subset:

```text
S3

CloudFront

ECR

ECS Core API

ALB

RDS

ACM
```

AI, RabbitMQ, Redis, WAF, and full observability may remain local until needed.

---

# 97. Full Target Production

When all roadmap capabilities are justified:

```text
Frontend:
S3 + CloudFront

Core:
ECS Fargate

AI:
ECS Fargate AI application

Data:
RDS PostgreSQL + pgvector

Cache:
ElastiCache

Async:
Amazon MQ + ECS Workers

Objects:
S3

Routing:
ALB

DNS:
Route 53

TLS:
ACM

Security:
IAM + Secrets + WAF

Monitoring:
CloudWatch + application observability
```

Model-hosting infrastructure remains a separate decision.

---

# 98. Terraform

Terraform is the target IaC technology.

It comes after AWS deployment is understood.

Sequence:

```text
Manual AWS learning
       ↓
Working deployment
       ↓
Stable architecture
       ↓
Documented resources
       ↓
Terraform
```

---

# 99. Why Terraform Is Later

Terraform introduces another abstraction.

Before using it, the engineer should understand:

```text
ECS

ECR

RDS

ALB

VPC

IAM

S3

Route 53
```

Otherwise Terraform configuration becomes copied infrastructure rather than understood infrastructure.

---

# 100. Target Infrastructure Repository

Later:

```text
infrastructure/

├── environments/
│   ├── staging/
│   └── production/
│
├── modules/
│   ├── network/
│   ├── ecs/
│   ├── rds/
│   ├── alb/
│   ├── storage/
│   ├── mq/
│   └── cache/
│
└── README.md
```

Do not create this structure until Terraform work begins.

---

# 101. Deployment Environments

Long-term:

```text
development

test

staging

production
```

A portfolio project may initially use:

```text
development

production
```

Do not create unnecessary AWS environments purely for architecture appearance.

---

# 102. Staging

Staging becomes useful when:

```text
production risk increases

payment integration exists

AI write actions exist

database migrations become complex
```

It is not mandatory during early development.

---

# 103. Production Data Isolation

Never use real production database credentials in local development.

Production data should remain isolated from development environments.

---

# 104. Seed Data

Development/test environments may use seed data.

Production deployment must not automatically run development seed logic.

---

# 105. Service-to-Service Networking

AI Service → Core API communication should use a stable internal endpoint where practical.

Target:

```text
AI Service
 ↓
Core API
```

Avoid creating unnecessary internet round trips between services within the same AWS environment.

Exact service discovery/routing method is deferred to AWS implementation.

---

# 106. Internal Service Authentication

The production AI-to-Core trust mechanism must be defined before deployment.

Requirements:

```text
trusted service identity

end-user identity propagation

public clients cannot forge internal identity

Core API remains authorization authority
```

Do not rely on plain arbitrary internal headers.

---

# 107. RabbitMQ Service Authentication

Applications connecting to Amazon MQ should use dedicated credentials/permissions appropriate to their responsibility.

Avoid sharing one broad broker credential across all environments.

---

# 108. Redis Authentication

ElastiCache security should rely on:

```text
private networking

appropriate authentication/encryption options

security groups
```

Do not expose Redis publicly.

---

# 109. Database Connection Pooling

Production deployment should monitor database connection usage.

Scaling ECS tasks increases total possible connections.

Example:

```text
Core API tasks ↑
→ Prisma pools ↑
→ database connections ↑
```

RDS sizing must account for application concurrency.

---

# 110. Scaling Is Not Free

Adding application instances may increase load on:

```text
PostgreSQL

Redis

RabbitMQ

external providers
```

Scaling one component does not automatically scale the whole system.

Measure before increasing capacity.

---

# 111. Multi-Service Version Compatibility

Core API and AI Service deploy independently.

Therefore internal API contracts must remain compatible during rollout.

Avoid:

```text
deploy Core breaking change
↓
old AI Service immediately fails
```

Use backward-compatible internal API evolution.

---

# 112. Queue Version Compatibility

Producers and workers may briefly run different versions.

Queue messages should support versioning where needed.

Example:

```json
{
  "version": 1,
  "jobId": "...",
  "documentId": "..."
}
```

---

# 113. Production Deployment Order

Recommended first AWS progression:

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
AI Service deployment

M10
Amazon MQ

M11
Workers

M12
ElastiCache

M13
CloudWatch hardening
```

Do not implement all milestones in one change.

---

# 114. AWS Deployment ExecPlan

AWS work should use:

```text
docs/exec-plans/active/aws-production-deployment.md
```

Each AWS capability should be a milestone.

Do not ask Codex:

```text
Deploy everything to AWS.
```

---

# 115. Container Deployment ExecPlan

Before AWS, use:

```text
docs/exec-plans/active/production-containerization.md
```

Possible milestones:

```text
Core API Dockerfile

AI Dockerfile

Worker Dockerfile

local image validation

health validation

shutdown validation
```

---

# 116. Model Hosting ExecPlan

Production AI model hosting should have a separate plan:

```text
docs/exec-plans/active/ai-model-production-hosting.md
```

It should compare:

```text
self-hosted Ollama

GPU compute

managed AI provider

cost

privacy

latency

operations
```

Do not couple this decision to ordinary ECS Node.js deployment.

---

# 117. Deployment Security Checklist

Before public production:

```text
HTTPS enabled

RDS not unnecessarily public

Redis private

RabbitMQ private

secrets not embedded

IAM least privilege

frontend contains no secrets

ALB routes correctly

private files protected

health endpoints safe

logs reviewed
```

---

# 118. Deployment Reliability Checklist

Before public production:

```text
production build passes

containers start

health checks pass

graceful shutdown works

database migration plan exists

rollback image exists

database backups configured

timeout behavior exists

dependency failures handled
```

---

# 119. Deployment Quality Gate

Before deployment:

```text
lint
✅

typecheck
✅

tests
✅

build
✅

Docker build
✅

container runtime validation
✅
```

Do not deploy code simply because Docker build succeeds.

---

# 120. Infrastructure Definition of Done

An infrastructure milestone is complete when applicable conditions pass:

```text
Resource created                    ✅

Purpose documented                  ✅

Security reviewed                   ✅

Network access reviewed             ✅

Secrets handled correctly           ✅

Health behavior validated           ✅

Failure behavior understood         ✅

Monitoring exists                   ✅

Rollback understood                 ✅

Cost impact understood              ✅

Documentation updated               ✅
```

---

# 121. Technologies Intentionally Not Used

Current deployment architecture does not require:

```text
Kubernetes

EKS

Kafka

service mesh

full microservices
```

Do not introduce them unless future evidence demonstrates a real need.

---

# 122. Why No Kubernetes

Current deployment contains a manageable number of services:

```text
Core API

AI Service

Workers
```

ECS Fargate provides sufficient initial orchestration without adding Kubernetes operational complexity.

---

# 123. Why No Full Microservices

Core academic modules stay inside one Core API.

Deployment independence is currently needed mainly for:

```text
AI

Workers
```

Do not create separate deployment units for every domain solely to demonstrate microservices.

---

# 124. Deployment Target Summary

Frontend:

```text
React
 ↓
S3
 ↓
CloudFront
```

Public routing:

```text
Route 53
 ↓
ACM
 ↓
ALB
```

Backend:

```text
/api/*
→ ECS Core API

/ai/*
→ ECS AI Service
```

Data:

```text
RDS PostgreSQL + pgvector
```

Cache:

```text
ElastiCache
```

Async:

```text
Amazon MQ
 ↓
ECS Workers
```

Storage:

```text
S3
```

Containers:

```text
ECR
```

Monitoring:

```text
CloudWatch
+
application observability
```

Security:

```text
IAM
Secrets Manager / SSM
WAF later
```

Infrastructure as Code:

```text
Terraform later
```

---

# 125. Final Deployment Principle

The deployment architecture should allow each major runtime component to fail, deploy, and scale independently where that independence provides real value.

The intended production direction is:

```text
Frontend
        ↓
CloudFront / S3

Core API
        ↓
ECS Fargate
        ↓
RDS

AI Service
        ↓
ECS Fargate
        ↓
Model Runtime
        ↓
Core API Tools

Async Work
        ↓
Amazon MQ
        ↓
Workers

Cache
        ↓
ElastiCache
```

The final rule is:

> **Deploy the simplest infrastructure that safely supports the current application, and introduce managed services only when the corresponding application capability actually exists.**