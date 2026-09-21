import { DomainInvariantError } from "./errors.js";

export const TASK_STATUSES = [
  "PENDING",
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  readonly id: string;
  readonly organizationId: string;
  readonly createdBy: string;
  readonly type: string;
  readonly status: TaskStatus;
  readonly attemptCount: number;
  readonly createdAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
}

const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  PENDING: ["QUEUED", "CANCELLED"],
  QUEUED: ["RUNNING", "CANCELLED"],
  RUNNING: ["SUCCEEDED", "FAILED", "QUEUED", "CANCELLED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return transitions[from].includes(to);
}

export function transitionTask(
  task: Task,
  nextStatus: TaskStatus,
  now = new Date(),
): Task {
  if (!canTransition(task.status, nextStatus)) {
    throw new DomainInvariantError(
      `Invalid task transition: ${task.status} -> ${nextStatus}`,
    );
  }

  if (Number.isNaN(now.getTime())) {
    throw new DomainInvariantError("Task transition time must be valid");
  }

  const next: Task = {
    ...task,
    status: nextStatus,
  };

  if (nextStatus === "RUNNING") {
    return {
      ...next,
      attemptCount: task.attemptCount + 1,
      startedAt: now,
      completedAt: undefined,
    };
  }

  if (nextStatus === "QUEUED") {
    return {
      ...next,
      startedAt: undefined,
      completedAt: undefined,
    };
  }

  if (
    nextStatus === "SUCCEEDED" ||
    nextStatus === "FAILED" ||
    nextStatus === "CANCELLED"
  ) {
    return {
      ...next,
      completedAt: now,
    };
  }

  return next;
}
