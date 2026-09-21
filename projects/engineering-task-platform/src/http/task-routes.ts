import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticateRequest } from "../application/authentication.js";
import { ApplicationError, toHttpError } from "../application/http-errors.js";
import { TaskApiService } from "../application/task-api-service.js";
import { parsePagination, parseTaskStatus, requireNonEmptyString } from "../application/request-validation.js";
import type { UserRepository } from "../application/repositories.js";
import type { TokenService } from "../application/token-service.js";
import { readJsonBody } from "./request-body.js";
import { failure, success } from "./api-response.js";

function sendJson(response: ServerResponse, status: number, body: unknown, requestId: string): void {
  response.setHeader("x-request-id", requestId);
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function getPathParts(url: string): string[] {
  return new URL(url, "http://localhost").pathname.split("/").filter(Boolean);
}

function isTaskRoute(method: string | undefined, parts: string[]): boolean {
  return (
    (method === "POST" && parts.length === 1 && parts[0] === "tasks") ||
    (method === "GET" && parts.length === 2 && parts[0] === "tasks") ||
    (method === "GET" && parts.length === 3 && parts[0] === "organizations" && parts[2] === "tasks") ||
    (method === "PATCH" && parts.length === 3 && parts[0] === "tasks" && parts[2] === "status")
  );
}

export async function handleTaskRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  tasks: TaskApiService,
  users: UserRepository,
  tokens: TokenService,
  requestId: string,
): Promise<boolean> {
  if (!request.url) return false;

  const url = new URL(request.url, "http://localhost");
  const parts = getPathParts(request.url);
  if (!isTaskRoute(request.method, parts)) return false;

  try {
    const authenticated = await authenticateRequest(
      request.headers.authorization,
      users,
      tokens,
    );

    if (request.method === "POST" && parts.length === 1 && parts[0] === "tasks") {
      const body = await readJsonBody(request);
      if (!body || typeof body !== "object") {
        throw new ApplicationError("Request body must be an object", "BAD_REQUEST");
      }

      const task = await tasks.create(authenticated, {
        id: randomUUID(),
        type: requireNonEmptyString((body as Record<string, unknown>).type, "type"),
      });
      sendJson(response, 201, success(task, requestId), requestId);
      return true;
    }

    if (request.method === "GET" && parts.length === 2 && parts[0] === "tasks") {
      const task = await tasks.getById(authenticated, requireNonEmptyString(parts[1], "taskId"));
      sendJson(response, 200, success(task, requestId), requestId);
      return true;
    }

    if (request.method === "GET" && parts.length === 3 && parts[0] === "organizations" && parts[2] === "tasks") {
      const organizationId = requireNonEmptyString(parts[1], "organizationId");
      if (organizationId !== authenticated.organizationId) {
        throw new ApplicationError("Organization access denied", "FORBIDDEN");
      }
      const { limit, offset } = parsePagination(url.searchParams);
      const result = await tasks.list(authenticated, limit, offset);
      sendJson(response, 200, success({ data: result, limit, offset }, requestId), requestId);
      return true;
    }

    const body = await readJsonBody(request);
    if (!body || typeof body !== "object") {
      throw new ApplicationError("Request body must be an object", "BAD_REQUEST");
    }
    const status = parseTaskStatus((body as Record<string, unknown>).status);
    const task = await tasks.transition(
      authenticated,
      requireNonEmptyString(parts[1], "taskId"),
      status,
    );
    sendJson(response, 200, success(task, requestId), requestId);
    return true;
  } catch (error) {
    const mapped = toHttpError(error);
    sendJson(response, mapped.status, failure(mapped.body.error, mapped.body.code, requestId), requestId);
    return true;
  }
}
