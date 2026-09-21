import { createApplication } from "./infrastructure/composition-root.js";
import { checkReadiness } from "./application/health-service.js";
import { TaskApiService } from "./application/task-api-service.js";
import { createHttpServer } from "./http/server-app.js";

const { config, container, pool } = createApplication();
const taskApi = new TaskApiService(container.tasks);

const server = createHttpServer(
  taskApi,
  container.auth,
  container.users,
  container.tokens,
  () => checkReadiness(container),
);

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
