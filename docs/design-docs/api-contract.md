# API CONTRACT

## Purpose

This document defines the API contract conventions for the SIAKAD platform.

It establishes predictable rules for:

- REST endpoints
- request and response structure
- HTTP status codes
- authentication
- authorization
- pagination
- filtering
- sorting
- error responses
- request correlation
- validation failures
- file handling
- AI-to-Core communication
- asynchronous operations
- payment integration
- backward compatibility

This document is the canonical direction for **new and explicitly migrated APIs**.

SIAKAD is a brownfield application.

Existing endpoints do not need to be rewritten globally only to match this document.

---

# 1. Scope

This contract applies to:

```text
Core SIAKAD REST API

Frontend → Core API

AI Service → Core API

Future external integrations

Selected internal HTTP contracts
```

AI chat streaming has additional rules described later in this document.

RabbitMQ message contracts are separate from HTTP API contracts.

---

# 2. Core Principle

The API contract should be:

```text
Predictable
Typed
Authorization-aware
Backward-compatible
Observable
Easy to document
Easy to test
```

API consistency must not be achieved by unnecessarily breaking existing consumers.

---

# 3. API Style

The Core SIAKAD API uses:

> REST

Preferred transport:

```text
HTTPS
JSON
```

Example:

```http
GET /api/students/123
```

Response:

```json
{
  "data": {
    "id": "123",
    "name": "Mulia"
  }
}
```

---

# 4. Base Path

Public Core API routes should use:

```text
/api
```

Examples:

```text
/api/auth
/api/students
/api/lecturers
/api/krs
/api/grades
/api/attendance
/api/tuition
/api/payments
```

Exact existing route names must be preserved unless an explicit migration changes them.

---

# 5. Resource Naming

Prefer plural nouns.

Good:

```text
/students
/lecturers
/courses
/payments
```

Avoid action-heavy routing such as:

```text
/getStudents
/createStudent
/deleteStudent
```

when standard HTTP semantics can express the operation.

---

# 6. HTTP Method Conventions

Use:

```text
GET
→ retrieve data

POST
→ create a resource or execute a non-idempotent command

PUT
→ full replacement when applicable

PATCH
→ partial update

DELETE
→ remove resource
```

Example:

```text
GET    /api/students
GET    /api/students/:id
POST   /api/students
PATCH  /api/students/:id
DELETE /api/students/:id
```

---

# 7. Command Endpoints

Not every domain action maps cleanly to CRUD.

State transitions may use explicit command endpoints.

Examples:

```text
POST /api/krs/:id/submit

POST /api/krs/:id/approve

POST /api/krs/:id/reject
```

This is preferable to hiding complex state transitions inside an ambiguous generic update.

Commands must still enforce:

```text
authentication
authorization
business rules
state transition rules
idempotency where required
```

---

# 8. Success Response Contract

For a single resource, preferred canonical response:

```json
{
  "data": {
    "id": "student-123",
    "name": "Mulia"
  }
}
```

Do not unnecessarily wrap data in multiple nested levels such as:

```json
{
  "success": true,
  "result": {
    "response": {
      "data": {}
    }
  }
}
```

---

# 9. Collection Response Contract

Preferred paginated collection:

```json
{
  "data": [
    {
      "id": "student-1",
      "name": "Student One"
    },
    {
      "id": "student-2",
      "name": "Student Two"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# 10. Metadata

`meta` is reserved for response-level metadata.

Examples:

```text
pagination

aggregation metadata

non-resource response context
```

Do not place normal domain fields inside `meta`.

---

# 11. Non-Paginated Collections

If a collection is intentionally small and pagination is unnecessary:

```json
{
  "data": [
    {
      "id": "A"
    },
    {
      "id": "B"
    }
  ]
}
```

Do not invent pagination metadata when pagination does not exist.

---

# 12. Mutation Response

A successful mutation may return the updated resource:

```json
{
  "data": {
    "id": "student-123",
    "status": "ACTIVE"
  }
}
```

When returning a resource provides useful frontend state, prefer returning it rather than requiring an immediate extra GET request.

---

# 13. Delete Response

For successful deletion, use one of these patterns consistently for the endpoint being designed.

Option A:

```http
204 No Content
```

with no body.

Option B when deleted-resource information is useful:

```http
200 OK
```

```json
{
  "data": {
    "id": "student-123"
  }
}
```

Do not return:

```json
{
  "success": true
}
```

without a reason if canonical resource semantics are available.

Existing endpoint behavior may remain for compatibility.

---

# 14. Error Contract

Canonical error response:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource not found",
  "requestId": "req_..."
}
```

