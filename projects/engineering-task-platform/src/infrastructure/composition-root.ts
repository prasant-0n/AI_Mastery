import { loadConfig } from "./config.js";
import { createPostgresPool } from "./persistence/postgres/client.js";
import { PostgresOrganizationRepository } from "./persistence/postgres/organization-repository.js";
import { PostgresTaskRepository } from "./persistence/postgres/task-repository.js";
import { PostgresUserRepository } from "./persistence/postgres/user-repository.js";
import type { ApplicationContainer } from "../application/container.js";

export function createApplication() {
  const config = loadConfig();
  const pool = createPostgresPool(config.databaseUrl);

  const container: ApplicationContainer = {
    organizations: new PostgresOrganizationRepository(pool),
    users: new PostgresUserRepository(pool),
    tasks: new PostgresTaskRepository(pool),
  };

  return { config, container, pool };
}
