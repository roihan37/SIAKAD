# OBSERVABILITY ARCHITECTURE

## Purpose

This document defines the target observability architecture for the SIAKAD platform.

Observability should make it possible to answer questions such as:

- Is the system healthy?
- Which endpoint is slow?
- Why is an API returning 500?
- Which AI tool is failing?
- Is Ollama causing AI latency?
- Is the Core API or AI Service responsible for a failure?
- Are RabbitMQ jobs accumulating?
- Is Redis actually improving performance?
- Can one user request be followed across multiple services?
- Can a production incident be investigated without guessing?

The observability stack must support the target hybrid architecture:

> **Core SIAKAD REST API + Separate AI Assistant Service + Workers + Infrastructure Services**

Observability must be introduced incrementally.

It should not become a hard dependency for core academic functionality.

---

# 1. Observability Principles

The project follows these principles:

1. Observe real operational questions.
2. Avoid telemetry that has no diagnostic value.
3. Do not expose sensitive academic or financial data.
4. Keep telemetry failure isolated from business functionality.
5. Use structured logs.
6. Use metrics for system behavior and trends.
7. Use distributed traces for request flow across services.
8. Propagate correlation identifiers.
9. Avoid high-cardinality metrics.
10. Add observability progressively.
11. Prefer actionable alerts over noisy alerts.
12. Do not introduce the entire observability stack at once.

---

# 2. Observability Model

The target observability model has three primary signals:

```text
Logs
Metrics
Traces
```

They answer different questions.

---

# 3. Logs

Logs provide detailed event context.

Examples:

```text
A request failed.

A user attempted a forbidden action.

An AI tool call returned an error.

A RabbitMQ worker failed to process a message.
```

Logs are best for:

```text
What happened?

What error occurred?

What context surrounded the failure?
```

Target logging technology:

```text
Pino
```

Future centralized storage:

```text
Loki
```

Visualization/search:

```text
Grafana
```

---

# 4. Metrics

Metrics provide numerical system behavior over time.

Examples:

```text
How many requests per minute?

How many 500 errors?

How long are AI requests taking?

How many RabbitMQ jobs failed?

What is the cache hit rate?
```

Target metrics technology:

```text
Prometheus
```

Visualization:

```text
Grafana
```

---

# 5. Traces

Distributed traces show the path of one request across multiple services.

Example:

```text
User
 ↓
AI Service
 ↓
Hermes
 ↓
Tool
 ↓
Core API
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

Tracing helps answer:

```text
Where did this request spend its time?

Which service failed?

Which tool caused the delay?
```

Target instrumentation:

```text
OpenTelemetry
```

Target trace backend:

```text
Tempo
```

Visualization:

```text
Grafana
```

---

# 6. Target Observability Stack

```text
                       SIAKAD SERVICES
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
            LOGS            METRICS          TRACES
             │                │                │
             ▼                ▼                ▼
            Pino          Prometheus      OpenTelemetry
             │                                 │
             ▼                                 ▼
            Loki                              Tempo
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                           Grafana
```

---

# 7. Current State

Current implemented observability foundation includes:

```text
Pino structured logging
request IDs
health endpoints
centralized error handling
```

Future components:

```text
Prometheus
Grafana
Loki
OpenTelemetry
Tempo
alerting
```

Future technologies must not be treated as implemented until they actually exist in the repository.

---

# 8. Implementation Sequence

Recommended sequence:

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
Cross-signal correlation
  ↓
Alerting
```

Do not start with all tools simultaneously.

---

# 9. Why Pino First

Logs are the simplest observability signal already available in the application.

Pino should remain the application logging standard.

Target services using Pino:

```text
Core API

AI Service

Workers
```

All application logs should use structured metadata.

---

# 10. Structured Logging

Prefer:

```json
{
  "service": "core-api",
  "requestId": "req-123",
  "method": "GET",
  "route": "/api/students",
  "statusCode": 200,
  "durationMs": 45
}
```

Avoid unstructured strings such as:

```text
"request finished successfully"
```

without machine-readable context.

---

# 11. Standard Log Fields

Recommended common fields:

```text
service

environment

requestId

traceId

method

route

statusCode

durationMs

errorCode

userRole

jobId

toolName
```

Only add fields that provide diagnostic value.

---

# 12. Service Name

Every deployable process should identify itself.

Examples:

```text
core-api

ai-service

document-worker

report-worker

notification-worker
```

This becomes especially important once logs are centralized.

---

# 13. Request ID

Every HTTP request should have:

```text
requestId
```

Example flow:

```text
React
 ↓
AI Service
 requestId=abc
 ↓
Core API
 requestId=abc
```

Where practical, propagate the request ID across service boundaries.

Request IDs are for correlation, not authorization.

---

# 14. Trace ID

After OpenTelemetry is introduced:

```text
traceId
```

becomes the primary distributed correlation identifier.

Logs should include trace ID where practical.

Target:

```text
requestId
+
traceId
```

both available during incident investigation.

---

# 15. Logging Levels

Use log levels intentionally.

Recommended semantics:

```text
trace
Very detailed development diagnostics.

debug
Developer diagnostic information.

info
Normal meaningful operational event.

warn
Unexpected but recoverable condition.

error
Operation failed or requires investigation.

fatal
Process cannot continue safely.
```

Do not log every normal event as an error.

---

# 16. INFO Logging

Examples:

```text
service startup

service shutdown

HTTP request completion

worker job completion

document indexing completion
```

Avoid excessive INFO logs that provide no operational value.

---

# 17. WARN Logging

Examples:

```text
Redis temporarily unavailable

retryable RabbitMQ reconnect

deprecated API path used

AI response exceeded expected latency
```

Warning means something abnormal occurred but operation may continue.

---

# 18. ERROR Logging

Examples:

```text
database operation failed

AI tool execution failed

worker job permanently failed

payment webhook processing failed
```

Errors should contain enough metadata for investigation without exposing sensitive values.

---

# 19. Error Logging

Recommended:

```json
{
  "level": "error",
  "service": "core-api",
  "requestId": "req-123",
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "Failed to process request"
}
```

Detailed stack information may exist in protected application logs.

Do not expose stack traces to clients.

---

# 20. Sensitive Logging Rules

Never intentionally log:

```text
passwords

JWT access tokens

refresh tokens

API keys

AWS credentials

database passwords

payment secrets
```

Be careful with:

```text
student grades

tuition information

AI prompts

AI tool results

request bodies

payment payloads
```

Prefer metadata rather than raw sensitive content.

---

# 21. Pino Redaction

Pino redaction should protect common sensitive fields.

Candidate fields:

```text
authorization

cookie

password

token

refreshToken

secret

apiKey
```

Redaction supplements safe logging practices.

It does not replace them.

---

# 22. Logging Failure

Logging must never cause the intended application response to fail.

Especially inside:

```text
global error handler
```

If the logger fails unexpectedly, the application should still attempt to return the correct safe HTTP error.

---

# 23. Prometheus

Prometheus is the target metrics system.

The application should eventually expose:

```text
/metrics
```

using the Prometheus exposition format.

This endpoint is operational infrastructure, not a normal JSON REST resource.

---

# 24. Initial HTTP Metrics

The first metrics should be simple and useful.

Recommended:

```text
http_requests_total

http_request_duration_seconds

http_errors_total
```

---

# 25. HTTP Request Counter

Example concept:

```text
http_requests_total{
  service="core-api",
  method="GET",
  route="/api/students",
  status="200"
}
```

Do not use raw full URL values that include dynamic IDs.

Bad:

```text
/api/students/123
/api/students/456
/api/students/789
```

Prefer route templates:

```text
/api/students/:id
```

---

# 26. HTTP Duration

Use histogram-style metrics for latency.

Example:

```text
http_request_duration_seconds
```

Useful dimensions may include:

```text
service
method
route
status
```

Keep labels bounded.

---