Optional details may be included when safe:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "requestId": "req_...",
  "details": {
    "fields": {
      "email": "Invalid email format"
    }
  }
}
```

---

# 15. Error Fields

Canonical fields:

```text
code
message
requestId
details?
```

## `code`

Machine-readable stable error identifier.

Example:

```text
STUDENT_NOT_FOUND
KRS_ALREADY_SUBMITTED
FORBIDDEN
VALIDATION_ERROR
```

## `message`

Human-readable safe explanation.

## `requestId`

Correlation identifier for diagnostics.

## `details`

Optional structured safe information.

---

# 16. Error Code Naming

Use uppercase snake case.

Examples:

```text
INVALID_CREDENTIALS

STUDENT_NOT_FOUND

KRS_NOT_FOUND

KRS_ALREADY_SUBMITTED

COURSE_PREREQUISITE_NOT_MET

SCHEDULE_CONFLICT

PAYMENT_ALREADY_PROCESSED
```

Avoid using raw exception class names as public API error codes.

---

# 17. Error Codes Must Be Stable

Frontend and AI consumers may depend on error codes.

Do not casually rename:

```text
KRS_NOT_FOUND
```

to:

```text
MISSING_KRS
```

after consumers already depend on it.

Treat public error codes as part of the contract.

---

# 18. HTTP Status Codes

Preferred semantics:

```text
200 OK
Successful read or mutation.

201 Created
Resource successfully created.

202 Accepted
Request accepted for asynchronous processing.

204 No Content
Successful operation with no response body.

400 Bad Request
Invalid request syntax or validation.

401 Unauthorized
Authentication required or invalid.

403 Forbidden
Authenticated but not permitted.

404 Not Found
Resource or route not found.

409 Conflict
Business or resource state conflict.

413 Payload Too Large
Upload/request exceeds configured limit.

415 Unsupported Media Type
Unsupported file/content type.

422 Unprocessable Content
Optional for semantic validation if explicitly adopted.

429 Too Many Requests
Rate limit exceeded.

500 Internal Server Error
Unexpected application failure.

502 Bad Gateway
Upstream service returned invalid failure when applicable.

503 Service Unavailable
Service temporarily unable to serve request.

504 Gateway Timeout
Upstream dependency timed out when applicable.
```

---

# 19. 401 vs 403

Use:

```text
401
→ identity is missing or invalid

403
→ identity is known but action is forbidden
```

Example:

```text
No JWT
→ 401
```

```text
Student calling admin-only route
→ 403
```

---

# 20. 404 Semantics

There are two broad categories.

Unknown route:

```json
{
  "code": "ROUTE_NOT_FOUND",
  "message": "Route not found",
  "requestId": "..."
}
```

Missing domain resource:

```json
{
  "code": "STUDENT_NOT_FOUND",
  "message": "Student not found",
  "requestId": "..."
}
```

Security-sensitive endpoints may intentionally obscure resource existence when required.

---

# 21. 409 Conflict

Use 409 for state conflicts.

Examples:

```text
duplicate unique resource

KRS already submitted

invalid current state transition

payment already processed

course already registered
```

Example:

```json
{
  "code": "KRS_ALREADY_SUBMITTED",
  "message": "KRS has already been submitted",
  "requestId": "..."
}
```

---

# 22. 500 Errors

Unexpected errors should return a safe response.

Example:

```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "requestId": "..."
}
```

Never expose:

```text
stack trace

Prisma internals

database credentials

SQL

AWS secrets

filesystem paths
```

to public clients.

---

# 23. Validation Errors

Validation failures should be machine-readable when practical.

Example:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "requestId": "req_123",
  "details": {
    "fields": {
      "nim": "NIM is required",
      "semester": "Semester must be a positive integer"
    }
  }
}
```

Exact validation implementation follows the existing backend approach.

Backend Zod is not part of the architecture.

---

# 24. Authentication Header

Authenticated API requests should use:

