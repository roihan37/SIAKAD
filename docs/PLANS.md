# Execution Planning Guide

## When a plan is required

Create a self-contained ExecPlan before complex, risky, cross-cutting, or multi-step work: architecture changes, substantial refactors, database migrations, authentication, API contracts, infrastructure, production hardening, and significant frontend state migration. An isolated low-risk fix may not require a plan.

A plan records intended work; it is not permission to implement work outside the current request. The harness bootstrap creates documentation only. Implementation of platform hardening remains pending a subsequent task.

## Required contents

Each plan must include:

1. Status and context, with relevant repository paths and inspection date.
2. Goal and observable completion criteria.
3. Non-goals and compatibility/scope constraints.
4. Current state and target state, clearly separated.
5. Ordered, independently verifiable milestones with acceptance checks.
6. Validation commands, working directories, environment requirements, and actual results when run.
7. Risks and open decisions, including any required API or deployment decisions.
8. Rollback and recovery for the affected components.
9. Progress checklist, dated decisions, discoveries, and outcome/remaining work.

Use small changes and preserve API behavior. Record failures honestly; neither missing scripts nor known failures count as passed checks. Tie work to stable debt IDs. Reliability and production safety take priority over cleanup.

## Lifecycle

- Store proposed or in-progress plans in `docs/exec-plans/active/`. A file in this directory may still be proposed; state its status explicitly.
- Update progress and decisions during implementation. Do not mark planned validation as executed.
- Move a plan to `docs/exec-plans/completed/` only when its acceptance criteria are verified and its outcome is recorded. Preserve history. This lifecycle move applies to future plan completion; bootstrap does not rename existing files.
- Update the [debt tracker](exec-plans/tech-debt-tracker.md) when work is resolved or deferred, linking evidence and the relevant plan.

The initial plan is [platform hardening](exec-plans/active/platform-hardening.md). StudentController decomposition requires its own future plan; it is not part of this one.
