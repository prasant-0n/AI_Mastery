import assert from "node:assert/strict";
import test from "node:test";

import {
  canTransition,
  transitionTask,
  type Task,
} from "../src/domain/task.js";

const task: Task = {
  id: "task-1",
  organizationId: "org-1",
  createdBy: "user-1",
  type: "process_document",
  status: "PENDING",
  attemptCount: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

test("allows valid task transitions", () => {
  assert.equal(canTransition("PENDING", "QUEUED"), true);
  assert.equal(canTransition("QUEUED", "RUNNING"), true);
  assert.equal(canTransition("RUNNING", "SUCCEEDED"), true);
});

test("rejects transitions from terminal states", () => {
  assert.equal(canTransition("SUCCEEDED", "RUNNING"), false);
  assert.equal(canTransition("FAILED", "QUEUED"), false);
  assert.equal(canTransition("CANCELLED", "RUNNING"), false);
});

test("transitionTask returns a new task state", () => {
  const queued = transitionTask(task, "QUEUED");

  assert.equal(task.status, "PENDING");
  assert.equal(queued.status, "QUEUED");
  assert.notEqual(queued, task);
});

test("transitionTask throws for invalid transitions", () => {
  assert.throws(
    () => transitionTask(task, "SUCCEEDED"),
    /Invalid task transition/,
  );
});