```http
Authorization: Bearer <access-token>
```

Do not introduce multiple authentication conventions without need.

---

# 25. Authentication Authority

The backend decides identity.

Do not trust identity from:

```text
request body

query parameters

frontend Redux state

AI model output
```

for authorization.

---

# 26. Ownership

For "my" operations, prefer identity from authenticated context.

Example:

```text
GET /api/me/grades
```

or an equivalent protected domain route.

Prefer:

```text
authenticated user
→ resolve student
→ retrieve grades
```

over accepting arbitrary:

```text
studentId
```

from an AI-generated tool argument.

---

# 27. Role Authorization

Common roles may include:

```text
ADMIN
DOSEN
MAHASISWA
```

The API must enforce role access independently from frontend rendering.

Example:

```text
Frontend hides admin menu
+
Core API still enforces ADMIN
```

---

# 28. Resource Authorization

Role access does not automatically grant access to every resource.

Examples:

```text
DOSEN
→ may only grade authorized classes

MAHASISWA
→ may only access own protected academic data
```

Service-level business authorization should remain explicit.

---

# 29. Request ID

Every HTTP request should have a request ID.

Recommended response header:

```http
X-Request-Id: <request-id>
```

Canonical errors include:

```json
{
  "requestId": "..."
}
```

Request IDs support:

```text
logs
debugging
distributed tracing
support investigation
```

They are not authentication credentials.

---

# 30. Incoming Request IDs

If incoming request IDs are supported:

- validate format
- reject or replace unsafe values
- enforce reasonable length

Do not allow arbitrary huge or malicious values to become log metadata.

---

# 31. Service-to-Service Correlation

AI Service → Core API should propagate correlation identifiers where practical.

Concept:

```text
User Request

requestId A
    ↓
AI Service
    ↓
Core API

traceId shared where tracing exists
```

Do not rely on request IDs for authorization.

---

# 32. Content Type

JSON API requests should use:

```http
Content-Type: application/json
```

unless the endpoint explicitly accepts:

```text
multipart/form-data
text/event-stream
```

or another documented format.

---

# 33. Date and Time

API dates should use ISO 8601 representation.

Example:

```json
{
  "createdAt": "2026-10-06T12:30:00.000Z"
}
```

Avoid ambiguous strings such as:

```text
06/10/26
```

unless the field represents a date-only domain value and the contract explicitly defines its format.

---

# 34. Date-Only Fields

For actual calendar dates without time semantics:

```text
YYYY-MM-DD
```

Example:

```json
{
  "dateOfBirth": "2002-03-28"
}
```

Do not automatically convert date-only business values into timestamps when it changes meaning.

---

# 35. Timezone

Stored timestamps should normally use UTC.

Frontend handles user-local display.

Domain-specific schedules may require an explicit local timezone policy.

Do not infer timezone from ambiguous strings.

---

# 36. IDs

IDs should be treated as opaque values by consumers.

A client should not depend on whether an ID internally happens to be:

```text
integer
UUID
CUID
database sequence
```

unless explicitly documented.

---

# 37. Boolean Values

Use real JSON booleans.

Good:

```json
{
  "active": true
}
```

Avoid:

```json
{
  "active": "true"
}
```

unless preserving a legacy contract.

---

# 38. Numeric Values

Use JSON numbers for actual numeric values where precision semantics permit.

Be cautious with monetary values.

Do not rely on floating-point arithmetic for financial calculations if exact decimal semantics are required.

---

# 39. Money

Payment-related fields should define their unit clearly.

Example:

```json
{
  "amount": 1500000,
  "currency": "IDR"
}
```

If amount uses the smallest currency unit, document it explicitly.

Do not mix formatted strings:

```text
Rp1.500.000
```

with calculation values in the API.

Formatting belongs primarily to presentation.

---

# 40. Enum Values

Enums should be stable.

Example:

```json
{
  "status": "DIAJUKAN"
}
```

Do not change enum strings casually once consumed by frontend, AI tools, or external integrations.

KRS status changes must follow the KRS Domain Audit.

---

# 41. Nullable Fields

Differentiate:

```text
field absent

field = null

field = empty string
```

Do not use them interchangeably without contract semantics.

Example:

```json
{
  "phoneNumber": null
}
```

