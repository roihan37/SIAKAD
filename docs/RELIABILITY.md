# RELIABILITY.md

## Purpose

This document defines reliability requirements for the SIAKAD repository.

Reliability means the system continues to behave predictably when dependencies fail, requests are slow, workers restart, external services are unavailable, or infrastructure changes.

The project must prefer:

- bounded failure
- graceful degradation
- clear health signals
- deterministic recovery
- safe retries
- idempotent processing
- observable failure
- controlled shutdown
- stable production builds

The repository is a brownfield system.

Reliability improvements should be introduced incrementally and validated against existing behavior.

---

# 1. Reliability Principles

The project follows these principles:

1. Fail predictably.
2. Avoid unbounded waits.
3. Avoid silent failure.
4. External dependency failure should not corrupt core academic state.
5. Recovery behavior should be explicit.
6. Critical operations should be idempotent where retries are possible.
7. Health checks must reflect real service readiness.
8. Graceful shutdown is required for long-running processes.
9. Retry only transient failures.
10. Logs, metrics, and traces should make failures diagnosable.
11. Core SIAKAD functionality should remain available when optional features fail where possible.
12. Reliability must be testable.

---

# 2. Reliability Scope

This document covers:

```text
Core REST API
AI Assistant Service
PostgreSQL
Prisma
Redis
RabbitMQ
Workers
S3
Payment Gateway
Ollama / LLM Provider
Internal Service Communication
Docker
AWS Runtime
```

Not every component is implemented yet.

Future technology must not be treated as already available.

---

# 3. Service Categories

The architecture contains several runtime categories.

## Core API

Responsible for:

- authentication
- authorization
- academic business logic
- database access
- synchronous REST APIs

This is a critical service.

## AI Assistant Service

Responsible for:

- chat orchestration
- LangChain
- Ollama / LLM integration
- tool calling
- SSE

This is important but must not become a hard dependency for basic academic operations.

## Workers

Responsible for asynchronous work such as:

- document indexing
- report generation
- notifications
- batch processing

Workers may restart independently from HTTP services.

---

# 4. Core Reliability Rule

The system should distinguish:

```text
Critical dependency
vs
Optional dependency
```

Examples:

```text
PostgreSQL
→ critical for most Core API operations

Ollama
→ not critical for normal academic CRUD

Redis
→ ideally optional for correctness

RabbitMQ
→ required for async jobs, but not every REST request
```

Do not let an optional dependency unnecessarily take down unrelated Core API behavior.

---

# 5. Liveness

Every deployable service should expose a liveness endpoint.

Core API:

```text
GET /health/live
```

Future AI Service:

```text
GET /health/live
```

Liveness answers:

```text
Is this process alive?
```

It should not perform expensive dependency checks.

It should not depend on PostgreSQL.

A database outage should not make the process appear dead.

---

# 6. Readiness

Every public service should expose readiness.

Example:

```text
GET /health/ready
```

Readiness answers:

```text
Can this service safely receive traffic?
```

Core API readiness may check critical dependencies such as PostgreSQL.

Future AI Service readiness may check only dependencies required to serve AI traffic.

---

# 7. Readiness Checks Must Be Bounded

Dependency probes must have explicit time limits.

Avoid:

```text
health request
↓
database hangs
↓
request waits indefinitely
```

Prefer:

```text
health request
↓
database probe
↓
bounded timeout
↓
ready / not ready
```

Existing bounded readiness behavior should be preserved.

---

# 8. Health Check Semantics

Use clear semantics.

```text
/health/live
200
→ process alive
```

```text
/health/ready
200
→ ready to receive traffic

503
→ temporarily not ready
```

Do not return 200 when a critical readiness dependency is unavailable.

---

# 9. Health Checks Must Be Lightweight

Avoid health checks that:

- scan large tables
- perform expensive joins
- call LLMs
- generate embeddings
- publish queue messages
- perform writes

Use the minimum operation needed to prove readiness.

---

# 10. Application Startup

Startup should validate critical configuration before accepting traffic.

