# Data Model

## Entities

### organizations

- id — UUID, primary key
- name — VARCHAR(255), required
- created_at — TIMESTAMPTZ, required

### users

- id — UUID, primary key
- organization_id — UUID, foreign key
- email — VARCHAR(320), required
- password_hash — TEXT, required
- created_at — TIMESTAMPTZ, required

Email is unique within an organization.

### tasks

- id — UUID, primary key
- organization_id — UUID, foreign key
- created_by — UUID, foreign key
- type — VARCHAR(100), required
- status — VARCHAR(32), required
- input — JSONB
- result — JSONB
- error_code — VARCHAR(100)
- attempt_count — INTEGER, required
- created_at — TIMESTAMPTZ, required
- started_at — TIMESTAMPTZ
- completed_at — TIMESTAMPTZ

## Task Lifecycle

```text
PENDING -> QUEUED -> RUNNING -> SUCCEEDED
                     |       -> FAILED
                     |       -> QUEUED (retry)
                     |       -> CANCELLED
                     |
                     -> CANCELLED

PENDING -> CANCELLED
```

The domain state machine is the source of truth for legal status transitions. PostgreSQL also constrains the status vocabulary and tenant ownership relationships.

## Invariants

1. Every user belongs to exactly one organization.
2. Every task belongs to exactly one organization.
3. A task creator must belong to the task's organization.
4. Attempt count cannot be negative.
5. New tasks start as PENDING with attempt_count = 0.
6. Entering RUNNING increments attempt_count and records started_at.
7. Terminal task states record completed_at and cannot move to another state.
8. RUNNING -> QUEUED represents a retry/requeue and does not complete the task.
9. Task status is constrained to the application state machine.

## Initial Indexes

- users(organization_id, email)
- tasks(organization_id, created_at DESC)
- tasks(status, created_at)

Indexes must be justified by actual access patterns and benchmarks.

## Ownership

PostgreSQL is the authoritative store for durable task state.

The queue is responsible for work delivery, not authoritative task lifecycle state.