can mean "known field with no value".

---

# 42. Pagination

Preferred query:

```http
GET /api/students?page=1&limit=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

---

# 43. Pagination Defaults

Every paginated endpoint should define:

```text
default page

default limit

maximum limit
```

Do not allow unbounded client-controlled limits.

Example direction:

```text
page >= 1

limit >= 1

limit <= configured maximum
```

Exact limits may differ by resource.

---

# 44. Empty Pagination

For no results:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Do not return 404 merely because a collection is empty.

---

# 45. Filtering

Filters should use explicit query parameters.

Example:

```http
GET /api/students?status=ACTIVE&programId=123
```

Do not accept unrestricted arbitrary database filter objects from clients.

Bad:

```json
{
  "where": {
    "anything": {}
  }
}
```

---

# 46. Search

Search may use:

```http
GET /api/students?search=mulia
```

The contract should define which fields participate in search.

Do not promise full-text semantics unless actually implemented.

---

# 47. Sorting

Preferred:

```http
GET /api/students?sortBy=name&sortOrder=asc
```

Only allow approved sort fields.

Do not pass arbitrary client-provided property names directly into database operations without validation.

---

# 48. Sort Order

Allowed values:

```text
asc
desc
```

Invalid values should return a controlled validation error.

---

# 49. Field Selection

Do not expose arbitrary client-controlled Prisma `select`.

If sparse fieldsets are required later, create an explicit API contract.

---

# 50. Resource Expansion

Avoid arbitrary client-controlled relational includes such as:

```text
?include=everything
```

unless explicitly designed.

Unbounded relation expansion can create:

```text
security leaks
large responses
performance problems
```

---

# 51. API Versioning

Do not introduce versioning only for appearance.

Current direction may remain:

```text
/api/...
```

Introduce versioning when a genuinely incompatible public contract requires coexistence.

Possible future:

```text
/api/v1/...
```

Versioning strategy must be deliberate.

---

# 52. Backward Compatibility

Existing consumers include:

```text
React frontend

tests

AI Service in the future

workers

external integrations in the future
```

Before changing an existing response:

```text
identify consumers
    ↓
assess compatibility
    ↓
migrate safely
```

---

# 53. Legacy Endpoints

Legacy endpoints may preserve existing response shapes.

Example:

```text
Legacy endpoint
→ current contract remains

New endpoint
→ canonical contract

Migrated endpoint
→ canonical contract after consumer updates
```

Do not perform a global response-shape rewrite.

---

# 54. Contract Migration

Preferred migration process:

```text
Characterize current response
      ↓
Identify consumers
      ↓
Add/update tests
      ↓
Update backend
      ↓
Update consumers
      ↓
Regression validation
```

For risky contracts, consider temporary compatibility layers.

---

# 55. Deprecation

If an endpoint becomes obsolete, do not remove it immediately when active consumers may remain.

A deprecation plan should identify:

```text
replacement endpoint

known consumers

migration deadline

removal criteria
```

---

# 56. OpenAPI

OpenAPI is the target machine-readable documentation format.

New/migrated routes should eventually document:

```text
path
method
authentication
parameters
request body
success response
error responses
pagination
```

Swagger UI may expose the documentation for development/testing.

---

# 57. OpenAPI Is Documentation, Not Runtime Security

OpenAPI does not enforce:

```text
authentication

authorization

ownership

business rules
```

Backend code remains authoritative.

---

# 58. Internal AI API Contract

The AI Assistant is a separate service.

Preferred flow:

```text
AI Service
    ↓
Approved Core API
    ↓
Authorization
    ↓
Domain Service
```

Internal AI endpoints must still have explicit contracts.

---

# 59. AI Must Not Depend on Database Schema

AI Service should not need to understand Prisma database models directly.

Avoid:

```text
AI tool
→ Prisma-specific object structure
```

Prefer stable API DTOs.

This keeps AI Service decoupled from internal database implementation.

---

# 60. AI "My" Endpoints

Where practical, expose identity-safe capabilities.

Example conceptual routes:

```text
GET /api/me/profile

GET /api/me/schedule

GET /api/me/grades

GET /api/me/attendance

GET /api/me/tuition

