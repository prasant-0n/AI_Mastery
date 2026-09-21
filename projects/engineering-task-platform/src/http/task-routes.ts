import type { IncomingMessage, ServerResponse } from "node:http";
import { ApplicationError, toHttpError } from "../application/http-errors.js";
import { TaskApiService } from "../application/task-api-service.js";
import { parsePagination, parseTaskStatus, requireNonEmptyString } from "../application/request-validation.js";
import { readJsonBody } from "./request-body.js";

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function getPathParts(url: string): string[] {
  return new URL(url, "http://localhost").pathname
    .split("/")
    .filter(Boolean);
}

export async function handleTaskRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  tasks: TaskApiService,
): Promise<boolean> {
  if (!request.url) return false;

  const url = new URL(request.url, "http://localhost");
  const parts = getPathParts(request.url);

  try {
    if (request.method === "POST" && parts.length === 1 && parts[0] === "tasks") {
      const body = await readJsonBody(request);

      if (!body || typeof body !== "object") {
        throw new ApplicationError("Request body must be an object", "BAD_REQUEST");
      }

      const input = body as Record<string, unknown>;

      const task = await tasks.create({
        id: crypto.randomUUID(),
        organizationId: requireNonEmptyString(input.organizationId, "organizationId"),
        createdBy: requireNonEmptyString(input.createdBy, "createdBy"),
        type: requireNonEmptyString(input.type, "type"),
      });

      sendJson(response, 201, task);
      return true;
    }

    if (request.method === "GET" && parts.length === 2 && parts[0] === "tasks") {
      const task = await tasks.getById(requireNonEmptyString(parts[1], "taskId"));
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
      const { limit, offset } = parsePagination(url.searchParams);
      const result = await tasks.list(organizationId, limit, offset);

      sendJson(response, 200, {
        data: result,
        limit,
        offset,
      });
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