Examples:

```text
DATABASE_URL
JWT secrets
AWS region
required bucket configuration
required service configuration
```

A service with invalid configuration should fail early and clearly.

Do not start partially configured and fail unpredictably later.

---

# 11. Startup Dependency Policy

Not every external dependency must block startup.

Classify dependencies.

Example:

```text
Core API

PostgreSQL
→ likely required

Redis
→ optional depending on usage

RabbitMQ
→ optional for endpoints not requiring async publishing

Ollama
→ irrelevant to Core API
```

Do not create unnecessary hard startup coupling.

---

# 12. Production Build Reliability

Production runtime must use compiled production output.

For the backend:

```text
TypeScript source
↓
npm run build
↓
dist
↓
node dist/server.js
```

Do not rely on development-only runtime tooling in production.

---

# 13. Generated Output

Never fix production issues by patching `dist/` directly.

Fix source:

```text
src/
```

Then rebuild.

Compiled output must remain reproducible.

---

# 14. Graceful Shutdown

Long-running processes must handle termination signals.

Typical signals:

```text
SIGTERM
SIGINT
```

Shutdown flow:

```text
Signal
  ↓
Mark service shutting down
  ↓
Stop accepting new work
  ↓
Wait for active work within timeout
  ↓
Close external connections
  ↓
Exit
```

---

# 15. Core API Shutdown

The Core API should safely close:

- HTTP server
- Prisma/database connection
- Redis client when introduced
- RabbitMQ connection when introduced
- telemetry exporter if required

Shutdown must not wait indefinitely.

---

# 16. AI Service Shutdown

The AI service should eventually:

- stop accepting new AI requests
- stop SSE streams safely where practical
- stop new tool calls
- close Ollama/provider connections if needed
- close Redis/RabbitMQ clients
- flush telemetry where appropriate
- exit within a bounded timeout

---

# 17. Worker Shutdown

Workers require special shutdown behavior.

On termination:

```text
stop consuming new messages
        ↓
finish current job if safe
        ↓
ack successful work
        ↓
leave unfinished work unacknowledged
        ↓
close broker connection
```

Do not acknowledge a message before critical processing has completed.

---

# 18. Shutdown Timeout

Every service should have a bounded shutdown deadline.

If graceful cleanup exceeds the deadline, exit should still occur in a controlled way.

Avoid processes that never terminate because one connection does not close.

---

# 19. Timeouts

All external calls should have bounded timeouts.

Examples:

```text
database readiness probe
AI Service → Core API
Core API → Payment Gateway
AI Service → Ollama
AI Service → external LLM
S3 calls
RabbitMQ connection
Redis connection
```

Unbounded network calls are reliability defects.

---

# 20. Internal Service Timeouts

AI tool calls to the Core API must define timeouts.

Example:

```text
AI Service
  ↓
get_my_grades
  ↓
Core API
```

If Core API does not respond in time:

```text
tool call fails safely
```

The AI should not hang indefinitely.

---

# 21. LLM Timeout

Model inference is slower than normal API work.

AI requests should define:

- model timeout
- tool timeout
- total request deadline
- cancellation behavior where possible

A stuck local model must not hold resources indefinitely.

---

# 22. SSE Reliability

AI chat uses Server-Sent Events.

SSE handling should consider:

- client disconnect
- partial response
- upstream model failure
- timeout
- cancellation
- stream cleanup

When the client disconnects, unnecessary model/tool work should be cancelled where practical.

---

# 23. AI Failure Degradation

AI is not required for normal Core SIAKAD functionality.

If the AI Service is unavailable:

```text
Core REST API
✅ should continue functioning
```

The frontend should show an AI-specific unavailable state.

Avoid making the whole SIAKAD unusable because Ollama or the AI Service fails.

---

# 24. Ollama Failure

Possible Ollama failures:

```text
model unavailable
runtime not running
model loading timeout
out-of-memory
slow inference
unexpected response
```

AI Service should:

- fail safely
- produce a controlled error
- log relevant metadata
- avoid leaking provider internals unnecessarily