# 27. Error Metrics

Example:

```text
http_errors_total
```

Possible labels:

```text
service
route
status
errorCode
```

Only use `errorCode` if its values are controlled and bounded.

---

# 28. High Cardinality

Do not use unbounded values as Prometheus labels.

Bad:

```text
studentId

userId

requestId

conversationId

email

full URL
```

These can create huge numbers of time series.

Good:

```text
service

route

method

status

role

tool

queue
```

when values are controlled.

---

# 29. AI Metrics

Future AI Service metrics should include:

```text
ai_requests_total

ai_request_duration_seconds

ai_errors_total

ai_tool_calls_total

ai_tool_errors_total

ai_provider_errors_total
```

---

# 30. AI Request Metrics

Useful dimensions may include:

```text
model

role

status
```

Avoid:

```text
userId

conversationId
```

---

# 31. AI Latency

AI latency should be broken down when possible.

Useful measurements:

```text
total AI request duration

time to first token

LLM inference duration

tool execution duration

RAG retrieval duration
```

This helps distinguish:

```text
model slow

vs

Core API slow

vs

database slow
```

---

# 32. AI Tool Metrics

Example:

```text
ai_tool_calls_total{
  tool="get_my_grades",
  status="success"
}
```

and:

```text
ai_tool_errors_total{
  tool="get_my_grades",
  error="timeout"
}
```

Do not include user identities.

---

# 33. Future Cloud LLM Metrics

If cloud LLMs are introduced later, consider:

```text
ai_input_tokens_total

ai_output_tokens_total

ai_provider_requests_total

ai_estimated_cost
```

Only implement cost metrics when actual cloud usage exists.

---

# 34. RabbitMQ Metrics

Once RabbitMQ exists, useful application-level metrics include:

```text
worker_jobs_total

worker_job_failures_total

worker_job_duration_seconds

worker_retries_total
```

Infrastructure-level broker metrics may separately expose:

```text
queue depth

consumer count

message rates
```

---

# 35. Queue Backlog

Queue depth is an important operational signal.

Example:

```text
ai.document.index
```

If the queue continually grows:

```text
producer rate
>
consumer processing rate
```

This may indicate:

```text
worker too slow

worker unavailable

dependency failure

insufficient worker capacity
```

---

# 36. Redis Metrics

Once Redis is introduced, useful metrics may include:

```text
cache_hits_total

cache_misses_total

cache_errors_total
```

This allows the team to answer:

```text
Is Redis actually useful?
```

rather than assuming it improves performance.

---

# 37. Cache Hit Ratio

Concept:

```text
cache hits
───────────
hits + misses
```

A low cache hit ratio may indicate:

```text
bad cache key design

TTL too short

wrong use case
```

Do not optimize only for a high ratio if stale data risk increases.

---

# 38. Database Metrics

Application-level database signals may include:

```text
query duration

database errors

connection failures
```

Do not expose raw SQL text as metric labels.

Infrastructure-level RDS metrics will later complement application metrics.

---

# 39. Health vs Metrics

Health endpoints answer:

```text
Can this service serve traffic now?
```

Metrics answer:

```text
How has the service behaved over time?
```

Do not use metrics as a replacement for readiness.

Do not make health endpoints expensive monitoring endpoints.

---

# 40. Grafana

Grafana is the visualization layer.

It should combine:

```text
Prometheus metrics

Loki logs

Tempo traces
```

into operational dashboards.

Grafana itself should not become an application dependency.

---

# 41. First Grafana Dashboard

The first dashboard should be:

```text
Core API Overview
```

Recommended panels:

```text
request rate

error rate

request latency

5xx count

health status
```

Avoid building dozens of dashboards before one is actually useful.

---

# 42. AI Dashboard

Later:

```text
AI Assistant Overview
```

Potential panels:

```text
AI requests

AI error rate

AI latency

tool calls

tool failures

provider failures

time to first token
```

---

# 43. Worker Dashboard

Later:

```text
Worker Overview
```

Potential panels:

