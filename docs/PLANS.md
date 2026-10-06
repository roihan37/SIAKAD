# PLANS.md

## Purpose

This document defines how engineering work is planned and executed in the SIAKAD repository.

The repository uses a Harness Engineering workflow.

Large or risky changes must not begin as vague implementation requests.

They should be converted into explicit, reviewable, milestone-based ExecPlans.

An ExecPlan is a living engineering document that explains:

- why the work exists
- what problem is being solved
- what is intentionally excluded
- how the current system behaves
- what the target state is
- how implementation will be divided
- how each milestone will be validated
- what risks exist
- how changes can be rolled back
- what progress has actually been completed

---

# 1. Planning Philosophy

The purpose of planning is not to predict every implementation detail in advance.

The purpose is to reduce uncontrolled change.

Preferred workflow:

```text
Problem
  ↓
Inspect Current State
  ↓
Define Goal
  ↓
Define Non-Goals
  ↓
Create ExecPlan
  ↓
Break Into Milestones
  ↓
Implement One Milestone
  ↓
Validate
  ↓
Review Diff
  ↓
Update Plan
  ↓
Commit
  ↓
Next Milestone
```

Do not create plans merely for documentation appearance.

A plan should help execution.

---

# 2. When an ExecPlan Is Required

An ExecPlan is required for substantial work such as:

- architecture refactors
- domain redesign
- KRS restructuring
- major service extraction
- AI Assistant implementation
- AI tool calling
- RAG
- pgvector
- RabbitMQ
- Redis
- observability
- payment gateway
- Docker architecture
- CI/CD redesign
- AWS deployment
- production hardening
- Terraform
- large frontend structural changes
- security-sensitive migrations
- changes spanning multiple modules
- changes expected to require several commits

Examples:

```text
GOOD:
docs/exec-plans/active/krs-domain-audit.md

GOOD:
docs/exec-plans/active/ai-assistant-foundation.md

GOOD:
docs/exec-plans/active/rabbitmq-document-indexing.md
```

---

# 3. When an ExecPlan Is Not Required

Small, isolated changes generally do not require a full ExecPlan.

Examples:

- typo fix
- small CSS adjustment
- simple bug fix with obvious scope
- one validation correction
- updating documentation wording
- small test correction
- one dependency patch with no architecture impact

Even without an ExecPlan, normal validation rules still apply.

---

# 4. ExecPlan Location

Active plans live in:

```text
docs/exec-plans/active/
```

Completed plans move to:

```text
docs/exec-plans/completed/
```

Technical debt is tracked in:

```text
docs/exec-plans/tech-debt-tracker.md
```

Do not delete completed plans.

They serve as engineering history.

---

# 5. One Active Problem at a Time

Prefer one major active ExecPlan at a time.

Do not simultaneously execute unrelated major initiatives such as:

```text
KRS redesign
+
AI Assistant
+
RabbitMQ
+
AWS deployment
```

unless there is a clear dependency and explicit coordination plan.

The default is:

```text
Finish one coherent plan
        ↓
Close it
        ↓
Start the next
```

This keeps:

- scope understandable
- regressions easier to identify
- commits reviewable
- architecture evolution traceable

---

# 6. Plan Naming

Use descriptive kebab-case names.

Examples:

```text
krs-domain-audit.md

ai-assistant-foundation.md

ai-tool-calling.md

ai-rag.md

rabbitmq-document-indexing.md

redis-cache-foundation.md

observability-foundation.md

aws-production-deployment.md
```

Avoid vague names such as:

```text
improvements.md

backend-fixes.md

phase-2.md

misc-refactor.md
```

---

# 7. Required ExecPlan Structure

Every substantial ExecPlan should contain the following sections.

```text
Title

Status

Context

Problem Statement

Goal

Non-Goals

Constraints

Current State

Target State

Architecture Impact

Milestones

Validation Strategy

Security Considerations

Reliability Considerations

Compatibility

Risks

Rollback Strategy

Progress

Decisions

Discovered Technical Debt

Exit Criteria
```

Sections may be expanded when the domain requires it.

---

# 8. ExecPlan Template

Use the following template.

