# Domain Invariants

Milestone 2 defines the business rules that must remain true independently of HTTP, PostgreSQL, queues, or external providers.

## Organization

- id must be non-empty.
- name is trimmed and must contain at least two characters.
- createdAt must be a valid date.

## User

- id must be non-empty.
- organizationId must be non-empty.
- email is normalized to lowercase and trimmed.
- email must contain the minimum structural @ boundary required by the domain.
- passwordHash must be present.
- createdAt must be valid.
- user identity always belongs to exactly one organization.

## Task

- id must be non-empty.
- organizationId must be non-empty.
- createdBy must be non-empty.
- type must be non-empty.
- new tasks start in PENDING.
- new tasks start with attemptCount = 0.
- task status changes only through the explicit state machine.
- entering RUNNING increments attemptCount.
- entering RUNNING records startedAt.
- terminal states record completedAt.
- terminal states cannot transition to another state.
- RUNNING -> QUEUED represents retry/requeue and clears active execution timestamps.

## Tenant Ownership

A task is owned by organizationId, and createdBy must identify a user belonging to that organization. The PostgreSQL schema enforces the cross-entity tenant relationship as an additional persistence invariant.

## Domain Boundary Rule

Domain/application rules must not depend on HTTP request objects, HTTP status codes, PostgreSQL SQL statements, queue libraries, framework-specific request context, or external provider SDKs.

Infrastructure may enforce the same invariants again, but infrastructure must not be the only place where business invariants exist.

## Completion Evidence

- domain factory validation tests
- complete task transition matrix
- lifecycle timestamp tests
- tenant ownership tests
- PostgreSQL cross-tenant constraint test
