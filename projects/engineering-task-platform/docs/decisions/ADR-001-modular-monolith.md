# ADR-001 — Start as a Modular Monolith

## Context

Phase 00 requires demonstrating module boundaries, dependency direction, testing, debugging, and trade-off reasoning.

The project does not initially require independently deployable services.

## Options

### Option A — Modular Monolith

One deployable application with explicit internal boundaries.

### Option B — Multiple Microservices

Separate deployables for API, workers, and domain capabilities.

## Decision

Start with a modular monolith.

## Rationale

The initial problem is engineering correctness and boundary design, not independent service deployment.

A modular monolith reduces:

- network failure modes
- deployment overhead
- local development complexity
- distributed debugging cost

while still allowing internal boundaries to be established.

## Consequences

Positive:

- simpler development
- simpler testing
- easier debugging
- lower operational overhead

Negative:

- less deployment independence
- process-level scaling initially

## Revisit Trigger

Reconsider service extraction only when independent scaling, deployment, ownership, or fault isolation becomes a demonstrated requirement.