```markdown
# <Plan Name>

## Status

ACTIVE

## Context

Explain why this work exists.

Include relevant history and architectural context.

## Problem Statement

Describe the concrete problem.

Do not describe only the desired technology.

Bad:

"Add Redis."

Good:

"Dashboard aggregation repeatedly performs expensive queries and
requires a bounded caching strategy."

## Goal

Describe the desired outcome.

## Non-Goals

Explicitly list what this plan will not do.

## Constraints

Examples:

- preserve existing API behavior
- preserve frontend compatibility
- no repository-wide refactor
- no database redesign
- no unrelated dependency migration
- no new infrastructure outside this plan

## Current State

Describe how the repository currently works.

Use actual code and tests as evidence.

Do not rely only on assumptions or historical chat context.

## Target State

Describe what should exist when the plan is complete.

## Architecture Impact

Describe which architectural boundaries are affected.

Examples:

- controller → service
- Core API ↔ AI Service
- RabbitMQ producer ↔ worker
- frontend ↔ API contract

## Milestones

### M0 - Preconditions

Tasks:

- ...

Validation:

- ...

Completion criteria:

- ...

### M1 - ...

Tasks:

- ...

Validation:

- ...

Completion criteria:

- ...

## Validation Strategy

Focused validation:

- ...

Full validation:

- ...

## Security Considerations

- ...

## Reliability Considerations

- ...

## Compatibility

Describe compatibility expectations.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| ... | ... | ... |

## Rollback Strategy

Explain how to return to the previous stable state.

## Progress

- [ ] M0 ...
- [ ] M1 ...
- [ ] M2 ...

## Decisions

Record meaningful decisions made during implementation.

## Discovered Technical Debt

Record debt found during this plan that is outside scope.

## Exit Criteria

- [ ] implementation complete
- [ ] focused tests pass
- [ ] regression tests pass
- [ ] lint passes
- [ ] typecheck passes
- [ ] production build passes
- [ ] security invariants preserved
- [ ] documentation updated
- [ ] diff reviewed
- [ ] technical debt recorded
```

---

# 9. Context Section

The Context section explains why this work matters.

Good context includes:

- historical reason
- existing implementation limitations
- architectural direction
- relevant completed work
- dependencies on previous plans

Example:

```text
Student Service Extraction has been completed.

KRS remains one of the next high-risk academic domains and is also
expected to be consumed by the future AI Assistant.

Before exposing KRS capabilities through AI tools, its current state
model and service boundaries need to be understood.
```

Context should not become a full implementation specification.

---

# 10. Problem Statement

The problem should describe an actual problem.

Avoid technology-first statements.

Bad:

```text
We need RabbitMQ.
```

Better:

```text
Document indexing may require parsing, chunking and embedding large
documents. Performing the entire operation inside the upload HTTP
request would increase request duration and make retry behavior
difficult.
```

Then RabbitMQ becomes a solution to a real problem.

---

# 11. Goals

Goals should describe measurable outcomes.

Example:

```text
The AI Service can call approved student tools through the Core API
while preserving authentication, authorization and ownership rules.
```

Avoid:

```text
Make AI better.
```

---

# 12. Non-Goals

Non-Goals are mandatory.

They prevent accidental scope expansion.

Example for AI Tool Calling:

```text
Non-Goals:

- no RAG
- no document upload
- no RabbitMQ
- no Redis
- no admin AI tools
- no lecturer AI tools
- no production AWS deployment
```

This gives the agent permission to leave unrelated issues alone.

---

# 13. Constraints

Constraints define boundaries the implementation must respect.

Common SIAKAD constraints include:

```text
Preserve existing API compatibility.

Do not introduce TanStack Query.

Do not introduce backend Zod.

Do not introduce Repository Pattern.

Do not bypass Core API authorization.

Do not give AI direct Prisma access.

Do not rewrite unrelated legacy code.

Do not weaken existing tests.

Do not patch generated dist output directly.
```

---

# 14. Current State Must Be Verified

Before implementation begins, inspect actual repository state.

Do not assume:

- previous plans are fully implemented
- documentation is perfectly current
- chat history reflects current code
- file names have not changed
- test counts remain the same

For every substantial plan:

```text
Documentation
      +
Actual Repository
      +
Tests
      ↓
Current State
```