GET /api/me/krs
```

Exact routes should only be introduced through an ExecPlan.

The architectural principle is more important than the exact naming.

---

# 61. AI Tool Mapping

Example:

```text
AI Tool:
get_my_grades

         ↓

Core API:
GET /api/me/grades

         ↓

Authenticated identity

         ↓

StudentAcademicService
```

The LLM does not choose an arbitrary student ID.

---

# 62. AI Service Identity

Service-to-service communication must distinguish:

```text
Service identity

End-user identity
```

The exact production mechanism for authenticating AI Service → Core API should be defined in the AI/service deployment ExecPlan.

Do not implement insecure trust using public forgeable headers.

---

# 63. Internal Headers

Do not rely on headers such as:

```http
X-User-Role: ADMIN
X-User-Id: 123
```

when public clients could forge them.

If internal identity headers are eventually used, they must exist behind a trusted authenticated service boundary and public input must not be allowed to impersonate them.

---

# 64. AI Tool Errors

Core API errors should remain structured when consumed by the AI Service.

Example:

```json
{
  "code": "KRS_NOT_FOUND",
  "message": "KRS not found",
  "requestId": "..."
}
```

The AI Service can convert this into a natural-language explanation.

Do not expose raw Prisma errors to the model.

---

# 65. AI Timeout Contract

AI → Core API calls must use bounded timeouts.

Timeout should be distinguishable from:

```text
404
403
validation error
```

AI should not hallucinate data after a tool timeout.

---

# 66. AI Streaming API

AI chat may use Server-Sent Events.

Example endpoint direction:

```http
POST /ai/chat
```

Response:

```http
Content-Type: text/event-stream
```

Exact route and event schema should be defined in the AI Assistant ExecPlan.

---

# 67. SSE Event Contract

Potential future event types:

```text
message.start

message.delta

tool.start

tool.complete

message.complete

error
```

Example conceptual event:

```text
event: message.delta
data: {"content":"Jadwal Anda..."}
```

The exact schema should remain small and versionable.

---

# 68. SSE Error Behavior

If failure occurs after the HTTP stream has started, the service cannot simply switch to a normal JSON error response.

Use a controlled SSE error event.

Concept:

```text
event: error
data: {
  "code": "AI_PROVIDER_UNAVAILABLE",
  "message": "AI service is temporarily unavailable",
  "requestId": "..."
}
```

Then close the stream appropriately.

---

# 69. Client Disconnect

SSE implementation should detect client disconnection where practical.

Unnecessary LLM or tool execution should be cancelled where supported.

---

# 70. Async HTTP Operations

For operations moved to background jobs, use:

```http
202 Accepted
```

when the request is successfully accepted but not yet completed.

Example:

```json
{
  "data": {
    "jobId": "job-123",
    "status": "QUEUED"
  }
}
```

Do not return success if queue publishing failed.

---

# 71. Job Status

If clients need asynchronous job tracking, a future contract may provide:

```text
GET /api/jobs/:jobId
```

Example:

```json
{
  "data": {
    "id": "job-123",
    "status": "PROCESSING"
  }
}
```

Potential states:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
```

Only introduce this if a real use case requires it.

---

# 72. RabbitMQ Is Not a Public API

Do not expose RabbitMQ message semantics directly to frontend clients.

Public API:

```text
HTTP
```

Internal async transport:

```text
RabbitMQ
```

These contracts should remain separated.

---

# 73. File Upload Contract

File endpoints should explicitly define:

```text
maximum size

allowed types

ownership

storage behavior

response metadata
```

Use:

```text
multipart/form-data
```

when appropriate.

---

# 74. File Upload Response

Example:

```json
{
  "data": {
    "id": "document-123",
    "fileName": "academic-guide.pdf",
    "status": "UPLOADED"
  }
}
```

Do not expose internal filesystem paths or raw S3 credentials.

---

# 75. Private File Access

Private files should not automatically expose public S3 URLs.

The API may eventually return:

```text
controlled application endpoint

or

short-lived signed URL
```

depending on the use case.

Authorization must occur before private access is granted.

---

# 76. RAG Document API

Future RAG documents may have lifecycle states.

Example:

```text
UPLOADED
PROCESSING
READY
FAILED
```

Response:

```json
{
  "data": {
    "id": "document-123",
    "status": "PROCESSING"
  }
}
```