```text
jobs processed

jobs failed

retry count

job duration

queue backlog
```

---

# 44. Redis Dashboard

Potential panels:

```text
cache hits

cache misses

cache error rate

Redis availability
```

Do not create a Redis dashboard before Redis has a real use case.

---

# 45. Loki

Loki is the target centralized log backend.

Target flow:

```text
Core API ─────┐
              │
AI Service ───┼→ Pino Logs
              │
Workers ──────┘
                    ↓
                  Loki
                    ↓
                 Grafana
```

---

# 46. Loki Purpose

Loki enables centralized investigation.

Example questions:

```text
Show all logs for requestId abc.

Show Core API errors in the last hour.

Show failures from document-worker.

Show all AI tool failures.
```

This is more useful than inspecting separate local log files.

---

# 47. Log Labels

Loki labels should also avoid unbounded cardinality.

Good candidates:

```text
service

environment

level
```

Avoid using:

```text
requestId

userId

studentId
```

as permanent labels.

These should remain searchable log fields instead.

---

# 48. OpenTelemetry

OpenTelemetry is the target instrumentation standard.

It should eventually instrument:

```text
Core API

AI Service

Workers

HTTP client calls

LLM calls

RabbitMQ publish/consume
```

Use standard instrumentation where practical before custom instrumentation.

---

# 49. Trace Structure

Example AI trace:

```text
POST /ai/chat
│
├── authenticate
│
├── llm.invoke
│
├── tool.get_my_grades
│    │
│    └── GET Core API /api/me/grades
│          │
│          ├── authorization
│          ├── StudentAcademicService
│          └── Prisma
│
└── llm.final_response
```

This trace can show exactly where latency occurred.

---

# 50. Tempo

Tempo is the target distributed trace backend.

Flow:

```text
Application
    ↓
OpenTelemetry
    ↓
Tempo
    ↓
Grafana
```

Tempo becomes valuable once a request crosses multiple runtime boundaries.

---

# 51. Why Tempo Is Later

Before AI Service and workers exist, Core SIAKAD is largely a single backend application.

In that state:

```text
Pino
+
Prometheus
```

provide much of the required visibility.

Tempo becomes more valuable when flows become:

```text
AI Service
→ Core API
→ PostgreSQL
```

or:

```text
Core API
→ RabbitMQ
→ Worker
```

Therefore tracing is intentionally later in the roadmap.

---

# 52. Trace Context Propagation

Future trace context should propagate across:

```text
HTTP

RabbitMQ

workers
```

Example:

```text
AI request trace
      ↓
Core API
      ↓
RabbitMQ job
      ↓
Worker
```

Where technically appropriate, these operations should be correlatable.

---

# 53. Request ID vs Trace ID

`requestId` is application-level correlation.

`traceId` is distributed tracing correlation.

Both may coexist.

Example:

```text
requestId
→ easier application/support reference

traceId
→ entire distributed execution path
```

Do not remove request IDs merely because OpenTelemetry exists.

---

# 54. Trace Attributes

Useful bounded attributes:

```text
service.name

http.method

http.route

http.status_code

ai.model

ai.tool

messaging.destination
```

Avoid sensitive values.

---

# 55. Sensitive Trace Data

Do not put these into trace attributes by default:

```text
JWT

password

full AI prompt

student grades

payment data

document content
```

Tracing should describe execution, not copy private payloads.

---

# 56. AI Model Tracing

AI spans may eventually include:

```text
model name

provider

duration

success/failure

tool count
```

Potentially:

```text
input/output token count
```

for providers where those values exist.

Do not automatically record full prompts.

---

# 57. RAG Tracing

Potential RAG spans:

```text
embedding generation

vector retrieval

document filtering

LLM answer generation
```

Useful metadata:

```text
retrieved chunk count

embedding model

retrieval duration
```

Avoid recording raw document contents.

---

# 58. RabbitMQ Tracing

Future trace path:

```text
Core API
 ↓
publish message
 ↓
RabbitMQ
 ↓
consume message
 ↓
Worker
```

