import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { UserRepository } from "../application/repositories.js";
import type { TokenService } from "../application/token-service.js";
import { checkReadiness, getHealth } from "../application/health-service.js";
import { AuthService } from "../application/auth-service.js";
import { TaskApiService } from "../application/task-api-service.js";
import { handleAuthRoutes } from "./auth-routes.js";
import { handleTaskRoutes } from "./task-routes.js";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
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
    response.setHeader("content-type", "application/json");

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, getHealth());
      return;
    }

    if (request.method === "GET" && request.url === "/ready") {
      const result = await readiness();
      sendJson(response, result.status === "ready" ? 200 : 503, result);
      return;
    }

    if (await handleAuthRoutes(request, response, auth)) {
      return;
    }

    const handled = await handleTaskRoutes(
      request,
      response,
      taskApi,
      users,
      tokens,
    );

    if (!handled) {
      sendJson(response, 404, {
        error: "Not found",
        code: "NOT_FOUND",
      });
    }
  });
}
