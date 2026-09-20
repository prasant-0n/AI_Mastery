# Architecture

## Initial Decision

The project starts as a modular monolith.

The purpose is to establish clear internal boundaries without prematurely introducing distributed-service complexity.

## Current Components

- HTTP server
- domain layer
- application layer
- tests

## Planned Components

- PostgreSQL persistence
- queue
- worker
- provider adapter
- observability

## Dependency Direction

```text
Transport
   |
Application
   |
Domain

Infrastructure <---- Application
```

The domain must not depend on HTTP, PostgreSQL, queue implementations, or external providers.

## Evolution Rule

A new infrastructure component is introduced only when a project requirement or measured limitation justifies it.
