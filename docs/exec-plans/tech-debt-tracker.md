# TECHNICAL DEBT TRACKER

## Purpose

This document tracks technical debt discovered while developing, refactoring, testing, operating, or reviewing the SIAKAD platform.

Technical debt recorded here is **not automatically approved implementation work**.

The purpose of this tracker is to:

- keep unrelated problems visible
- prevent scope creep
- avoid forgetting important issues
- distinguish urgent risks from cosmetic cleanup
- provide input for future ExecPlans
- document where and why debt was discovered

The Harness rule is:

> **Discovering technical debt does not give permission to fix it inside an unrelated milestone.**

---

# 1. Core Rule

When an agent discovers an issue outside the current task:

```text
Current Milestone
      ↓
Unrelated Problem Found
      ↓
Assess Severity
      ↓
Record Here
      ↓
Continue Current Milestone
```

Do not:

```text
Unrelated Problem Found
      ↓
"While I'm here..."
      ↓
Large Additional Refactor
```

unless the issue is critical enough to block safe continuation.

---

# 2. When to Record Technical Debt

Record an item when the issue is real but outside the current approved scope.

Examples include:

```text
architecture inconsistency

large legacy controller

duplicated business logic

weak typing

missing tests

unclear state model

API inconsistency

security concern

reliability weakness

performance issue

naming inconsistency

missing documentation

deployment limitation

obsolete dependency

missing observability
```

Do not create debt entries for every minor stylistic preference.

---

# 3. Priority Model

Use the following priority levels.

| Priority | Meaning | Typical Examples |
|---|---|---|
| **P0** | Immediate critical risk. Current work may need to stop. | Authorization bypass, secret exposure, data corruption, production blocker |
| **P1** | High-impact correctness, security, or reliability risk. | Broken transaction boundary, cross-user data risk, serious production instability |
| **P2** | Important maintainability, architecture, performance, or testing debt. | Oversized controller, inconsistent API contract, missing characterization coverage |
| **P3** | Low-impact cleanup or improvement. | Naming inconsistency, minor duplication, cosmetic structure issue |

Priority should reflect **impact**, not developer annoyance.

---

# 4. Status Model

Use:

```text
OPEN

VERIFIED

PLANNED

IN_PROGRESS

BLOCKED

RESOLVED

WONT_FIX
```

Meaning:

| Status | Meaning |
|---|---|
| `OPEN` | Reported but not yet deeply verified |
| `VERIFIED` | Confirmed in current repository |
| `PLANNED` | Accepted into a future/current ExecPlan |
| `IN_PROGRESS` | Currently being addressed |
| `BLOCKED` | Cannot proceed because of another dependency |
| `RESOLVED` | Debt has been fixed and validated |
| `WONT_FIX` | Explicit decision to accept the debt |

---

# 5. Technical Debt ID

Use sequential IDs:

```text
TD-001
TD-002
TD-003
...
```

Never reuse an old ID.

Resolved items remain in this document for historical traceability.

---

# 6. Main Tracker