Trace context should be propagated in message metadata when OpenTelemetry support is introduced.

---

# 59. Observability Failure Isolation

The following failures should not normally stop SIAKAD:

```text
Grafana unavailable

Loki unavailable

Tempo unavailable

Prometheus unavailable
```

Application functionality should continue where practical.

Telemetry must not become a business-critical dependency.

---

# 60. Telemetry Export Failure

If telemetry cannot be exported:

```text
application operation
✅ should generally continue
```

Telemetry failure may be logged or counted locally.

Avoid blocking user requests while waiting indefinitely for an observability backend.

---

# 61. Metrics Endpoint Security

`/metrics` can reveal operational information.

Production exposure should be controlled.

It does not necessarily need to be publicly accessible through ALB.

Production infrastructure may allow only trusted monitoring systems to reach it.

---

# 62. Grafana Security

Production Grafana must require authentication.

Do not expose operational dashboards publicly.

Dashboards may reveal:

```text
internal routes

service names

failure patterns

infrastructure details
```

---

# 63. Loki Security

Central logs may contain sensitive operational metadata.

Loki access should be restricted.

Retention should be intentional.

---

# 64. Tempo Security

Trace data exposes internal service architecture.

Tempo should not be publicly accessible.

Trace attributes must follow the same sensitive-data rules as logs.

---

# 65. Development Environment

Target local observability infrastructure may use Docker Compose.

Example:

```text
Docker Compose

├── Prometheus
├── Grafana
├── Loki
└── Tempo
```

Application processes may still run natively.

This allows observability to be learned without containerizing the entire project first.

---

# 66. Production AWS Observability

AWS production introduces:

```text
CloudWatch
```

CloudWatch may provide:

```text
ECS metrics

ALB metrics

RDS metrics

Amazon MQ metrics

ElastiCache metrics

infrastructure logs

alarms
```

CloudWatch complements application observability.

It does not automatically replace:

```text
Pino

Prometheus

OpenTelemetry
```

---

# 67. Avoid Unnecessary Duplication

Do not duplicate every telemetry signal across every monitoring platform without a reason.

Example:

```text
CloudWatch
+
Prometheus
+
Loki
+
Tempo
```

should each have a clear purpose.

Production architecture may initially use simpler CloudWatch coverage before reproducing the full local observability stack.

---

# 68. Production Strategy

A practical production progression may be:

```text
Phase 1

CloudWatch Logs
CloudWatch Metrics
CloudWatch Alarms

        ↓

Phase 2

Application Prometheus metrics

        ↓

Phase 3

OpenTelemetry distributed tracing

        ↓

Phase 4

Additional Grafana/Loki/Tempo
only where justified
```

The full local learning stack does not have to be immediately self-hosted in AWS.

---

# 69. Alerting Philosophy

Alerts should indicate actionable problems.

Good alert:

```text
Core API 5xx rate above threshold for 5 minutes.
```

Good alert:

```text
Document indexing queue backlog growing for 15 minutes.
```

Bad alert:

```text
One request returned 500.
```

Individual errors belong primarily in logs.

Persistent abnormal behavior belongs in alerts.

---

# 70. Initial Alerts

Future initial production alerts should focus on:

```text
service unavailable

readiness failures

high 5xx rate

very high latency

database unavailable
```

Then later:

```text
AI provider failures

RabbitMQ backlog

worker failure rate

Redis failure

payment webhook failure rate
```

---

# 71. Alert Severity

Potential model:

```text
P0 / Critical
Major outage, security issue, data-integrity risk.

P1 / High
Important degradation requiring prompt investigation.

P2 / Warning
Problem exists but service largely functions.

P3 / Informational
Operational observation.
```

Do not mark routine noise as critical.

---

# 72. Service Level Indicators

Potential future SLIs:

```text
availability

request success rate

request latency

AI successful response rate

AI time to first token

job success rate
```

Formal SLOs are not required during early development.

