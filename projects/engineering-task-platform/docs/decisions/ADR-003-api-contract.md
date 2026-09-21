# ADR-003 — API Contract and Versioning

## Status

Accepted

## Context

The service needs a stable HTTP contract for clients, tests, and future workers while avoiding premature API complexity.

## Decision

Use a small JSON API with:

- explicit HTTP status semantics
- stable machine-readable error codes
- success/error response envelopes
- request correlation through `x-request-id`
- Bearer-token authentication for protected endpoints
- an unversioned local API until a public compatibility boundary requires versioning

The service will introduce a `/v1` prefix when external compatibility becomes a concrete requirement rather than adding a version solely for convention.

## Consequences

Positive:

- consistent client parsing
- easier debugging and incident correlation
- clear authentication semantics
- smaller routing surface
- versioning remains a deliberate compatibility decision

Trade-off:

- changing the unversioned contract later requires a migration plan once clients depend on it

## Security Note

Development CORS currently permits all origins. Production deployment must replace this with an explicit origin allowlist.