| ID | Area | Issue | Priority | Status | Discovered In | Target Plan |
|---|---|---|---|---|---|---|
| TD-001 | KRS | KRS header and detail status models may have overlapping or confusing semantics and need domain verification before redesign. | P2 | OPEN | Architecture review | `krs-domain-audit.md` |
| TD-002 | API | Legacy endpoints may use inconsistent success and error response shapes compared with the canonical API contract. | P2 | OPEN | API architecture review | API Contract / OpenAPI ExecPlan |
| TD-003 | Backend | Some legacy backend areas may still access Prisma directly from controllers rather than through services. These should be migrated only when significantly touched. | P2 | OPEN | Backend architecture review | Domain-specific future plans |
| TD-004 | Frontend | Frontend API access and Redux patterns may contain inconsistencies or duplication that should be reviewed incrementally rather than globally rewritten. | P2 | OPEN | Frontend architecture review | Frontend Cleanup ExecPlan |
| TD-005 | AI | Production authentication mechanism for AI Service → Core API service identity and end-user identity propagation is not yet finalized. | P1 | OPEN | AI architecture design | AI Tool Calling / Deployment ExecPlan |
| TD-006 | AI Deployment | Production hosting strategy for Ollama/Hermes is intentionally unresolved because model CPU/RAM/GPU requirements differ from the Node.js AI Service runtime. | P2 | OPEN | Deployment architecture design | AI Model Production Hosting ExecPlan |
| TD-007 | Observability | Metrics, centralized logs, and distributed tracing are not yet implemented beyond the current Pino/request-ID foundation. | P2 | OPEN | Observability design | Observability Foundation ExecPlan |
| TD-008 | Infrastructure | Production AWS infrastructure has not yet been implemented or codified. | P2 | OPEN | Technology roadmap | AWS Production Deployment ExecPlan |
| TD-009 | Infrastructure | Infrastructure as Code is intentionally deferred until AWS resources and relationships are understood and stable. | P3 | OPEN | Deployment architecture design | Terraform ExecPlan |
| TD-010 | Async | Reliable DB + RabbitMQ publication strategy may eventually require a transactional outbox if simple publishing produces consistency gaps. | P3 | OPEN | Reliability design | Future async reliability plan |

---

# 7. Important Note About Seed Items

The initial entries above are architecture-level known concerns or intentionally deferred decisions.

They are not proof that every problem currently exists in production code.

Before changing an item from:

```text
OPEN
```

to:

```text
VERIFIED
```

the agent must inspect the actual repository.

Example:

```text
TD-003

"Some legacy controllers may still access Prisma directly."

        ↓

Inspect repository

        ↓

Confirmed?
YES → VERIFIED

Not present anymore?
→ RESOLVED or remove only if the entry was never historically meaningful
```

Do not refactor code solely because a tracker item predicts that debt may exist.

---

# 8. Detailed Debt Record Template

For issues requiring more detail, add a section using this template:

```markdown
## TD-XXX - Short Title

**Area:** Backend / Frontend / AI / Database / Infrastructure / Security / Reliability

**Priority:** P0 / P1 / P2 / P3

**Status:** OPEN / VERIFIED / PLANNED / IN_PROGRESS / BLOCKED / RESOLVED / WONT_FIX

**Discovered In:** <ExecPlan, review, test, incident, etc.>

### Problem

Describe the actual issue.

### Evidence

List concrete repository evidence:

- file
- behavior
- failing test
- architecture violation
- runtime log

### Impact

Explain why the debt matters.

### Why It Is Not Being Fixed Now

Explain why fixing it would expand the current scope or why another dependency must happen first.

### Proposed Direction

Describe a possible direction without prematurely designing the entire solution.

### Target ExecPlan

Name the future plan if known.

### Resolution

Complete when the item is resolved.

Include:

- implementation summary
- validation
- commit or plan reference
```

---

# 9. Verification Rule

Do not classify architecture assumptions as confirmed implementation debt.

Use:

```text
OPEN
```

when something needs repository inspection.

Use:

```text
VERIFIED
```

only when there is evidence.

Evidence may include:

```text
source code

tests

runtime behavior

CI failure

logs

dependency configuration

database schema
```

---

# 10. P0 Handling

P0 debt is different from ordinary debt.

Examples:

```text
authorization bypass

production credentials committed to Git

cross-user data exposure

payment manipulation

data corruption

unrestricted AI SQL execution
```

When a P0 issue is verified:

```text
Current Feature Work
       ↓
STOP if necessary
       ↓
Security / Data Integrity Fix
       ↓
Full Validation
       ↓
Resume Original Work
```

P0 issues should not wait indefinitely in the tracker.

---

# 11. P1 Handling

P1 debt should normally become scheduled work relatively soon.

Examples:

```text
broken ownership enforcement

serious transaction risk

critical retry duplication

AI service trust vulnerability

major production reliability weakness
```

A P1 does not automatically interrupt current work unless continuation would be unsafe.

---

# 12. P2 Handling

Most meaningful architectural debt belongs here.

Examples:

```text
large legacy controller

inconsistent API response

missing service extraction

missing tests

duplicated frontend API logic

weak module boundary
```

These should usually be addressed through future scoped ExecPlans.

---

# 13. P3 Handling

Examples:

```text
minor naming cleanup

folder inconsistency

low-impact duplication

old comment

small developer-experience improvement
```

Do not allow P3 work to distract from higher-value roadmap work.

---

# 14. Do Not Create Fake Urgency

Do not mark an item P1 or P0 because:

```text
the code looks ugly

a newer library exists

the architecture is not fashionable

another framework would be cleaner
```

Priority must reflect actual system risk or engineering impact.

---

# 15. Scope Protection

Suppose the active milestone is:

```text
KRS Domain Audit M2
```

and the agent discovers:

```text
duplicate pagination code
```

The correct behavior is:

```text
Record TD item

Continue KRS M2
```

Not:

```text
Refactor pagination across the repository
```

---

# 16. Debt vs Bug

A bug causes incorrect behavior now.

Technical debt is usually a structural weakness, risk, or deferred improvement.

Example bug:

```text
Student A can read Student B grades.
```

This is a security bug and may require immediate repair.

Example debt:

```text
Grade controller contains duplicated query parsing.
```

This may be safely deferred.

Use engineering judgment.

---

# 17. Debt vs Future Feature

Do not record planned features as technical debt.

Not debt:

```text
RabbitMQ has not been added yet.
```

if RabbitMQ is simply scheduled for a later roadmap phase.

Debt:

```text
Current synchronous document processing is already causing
request timeouts and RabbitMQ work is being deferred.
```

The difference is whether the current implementation creates a meaningful deficiency.

---

# 18. Intentionally Deferred Architecture

Some items are consciously deferred and may be tracked for visibility.

Examples:

```text
Terraform

production AI model hosting

WAF

advanced tracing
```

These should not automatically be treated as defects.

Use P3 or roadmap tracking unless their absence creates a current problem.

---

# 19. Debt Discovered During ExecPlans

Every ExecPlan should include:

```text
Discovered Technical Debt
```

At plan completion:

```text
ExecPlan debt findings
       ↓
Review
       ↓
Add relevant unresolved items here
```

Do not duplicate the same debt under several IDs.

---

# 20. Linking Debt to ExecPlans

When a debt item becomes approved work:

```text
OPEN / VERIFIED
       ↓
PLANNED
```

Set:

```text
Target Plan
```

Example:

```text
TD-001
→ docs/exec-plans/active/krs-domain-audit.md
```

When implementation starts:

```text
IN_PROGRESS
```

---

# 21. Resolving Debt

Debt becomes:

```text
RESOLVED
```

only after implementation and relevant validation are complete.

Do not mark resolved because:

```text
code was edited
```

without validation.

Expected evidence may include:

```text
focused tests

regression tests

lint

typecheck

build

architecture/documentation update
```

---

# 22. WONT_FIX

Use `WONT_FIX` when the team intentionally accepts debt.

Example:

```text
Legacy endpoint uses older response shape.

Changing it would break an external consumer.

The endpoint will be retired later.
```

Document why the debt is accepted.

`WONT_FIX` should be an engineering decision, not a way to hide inconvenient work.

---

# 23. Resolved Debt History

Do not delete resolved items.

Historical debt helps explain:

```text
why architecture changed

why certain tests exist

why an abstraction was introduced

why compatibility logic remains
```

The tracker is also an engineering decision history.

---

# 24. Review Cadence

Review this tracker:

```text
before starting a new major ExecPlan

after completing a major ExecPlan

before production deployment

after major incidents
```

