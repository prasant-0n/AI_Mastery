import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { AuthService } from "../src/application/auth-service.js";
import { TokenService } from "../src/application/token-service.js";
import { TaskApiService } from "../src/application/task-api-service.js";
import type { Task } from "../src/domain/task.js";
import type { User } from "../src/domain/user.js";
import type { UserRepository, TaskRepository } from "../src/application/repositories.js";
import { createHttpServer } from "../src/http/server-app.js";

class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();
  public async create(user: User): Promise<void> { this.store.set(user.id, user); }
  public async findById(id: string): Promise<User | null> { return this.store.get(id) ?? null; }
  public async findByEmail(email: string): Promise<User | null> {
    return [...this.store.values()].find((user) => user.email === email.trim().toLowerCase()) ?? null;
  }
  public async findByOrganizationAndEmail(organizationId: string, email: string): Promise<User | null> {
    return [...this.store.values()].find((user) => user.organizationId === organizationId && user.email === email.trim().toLowerCase()) ?? null;
  }
}

class InMemoryTaskRepository implements TaskRepository {
  private readonly store = new Map<string, Task>();
  public async create(task: Task): Promise<void> { this.store.set(task.id, task); }
  public async findById(id: string): Promise<Task | null> { return this.store.get(id) ?? null; }
  public async update(task: Task): Promise<void> { this.store.set(task.id, task); }
  public async listByOrganization(organizationId: string, limit: number, offset: number): Promise<readonly Task[]> {
    return [...this.store.values()].filter((task) => task.organizationId === organizationId).slice(offset, offset + limit);
  }
}

const secret = "0123456789abcdef0123456789abcdef";

async function startServer() {
  const users = new InMemoryUserRepository();
  const tokens = new TokenService(secret);
  const auth = new AuthService(users, tokens);
  const service = new TaskApiService(new InMemoryTaskRepository());
  await auth.register({ id: "user-1", organizationId: "org-1", email: "user@example.com", password: "correct horse battery staple" });

  const server = createHttpServer(service, auth, users, tokens, async () => ({ status: "ready", database: "up" }));
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");

  const login = await fetch("http://127.0.0.1:" + address.port + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ organizationId: "org-1", email: "user@example.com", password: "correct horse battery staple" }),
  });
  assert.equal(login.status, 200);
  const loginBody = await login.json();

  return { server, baseUrl: "http://127.0.0.1:" + address.port, accessToken: loginBody.data.accessToken as string };
}

test("GET /health returns enveloped service health", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/health");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.status, "ok");
    assert.equal(typeof body.meta.requestId, "string");
    assert.equal(response.headers.get("x-request-id"), body.meta.requestId);
  } finally { server.close(); }
});

test("GET /ready reports readiness", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/ready");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.status, "ready");
  } finally { server.close(); }
});

test("POST /auth/login returns an access token", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: "org-1", email: "user@example.com", password: "correct horse battery staple" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.userId, "user-1");
    assert.equal(typeof body.data.accessToken, "string");
    assert.equal("passwordHash" in body.data, false);
  } finally { server.close(); }
});

test("POST /tasks requires authentication", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "document" }) });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "UNAUTHORIZED");
  } finally { server.close(); }
});

test("POST /tasks derives tenant identity from authentication", async () => {
  const { server, baseUrl, accessToken } = await startServer();
  try {
    const response = await fetch(baseUrl + "/tasks", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + accessToken },
      body: JSON.stringify({ organizationId: "attacker-org", createdBy: "attacker-user", type: "document" }),
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.data.organizationId, "org-1");
    assert.equal(body.data.createdBy, "user-1");
  } finally { server.close(); }
});

test("GET /tasks/:id requires authentication", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/tasks/missing");
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "UNAUTHORIZED");
  } finally { server.close(); }
});

test("PATCH /tasks/:id/status requires authentication", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/tasks/task-1/status", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "QUEUED" }) });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "UNAUTHORIZED");
  } finally { server.close(); }
});

test("unknown route returns structured 404", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(baseUrl + "/unknown");
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(typeof body.meta.requestId, "string");
  } finally { server.close(); }
});