They may be introduced after real production behavior exists.

---

# 73. RED Method

HTTP services can initially be monitored using:

```text
Rate

Errors

Duration
```

Example:

```text
How many requests?

How many failures?

How slow are they?
```

This provides a simple useful starting point.

---

# 74. USE Method

Infrastructure may later use:

```text
Utilization

Saturation

Errors
```

Examples:

```text
CPU

memory

queue depth

database connections
```

Do not build complex capacity dashboards before there is actual operational need.

---

# 75. Core API Observability

The Core API should eventually expose visibility for:

```text
HTTP traffic

HTTP errors

latency

database-related failures

authentication failures

authorization failures

business conflicts
```

Security-sensitive failures must be logged carefully.

---

# 76. Authentication Metrics

Potential bounded metrics:

```text
auth_login_total

auth_login_failures_total

auth_refresh_failures_total
```

Do not include usernames/emails as labels.

Be careful not to create information useful to attackers through public metrics exposure.

---

# 77. Authorization Metrics

Potential:

```text
authorization_denied_total
```

with bounded dimensions:

```text
role

route
```

Do not log or metric private identifiers unnecessarily.

---

# 78. KRS Observability

Potential future business/operational signals:

```text
KRS submission failures

KRS conflict errors

KRS approval errors
```

Business analytics and infrastructure metrics should remain conceptually separated.

Do not put every business data point into Prometheus.

---

# 79. Business Analytics vs Observability

Observability answers:

```text
Is the application operating correctly?
```

Business analytics answers:

```text
How many students submitted KRS?
```

Some overlap exists, but do not use Prometheus as the main business reporting database.

Business reports belong in application/database analytics.

---

# 80. AI Observability

AI needs additional operational context because failures may happen in several layers.

Potential failure points:

```text
AI Service

LangChain

Ollama

Hermes

tool selection

Core API tool execution

RAG retrieval
```

Observability should make these distinguishable.

---

# 81. AI Error Classification

Future AI errors should distinguish categories such as:

```text
AI_PROVIDER_UNAVAILABLE

AI_PROVIDER_TIMEOUT

AI_TOOL_ERROR

AI_TOOL_TIMEOUT

AI_RETRIEVAL_ERROR

AI_INVALID_TOOL_RESULT
```

This improves metrics and incident investigation.

---

# 82. Tool Visibility

Tool execution should expose safe operational metadata.

Example log:

```json
{
  "service": "ai-service",
  "requestId": "req-123",
  "toolName": "get_my_grades",
  "durationMs": 85,
  "status": "success"
}
```

Avoid logging the complete grade payload.

---

# 83. AI Performance Investigation

Example issue:

```text
AI response takes 6 seconds.
```

Metrics/traces should eventually show:

```text
Hermes inference       4.8s

Core API tool call     0.2s

Database               0.05s

Other orchestration    0.95s
```

This avoids guessing which layer needs optimization.

---

# 84. Worker Observability

Every worker should log:

```text
job received

job completed

job failed
```

Useful fields:

```text
jobId

jobType

attempt

duration

errorCode
```

Do not log entire large message payloads.

---

# 85. Worker Metrics

Recommended:

```text
worker_jobs_total

worker_job_failures_total

worker_job_duration_seconds

worker_retries_total
```

This helps identify:

```text
failing jobs

slow jobs

retry loops
```

---

# 86. Dead-Letter Monitoring

If dead-letter queues are introduced:

```text
dead-letter message count
```

should become an operational signal.

Messages reaching a DLQ indicate work requiring investigation or remediation.

---

# 87. Payment Observability

Payment observability should focus on safe operational signals.

Potential:

```text
payment_webhooks_total

payment_webhook_failures_total

payment_provider_errors_total
```

Do not expose sensitive payment payloads to metrics or logs.

---

# 88. S3 Observability

File operations may log:

```text
operation type

object category

duration

success/failure
```

Do not log signed URLs or secret credentials.

---

# 89. Database Observability

Database visibility should help answer:

