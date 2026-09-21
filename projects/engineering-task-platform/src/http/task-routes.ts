import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticateRequest } from "../application/authentication.js";
import { ApplicationError, toHttpError } from "../application/http-errors.js";
import { TaskApiService } from "../application/task-api-service.js";
import { parsePagination, parseTaskStatus, requireNonEmptyString } from "../application/request-validation.js";
import type { UserRepository } from "../application/repositories.js";
import type { TokenService } from "../application/token-service.js";
import { readJsonBody } from "./request-body.js";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function getPathParts(url: string): string[] {
  return new URL(url, "http://localhost").pathname.split("/").filter(Boolean);
}

export async function handleTaskRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  tasks: TaskApiService,
  users: UserRepository,
  tokens: TokenService,
): Promise<boolean> {
  if (!request.url) return false;

  const url = new URL(request.url, "http://localhost");
  const parts = getPathParts(request.url);

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

      const input = body as Record<string, unknown>;

      const task = await tasks.create(authenticated, {
        id: randomUUID(),
        type: requireNonEmptyString(input.type, "type"),
      });

      sendJson(response, 201, task);
      return true;
    }

    if (request.method === "GET" && parts.length === 2 && parts[0] === "tasks") {
      const task = await tasks.getById(
        authenticated,
        requireNonEmptyString(parts[1], "taskId"),
      );
      sendJson(response, 200, task);
      return true;
    }

    if (
      request.method === "GET" &&
      parts.length === 3 &&
      parts[0] === "organizations" &&
      parts[2] === "tasks"
    ) {
      const organizationId = requireNonEmptyString(parts[1], "organizationId");

      if (organizationId !== authenticated.organizationId) {
        throw new ApplicationError("Organization access denied", "NOT_FOUND");
      }

      const { limit, offset } = parsePagination(url.searchParams);
      const result = await tasks.list(authenticated, limit, offset);

      sendJson(response, 200, { data: result, limit, offset });
      return true;
    }

    if (
      request.method === "PATCH" &&
      parts.length === 3 &&
      parts[0] === "tasks" &&
      parts[2] === "status"
    ) {
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

      sendJson(response, 200, task);
      return true;
    }

    return false;
  } catch (error) {
    const mapped = toHttpError(error);
    sendJson(response, mapped.status, mapped.body);
    return true;
  }
}