If the plan disagrees with the repository, reconcile it before major changes.

---

# 15. Target State

The Target State should explain the intended result without over-specifying implementation.

Example:

```text
AI Service
   ↓
Approved Tool
   ↓
Core REST API
   ↓
RBAC
   ↓
Domain Service
   ↓
Prisma
```

It should clearly distinguish target architecture from current implementation.

---

# 16. Milestone Design

A milestone should be:

- coherent
- independently reviewable
- independently testable
- small enough to understand
- meaningful enough to complete a real slice

Avoid milestones like:

```text
M1 - Refactor everything
```

Prefer:

```text
M1 - Add AI service health endpoint

M2 - Establish Ollama provider

M3 - Add basic non-tool chat

M4 - Add SSE streaming
```

---

# 17. Milestone Size

A milestone should normally represent one logical commit or a small set of tightly related commits.

Prefer:

```text
1 milestone
≈
1 coherent engineering change
```

Not every milestone must be exactly one commit, but unrelated work must not be bundled.

---

# 18. M0 Preconditions

Substantial plans should normally begin with an M0.

M0 verifies that the repository is ready for the work.

Example:

```text
M0 Preconditions

- active branch understood
- working tree reviewed
- relevant baseline tests pass
- current architecture mapped
- affected files identified
- compatibility requirements documented
```

M0 should not perform large production changes.

---

# 19. Characterization Before Refactor

For brownfield behavior that is poorly documented:

```text
Existing behavior
      ↓
Characterization Test
      ↓
Refactor
```

Do not restructure high-risk legacy logic without understanding current behavior.

Characterization tests are especially important for:

- transactions
- status transitions
- payments
- KRS
- student updates
- file cleanup
- authorization
- ownership
- date handling

---

# 20. Implementation Loop

Every milestone follows:

```text
Read
 ↓
Inspect
 ↓
Baseline
 ↓
Implement
 ↓
Focused Validate
 ↓
Full Validate
 ↓
Inspect Diff
 ↓
Update Plan
 ↓
Commit
```

---

# 21. Step 1 - Read

Read:

```text
AGENTS.md

ARCHITECTURE.md

BACKEND.md or FRONTEND.md

relevant design documents

active ExecPlan
```

Do not begin implementation before understanding the relevant rules.

---

# 22. Step 2 - Inspect

Inspect actual implementation.

Typical questions:

```text
Where is the current behavior implemented?

Which tests protect it?

Which API consumers depend on it?

Which modules call this code?

Are there side effects?

Are transactions involved?

Are there security boundaries?
```

Do not guess.

---

# 23. Step 3 - Baseline

Run relevant tests before major changes when practical.

For backend:

```bash
cd server

npm run lint
npm run typecheck
npm test
npm run build
```

If only a focused baseline is appropriate initially, record what was run.

Do not silently begin from a broken baseline.

If baseline is broken, determine whether the failure is:

```text
Application bug

Test bug

Environment limitation

Known pre-existing issue
```

Record the distinction.

---

# 24. Step 4 - Implement

Implement the smallest coherent change that satisfies the current milestone.

Do not implement future milestones early unless technically unavoidable.

Example:

If current work is:

```text
Prometheus metrics
```

do not also add:

```text
Grafana
Loki
Tempo
```

in the same milestone.

---

# 25. Step 5 - Focused Validation

Run the smallest relevant validation first.

Examples:

```text
student tests

KRS tests

AI tool tests

RabbitMQ worker tests

health endpoint tests
```

Focused validation provides faster feedback.

---

# 26. Step 6 - Full Validation

After focused validation passes, run full relevant quality gates.

Backend:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Frontend:

Use the actual scripts defined in the frontend package for:

```text
lint

typecheck if available

tests if available

production build
```

Never invent a script that does not exist.

---

# 27. Environment-Limited Validation

Some agent environments may block:

- loopback sockets
- external network access
- Docker
- system services
- AWS access

Do not weaken application tests to accommodate those restrictions.

When validation is blocked:

1. run all validation the environment permits
2. record the exact limitation
3. distinguish environment failure from application failure
4. run blocked validation on host or CI
5. treat host/CI result as authoritative when appropriate

Example:

```text
Sandbox:
EPERM listen 127.0.0.1

Host:
HTTP integration test PASS
```

This is not an application failure.

---

# 28. Step 7 - Inspect Diff

Before declaring a milestone complete, inspect:

```bash
git status
git diff --stat
git diff
```

Questions:

```text
Did unrelated files change?

Did generated files change unexpectedly?

Did the agent perform unnecessary formatting?

Were secrets added?

Did scope expand?
```

Fix scope drift before committing.

---

# 29. Step 8 - Update the Plan

ExecPlans are living documents.

Update them during implementation.

Record:

- milestone completion
- actual implementation
- validation results
- decisions
- unexpected discoveries
- risk changes
- technical debt

Do not leave the plan describing an outdated future after implementation has already changed reality.

---

# 30. Step 9 - Commit

Create logical commits.

Good:

```text
refactor: extract KRS submission service

feat: add AI service health endpoints

feat: add student grade AI tool

feat: add document indexing queue
```

Avoid:

```text
update stuff

many fixes

phase work
```

Do not mix unrelated milestones into one commit unless unavoidable.

---

# 31. Progress Tracking

Use explicit milestone checkboxes.

Example:

```markdown
## Progress

- [x] M0 - Baseline and architecture mapping
- [x] M1 - Characterization coverage
- [ ] M2 - Extract submission service
- [ ] M3 - Extract approval service
- [ ] M4 - Thin controller cleanup
- [ ] M5 - Final regression
```

Do not mark a milestone complete before validation passes.

---

# 32. Decisions Log

Meaningful implementation decisions must be recorded.

Example:

```markdown
## Decisions

### 2026-10-06 - Keep Prisma as direct service dependency

Decision:
Do not introduce Repository Pattern.

Reason:
Prisma already acts as the data access abstraction and an additional
repository layer would add complexity without a current requirement.
```

Decision logs prevent the same architecture debate from repeatedly reappearing.

---

# 33. Technical Debt Handling

During implementation, unrelated issues may be discovered.

Do not automatically fix them.

Classify them.

Example:

```markdown
## Discovered Technical Debt

- TD-021: KRS enum naming remains ambiguous.
- TD-022: payment controller contains duplicated pagination parsing.
```

Then add relevant items to:

```text
docs/exec-plans/tech-debt-tracker.md
```

This protects scope.

---

# 34. Tech Debt Tracker Format

Recommended:

```markdown
| ID | Area | Issue | Priority | Status | Discovered In |
|---|---|---|---|---|---|
| TD-001 | Backend | ... | P1 | Open | ... |
```

Priority suggestion:

```text
P0
production blocker / security / data corruption

P1
high-impact reliability or maintainability issue

P2
important but not urgent

P3
cleanup / low priority
```

---

# 35. Security Review

Plans involving the following require explicit security consideration:

- authentication
- authorization
- AI
- payments
- file upload
- AWS
- secrets
- internal APIs
- student private data
- lecturer data
- external integrations

Questions include:

```text
Who is allowed to perform this action?

Where does identity come from?

Can input bypass authorization?

Can sensitive data be logged?

Can AI access another user's data?

Are credentials exposed?

Does the change create a new public surface?
```

---

# 36. AI Plan Rules

AI-related plans must preserve these invariants:

```text
LLM != authorization

LLM != source of truth

LLM != arbitrary SQL executor

AI Service != direct unrestricted database client
```

Preferred:

```text
AI
 ↓
Tool
 ↓
Core API
 ↓
RBAC
 ↓
Domain Service
```

Plans for state-changing AI tools must consider explicit user confirmation.

---

# 37. RabbitMQ Plan Rules

A RabbitMQ plan must identify the async problem first.

Good:

```text
Document indexing takes long enough that it should not remain inside
the upload request.
```

Then RabbitMQ becomes the proposed mechanism.

A RabbitMQ plan should define:

- producer
- exchange if needed
- queue
- routing
- message schema
- acknowledgement
- retry behavior
- failure behavior
- idempotency
- dead-letter strategy if needed
- shutdown behavior
- observability

---

# 38. Redis Plan Rules

A Redis plan must define:

- data being cached
- reason for caching
- cache key design
- TTL
- invalidation
- failure behavior
- source of truth
- expected performance benefit