```text
Are queries slow?

Is the DB unavailable?

Are requests waiting on DB?
```

Do not prematurely add detailed per-query tracing everywhere.

Start with request and dependency-level visibility.

---

# 90. Slow Request Thresholds

The project may later define thresholds.

Example conceptual:

```text
Core API request > X ms
→ slow request signal

AI request > Y seconds
→ slow AI signal
```

Do not invent production thresholds before observing actual behavior.

---

# 91. Sampling

Distributed tracing can generate significant telemetry.

Initial development may record all traces.

Production may later require sampling.

Potential strategies:

```text
sample percentage

always sample errors

sample slow requests
```

Do not optimize sampling before trace volume exists.

---

# 92. Retention

Telemetry retention must be intentional.

Different signals may have different retention periods:

```text
logs

metrics

traces
```

Retention affects:

```text
storage

cost

privacy
```

Do not keep sensitive operational information forever without a reason.

---

# 93. Local Debug Logging

Development may use more verbose logging.

Production should use appropriate log levels.

Do not leave excessive debug logging enabled in production by accident.

Configuration may use:

```text
LOG_LEVEL
```

---

# 94. Environment Metadata

Telemetry should identify environment.

Examples:

```text
development

test

staging

production
```

This prevents mixing production and local telemetry.

---

# 95. Health Dashboard

A basic operational dashboard may show:

```text
Core API readiness

AI Service readiness

HTTP request rate

HTTP error rate

latency
```

Infrastructure health can later expand to:

```text
PostgreSQL

RabbitMQ

Redis
```

---

# 96. Dashboard Discipline

Each dashboard should answer a clear operational question.

Avoid dashboards that contain dozens of unrelated charts.

Example:

```text
Core API Overview

Question:
"Is the Core API currently healthy?"
```

That focus determines which panels belong.

---

# 97. Runbooks

Important alerts should eventually link to operational runbooks.

Example:

```text
Alert:
RabbitMQ document queue backlog high

Runbook:
docs/runbooks/rabbitmq-document-backlog.md
```

Runbooks may be introduced during production hardening.

---

# 98. Observability ExecPlan

Observability implementation should use:

```text
docs/exec-plans/active/observability-foundation.md
```

Do not implement all components in one milestone.

Recommended milestones:

```text
M0
Baseline and requirements

M1
Prometheus application metrics

M2
Grafana Core API dashboard

M3
Loki centralized logging

M4
AI Service metrics

M5
Worker metrics

M6
OpenTelemetry foundation

M7
Tempo

M8
Cross-service trace propagation

M9
Correlation between logs, metrics, traces

M10
Alerting
```

Exact milestones should reflect repository state when work begins.

---

# 99. M1 Prometheus Exit Criteria

Example:

```text
/metrics available

HTTP request counter works

HTTP duration metric works

HTTP error metric works

labels have bounded cardinality

tests pass

telemetry failure does not break API

quality gates pass
```

---

# 100. M2 Grafana Exit Criteria

Example:

```text
Prometheus connected

Core API dashboard exists

request rate visible

error rate visible

latency visible

dashboard configuration documented
```

---

# 101. M3 Loki Exit Criteria

Example:

```text
Pino logs reach Loki

Core API logs searchable

service and environment labels exist

sensitive fields reviewed

Grafana can query logs
```

---

# 102. M6 OpenTelemetry Exit Criteria

Example:

```text
Core API trace created

HTTP requests instrumented

traceId available

logging correlation works where practical

telemetry failure isolated
```

---

# 103. Tempo Exit Criteria

Example:

```text
Tempo receives traces

Grafana can inspect traces

AI → Core trace visible

latency spans meaningful

sensitive payloads excluded
```

---

# 104. Observability Testing

Tests should focus on application integration rather than testing Prometheus/Grafana internals.

Examples:

```text
metrics middleware records request

error increments expected metric

requestId included in log context

trace propagation header passed to Core API

telemetry initialization failure does not crash business request
```

---

# 105. Dependency Policy

