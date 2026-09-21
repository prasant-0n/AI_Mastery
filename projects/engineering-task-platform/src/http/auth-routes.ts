import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthService } from "../application/auth-service.js";
import { ApplicationError, toHttpError } from "../application/http-errors.js";
import { requireNonEmptyString } from "../application/request-validation.js";
import { readJsonBody } from "./request-body.js";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export async function handleAuthRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  auth: AuthService,
): Promise<boolean> {
  if (!request.url) return false;

  try {
    if (request.method !== "POST") return false;

    const path = new URL(request.url, "http://localhost").pathname;

    if (path !== "/auth/login" && path !== "/auth/register") {
      return false;
    }

    const body = await readJsonBody(request);

    if (!body || typeof body !== "object") {
      throw new ApplicationError("Request body must be an object", "BAD_REQUEST");
    }

    const input = body as Record<string, unknown>;
    const organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
    const email = requireNonEmptyString(input.email, "email");
    const password = requireNonEmptyString(input.password, "password");

    if (path === "/auth/register") {
      const result = await auth.register({
        id: randomUUID(),
        organizationId,
        email,
        password,
      });
      sendJson(response, 201, result);
      return true;
    }

    const result = await auth.login(organizationId, email, password);
    sendJson(response, 200, result);
    return true;
  } catch (error) {
    const mapped = toHttpError(error);
    sendJson(response, mapped.status, mapped.body);
    return true;
  }
}
