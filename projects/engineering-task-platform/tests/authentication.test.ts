import test from "node:test";
import assert from "node:assert/strict";
import { authenticateRequest } from "../src/application/authentication.js";
import { hashPassword } from "../src/application/password-hashing.js";
import { AuthService } from "../src/application/auth-service.js";
import { TokenService } from "../src/application/token-service.js";
import type { User } from "../src/domain/user.js";
import type { UserRepository } from "../src/application/repositories.js";

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  public async create(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  public async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find(
      (user) => user.email === email.trim().toLowerCase(),
    ) ?? null;
  }

  public async findByOrganizationAndEmail(
    organizationId: string,
    email: string,
  ): Promise<User | null> {
    return [...this.users.values()].find(
      (user) =>
        user.organizationId === organizationId &&
        user.email === email.trim().toLowerCase(),
    ) ?? null;
  }
}

const secret = "0123456789abcdef0123456789abcdef";

test("registers and logs in a user without exposing the password hash", async () => {
  const users = new InMemoryUserRepository();
  const tokens = new TokenService(secret);
  const auth = new AuthService(users, tokens);

  const registered = await auth.register({
    id: "user-1",
    organizationId: "org-1",
    email: "USER@example.com",
    password: "correct horse battery staple",
  });

  assert.equal(registered.email, "user@example.com");
  assert.equal("passwordHash" in registered, false);
  assert.equal(typeof registered.accessToken, "string");

  const login = await auth.login(
    "org-1",
    "user@example.com",
    "correct horse battery staple",
  );

  assert.equal(login.userId, "user-1");
  assert.equal(login.organizationId, "org-1");
  assert.equal(typeof login.accessToken, "string");
});

test("login rejects the wrong tenant", async () => {
  const users = new InMemoryUserRepository();
  const tokens = new TokenService(secret);
  const auth = new AuthService(users, tokens);

  await auth.register({
    id: "user-1",
    organizationId: "org-1",
    email: "user@example.com",
    password: "correct horse battery staple",
  });

  await assert.rejects(
    () => auth.login("org-2", "user@example.com", "correct horse battery staple"),
    /Invalid credentials/,
  );
});

test("request authentication verifies the persisted tenant identity", async () => {
  const users = new InMemoryUserRepository();
  const tokens = new TokenService(secret);
  const passwordHash = await hashPassword("correct horse battery staple");

  await users.create({
    id: "user-1",
    organizationId: "org-1",
    email: "user@example.com",
    passwordHash,
    createdAt: new Date(),
  });

  const token = tokens.issue({
    userId: "user-1",
    organizationId: "org-1",
  });

  const identity = await authenticateRequest(
    `Bearer ${token}`,
    users,
    tokens,
  );

  assert.deepEqual(identity, {
    userId: "user-1",
    organizationId: "org-1",
  });
});

test("missing authorization is rejected", async () => {
  const users = new InMemoryUserRepository();
  const tokens = new TokenService(secret);

  await assert.rejects(
    () => authenticateRequest(undefined, users, tokens),
    /Authentication required/,
  );
});