Observability libraries should be introduced only during observability milestones.

Do not add:

```text
Prometheus client

OpenTelemetry packages

Loki-specific dependencies
```

during unrelated domain feature work.

---

# 106. Performance Overhead

Observability has cost.

Potential overhead:

```text
CPU

memory

network

storage

request latency
```

Instrumentation should remain lightweight enough that monitoring does not materially degrade the application.

---

# 107. Telemetry Backpressure

Application requests should not wait indefinitely because telemetry destinations are slow.

Telemetry exporters should use bounded buffering/timeout behavior.

The application should prioritize business processing over perfect telemetry delivery.

---

# 108. Cardinality Review

Before introducing a metric label, ask:

```text
How many possible values can this field have?
```

If the answer is:

```text
one per user

one per request

one per conversation
```

it probably should not be a Prometheus label.

---

# 109. Observability Security Review

Before recording telemetry, ask:

```text
Does this contain authentication material?

Does this contain private student data?

Does this contain financial data?

Does this contain full AI conversation content?

Could this expose internal credentials?

Could this identify a user unnecessarily?
```

If yes, reduce or redact the data.

---

# 110. Production Deployment Direction

Local observability:

```text
Prometheus
Grafana
Loki
Tempo
```

may run via Docker Compose.

AWS infrastructure:

```text
CloudWatch
```

will provide cloud-native operational visibility.

Production does not automatically need to self-host the entire local observability stack immediately.

---

# 111. Cost Awareness

Observability generates data.

High-volume:

```text
logs

metrics with excessive labels

100% traces
```

can create significant storage and cloud costs.

Production design should monitor telemetry volume.

Do not sacrifice useful visibility, but avoid collecting data without purpose.

---

# 112. Target Correlation Experience

The long-term desired debugging workflow is:

```text
Grafana alert
     ↓
Prometheus metric shows error spike
     ↓
Open trace in Tempo
     ↓
Identify failing AI/Core span
     ↓
Open correlated Loki logs
     ↓
Inspect safe contextual error details
```

This is the main benefit of combining the three observability signals.

---

# 113. Example Investigation

User reports:

```text
"AI keeps failing when I ask about grades."
```

Target investigation:

```text
1. Grafana:
   AI tool error rate increased.

2. Tempo:
   get_my_grades span failing.

3. Core API trace:
   grades API returning 503.

4. Loki:
   database dependency timeout.

5. Prometheus:
   Core API DB-related errors increased.
```

Result:

```text
The issue is database availability,
not Hermes.
```

This is the type of question observability should answer.

---

# 114. Technologies Intentionally Not Added

Do not introduce additional observability platforms without a demonstrated need.

Examples:

```text
Datadog

New Relic

Elastic Stack

Jaeger
```

The approved learning stack is:

```text
Pino

Prometheus

Grafana

Loki

OpenTelemetry

Tempo
```

AWS additionally provides:

```text
CloudWatch
```

---

# 115. Observability Definition of Done

An observability milestone is complete when applicable conditions pass:

```text
Telemetry implemented              ✅

Operational question answered      ✅

Sensitive data reviewed            ✅

Cardinality reviewed               ✅

Failure isolation preserved        ✅

Focused tests pass                 ✅

Regression tests pass              ✅

Lint passes                        ✅

Typecheck passes                   ✅

Production build passes            ✅

Dashboard updated                  ✅

Documentation updated              ✅

Diff reviewed                      ✅
```

---

# 116. Final Observability Principle

Observability exists to reduce uncertainty.

The project should progress from:

```text
"Something is slow."
```

to:

```text
"AI requests are slow."
```

then:

```text
"get_my_grades is slow."
```

and finally:

```text
"Core API database access accounts
for 1.8 seconds of this trace."
```

The final target is:

```text
Metrics
→ tell us WHAT is wrong

Traces
→ tell us WHERE it is wrong

Logs
→ tell us WHY or provide the context
```

The observability stack should make SIAKAD easier to operate without becoming more important than the application itself.