PostgreSQL remains authoritative.

Redis failure should not silently corrupt business state.

---

# 39. Observability Plan Rules

Do not add all observability technologies at once.

Recommended milestone order:

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
  ↓
Correlation
  ↓
Alerting
```

Each milestone must have a concrete observable outcome.

Example:

```text
Prometheus milestone:
GET /metrics works and exposes HTTP request metrics.
```

---

# 40. Deployment Plan Rules

AWS deployment must be divided into understandable milestones.

Example:

```text
M1 ECR

M2 RDS

M3 Core API ECS

M4 ALB

M5 ACM

M6 AI Service ECS

M7 S3 + CloudFront

M8 Route 53

M9 Amazon MQ

M10 ElastiCache

M11 CloudWatch
```

Do not use:

```text
M1 Deploy entire architecture
```

---

# 41. Terraform Rule

Terraform is introduced only after infrastructure architecture is understood.

Preferred order:

```text
Understand manually
      ↓
Deploy manually
      ↓
Stabilize
      ↓
Document
      ↓
Terraform
```

Terraform should codify understood infrastructure.

It should not be used to hide an architecture the team does not understand.

---

# 42. Rollback Strategy

Every high-risk plan should explain rollback.

Examples:

```text
restore previous route binding

disable feature flag

revert service migration

restore previous Docker image

stop new worker consumer

restore previous infrastructure revision
```

Database migrations require special care.

If a database migration is irreversible, that must be explicitly documented.

---

# 43. Compatibility

Before changing a contract identify consumers.

Possible consumers include:

```text
React frontend

AI Assistant

workers

external payment gateway

internal scripts

tests
```

Do not change API response shapes casually.

New architecture does not justify breaking working consumers.

---

# 44. Plan Closure

A plan can move to `completed/` only after Exit Criteria are satisfied.

Closing workflow:

```text
All Milestones Complete
        ↓
Full Validation
        ↓
Final Diff Review
        ↓
Docs Updated
        ↓
Debt Recorded
        ↓
Exit Criteria Pass
        ↓
Move Active → Completed
```

---

# 45. Exit Criteria

Recommended final checklist:

```markdown
## Exit Criteria

- [ ] All planned milestones are complete.
- [ ] Focused tests pass.
- [ ] Full regression tests pass.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] Security invariants are preserved.
- [ ] Compatibility expectations are satisfied.
- [ ] Relevant architecture documentation is updated.
- [ ] Technical debt discovered during the plan is recorded.
- [ ] Final git diff has been reviewed.
- [ ] No unrelated changes remain.
```

Only then:

```text
active/<plan>.md
```

becomes:

```text
completed/<plan>.md
```

---

# 46. Completed Plans Are Historical Records

Do not continuously rewrite completed plans to describe new architecture.

A completed ExecPlan represents:

```text
what was known
what was decided
what was implemented
what validation passed
```

at the time that work completed.

If architecture changes later, create a new plan.

---

# 47. Example Project Sequence

The expected SIAKAD evolution is approximately:

```text
Platform Hardening
      ✅
       ↓
Student Service Extraction
      ✅
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
AI RAG
       ↓
RabbitMQ
       ↓
Redis
       ↓
Observability
       ↓
Payment Gateway
       ↓
Docker
       ↓
AWS Deployment
       ↓
Production Hardening
       ↓
Terraform
```

This sequence is directional, not immutable.

Actual repository needs take precedence.

---

# 48. Agent Prompt Discipline

Do not ask an agent:

```text
Implement the entire ExecPlan.
```

Prefer:

```text
Read AGENTS.md, ARCHITECTURE.md, BACKEND.md and the active ExecPlan.

Inspect the actual repository.

Implement only milestone M2.

Do not begin M3.

Preserve existing behavior.

Run focused validation followed by full validation.

Review the final diff.

Update the ExecPlan with actual progress and validation results.
```

This produces safer and more reviewable work.

---

# 49. Core Harness Principle

The repository should always remain closer to:

```text
known stable state
```

than:

```text
large unfinished transformation
```

Prefer:

```text
small change
+
proof
+
commit
```

repeated many times.

That is the central execution principle of this Harness.