import assert from "node:assert/strict";
import test from "node:test";

import { createOrganization } from "../src/domain/organization.js";
import { createUser } from "../src/domain/user.js";
import { DomainInvariantError } from "../src/domain/errors.js";
import { canTransition, transitionTask } from "../src/domain/task.js";
import { createTask } from "../src/application/task-service.js";
import { buildTask } from "../src/domain/task.test-helpers.js";

const transitionTime = new Date("2026-01-01T01:00:00.000Z");

test("creates an organization with normalized name", () => {
  const organization = createOrganization(" org-1 ", "  Acme  ");

  assert.equal(organization.id, "org-1");
  assert.equal(organization.name, "Acme");
});

test("rejects invalid organization invariants", () => {
  assert.throws(
    () => createOrganization("", "Acme"),
    DomainInvariantError,
  );
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

test("rejects invalid user invariants", () => {
  assert.throws(
    () => createUser("user-1", "org-1", "invalid", "password-hash"),
    /Invalid email address/,
  );
  assert.throws(
    () => createUser("user-1", "", "user@example.com", "password-hash"),
    /User organizationId is required/,
  );
  assert.throws(
    () => createUser("user-1", "org-1", "user@example.com", ""),
    /Password hash is required/,
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

test("rejects invalid task creation invariants", () => {
  assert.throws(
    () => createTask({ id: "", organizationId: "org-1", createdBy: "user-1", type: "test" }),
    /Task id is required/,
  );
  assert.throws(
    () => createTask({ id: "task-1", organizationId: "", createdBy: "user-1", type: "test" }),
    /Task organizationId is required/,
  );
  assert.throws(
    () => createTask({ id: "task-1", organizationId: "org-1", createdBy: "", type: "test" }),
    /Task createdBy is required/,
  );
  assert.throws(
    () => createTask({ id: "task-1", organizationId: "org-1", createdBy: "user-1", type: " " }),
    /Task type is required/,
  );
});

test("allows only explicitly modeled task transitions", () => {
  assert.equal(canTransition("PENDING", "QUEUED"), true);
  assert.equal(canTransition("PENDING", "RUNNING"), false);
  assert.equal(canTransition("SUCCEEDED", "RUNNING"), false);
  assert.equal(canTransition("FAILED", "QUEUED"), false);
  assert.equal(canTransition("CANCELLED", "PENDING"), false);
});

test("RUNNING transition increments attempt count and records start time", () => {
  const task = buildTask({ status: "QUEUED", attemptCount: 2 });
  const running = transitionTask(task, "RUNNING", transitionTime);

  assert.equal(running.attemptCount, 3);
  assert.equal(running.startedAt, transitionTime);
  assert.equal(running.completedAt, undefined);
});

test("terminal transition records completion time", () => {
  const task = buildTask({
    status: "RUNNING",
    attemptCount: 1,
    startedAt: new Date("2026-01-01T00:30:00.000Z"),
  });

  const succeeded = transitionTask(task, "SUCCEEDED", transitionTime);

  assert.equal(succeeded.status, "SUCCEEDED");
  assert.equal(succeeded.completedAt, transitionTime);
  assert.equal(succeeded.attemptCount, 1);
});

test("retry transition returns task to QUEUED without completion", () => {
  const task = buildTask({
    status: "RUNNING",
    attemptCount: 1,
    startedAt: new Date("2026-01-01T00:30:00.000Z"),
  });

  const queued = transitionTask(task, "QUEUED", transitionTime);

  assert.equal(queued.status, "QUEUED");
  assert.equal(queued.attemptCount, 1);
  assert.equal(queued.startedAt, undefined);
  assert.equal(queued.completedAt, undefined);
});

test("invalid transition throws a domain invariant error", () => {
  assert.throws(
    () => transitionTask(buildTask(), "SUCCEEDED", transitionTime),
    DomainInvariantError,
  );
});
