import { TASK_STATUSES, type TaskStatus } from "../domain/task.js";
import { ApplicationError } from "./http-errors.js";

export function requireNonEmptyString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApplicationError(`${field} is required`, "BAD_REQUEST");
  }

  return value.trim();
}

export function parseTaskStatus(value: unknown): TaskStatus {
  const status = requireNonEmptyString(value, "status");

  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new ApplicationError("Invalid task status", "BAD_REQUEST");
  }

  return status as TaskStatus;
}

export function parsePagination(
  searchParams: URLSearchParams,
): { limit: number; offset: number } {
  const rawLimit = searchParams.get("limit") ?? "20";
  const rawOffset = searchParams.get("offset") ?? "0";

  const limit = Number(rawLimit);
  const offset = Number(rawOffset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApplicationError("limit must be between 1 and 100", "BAD_REQUEST");
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new ApplicationError("offset must be non-negative", "BAD_REQUEST");
  }

  return { limit, offset };
}