The document should not be treated as searchable until indexing completes successfully.

---

# 77. Payment API Contract

Payment APIs require stricter contract rules.

Frontend request:

```text
Core API
→ create or retrieve payment process
```

Provider webhook:

```text
Payment Provider
→ Core API webhook endpoint
```

Frontend must never directly mark a payment as successful.

---

# 78. Payment Amount

Payment amount must be calculated or verified by trusted backend logic.

Do not trust:

```json
{
  "amount": 100
}
```

from the browser as authoritative when the actual tuition is determined by backend data.

---

# 79. Payment Webhook

Webhook endpoints should return status according to provider requirements, but only after appropriate authenticity verification and processing behavior.

Webhook payloads are external untrusted input.

---

# 80. Idempotency

Operations vulnerable to duplicate submission should define idempotency strategy.

Candidates:

```text
payments

queue-triggering requests

report generation

AI state-changing actions
```

Do not add generic idempotency infrastructure to every endpoint unless required.

---

# 81. Idempotency Key

If HTTP idempotency keys are introduced later, an example convention may be:

```http
Idempotency-Key: <unique-client-key>
```

Exact behavior must define:

```text
scope

expiration

duplicate response behavior

storage
```

before implementation.

---

# 82. Rate Limit Response

When rate limiting is implemented:

```http
429 Too Many Requests
```

Canonical response:

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "requestId": "..."
}
```

Additional rate-limit headers may be added consistently if required.

---

# 83. Health Contract

Core API:

```http
GET /health/live
GET /health/ready
```

Liveness means:

```text
process alive
```

Readiness means:

```text
ready to receive traffic
```

---

# 84. Liveness Response

Preferred minimal response:

```json
{
  "status": "ok"
}
```

Do not expose unnecessary infrastructure details.

---

# 85. Readiness Response

Healthy:

```json
{
  "status": "ready"
}
```

Unavailable:

```http
503 Service Unavailable
```

```json
{
  "status": "not_ready"
}
```

Avoid exposing credentials, hostnames, or sensitive database internals.

---

# 86. Metrics Endpoint

Future Prometheus endpoint:

```text
/metrics
```

This endpoint does not follow the JSON API contract because Prometheus uses its own exposition format.

Production exposure should follow infrastructure/security requirements.

---

# 87. Empty Resource vs Missing Resource

Collection:

```text
GET /api/students?search=unlikely-name
```

No match:

```http
200 OK
```

```json
{
  "data": [],
  "meta": {
    "...": "..."
  }
}
```

Specific resource:

```text
GET /api/students/not-found
```

should normally return:

```http
404
```

---

# 88. Optional Relationships

Do not return fake placeholder objects for missing optional relationships.

Prefer:

```json
{
  "advisor": null
}
```

if the relationship is legitimately absent.

---

# 89. Sensitive Fields

API DTOs should expose only required fields.

Never accidentally serialize complete Prisma objects containing:

```text
password hash

refresh token

internal secrets

private system metadata
```

Use explicit response selection/mapping for sensitive resources.

---

# 90. Password Fields

Passwords must never appear in normal resource responses.

Example:

```json
{
  "data": {
    "id": "user-1",
    "email": "user@example.com"
  }
}
```

Never:

```json
{
  "password": "...",
  "passwordHash": "..."
}
```

---

# 91. Internal Database Fields

Database implementation details should not automatically become API fields.

Example:

```text
Prisma model has internal column
```

does not mean:

```text
public API must expose it
```

DTO boundaries should be intentional.

---

# 92. Response Ordering

If collection ordering matters to consumers, define it.

Avoid depending on implicit database ordering.

Example:

```text
Default:
createdAt desc
```

or another domain-appropriate order.

Do not change meaningful ordering casually.

---

# 93. API Performance

Endpoints should avoid:

```text
unbounded result sets

huge nested relations

unnecessary binary payloads

obvious N+1 queries
```

Performance improvements must preserve contract correctness.

---

# 94. Cache Transparency

When Redis is introduced, caching should not normally change the public API contract.

Client should not need to know whether the result came from:

```text
PostgreSQL

or

Redis
```

Correctness remains the same.

---

# 95. API Reliability

External/internal dependency failure should map to controlled API behavior.

Example:

```text
AI provider unavailable
→ AI-specific service error

