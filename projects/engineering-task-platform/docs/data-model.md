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

## Invariants

1. Every user belongs to exactly one organization.
2. Every task belongs to exactly one organization.
3. A task creator must belong to the task's organization.
4. Attempt count cannot be negative.
5. Terminal task states cannot move back to active states.
6. Task status is constrained to the application state machine.

## Initial Indexes

- users(organization_id, email)
- tasks(organization_id, created_at DESC)
- tasks(status, created_at)

Indexes must be justified by actual access patterns and benchmarks.

## Ownership

PostgreSQL is the authoritative store for durable task state.

The queue is responsible for work delivery, not authoritative task lifecycle state.
