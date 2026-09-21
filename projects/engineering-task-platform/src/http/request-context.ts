import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

export interface RequestContext {
  readonly requestId: string;
}

export function createRequestContext(request: IncomingMessage): RequestContext {
  const incoming = request.headers["x-request-id"];
  const requestId = typeof incoming === "string" && incoming.trim()
    ? incoming.trim().slice(0, 128)
    : randomUUID();

  return { requestId };
}
