import { createServer } from "node:http";
import { createApplication } from "./infrastructure/composition-root.js";
import { checkReadiness, getHealth } from "./application/health-service.js";
import { TaskApiService } from "./application/task-api-service.js";
import { handleTaskRoutes } from "./http/task-routes.js";

const { config, container, pool } = createApplication();
const taskApi = new TaskApiService(container.tasks);

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");

  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200);
    response.end(JSON.stringify(getHealth()));
    return;
  }

  if (request.method === "GET" && request.url === "/ready") {
    const readiness = await checkReadiness(container);
    response.writeHead(readiness.status === "ready" ? 200 : 503);
    response.end(JSON.stringify(readiness));
    return;
  }

  const handled = await handleTaskRoutes(request, response, taskApi);
  if (handled) return;

  response.writeHead(404);
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(config.port, () => {
  console.log(`engineering-task-platform listening on :${config.port}`);
});

const shutdown = async (signal: string): Promise<void> => {
  console.log(`received ${signal}; shutting down`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
