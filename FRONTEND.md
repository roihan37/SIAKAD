# FRONTEND.md

## Purpose

This document defines frontend engineering conventions for the SIAKAD application.

It is intended for developers and engineering agents modifying code inside:

```text
client/
```

The frontend is a React Single Page Application responsible for:

- user interface
- navigation
- form interaction
- client-side state
- API consumption
- loading states
- error states
- authorization-aware presentation
- AI Assistant user experience

The frontend is not the authority for authentication, authorization, academic rules, or protected business decisions.

---

# 1. Read Before Editing

Before modifying frontend production code, read:

```text
AGENTS.md
ARCHITECTURE.md
FRONTEND.md
docs/QUALITY.md
docs/SECURITY.md
```

When relevant also read:

```text
docs/RELIABILITY.md
docs/TARGET-ARCHITECTURE.md
docs/TECHNOLOGY-ROADMAP.md
docs/design-docs/api-contract.md
docs/design-docs/ai-architecture.md
```

If an active ExecPlan covers the task, read it first.

Always inspect the actual repository before editing.

Do not assume documentation perfectly reflects current implementation.

---

# 2. Frontend Stack

Current approved frontend technologies:

```text
React
TypeScript
Vite
React Router
Redux Toolkit
Tailwind CSS
shadcn/ui
```

These technologies remain the default frontend stack.

---

# 3. Technologies Not Currently Planned

Do not introduce without explicit architecture revision:

```text
TanStack Query

Next.js migration

another global state manager

GraphQL client

large frontend framework replacement
```

Do not replace existing technology merely because another library is popular.

---

# 4. Frontend Architecture Principle

Target frontend flow:

```text
UI
 ↓
Feature Logic
 ↓
Redux / Local State
 ↓
API Service
 ↓
Core REST API
```

For AI:

```text
AI Chat UI
 ↓
AI Client
 ↓
AI Service
 ↓
SSE
```

Avoid placing backend business rules inside React components.

---

# 5. Frontend Responsibility

Frontend responsibilities include:

```text
rendering data

handling user interaction

navigation

form state

client validation

loading state

error presentation

empty state

calling APIs

display formatting
```

Frontend must not become responsible for:

```text
RBAC enforcement

ownership enforcement

KRS business rules

grade authority

payment authority

academic source of truth
```

---

# 6. Backend Remains Authoritative

Frontend checks improve UX.

Example:

```text
MAHASISWA
→ hide admin menu
```

But backend must still enforce:

```text
MAHASISWA
→ cannot access admin API
```

Frontend role checks are presentation logic, not security.

---

# 7. Folder Direction

The frontend should evolve gradually toward feature-oriented organization.

Potential target direction:

```text
client/src/

├── app/
│
├── components/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── students/
│   ├── lecturers/
│   ├── krs/
│   ├── grades/
│   ├── attendance/
│   ├── tuition/
│   └── ai/
│
├── services/
│
├── store/
│
├── hooks/
│
├── types/
│
├── utils/
│
└── pages/
```

This is a target direction.

Do not perform a repository-wide folder migration in one change.

---

# 8. Brownfield Policy

Existing frontend code may contain older structures.

Use:

```text
New code
→ follow target conventions

Significantly modified feature
→ improve structure when safe

Unrelated legacy code
→ leave unchanged
```

Avoid mass-refactoring the frontend.

---

# 9. Component Responsibility

Components should focus on presentation and interaction.

Prefer:

```text
Page
 ↓
Feature Component
 ↓
Reusable UI Component
```

Avoid components that simultaneously contain:

```text
large API logic

business rules

complex data transformation

routing logic

large forms

large reusable UI
```

Split when responsibilities become difficult to understand.

---

# 10. Page Components

Page components may coordinate:

```text
route params

feature hooks

API state

feature components

page layout
```

They should not become a second backend service layer.

---

# 11. Shared Components

Place reusable presentation components in an appropriate shared location.

Examples:

```text
DataTable

LoadingState

EmptyState

ErrorState

PageHeader

ConfirmationDialog
```

Do not create shared abstractions before multiple real use cases exist.

---

# 12. shadcn/ui

Use shadcn/ui as the primary UI primitive foundation where appropriate.

Examples:

```text
Button

Dialog

Input

Select

Table

Card

Dropdown Menu

Toast
```

Do not rebuild basic UI primitives unnecessarily.

---

# 13. Tailwind CSS

Tailwind remains the primary styling approach.

Prefer consistent reusable design patterns.

Avoid:

```text
very large repeated class blocks

unnecessary inline styles

multiple competing styling systems
```

Extract repeated UI patterns when they provide real reuse.

---

# 14. Redux Toolkit

Redux Toolkit remains the approved global state management solution.

Do not introduce TanStack Query.

Existing server-derived state may remain in Redux.

Do not perform a global Redux rewrite.

---

# 15. When to Use Redux

Use Redux when state is:

```text
shared across many components

needed across routes

persistent during navigation

application-wide

auth-related

complex feature state
```

Do not automatically put every value in Redux.

---

# 16. Local State

Use component-local state for short-lived UI state.

Examples:

```text
dialog open state

input draft

selected tab

temporary filter

local loading state
```

Avoid unnecessary global state.

---

# 17. Server State

The project does not use TanStack Query.

Server data may be managed through:

```text
Redux Toolkit

existing thunks

API service functions

feature-specific state
```

Improve patterns incrementally.

Do not introduce a second server-state architecture without explicit decision.

---

# 18. API Service Layer

Avoid raw API calls scattered throughout components.

Preferred:

```text
Component
 ↓
Feature Logic
 ↓
API Service
 ↓
Backend
```

API service responsibilities may include:

```text
base URL

request construction

authentication headers

response parsing

error mapping
```

---

# 19. HTTP Client Consistency

Use the existing project HTTP client approach.

Do not mix:

```text
fetch

axios

custom wrappers

multiple unrelated clients
```

without a clear reason.

Before adding another HTTP library, inspect what already exists.

---

# 20. Authentication Requests

Authentication behavior should be centralized where practical.

Avoid duplicating token logic across feature components.

Common concerns include:

```text
access token

refresh behavior

logout

expired session

authenticated headers
```

Security authority remains on the backend.

---

# 21. API Contract

For new or migrated API consumption, follow:

```text
docs/design-docs/api-contract.md
```

Canonical single-resource response:

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

---

# 22. Legacy API Compatibility

Not every existing API follows the canonical contract.

Frontend must respect actual current backend behavior.

Do not change frontend consumers based only on target documentation.

Before changing an API integration:

```text
inspect backend

inspect current response

inspect existing frontend usage
```

---

# 23. API Types

Important API boundaries should be typed.

Examples:

```text
StudentResponse

KRSResponse

GradeResponse

PaginationMeta

ApiError
```

Do not rely heavily on:

```ts
any
```

for API results.

---

# 24. Avoid Prisma Types in Frontend

Frontend should not depend directly on backend Prisma models.

Preferred:

```text
Backend DTO
 ↓
API Contract
 ↓
Frontend Type
```

This prevents database schema changes from unnecessarily coupling the frontend.

---

# 25. TypeScript

Prefer explicit meaningful types.

Avoid unnecessary:

```ts
any
```

Use:

```ts
unknown
```

when handling untrusted error/data boundaries.

Do not silence typing problems with broad assertions.

---

# 26. Type Assertions

Avoid excessive:

```ts
as any
```

or:

```ts
as SomeType
```

unless runtime assumptions are actually guaranteed.

Fix the underlying typing when practical.

---

# 27. Form State

Forms should have clear ownership.

A form may manage:

```text
input values

local validation

submission state

backend validation errors
```

Avoid placing large domain workflows directly inside JSX.

---

# 28. Frontend Validation

Frontend validation improves user experience.

Backend validation remains authoritative.

Frontend may validate:

```text
required fields

basic formats

numeric limits

obvious invalid input
```

Do not assume passing frontend validation means backend will accept the request.

---

# 29. Backend Validation Errors

Backend validation errors should be displayed usefully.

Example:

```text
VALIDATION_ERROR
 ↓
field error / form message
```

Do not show raw JSON errors directly to users.

---

# 30. Loading State

Every async user-facing operation should have clear loading behavior.

Examples:

```text
page loading

button submitting

table loading

AI generating
```

Avoid allowing users to repeatedly submit actions accidentally.

---

# 31. Empty State

