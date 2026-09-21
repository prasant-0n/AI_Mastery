import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { UserRepository } from "../application/repositories.js";
import type { TokenService } from "../application/token-service.js";
import { checkReadiness, getHealth } from "../application/health-service.js";
import { AuthService } from "../application/auth-service.js";
import { TaskApiService } from "../application/task-api-service.js";
import { handleAuthRoutes } from "./auth-routes.js";
import { handleTaskRoutes } from "./task-routes.js";
import { createRequestContext } from "./request-context.js";
import { failure, success } from "./api-response.js";
import { setSecurityHeaders } from "./security-headers.js";

function sendJson(response: ServerResponse, status: number, body: unknown, requestId: string): void {
  response.setHeader("x-request-id", requestId);
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export function createHttpServer(
  taskApi: TaskApiService,
  auth: AuthService,
  users: UserRepository,
  tokens: TokenService,
  readiness: () => ReturnType<typeof checkReadiness>,
): ReturnType<typeof createServer> {
  return createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const { requestId } = createRequestContext(request);
    setSecurityHeaders(response);

    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
          "access-control-allow-headers": "content-type,authorization,x-request-id",
          "access-control-max-age": "600",
          "x-request-id": requestId,
        });
        response.end();
        return;
      }

      response.setHeader("access-control-allow-origin", "*");
      response.setHeader("access-control-expose-headers", "x-request-id");

      if (request.method === "GET" && request.url === "/health") {
        sendJson(response, 200, success(getHealth(), requestId), requestId);
        return;
      }

      if (request.method === "GET" && request.url === "/ready") {
        const result = await readiness();
        sendJson(
          response,
          result.status === "ready" ? 200 : 503,
          result.status === "ready"
            ? success(result, requestId)
            : failure("Service is not ready", "NOT_READY", requestId),
          requestId,
        );
        return;
      }

      if (await handleAuthRoutes(request, response, auth, requestId)) return;

      const handled = await handleTaskRoutes(
        request,
        response,
        taskApi,
        users,
        tokens,
        requestId,
      );

      if (!handled) {
        sendJson(
          response,
          404,
          failure("Not found", "NOT_FOUND", requestId),
          requestId,
        );
      }
    } catch {
      sendJson(
        response,
        500,
        failure("Internal server error", "INTERNAL_ERROR", requestId),
        requestId,
      );
    }
  });
}
