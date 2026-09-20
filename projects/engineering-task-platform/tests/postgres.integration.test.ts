import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { createOrganization } from "../src/domain/organization.js";
import { createUser } from "../src/domain/user.js";
import { createTask } from "../src/application/task-service.js";
import { PostgresOrganizationRepository } from "../src/infrastructure/persistence/postgres/organization-repository.js";
import { PostgresUserRepository } from "../src/infrastructure/persistence/postgres/user-repository.js";
import { PostgresTaskRepository } from "../src/infrastructure/persistence/postgres/task-repository.js";

const databaseUrl = process.env.DATABASE_URL;

test("PostgreSQL persistence round trip and tenant isolation", {
  skip: !databaseUrl,
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const organizations = new PostgresOrganizationRepository(pool);
    const users = new PostgresUserRepository(pool);
    const tasks = new PostgresTaskRepository(pool);

    const suffix = crypto.randomUUID();
    const orgA = createOrganization(crypto.randomUUID(), `Org A ${suffix.slice(0, 8)}`);
    const orgB = createOrganization(crypto.randomUUID(), `Org B ${suffix.slice(0, 8)}`);
    const userA = createUser(
      crypto.randomUUID(),
      orgA.id,
      `a-${suffix}@example.test`,
      "hashed-password",
    );
    const userB = createUser(
      crypto.randomUUID(),
      orgB.id,
      `b-${suffix}@example.test`,
      "hashed-password",
    );

    await organizations.create(orgA);
    await organizations.create(orgB);
    await users.create(userA);
    await users.create(userB);

    const taskA = createTask({
      id: crypto.randomUUID(),
      organizationId: orgA.id,
      createdBy: userA.id,
      type: "integration_test",
    });

    await tasks.create(taskA);

    const loaded = await tasks.findById(taskA.id);
    assert.deepEqual(loaded, taskA);

    const orgATasks = await tasks.listByOrganization(orgA.id, 100, 0);
    assert.equal(orgATasks.length, 1);
    assert.equal(orgATasks[0]?.organizationId, orgA.id);

    const orgBTasks = await tasks.listByOrganization(orgB.id, 100, 0);
    assert.equal(orgBTasks.length, 0);

    const crossTenantTask = createTask({
      id: crypto.randomUUID(),
      organizationId: orgB.id,
      createdBy: userA.id,
      type: "cross_tenant_test",
    });

    await assert.rejects(
      () => tasks.create(crossTenantTask),
      /foreign key|violates/i,
    );

    await pool.query("DELETE FROM tasks WHERE id = $1", [taskA.id]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [userA.id, userB.id]);
    await pool.query("DELETE FROM organizations WHERE id IN ($1, $2)", [orgA.id, orgB.id]);
  } finally {
    await pool.end();
  }
});