Empty data should not look like a broken screen.

Examples:

```text
No KRS data yet.

No payment history.

No announcements available.
```

An empty collection is different from an error.

---

# 32. Error State

Frontend should distinguish:

```text
network failure

permission denied

not found

validation failure

server error
```

where practical.

Avoid presenting all failures as:

```text
Something went wrong.
```

when useful safe information exists.

---

# 33. Request ID

Backend errors may include:

```text
requestId
```

For unexpected failures, the UI may expose the request ID in a support-friendly way.

Example:

```text
Something went wrong.
Reference: req-123
```

Do not treat request ID as a security credential.

---

# 34. 401 Handling

A 401 generally means authentication is missing or invalid.

Frontend behavior may include:

```text
refresh session

logout

redirect to login
```

according to existing authentication behavior.

Do not create refresh loops.

---

# 35. 403 Handling

A 403 means:

```text
authenticated
but
not authorized
```

Do not automatically log the user out because of a 403.

Show an appropriate permission state.

---

# 36. 404 Handling

Distinguish:

```text
frontend route not found

API resource not found
```

A missing student record should not necessarily render the same UI as an invalid React route.

---

# 37. 409 Handling

Business conflicts should be surfaced appropriately.

Examples:

```text
KRS already submitted

course already selected

invalid current state
```

Prefer user-friendly messages based on stable backend error codes.

---

# 38. Pagination

Paginated UI should respect backend metadata.

Example:

```text
page
limit
total
totalPages
```

Do not calculate total pages from incomplete data when backend already provides authoritative metadata.

---

# 39. Search

Search UI should avoid unnecessary requests where appropriate.

Potential techniques:

```text
submit-based search

debounce
```

Choose based on actual user experience requirements.

Do not introduce optimization complexity without need.

---

# 40. Filters

Keep filter state understandable.

Depending on feature, filters may belong in:

```text
component state

URL query params

Redux
```

Choose based on whether state needs to survive navigation/shareable URLs.

---

# 41. Sorting

Frontend may send approved:

```text
sortBy
sortOrder
```

values.

Do not send arbitrary object property names unless the API contract supports them.

---

# 42. React Router

React Router remains the routing solution.

Use routes for page-level navigation.

Avoid manually manipulating browser URL state where router APIs are more appropriate.

---

# 43. Route Guards

Frontend route guards improve UX.

Example:

```text
ADMIN route
→ hide/block for MAHASISWA
```

But backend still enforces authorization.

Route guards are not a security boundary.

---

# 44. Role-Aware UI

Role-specific menus and actions are acceptable.

Example:

```text
ADMIN
→ student management menu

DOSEN
→ class management

MAHASISWA
→ KRS
```

Do not assume UI visibility controls API access.

---

# 45. Derived UI Permissions

Prefer deriving presentation permissions from authenticated role/context.

Do not duplicate complex backend authorization rules in frontend code unless required for UX.

Example:

```text
Backend decides:
lecturer owns this class

Frontend:
shows API result accordingly
```

rather than reimplementing the entire ownership algorithm.

---

# 46. React Performance

Do not optimize every component by default.

Avoid unnecessary use of:

```text
memo

useMemo

useCallback
```

Use them when:

```text
profiling

measured rerenders

referential equality requirements

expensive calculations
```

justify them.

---

# 47. `memo`

Use `memo` when preventing rerenders provides meaningful value.

Do not wrap every component in `memo`.

Memoization itself creates maintenance complexity.

---

# 48. `useMemo`

Use `useMemo` for:

```text
expensive derived computations

stable derived references when required
```

Do not use it around trivial expressions purely for appearance.

---

# 49. `useCallback`

Use `useCallback` when stable function identity matters.

Examples:

```text
memoized child dependency

hook dependency with real effect
```

Avoid using it around every event handler.

---

# 50. Effects

Use `useEffect` for synchronization with external systems.

Avoid using effects for values that can be calculated directly during rendering.

Bad direction:

```text
state A
 ↓
effect
 ↓
state B
```

when `state B` can simply be derived from `state A`.

---

# 51. Data Derivation

Prefer derived values where possible.

Example:

```ts
const filteredProducts = products.filter(...);
```

rather than keeping duplicate synchronized state unnecessarily.

---

# 52. Keys

