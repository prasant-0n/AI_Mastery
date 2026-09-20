import assert from "node:assert/strict";
import test from "node:test";

import { createOrganization } from "../src/domain/organization.js";
import { createUser } from "../src/domain/user.js";
import { createTask } from "../src/application/task-service.js";

test("creates an organization with normalized name", () => {
  const organization = createOrganization("org-1", "  Acme  ");

  assert.equal(organization.id, "org-1");
  assert.equal(organization.name, "Acme");
});

test("rejects invalid organization names", () => {
  assert.throws(
    () => createOrganization("org-1", " "),
    /Organization name must contain at least 2 characters/,
  );
});

test("creates a user with normalized email", () => {
  const user = createUser(
    "user-1",
    "org-1",
    "  USER@Example.COM ",
    "password-hash",
  );

  assert.equal(user.email, "user@example.com");
  assert.equal(user.organizationId, "org-1");
});

test("rejects invalid user email", () => {
  assert.throws(
    () => createUser("user-1", "org-1", "invalid", "password-hash"),
    /Invalid email address/,
  );
});

test("creates a task in PENDING state", () => {
  const task = createTask({
    id: "task-1",
    organizationId: "org-1",
    createdBy: "user-1",
    type: "process_document",
  });

  assert.equal(task.status, "PENDING");
  assert.equal(task.attemptCount, 0);
});