Do not retry model calls indefinitely.

---

# 25. AI Provider Abstraction Reliability

If multiple providers are supported later:

```text
Ollama
Cloud Provider
```

failover behavior must be explicit.

Do not silently send sensitive data to a cloud provider merely because local inference failed.

Provider fallback requires a deliberate policy.

---

# 26. PostgreSQL Reliability

PostgreSQL is the source of truth.

Critical data should not depend on cache state.

Application reliability should preserve:

- transactions
- integrity constraints
- atomic operations
- predictable error handling

Database failure should produce controlled application errors rather than inconsistent partial state.

---

# 27. Database Connection Failure

When PostgreSQL is unavailable:

```text
Core API readiness
→ 503
```

Requests requiring the database should fail predictably.

Do not convert database outage into misleading successful responses.

---

# 28. Database Transactions

Use transactions where multiple writes represent one logical operation.

Example:

```text
update KRS state
+
write status history
```

should not leave partial state.

Reliability means:

```text
all committed
or
all rolled back
```

---

# 29. Transaction Scope

Keep transactions focused.

Avoid keeping a database transaction open while waiting for:

```text
LLM response
payment provider
email provider
S3 upload
long network request
```

Long transactions increase lock and failure risk.

---

# 30. External Side Effects

Operations involving both database state and external systems need explicit ordering.

Examples:

```text
DB + S3
DB + RabbitMQ
DB + Payment Gateway
```

Do not assume these systems form one atomic transaction.

Plan compensation or idempotency where required.

---

# 31. Redis Reliability

Redis should not become a correctness dependency unless explicitly designed that way.

Preferred:

```text
Redis available
→ faster response

Redis unavailable
→ slower but correct response
```

for caching use cases.

---

# 32. Cache Failure

If Redis fails:

- do not return stale/corrupt academic state silently
- fall back to PostgreSQL where practical
- log cache failure
- avoid retry storms

Cache failure should not generally bring down the Core API.

---

# 33. Cache Invalidation

Every cache design must define:

```text
key
TTL
invalidation
fallback
```

Stale academic or financial information can be worse than a slower response.

Correctness has priority over cache hit rate.

---

# 34. Redis Reconnection

Redis clients should use controlled reconnect behavior.

Avoid:

```text
infinite aggressive reconnect loop
```

that floods logs or consumes CPU.

Use bounded/backoff reconnect strategy supported by the chosen client.

---

# 35. RabbitMQ Reliability

RabbitMQ provides asynchronous delivery, not guaranteed exactly-once execution.

Design workers for:

```text
at-least-once delivery
```

where duplicates may occur.

Consumers should be idempotent where duplicate work would be harmful.

---

# 36. Message Acknowledgement

Acknowledge only after the required work succeeds.

Bad:

```text
receive
↓
ack
↓
process
↓
crash
```

Message is lost.

Preferred:

```text
receive
↓
process
↓
success
↓
ack
```

---

# 37. Message Failure

If a job fails:

```text
transient failure
→ retry may be appropriate

permanent invalid message
→ do not retry forever
```

Use a clear retry/dead-letter strategy when needed.

---

# 38. Retry Count

Retries must be bounded.

Avoid:

```text
retry forever
```

Prefer:

```text
attempt
↓
backoff
↓
attempt
↓
bounded maximum
↓
dead-letter / failed state
```

---

# 39. Dead-Letter Strategy

For critical queues, consider dead-letter handling.

Example:

```text
ai.document.index
      ↓
repeated failure
      ↓
ai.document.index.dlq
```

This prevents poison messages from blocking or endlessly cycling.

---

# 40. Idempotent Workers

Important workers must tolerate replay.

Examples:

```text
document indexing
report generation
payment event processing
notification jobs
```

Use stable job IDs or business keys where appropriate.

---

# 41. Message Schema Versioning

Queue messages should include a schema version.

Example:

```json
{
  "version": 1,
  "jobId": "...",
  "documentId": "..."
}
```

A worker should reject unsupported message formats predictably.

