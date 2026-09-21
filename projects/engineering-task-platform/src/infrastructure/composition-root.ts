import { AuthService } from "../application/auth-service.js";
import { TokenService } from "../application/token-service.js";
import type { ApplicationContainer } from "../application/container.js";
import { loadConfig } from "./config.js";
import { createPostgresPool } from "./persistence/postgres/client.js";
import { PostgresOrganizationRepository } from "./persistence/postgres/organization-repository.js";
import { PostgresTaskRepository } from "./persistence/postgres/task-repository.js";
import { PostgresUserRepository } from "./persistence/postgres/user-repository.js";

export function createApplication() {
  const config = loadConfig();
  const pool = createPostgresPool(config.databaseUrl);
  const users = new PostgresUserRepository(pool);
  const tokens = new TokenService(config.accessTokenSecret);

  const container: ApplicationContainer = {
    organizations: new PostgresOrganizationRepository(pool),
    users,
    tasks: new PostgresTaskRepository(pool),
    tokens,
    auth: new AuthService(users, tokens),
  };

  return { config, container, pool };
}
