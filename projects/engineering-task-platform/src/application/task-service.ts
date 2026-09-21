import {
  canTransition,
  type Task,
  type TaskStatus,
  transitionTask,
} from "../domain/task.js";
import { DomainInvariantError } from "../domain/errors.js";

export interface CreateTaskInput {
  readonly id: string;
  readonly organizationId: string;
  readonly createdBy: string;
  readonly type: string;
}

export function createTask(input: CreateTaskInput): Task {
  const id = input.id.trim();
  const organizationId = input.organizationId.trim();
  const createdBy = input.createdBy.trim();
  const type = input.type.trim();

  if (!id) throw new DomainInvariantError("Task id is required");
  if (!organizationId) {
    throw new DomainInvariantError("Task organizationId is required");
  }
  if (!createdBy) {
    throw new DomainInvariantError("Task createdBy is required");
  }
  if (!type) throw new DomainInvariantError("Task type is required");

  return {
    id,
    organizationId,
    createdBy,
    type,
    status: "PENDING",
    attemptCount: 0,
    createdAt: new Date(),
  };
}

export function moveTask(
  task: Task,
  nextStatus: TaskStatus,
  now = new Date(),
): Task {
  if (!canTransition(task.status, nextStatus)) {
    throw new DomainInvariantError(
      `Invalid task transition: ${task.status} -> ${nextStatus}`,
    );
  }

  return transitionTask(task, nextStatus, now);
}
