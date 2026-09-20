# ADR-002 — PostgreSQL as the Authoritative Task Store

## Context

The platform needs durable organization, user, and task state. Task lifecycle transitions must remain correct across process crashes, worker restarts, duplicate job delivery, and API retries.

## Options

### Option A — PostgreSQL

Use PostgreSQL as the durable source of truth.

### Option B — Queue or Cache as State Store

Treat the queue or cache as the primary task state store.

## Decision

Use PostgreSQL as the authoritative store for task lifecycle state.

## Rationale

Task state has relational integrity requirements:

- organizations own users and tasks
- users create tasks
- state transitions must be durable
- task records must survive worker restarts
- queries require filtering and ordering

The queue is responsible for delivery of work, not authoritative business state.

## Consequences

### Positive

- durable state
- relational constraints
- transactional updates
- queryable history
- clear source of truth

### Negative

- database becomes a critical dependency
- schema migrations require operational discipline
- high-scale workloads may require additional optimization

## Revisit Trigger

Reconsider the storage architecture only when measured workload, availability requirements, or data scale demonstrates a concrete limitation.
