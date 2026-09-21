import test from "node:test";
import assert from "node:assert/strict";
import { TaskApiService } from "../src/application/task-api-service.js";
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

function createService(): TaskApiService {
  return new TaskApiService(new InMemoryTaskRepository());
}

test("creates and retrieves a task", async () => {
  const service = createService();

  const created = await service.create({
    id: "task-1",
    organizationId: "org-1",
    createdBy: "user-1",
    type: "integration_test",
  });

  const loaded = await service.getById(created.id);

  assert.deepEqual(loaded, created);
  assert.equal(loaded.status, "PENDING");
});

test("rejects invalid state transitions", async () => {
  const service = createService();

  await service.create({
    id: "task-2",
    organizationId: "org-1",
    createdBy: "user-1",
    type: "integration_test",
  });

  await assert.rejects(
    () => service.transition("task-2", "SUCCEEDED"),
    /Invalid task transition/,
  );
});

test("allows valid state transitions", async () => {
  const service = createService();

  await service.create({
    id: "task-3",
    organizationId: "org-1",
    createdBy: "user-1",
    type: "integration_test",
  });

  const queued = await service.transition("task-3", "QUEUED");
  const running = await service.transition("task-3", "RUNNING");
  const succeeded = await service.transition("task-3", "SUCCEEDED");

  assert.equal(queued.status, "QUEUED");
  assert.equal(running.status, "RUNNING");
  assert.equal(succeeded.status, "SUCCEEDED");
});

test("lists only tasks belonging to the requested organization", async () => {
  const service = createService();

  await service.create({
    id: "task-org-a",
    organizationId: "org-a",
    createdBy: "user-a",
    type: "test",
  });

  await service.create({
    id: "task-org-b",
    organizationId: "org-b",
    createdBy: "user-b",
    type: "test",
  });

  const tasks = await service.list("org-a", 20, 0);

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]?.organizationId, "org-a");
});
