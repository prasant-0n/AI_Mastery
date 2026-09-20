import {
  canTransition,
  type Task,
  type TaskStatus,
  transitionTask,
} from "../domain/task.js";

export interface CreateTaskInput {
  readonly id: string;
  readonly organizationId: string;
  readonly createdBy: string;
  readonly type: string;
}

export function createTask(input: CreateTaskInput): Task {
  return {
    id: input.id,
    organizationId: input.organizationId,
    createdBy: input.createdBy,
    type: input.type,
    status: "PENDING",
    attemptCount: 0,
    createdAt: new Date(),
  };
}

export function moveTask(
  task: Task,
  nextStatus: TaskStatus,
): Task {
  if (!canTransition(task.status, nextStatus)) {
    throw new Error(
      `Invalid task transition: ${task.status} -> ${nextStatus}`,
    );
  }

  return transitionTask(task, nextStatus);
}