---

# 42. RabbitMQ Outage

If RabbitMQ is unavailable:

- synchronous business requests that do not require it should continue
- requests that require async enqueue should return a controlled failure or degraded response
- do not pretend a job was queued if publishing failed

Example:

```text
upload document
↓
DB record saved
↓
publish fails
```

This requires a deliberate recovery strategy.

---

# 43. Async Publish Consistency

For workflows requiring database state plus a queue message, consider reliable patterns later such as:

```text
transactional outbox
```

if evidence shows simple publishing creates reliability gaps.

Do not introduce the outbox pattern before needed.

But record the consistency risk explicitly.

---

# 44. S3 Reliability

S3 operations should have clear failure handling.

Examples:

```text
avatar upload
document upload
report storage
```

Do not commit database references to files that were never successfully stored unless recovery behavior is designed.

---

# 45. S3 Cleanup

Deletion or replacement workflows should define:

```text
database commit ordering
storage cleanup ordering
failure behavior
```

A storage cleanup failure should not necessarily invalidate a successful database transaction if best-effort cleanup is acceptable.

This behavior must be explicit and tested.

---

# 46. File Processing Reliability

Document workers should handle:

```text
missing object
invalid file
parser failure
embedding failure
database write failure
duplicate indexing
```

A single bad document must not crash the entire worker process repeatedly.

---

# 47. Payment Gateway Reliability

Payment systems are external and asynchronous.

Expect:

```text
timeouts
duplicate webhooks
delayed webhooks
out-of-order events
provider outage
```

Do not design payment state assuming one perfect callback.

---

# 48. Payment Idempotency

The same payment event may arrive multiple times.

Processing must avoid:

```text
duplicate credit
duplicate payment row
incorrect repeated transition
```

Use a stable provider event or transaction identifier.

---

# 49. Payment Provider Timeout

A timeout does not necessarily mean the payment failed.

Do not convert:

```text
provider timeout
```

directly into:

```text
payment failed
```

when the provider may have processed the request.

Use reconciliation/status lookup patterns where required.

---

# 50. External API Retries

Retry only transient failures.

Possible retry:

```text
network timeout
HTTP 502
HTTP 503
HTTP 504
```

Usually do not retry:

```text
400
401
403
business validation error
```

Retry policy must be bounded.

---

# 51. Exponential Backoff

Where retries are required, prefer backoff.

Concept:

```text
attempt 1
↓
short wait
↓
attempt 2
↓
longer wait
↓
attempt 3
```

Avoid simultaneous rapid retries across many instances.

---

# 52. Retry Storms

When a dependency fails, every service retrying aggressively can worsen the outage.

Use:

- bounded retry
- backoff
- jitter where supported
- circuit-breaking patterns only if complexity is justified later

Do not introduce complex resilience libraries without need.

---

# 53. Partial Failure

Distributed architecture introduces partial failure.

Example:

```text
AI Service healthy
Core API unavailable
```

The system must represent this accurately.

AI should respond with a controlled inability to retrieve data, not hallucinate values.

---

# 54. Service-to-Service Error Contract

AI Service → Core API calls should distinguish:

```text
401 / 403
→ auth/permission

404
→ missing resource

409
→ business conflict

5xx
→ Core service failure

timeout
→ dependency unavailable/slow
```

Do not convert all failures into a generic model response.

---

# 55. Circuit Breaking

Circuit breakers are not required initially.

Consider them only if:

- dependency failure repeatedly causes expensive requests
- retry/backoff is insufficient
- operational evidence justifies the added complexity

Do not add reliability patterns solely for architecture appearance.

---

# 56. Bulk Operations

Bulk operations should define limits.

Examples:

```text
bulk delete
bulk status update
batch generation
```

Unbounded batch sizes can produce:

- long transactions
- memory spikes
- timeouts
- lock contention

Use explicit limits and asynchronous processing where needed.

---

# 57. Pagination

Potentially large collections should use pagination.

Avoid returning entire large datasets in one request.

Pagination improves both:

- reliability
- resource usage

---

# 58. Memory Reliability

Avoid holding very large payloads unnecessarily.

Examples:

```text
large PDF
huge API result
entire student dataset
massive LLM context
```

Prefer streaming, pagination, chunking, or background work where appropriate.

---

# 59. AI Context Size

AI chat history should not grow without bound.

Long conversations may cause:

- latency increase
- memory increase
- model context overflow
- higher cloud cost later

Define conversation truncation or summarization strategy before this becomes significant.

---

# 60. RAG Reliability

RAG pipeline should handle document lifecycle.

States may eventually include:

```text
UPLOADED
PROCESSING
READY
FAILED
```

Do not expose a document as fully searchable before indexing completes successfully.

---

# 61. RAG Reindexing

Changing:

```text
embedding model
chunk size
embedding dimension
retrieval strategy
```

may require reindexing.

Do not silently mix incompatible embeddings.

Track embedding configuration/version.

---

# 62. RAG Failure

If retrieval fails:

```text
AI should not invent policy answers
```

Prefer a controlled response indicating that source information could not be retrieved.

---

# 63. Logging Reliability

Logging must not break request processing.

If logging itself fails unexpectedly, application error handling should still return the intended response where possible.

This is especially important inside:

```text
errorHandler
```

Never let logger invocation become a secondary application failure.

---

# 64. Request Correlation

Request IDs should propagate through synchronous service boundaries.

Target:

```text
Frontend
 ↓
AI Service
 ↓
Core API
```

should retain correlation context where practical.

This helps diagnose partial failures.

---

# 65. Trace Correlation

Future OpenTelemetry should propagate trace context across:

```text
HTTP
RabbitMQ
workers
```

This enables one investigation path across distributed components.

---

# 66. Metrics Reliability

Prometheus metrics should help detect degradation.

Useful metrics may include:

```text
http_requests_total
http_request_duration_seconds
http_errors_total

ai_requests_total
ai_request_duration_seconds
ai_tool_errors_total

rabbitmq_jobs_total
rabbitmq_job_failures_total

cache_hits_total
cache_misses_total
```

Avoid high-cardinality user-specific labels.

---

# 67. Alerting

Alert only on actionable conditions.

Examples:

```text
Core API readiness failing

HTTP 5xx above threshold

AI Service error rate high

queue backlog growing

database unavailable

worker failure rate high
```

Avoid alerts for every individual error.

---

# 68. Observability Failure

Observability is important but should not normally become a critical application dependency.

If:

```text
Prometheus
Loki
Tempo
```

are unavailable, the Core API should ideally continue serving traffic.

Telemetry export failure should not crash core business operations.

---

# 69. Grafana

Grafana is a visualization layer.

Its failure should not affect application correctness.

Do not create application runtime dependencies on Grafana availability.

---

# 70. Deployment Reliability

Deployments should support predictable rollback.

Target deployment should use versioned container images.

Example:

```text
siakad-core-api:1.4.2
siakad-ai:1.1.0
```

Avoid deploying only mutable:

```text
latest
```

without a traceable version strategy.

---

# 71. ECR Reliability

ECR stores deployable image versions.

CI should produce images tied to a commit or release identifier.

This makes rollback reproducible.

---

# 72. ECS Fargate Reliability

ECS should use health checks to determine whether tasks receive traffic.

Core API:

```text
/health/ready
```

AI Service:

```text
/health/ready
```

should drive readiness behavior where appropriate.

---

# 73. ALB Reliability

ALB should only route traffic to healthy targets.

Target architecture:

```text
/api/*
→ Core API target group

/ai/*
→ AI Service target group
```

Failure of AI target group should not make `/api/*` unavailable.

---

# 74. Rolling Deployment

Production deploys should avoid unnecessary total downtime.

ECS rolling deployment may run:

```text
old task
+
new task
```

until new tasks become healthy.

Readiness checks are critical for this behavior.

---

# 75. Database Migration Reliability

Schema migrations require special care.

Before destructive migration:

- understand existing data
- understand rollback
- understand compatibility with old/new application versions
- back up where appropriate

Prefer additive migrations before destructive cleanup.

---

# 76. Expand and Contract

For risky schema/API migrations, prefer:

```text
Expand
  ↓
Support old + new
  ↓
Migrate usage/data
  ↓
Contract
```

rather than:

```text
break old schema immediately
```

This improves deployment safety.

---

# 77. RDS Reliability

Production PostgreSQL should use RDS.

Future production planning should consider:

- automated backups
- recovery
- storage growth
- monitoring
- Multi-AZ only when justified by required availability and budget

Do not enable expensive HA features without understanding cost and need.

---

# 78. Redis Production Reliability

Production Redis may use ElastiCache.

Consider:

- persistence requirements
- node failure
- TTL behavior
- cache rebuild
- failover only when needed

Remember:

```text
Redis != source of truth
```

---

# 79. RabbitMQ Production Reliability

Production RabbitMQ may use Amazon MQ.

Reliability planning should consider:

- broker availability
- durable messages
- queue durability
- reconnect behavior
- consumer recovery
- dead-letter queues
- monitoring

Do not assume managed service removes application-level reliability responsibilities.

---

# 80. Network Failure

Service communication must assume networks can fail.

Possible states:

```text
connect timeout
connection reset
DNS failure
partial response
late response
```

Code should not assume:

```text
same AWS network
=
cannot fail
```

---

# 81. DNS Reliability

Route 53 is infrastructure-level DNS.

Application runtime should not hardcode unstable IP addresses.

Use service/domain endpoints.

---

# 82. HTTPS Reliability

Production traffic should use HTTPS.

TLS termination may happen at:

```text
ALB
CloudFront
```

Certificate renewal should be managed through ACM where used.

---

# 83. CloudFront Reliability

Frontend static delivery through CloudFront should tolerate backend API outages separately.

A backend outage should not prevent static frontend assets from loading.

Frontend should show controlled API unavailable states.

---

# 84. Configuration Reliability

Configuration should be validated at startup.

Avoid silent fallback for security- or correctness-critical values.

Example:

```text
JWT secret missing
→ fail startup
```

rather than generating an insecure runtime default.

---

# 85. Secret Availability

If required production secrets cannot be loaded:

```text
service should not accept traffic
```

Do not start with empty placeholder secrets.

---

# 86. Feature Flags

Feature flags may be introduced later for risky rollouts.

Potential uses:

```text
AI Assistant
new payment flow
new KRS behavior
```

Do not introduce a feature flag system before there is a concrete rollout need.

---

# 87. Backward Compatibility

Reliability includes avoiding unnecessary client breakage.

When changing an API:

```text
identify consumers
↓
preserve compatibility
↓
migrate
↓
remove old behavior later
```

Do not couple unrelated deployments unnecessarily.

---

# 88. AI/Core Version Compatibility

Because AI Service and Core API can deploy independently, internal tool contracts require compatibility.

Avoid AI Service depending on undocumented Core API behavior.

Use explicit internal contracts.

Breaking internal API changes should coordinate:

```text
Core API version
+
AI Service version
```

---

# 89. Worker Version Compatibility

Queue consumers and producers may briefly run different versions during deployment.

Message schema changes should be backward-compatible where practical.

Version queue messages when necessary.

---

# 90. Recovery Documentation

High-risk ExecPlans should document recovery.

Examples:

```text
How to disable AI Service?

How to stop a broken worker?

How to replay a failed indexing job?

How to roll back an ECS image?

How to restore DB state?
```

A system is more reliable when recovery is understood before failure.

---

# 91. Manual Recovery

Automation is preferred, but manual operational procedures should still be documented for unusual failures.

Examples:

```text
requeue failed job
disable queue consumer
restore previous release
rotate broken secret
```

Do not rely on undocumented tribal knowledge.

---

# 92. Data Integrity Before Availability

For academic and financial state, prefer:

```text
temporarily unavailable
```

over:

```text
available but incorrect
```

Examples:

```text
incorrect grade
incorrect payment state
incorrect KRS
```

are more damaging than a controlled temporary failure.

---

# 93. Error Handling

All services need centralized predictable error behavior.

Unexpected failure should:

```text
log diagnostic metadata
↓
return safe error
```

Do not expose internals.

Do not allow an error handler to throw another avoidable error.

---

# 94. 503 Usage

Use HTTP 503 for temporary inability to serve due to readiness/dependency state where appropriate.

Do not use 503 for ordinary business validation errors.

---

# 95. 500 Usage

Unexpected internal server failure should return a safe 500 response.

The client should receive enough information to correlate:

```text
requestId
```

without receiving sensitive internals.

---

# 96. Fail Fast vs Degrade Gracefully

Use fail-fast when:

```text
required secret missing
invalid startup config
unsupported schema
critical invariant broken
```

Use graceful degradation when:

```text
cache unavailable
AI unavailable
telemetry backend unavailable
optional notification service unavailable
```

The correct choice depends on whether correctness can be preserved.

---

# 97. Reliability Testing

Reliability behavior should be tested where practical.

Examples:

```text
database readiness timeout

graceful SIGTERM

logger failure resilience

Redis unavailable fallback

duplicate RabbitMQ message

failed worker retry

AI provider timeout

Core API internal timeout

client SSE disconnect
```

Do not test only successful paths.

---

# 98. Chaos Testing

Formal chaos engineering is not required now.

Later, simple controlled failure tests may be useful:

```text
stop Redis

stop RabbitMQ

stop Ollama

make DB unavailable

kill worker mid-job
```

Observe whether failure matches documented behavior.

Do not introduce large chaos platforms for this project.

---

# 99. Reliability and Technical Debt

Reliability issues discovered outside current scope should be recorded in:

```text
docs/exec-plans/tech-debt-tracker.md
```

Potential priorities:

```text
P0
data corruption / production blocker

P1
serious availability or recovery risk

P2
important reliability improvement

P3
minor operational cleanup
```

---

# 100. Reliability Review in ExecPlans

Every substantial plan should consider:

```text
What happens if the dependency is unavailable?

What happens if the request times out?

Can the operation be retried?

Can it execute twice?

Can partial state be created?

How does shutdown affect it?

How is failure observed?

How does the user recover?
```

If these questions are relevant, the ExecPlan must address them.

---

# 101. Reliability Definition of Done

Reliability-sensitive work should satisfy applicable checks:

```text
Timeouts defined                  ✅

Failure behavior defined          ✅

Retry behavior defined            ✅

Idempotency considered            ✅

Graceful shutdown considered      ✅

Health behavior considered        ✅

Partial failure considered        ✅

Logging added safely              ✅

Metrics/tracing considered        ✅

Focused tests pass                ✅

Regression tests pass             ✅

Lint passes                       ✅

Typecheck passes                  ✅

Production build passes           ✅

Recovery path documented          ✅
```

---

# 102. Current Reliability Foundation

Current implemented foundation includes:

```text
production TypeScript build

environment validation

health/live

health/ready

bounded database readiness

request IDs

centralized error handling

structured Pino logging

graceful shutdown

backend test infrastructure
```

Future reliability work includes:

```text
AI Service health and timeout behavior

RabbitMQ retry and dead-letter handling

Redis fallback behavior

RAG job recovery

payment idempotency

distributed tracing

AWS deployment health behavior

operational alerting
```

Do not document future behavior as implemented until it actually exists.

---

# 103. Final Reliability Principle

The main reliability objective is:

```text
Failure should be bounded,
observable,
recoverable,
and should not corrupt authoritative data.
```

For the target hybrid architecture:

```text
React
   │
   ▼
Core API ───────────────┐
   │                    │
   ▼                    ▼
PostgreSQL          AI Service
                        │
                     Ollama

RabbitMQ
   │
Workers

Redis
```

each component may fail independently.

The system should therefore avoid assumptions that all dependencies are always healthy.

Correctness and data integrity remain more important than pretending the system is always available.