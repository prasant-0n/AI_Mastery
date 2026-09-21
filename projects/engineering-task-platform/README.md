# Engineering Task Platform

Phase 00 — Engineering Foundation capstone project.

This project is a production-oriented backend laboratory for demonstrating:

- typed input boundaries
- domain state machines
- modular architecture
- PostgreSQL persistence
- asynchronous job processing
- idempotency
- retries and timeouts
- observability
- tenant isolation
- testing
- failure injection
- performance measurement
- engineering trade-offs

## Current Status

**Milestone 2 — Core Domain complete.**

The project now has a tested domain model for organizations, users, and tasks, including explicit task lifecycle rules, tenant ownership, lifecycle timestamps, repository boundaries, and PostgreSQL persistence constraints. HTTP authentication and authorization foundations are also present as supporting infrastructure, but later milestones remain incomplete.

## Engineering Rules

1. Do not add infrastructure before a requirement justifies it.
2. Keep domain logic independent from transport and infrastructure.
3. Validate untrusted input at boundaries.
4. Make state transitions explicit.
5. Assume asynchronous jobs can be delivered more than once.
6. Treat PostgreSQL as authoritative task state.
7. Never log secrets or sensitive payloads.
8. Every reliability mechanism must have tests.
9. Every optimization must have a measurement.
10. Every significant architectural choice gets an ADR.

## Planned Architecture

```text
Client
  |
  v
HTTP API
  |
  +------> PostgreSQL
  |
  +------> Queue ------> Worker ------> External Provider
  |
  +------> Logs / Metrics
```

## Milestones

- [x] Milestone 1 — Foundation scaffold
- [x] Milestone 2 — Core domain
- [ ] Milestone 3 — API hardening and contract completion
- [ ] Milestone 4 — Async processing
- [ ] Milestone 5 — Reliability
- [ ] Milestone 6 — Observability
- [ ] Milestone 7 — Security hardening
- [ ] Milestone 8 — Performance
- [ ] Milestone 9 — Production documentation
- [ ] Milestone 10 — Optional AI extension

## Milestone 2 Evidence

- organization domain factory and invariant tests
- user domain factory and invariant tests
- task creation invariants
- complete task transition matrix
- task attempt counting
- execution start/completion timestamps
- explicit domain invariant errors
- tenant ownership model
- PostgreSQL cross-tenant foreign-key enforcement
- repository abstractions separating domain/application from persistence

## Evidence

All implementation, tests, benchmarks, incident reports, and ADRs produced during the project are part of the Phase 00 completion evidence.