Lists must use stable keys.

Prefer:

```tsx
key={student.id}
```

Avoid array indexes when item identity can change.

---

# 53. Error Boundaries

React error boundaries may be introduced where they solve a real rendering-failure problem.

Do not use them as a replacement for normal async error handling.

---

# 54. Accessibility

Frontend UI should maintain basic accessibility.

Use:

```text
semantic HTML

labels

button elements

keyboard-accessible controls

accessible dialog behavior
```

shadcn components can help provide accessible primitives.

---

# 55. Buttons

Use actual buttons for actions.

Prefer:

```tsx
<button>
```

over clickable:

```tsx
<div>
```

when the behavior is an action.

---

# 56. Forms

Inputs should have usable labels.

Do not rely only on placeholders to describe required input.

---

# 57. Tables

Large SIAKAD data sets may use tables.

Tables should provide:

```text
loading

empty state

pagination

clear actions

responsive behavior where practical
```

Do not add a large table framework unless the existing implementation genuinely needs it.

---

# 58. Destructive Actions

Actions such as:

```text
delete student

cancel payment

remove important data
```

should normally require clear confirmation.

UI confirmation does not replace backend authorization or business rules.

---

# 59. Toasts

Use transient notifications for appropriate feedback.

Examples:

```text
Student updated successfully.

KRS submitted.

Failed to save changes.
```

Do not use toast notifications as the only place for important persistent error information.

---

# 60. AI Assistant Frontend

The AI feature should remain isolated as a frontend feature.

Potential direction:

```text
features/
└── ai/
    ├── components/
    ├── services/
    ├── hooks/
    └── types/
```

Do not mix AI chat implementation throughout unrelated academic components.

---

# 61. AI Request Flow

Target:

```text
React AI Chat
      ↓
AI Client
      ↓
AI Service
      ↓
SSE
```

Frontend must not call:

```text
Ollama
```

directly.

---

# 62. AI Streaming

AI responses use Server-Sent Events.

Frontend should support:

```text
stream start

partial content

completion

tool status where exposed

error

client cancellation
```

Do not wait for the entire response if the AI API provides streaming.

---

# 63. AI Chat States

Useful UI states:

```text
idle

sending

streaming

tool executing

completed

error
```

Do not represent every AI operation using a single boolean if more explicit state makes behavior clearer.

---

# 64. AI Tool Status

If the AI Service exposes safe tool events, UI may show:

```text
Checking your grades...

Checking your schedule...
```

Do not expose internal sensitive tool payloads.

---

# 65. AI Error Handling

Possible AI errors:

```text
AI unavailable

model timeout

tool failure

authentication failure

permission denied
```

The UI should show controlled user-facing messages.

Do not expose raw Ollama/LangChain stack traces.

---

# 66. AI Hallucination UX

When authoritative data cannot be retrieved, the frontend should preserve the AI Service's uncertainty state.

Do not visually transform:

```text
Unable to retrieve grades.
```

into something suggesting successful retrieval.

---

# 67. AI Confirmation UI

Future AI write actions must support explicit confirmation.

Example:

```text
AI proposes KRS submission

        ↓

Summary displayed

        ↓

[Cancel] [Confirm]
```

Do not automatically execute destructive/state-changing actions simply because the model requested them.

---

# 68. RAG Citations

Future RAG responses may include citations.

Frontend should display:

```text
document name

page

section
```

where available.

Do not invent source labels client-side.

Citation metadata must come from the AI/RAG service.

---

# 69. Conversation History

If AI conversations are persisted later:

```text
conversation list

new conversation

continue conversation

delete conversation
```

must respect authenticated ownership.

Do not treat frontend route IDs as authorization.

---

# 70. SSE Cleanup

When an AI component unmounts or the user cancels:

```text
close/cancel stream
```

where practical.

Avoid leaving orphaned browser-side streams.

---

# 71. File Upload UI

Frontend file upload should enforce UX-level constraints.

Examples:

```text
allowed file type

size message

upload progress
```

Backend remains responsible for authoritative validation.

---

# 72. File Upload Security

Do not assume:

```text
accept=".pdf"
```

makes a file safe.

It only improves user selection UX.

Backend must validate actual uploaded data.

---

# 73. Payment UI

Payment UI should display backend/provider state.

