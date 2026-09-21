import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { TaskApiService } from "../src/application/task-api-service.js";
import type { Task } from "../src/domain/task.js";
import type { TaskRepository } from "../src/application/repositories.js";
import { createHttpServer } from "../src/http/server-app.js";

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
      .slice(offset, offset + limit);
  }
}

async function startServer() {
  const service = new TaskApiService(new InMemoryTaskRepository());
  const server = createHttpServer(
    service,
    async () => ({ status: "ready", database: "up" }),
  );

  server.listen(0);
  await once(server, "listening");

  const address = server.address();
  assert.ok(address && typeof address === "object");

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

test("GET /health returns service health", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ok",
      service: "engineering-task-platform",
    });
  } finally {
    server.close();
  }
});

test("POST /tasks creates a task", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId: "org-1",
        createdBy: "user-1",
        type: "document",
      }),
    });

    assert.equal(response.status, 201);

    const body = await response.json();
    assert.equal(body.organizationId, "org-1");
    assert.equal(body.status, "PENDING");
  } finally {
    server.close();
  }
});

test("POST /tasks rejects malformed JSON", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, "BAD_REQUEST");
  } finally {
    server.close();
  }
});

test("GET /tasks/:id returns 404 for unknown task", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/tasks/missing`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).code, "NOT_FOUND");
  } finally {
    server.close();
  }
});

test("PATCH /tasks/:id/status enforces state machine", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const created = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId: "org-1",
        createdBy: "user-1",
        type: "document",
      }),
    });

    const task = await created.json();

    const invalid = await fetch(`${baseUrl}/tasks/${task.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "SUCCEEDED" }),
    });

    assert.equal(invalid.status, 500);
  } finally {
    server.close();
  }
});
