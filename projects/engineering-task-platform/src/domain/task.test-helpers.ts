import type { Task } from "./task.js";

export function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    organizationId: "org-1",
    createdBy: "user-1",
    type: "process_document",
    status: "PENDING",
    attemptCount: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