Core PostgreSQL unavailable
→ relevant Core API failure/readiness failure
```

Do not return fabricated successful data.

---

# 96. Timeouts

HTTP clients must use bounded timeouts for service-to-service communication.

Timeout behavior should map to an explicit controlled error.

Avoid hanging requests indefinitely.

---

# 97. Retries

Clients should not blindly retry every failure.

Do not automatically retry:

```text
400
401
403
most 404
business conflict
```

Transient failures may be retried according to reliability policy.

---

# 98. Logging Contract Awareness

Do not log complete sensitive API bodies by default.

Safe metadata:

```text
requestId
method
route
statusCode
duration
errorCode
```

Use care with:

```text
grades
financial data
AI prompts
personal data
```

---

# 99. API Security Invariant

Every protected API operation must ultimately satisfy:

```text
Authentication
      ↓
Authorization
      ↓
Ownership / Scope
      ↓
Business Rules
      ↓
Data Access
```

This remains true whether the caller is:

```text
React

AI Assistant

future worker

future external integration
```

---

# 100. Testing Contract

New or migrated API endpoints should have appropriate tests for:

```text
success

authentication

authorization

validation

missing resource

business conflict

unexpected failure where practical
```

High-risk endpoints require stronger coverage.

---

# 101. Contract Tests

Internal AI/Core integration should eventually use contract-focused tests.

Example:

```text
AI expects Core API grades DTO

Core API returns expected fields

Error code semantics preserved
```

Do not make the AI Service depend only on undocumented implementation behavior.

---

# 102. OpenAPI Contract Validation

When OpenAPI is introduced, documentation should stay aligned with actual runtime behavior.

A documented 200 response that actually returns a different structure is a contract defect.

---

# 103. Breaking Change Definition

Examples of breaking API changes:

```text
removing a response field

renaming a response field

changing field type

changing enum value

changing authentication behavior

changing status code relied upon by clients

changing ownership semantics

changing pagination structure
```

Breaking changes require explicit migration planning.

---

# 104. Non-Breaking Additions

Usually safer additions include:

```text
new optional response field

new endpoint

new optional query parameter

new error code for previously undocumented failure
```

But consumers must still be considered.

---

# 105. Contract Decision Priority

When deciding between theoretical consistency and existing compatibility:

```text
Correctness
    ↓
Security
    ↓
Compatibility
    ↓
Canonical consistency
```

Do not break a functioning consumer merely to make JSON look cleaner.

---

# 106. Canonical New API Checklist

For a new endpoint, define:

```text
HTTP method

route

authentication

authorization

input

validation

success status

success body

error codes

pagination if required

ownership rules

logging behavior

tests
```

---

# 107. API Review Questions

Before completing an endpoint, ask:

```text
Is the route predictable?

Is authentication required?

Who is authorized?

Can one user access another user's data?

Is input validated?

Is response typed?

Are sensitive fields excluded?

Is the status code correct?

Are errors machine-readable?

Is requestId available?

Does pagination have limits?

Is backward compatibility preserved?

Can AI safely consume this contract later?
```

---

# 108. Current Contract Migration Policy

The repository currently contains brownfield APIs.

Therefore:

```text
Existing working legacy endpoint
→ preserve by default

New endpoint
→ use canonical contract

Significantly migrated endpoint
→ adopt canonical contract when consumers are migrated safely
```

Do not create a repository-wide response migration without an approved ExecPlan.

---

# 109. Target Consumer Architecture

Long-term:

```text
React Frontend
       │
       ├─────────────┐
       │             │
       ▼             ▼
   Core API       AI Service
                     │
                     ▼
                  Core API
```

Core API contracts therefore need to support both human-facing frontend workflows and controlled AI tool workflows.

---

# 110. Final API Principle

The API is an architectural boundary.

It should protect the Core SIAKAD from consumers depending on internal implementation details.

Preferred:

```text
Consumer
   ↓
Stable Contract
   ↓
Controller
   ↓
Service
   ↓
Prisma
```

Not:

```text
Consumer
   ↓
Database assumptions
```

The final rule is:

> **Expose stable domain capabilities, not internal implementation details. Preserve compatibility deliberately, and let the Core API remain the authoritative boundary for protected academic and financial data.**