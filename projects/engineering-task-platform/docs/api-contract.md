# API Contract

## Base Path

The current service exposes an unversioned local API. Versioning is intentionally deferred until a public compatibility boundary is required; introducing `/v1` before that requirement would add unnecessary routing surface.

## Authentication

Protected task endpoints require:

`Authorization: Bearer <access-token>`

## Success Envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

## Error Envelope

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "meta": {
    "requestId": "..."
  }
}
```

## Endpoints

### GET /health

Public liveness endpoint.

### GET /ready

Public readiness endpoint. Returns HTTP 503 when dependencies are unavailable.

### POST /auth/register

Creates a user inside an existing organization and returns an access token.

Required fields:

- organizationId
- email
- password

### POST /auth/login

Authenticates a user for a specific organization.

Required fields:

- organizationId
- email
- password

### POST /tasks

Protected. Creates a task.

Required field:

- type

The server derives `organizationId` and `createdBy` from authenticated identity. Client-supplied values are ignored.

### GET /tasks/:id

Protected. Returns a task only when it belongs to the authenticated organization.

### GET /organizations/:organizationId/tasks

Protected. The path organization must match the authenticated organization.

Query parameters:

- `limit`
- `offset`

### PATCH /tasks/:id/status

Protected. Changes status according to the domain state machine.

Required field:

- status

## HTTP Semantics

- `200` successful retrieval/update
- `201` resource creation
- `204` CORS preflight
- `400` malformed or invalid request
- `401` missing/invalid authentication
- `403` authenticated but not authorized for the requested tenant
- `404` resource not found
- `409` resource conflict
- `422` semantically invalid request when introduced by future contracts
- `429` rate limiting when introduced
- `500` unexpected server failure
- `503` dependency/readiness failure

## Correlation

Every response includes `x-request-id`. Clients may provide an `x-request-id`; otherwise the server generates one.

The request ID belongs in logs, traces, and incident investigation records in later milestones.

## Body Limits

JSON request bodies are bounded to 1 MiB.

## CORS

The current development service permits all origins. This is intentionally a development default and must be replaced by an explicit deployment allowlist before production exposure.

## Security Headers

The service sets baseline headers including `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`, and `Cache-Control: no-store`.
