import test from "node:test";
import assert from "node:assert/strict";
import { TaskApiService } from "../src/application/task-api-service.js";
import type { AuthenticatedUser } from "../src/application/authentication.js";
import type { Task } from "../src/domain/task.js";
import type { TaskRepository } from "../src/application/repositories.js";

class InMemoryTaskRepository implements TaskRepository {
  private readonly store = new Map<string, Task>();

  public async create(task: Task): Promise<void> {
    this.store.set(task.id, task);
  }

  public async findById(id: string): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }

  public async update(task: Task): Promise<void> {
    this.store.set(task.id, task);
  }

  public async listByOrganization(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<readonly Task[]> {
    return [...this.store.values()]
      .filter((task) => task.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
}

const userA: AuthenticatedUser = {
  userId: "user-a",
  organizationId: "org-a",
};

const userB: AuthenticatedUser = {
  userId: "user-b",
  organizationId: "org-b",
};

function createService(): TaskApiService {
  return new TaskApiService(new InMemoryTaskRepository());
}

test("creates a task from authenticated tenant identity", async () => {
  const service = createService();

  const created = await service.create(userA, {
    id: "task-1",
    type: "integration_test",
  });

  assert.equal(created.organizationId, "org-a");
  assert.equal(created.createdBy, "user-a");
  assert.equal(created.status, "PENDING");
});

test("prevents one organization from reading another organization's task", async () => {
  const service = createService();

  await service.create(userA, {
    id: "task-private",
    type: "integration_test",
  });

  await assert.rejects(
    () => service.getById(userB, "task-private"),
    /Task not found/,
  );
});

test("prevents cross-tenant listing", async () => {
  const service = createService();

  await service.create(userA, {
    id: "task-org-a",
    type: "test",
  });

  await service.create(userB, {
    id: "task-org-b",
    type: "test",
  });

  const tasks = await service.list(userA, 20, 0);

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]?.organizationId, "org-a");
});

test("rejects invalid state transitions", async () => {
  const service = createService();

  await service.create(userA, {
    id: "task-2",
    type: "integration_test",
  });

  await assert.rejects(
    () => service.transition(userA, "task-2", "SUCCEEDED"),
    /Invalid task transition/,
  );
});

test("allows valid state transitions", async () => {
  const service = createService();

  await service.create(userA, {
    id: "task-3",
    type: "integration_test",
  });

  const queued = await service.transition(userA, "task-3", "QUEUED");
  const running = await service.transition(userA, "task-3", "RUNNING");
  const succeeded = await service.transition(userA, "task-3", "SUCCEEDED");

  assert.equal(queued.status, "QUEUED");
  assert.equal(running.status, "RUNNING");
  assert.equal(succeeded.status, "SUCCEEDED");
});