Do not spend time reviewing every P3 item during every small change.

---

# 25. Roadmap Alignment

Technical debt priority does not automatically determine roadmap order.

Consider:

```text
risk

dependency

business value

current milestone

architecture sequence

implementation cost
```

Example:

```text
P2 KRS debt
```

may be addressed before:

```text
P1 production AI service authentication
```

if AI production work has not started yet.

Context matters.

---

# 26. Architecture Debt Categories

Useful categories:

```text
Backend

Frontend

API

Database

KRS

Authentication

AI

RAG

Async

Cache

Observability

Payment

Deployment

Infrastructure

Security

Reliability

Testing

Developer Experience
```

Use the narrowest useful category.

---

# 27. Avoid Duplicate Debt

Before adding:

```text
TD-XXX
```

search this file for an existing issue describing the same underlying problem.

Prefer updating an existing debt item over creating duplicates.

---

# 28. Agent Instruction

When Codex or another engineering agent discovers unrelated technical debt, it should report:

```text
Debt discovered:
<short description>

Recommended:
Add to tech-debt-tracker.md

Priority:
P1 / P2 / P3

Reason:
<impact>
```

The agent may update this tracker if the current task permits documentation updates.

It must not automatically implement the debt.

---

# 29. Required Information for New Debt

Every new entry should answer at minimum:

```text
What is wrong?

Where is it?

Why does it matter?

How severe is it?

Where was it discovered?

Is there a future plan for it?
```

Avoid entries such as:

```text
TD-099
Clean backend.
```

They are too vague to be actionable.

---

# 30. Good Debt Example

```text
ID:
TD-021

Area:
Payments

Issue:
Webhook handler performs state transition without an explicit
idempotency guard.

Priority:
P1

Status:
VERIFIED

Discovered In:
Payment integration review

Target Plan:
payment-webhook-hardening.md
```

This is actionable.

---

# 31. Bad Debt Example

```text
ID:
TD-022

Issue:
Code could be cleaner.

Priority:
P1
```

This does not provide useful engineering information.

---

# 32. Security Debt

Security debt deserves explicit attention.

Examples:

```text
missing ownership check

secret handling weakness

untrusted service headers

overly broad IAM permission

unsafe file upload

AI tool authorization gap
```

When severity is unclear, consult `SECURITY.md`.

---

# 33. Reliability Debt

Examples:

```text
unbounded external call

infinite retry

non-idempotent queue consumer

missing graceful shutdown

unclear DB + queue consistency

missing recovery behavior
```

Refer to:

```text
RELIABILITY.md
```

for reliability standards.

---

# 34. API Debt

Examples:

```text
inconsistent error response

undocumented endpoint

unstable enum

unbounded pagination

ambiguous status code

frontend dependent on undocumented response field
```

Refer to:

```text
docs/design-docs/api-contract.md
```

---

# 35. AI Debt

Examples:

```text
AI tool too broad

LLM-selected user ID

direct database access

missing timeout

unsafe cloud fallback

missing tool authorization test

unbounded conversation context
```

Refer to:

```text
docs/design-docs/ai-architecture.md
```

---

# 36. Observability Debt

Examples:

```text
no metric for critical failure

sensitive data in logs

high-cardinality labels

no correlation between services

important worker failure invisible
```

Refer to:

```text
docs/design-docs/observability.md
```

---

# 37. Deployment Debt

Examples:

```text
static AWS credentials

public database

unversioned container image

no rollback path

no backup strategy

secret baked into Docker image
```

Refer to:

```text
docs/design-docs/deployment-architecture.md
```

---

# 38. Current Known / Candidate Debt Detail

## TD-001 - KRS Status Model Requires Domain Audit

**Area:** KRS

**Priority:** P2

**Status:** OPEN

**Discovered In:** Architecture review

### Problem

The KRS domain currently appears to contain separate status concepts for the KRS header and KRS detail items.

Known concepts include:

```text
Header:

DRAFT
DIAJUKAN
DISETUJUI
DITOLAK
```

and detail-level states such as:

```text
MENUNGGU
DISETUJUI
DITOLAK
```

These may represent legitimate independent state machines, but the domain intent must be verified before changing them.

### Impact

Ambiguous state semantics can make:

```text
business rules

approval logic

API contracts

AI KRS tools
```

harder to reason about.

### Why It Is Not Being Fixed Here

A dedicated KRS Domain Audit should inspect actual implementation and tests before any redesign.

### Target ExecPlan

```text
krs-domain-audit.md
```

---

# 39. TD-002 - Legacy API Contract Inconsistency

**Area:** API

**Priority:** P2

**Status:** OPEN

**Discovered In:** API architecture design

### Problem

Brownfield endpoints may use different response shapes and error conventions.

### Impact

This may increase complexity for:

```text
frontend API consumers

future AI Core API client

OpenAPI documentation

testing
```

### Direction

Do not globally rewrite responses.

Use the canonical contract for new and intentionally migrated endpoints.

### Target ExecPlan

API Contract + OpenAPI phase.

---

# 40. TD-005 - AI Service-to-Core Authentication Design

**Area:** AI / Security

**Priority:** P1

**Status:** OPEN

**Discovered In:** AI architecture design

### Problem

The final production mechanism for authenticating:

```text
AI Service
→ Core API
```

while preserving both:

```text
service identity
+
end-user identity
```

has not yet been selected.

### Impact

A weak implementation could allow:

```text
forged identity

forged role

authorization bypass
```

### Current Rule

Do not trust plain public headers such as:

```text
X-User-Role
X-User-Id
```

as sufficient proof.

### Target ExecPlan

AI Tool Calling and/or AWS Deployment security design.

This item must be resolved before public production AI deployment.

---

# 41. TD-006 - Production AI Model Hosting

**Area:** AI Deployment

**Priority:** P2

**Status:** OPEN

**Discovered In:** Deployment architecture design

### Problem

Local AI uses:

```text
Ollama
+
Hermes
```

but production model inference infrastructure has not been selected.

### Reason

The model runtime may require different:

```text
RAM

CPU

GPU

cost model
```

from the Node.js AI Service.

### Direction

Evaluate separately:

```text
self-hosted inference

GPU compute

managed AI provider
```

### Target ExecPlan

```text
ai-model-production-hosting.md
```

---

# 42. TD-010 - Database + Queue Consistency

**Area:** Async / Reliability

**Priority:** P3

**Status:** OPEN

**Discovered In:** Reliability design

### Problem

Future workflows may need both:

```text
database write
+
RabbitMQ publish
```

These operations cannot participate in one normal database transaction.

Potential failure:

```text
DB commit succeeds
      ↓
RabbitMQ publish fails
```

### Current Direction

Start simple when RabbitMQ is introduced.

Measure whether this consistency gap creates a real issue.

If required, evaluate:

```text
Transactional Outbox
```

later.

Do not introduce an outbox prematurely.

---

# 43. Resolved Items

Resolved debt should remain visible below or remain in the main table with status:

```text
RESOLVED
```

Example:

```text
TD-XXX
Large StudentController business logic
→ RESOLVED through Student Service Extraction
```

If historical Student debt is added here, reference the completed Student ExecPlan rather than recreating the work.

---

# 44. Final Technical Debt Principle

Technical debt is not:

```text
"code I personally would write differently"
```

Technical debt is a meaningful engineering compromise, weakness, risk, or deferred improvement.

The Harness workflow is:

```text
Find Debt
   ↓
Record It
   ↓
Prioritize It
   ↓
Finish Current Scope
   ↓
Plan It Properly
   ↓
Implement Safely
   ↓
Validate
   ↓
Resolve
```

The final rule is:

> **Technical debt should remain visible without being allowed to hijack unrelated engineering work.**