It must not decide:

```text
payment successful
```

based purely on client flow.

Payment status comes from trusted backend processing.

---

# 74. Money Formatting

Backend returns machine-readable values.

Frontend handles presentation.

Example backend:

```json
{
  "amount": 1500000,
  "currency": "IDR"
}
```

Frontend may display:

```text
Rp1.500.000
```

Do not send formatted currency strings back as authoritative calculation values unless the API expects them.

---

# 75. Dates

Backend timestamps should be parsed safely.

Frontend may display localized dates.

Do not make business decisions from locale-formatted strings.

Keep raw machine-readable values separate from presentation.

---

# 76. Environment Variables

Vite client environment variables are visible in the browser bundle.

Treat:

```text
VITE_*
```

as public.

Never store:

```text
JWT secret

database password

AWS private keys

payment secrets

private AI provider credentials
```

in frontend environment variables.

---

# 77. Base URLs

Environment-specific API URLs should be configurable.

Concept:

```text
development
→ local API

production
→ deployed API
```

Avoid hardcoding production endpoints throughout components.

---

# 78. Security

Never store or expose server secrets in frontend source.

Do not treat obfuscation as security.

Anything delivered to the browser is potentially inspectable by users.

---

# 79. Authentication Storage

Do not change current access/refresh token storage strategy casually.

Token storage changes affect:

```text
XSS

CSRF

session handling

refresh behavior
```

and require dedicated security review.

---

# 80. Logging

Avoid unnecessary production `console.log`.

Especially avoid logging:

```text
tokens

passwords

sensitive student data

payment data

complete AI conversations
```

Development diagnostics should be removed or intentionally controlled.

---

# 81. Browser Errors

Unexpected errors should be handled through appropriate UI and application logging strategy.

Do not expose implementation details to users.

---

# 82. Frontend Testing

Testing should focus on behavior.

Useful areas:

```text
critical forms

authorization-aware UI

API integration logic

Redux reducers/selectors

important feature workflows

AI stream handling
```

Do not write tests only to maximize coverage percentage.

---

# 83. Component Tests

Component tests should verify user behavior.

Prefer:

```text
user clicks submit

loading appears

success state appears
```

over testing internal implementation details.

---

# 84. Redux Tests

Reducers and important selectors can be tested directly when they contain meaningful behavior.

Avoid testing Redux Toolkit itself.

---

# 85. API Service Tests

Important API behavior may test:

```text
request construction

error mapping

response normalization

auth handling
```

especially for shared client infrastructure.

---

# 86. AI Frontend Tests

Future AI tests should cover:

```text
streaming content

stream error

cancel behavior

tool status event

confirmation flow

citation display
```

Do not depend on a real LLM for normal frontend unit tests.

---

# 87. Loading and Error Tests

Critical workflows should test:

```text
loading

success

empty

error
```

where practical.

These states are part of the product behavior.

---

# 88. Frontend Validation Gate

Use scripts that actually exist in the project.

Typical validation:

```bash
cd client

npm run lint
npm run typecheck
npm test
npm run build
```

If one script does not exist, do not invent it.

Run the relevant available quality gates.

---

# 89. Production Build

A frontend milestone is not complete if:

```text
npm run build
```

fails.

Development server success is not proof that production build is valid.

---

# 90. Focused Validation

Run focused tests first where possible.

Example:

```text
KRS frontend change
→ KRS tests

AI chat change
→ AI tests
```

Then run broader validation.

---

# 91. Browser Validation

For meaningful UI changes, automated validation alone may not prove visual correctness.

Review relevant flows in the browser where practical.

Examples:

```text
form submission

responsive layout

dialog

table

AI streaming
```

---

# 92. Responsive Design

Pages should remain usable across intended screen sizes.

Do not assume desktop-only layouts without product requirement.

Complex administrative tables may legitimately prioritize desktop while still avoiding broken mobile rendering.

---

# 93. Styling Changes

Avoid unrelated visual rewrites during functional tasks.

If a task is:

```text
fix KRS API error
```

do not simultaneously redesign the whole KRS page.

Keep diffs focused.

---

# 94. Dependency Policy

Before adding a frontend package ask:

```text
Does existing stack already solve this?

Will it be used meaningfully?

Does it increase bundle size?

Does it overlap with shadcn/Redux?

Is it actively maintained?
```

Avoid dependency accumulation.

---

# 95. No TanStack Query

The project intentionally remains on Redux Toolkit and the existing API/state approach.

Do not introduce:

```text
@tanstack/react-query
```

during unrelated cleanup.

If this decision is reconsidered in the future, it requires explicit architecture review.

---

# 96. No Framework Migration

Do not migrate React/Vite to:

```text
Next.js

Remix

another frontend framework
```

without a strong product/architecture requirement.

The current SPA is sufficient for the current SIAKAD direction.

---

# 97. Feature Refactoring

When a feature becomes difficult to maintain:

```text
inspect

characterize behavior

identify responsibility

refactor incrementally

validate
```

Do not rewrite complete features unless necessary.

---

# 98. Duplicate Code

Small duplication may be acceptable before a stable abstraction emerges.

Do not create overly generic components prematurely.

Extract when:

```text
multiple real usages exist

behavior is genuinely shared

the abstraction simplifies code
```

---

# 99. Technical Debt

When unrelated frontend debt is discovered:

```text
record it
```

in:

```text
docs/exec-plans/tech-debt-tracker.md
```

Do not let it expand the current milestone.

---

# 100. ExecPlan Rule

Substantial frontend work should use an ExecPlan.

Examples:

```text
large state restructuring

feature folder migration

authentication frontend redesign

AI frontend foundation

major API contract migration
```

Small isolated component fixes usually do not require their own plan.

---

# 101. Milestone Workflow

For meaningful frontend work:

```text
Read
 ↓
Inspect
 ↓
Baseline
 ↓
Implement
 ↓
Focused Validation
 ↓
Full Validation
 ↓
Browser Review
 ↓
Diff Review
 ↓
Update Plan
 ↓
Commit
```

---

# 102. Diff Review

Before completion:

```bash
git status
git diff --stat
git diff
```

Review for:

```text
unrelated UI changes

accidental formatting

dependency changes

generated files

debug logging

secrets

large scope expansion
```

---

# 103. Frontend Definition of Done

A meaningful frontend milestone is complete when applicable:

```text
Implementation complete        ✅

Expected UX works              ✅

API contract correct           ✅

Role-aware UI correct          ✅

Loading state                  ✅

Empty state                    ✅

Error state                    ✅

Types correct                  ✅

Focused tests                  ✅

Regression validation          ✅

Lint                           ✅

Typecheck if available         ✅

Tests if available             ✅

Production build               ✅

Browser review                 ✅

Security reviewed              ✅

Diff reviewed                  ✅

Documentation updated          ✅
```

---

# 104. Production Deployment Direction

Target frontend deployment:

```text
React
 ↓
Vite Production Build
 ↓
Amazon S3
 ↓
CloudFront
 ↓
User
```

Frontend communicates with:

```text
/api/*
→ Core API

/ai/*
→ AI Assistant
```

through the production routing architecture.

---

# 105. CloudFront and SPA

Production hosting must support React Router SPA fallback behavior.

Directly opening:

```text
/students/123
```

should load the application correctly.

This is a deployment concern, not a reason to migrate away from React Router.

---

# 106. Frontend Observability Direction

Frontend observability may eventually include:

```text
client errors

request failures

performance signals
```

but do not add another monitoring platform without a defined need.

Current observability roadmap primarily focuses on backend services first.

---

# 107. Architecture Change Rule

Before introducing a significant frontend architecture change, answer:

```text
What problem exists?

Why does the current stack fail to solve it?

What complexity will the change add?

How many features are affected?

How will migration work?

How will it be tested?

Can it be rolled back?
```

Avoid architectural churn.

---

# 108. Final Frontend Principle

The frontend should make SIAKAD easy to use without becoming the authority for protected business behavior.

Target:

```text
User
 ↓
React UI
 ↓
Redux / Feature Logic
 ↓
API Service
 ↓
Core API
```

For AI:

```text
User
 ↓
AI Chat UI
 ↓
AI Client
 ↓
AI Assistant Service
 ↓
Approved Core API Tools
```

The final rule is:

> **Keep UI logic in the frontend, business authority in the backend, shared state intentional, API access consistent, and architecture changes incremental.**