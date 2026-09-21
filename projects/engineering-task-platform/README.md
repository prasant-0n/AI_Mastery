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

**Milestone 3 — API complete.**

The service now has a defined HTTP contract, standardized JSON response envelopes, request correlation, authentication semantics, protected tenant-aware task routes, baseline security headers, CORS preflight handling, bounded request bodies, and API contract tests. Production security hardening remains a later milestone.

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
- [x] Milestone 3 — API
- [ ] Milestone 4 — Async processing
- [ ] Milestone 5 — Reliability
- [ ] Milestone 6 — Observability
- [ ] Milestone 7 — Security hardening
- [ ] Milestone 8 — Performance
- [ ] Milestone 9 — Production documentation
- [ ] Milestone 10 — Optional AI extension

## Milestone 3 Evidence

- HTTP endpoint contract
- standardized success/error envelopes
- stable machine-readable error taxonomy
- Bearer-token authentication semantics
- tenant-aware task authorization
- request ID generation and propagation
- baseline security response headers
- CORS preflight handling
- bounded JSON request bodies
- API contract tests
- HTTP integration tests
- ADR-003 for API contract/versioning

## Evidence

All implementation, tests, benchmarks, incident reports, and ADRs produced during the project are part of the Phase 00 completion evidence.
