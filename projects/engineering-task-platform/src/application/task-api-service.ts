import { createTask, type CreateTaskInput, moveTask } from "./task-service.js";
import { ApplicationError } from "./http-errors.js";
import type { TaskRepository } from "./repositories.js";
import type { TaskStatus } from "../domain/task.js";
import type { AuthenticatedUser } from "./authentication.js";

export class TaskApiService {
  public constructor(private readonly tasks: TaskRepository) {}

  public async create(
    authenticated: AuthenticatedUser,
    input: Pick<CreateTaskInput, "id" | "type">,
  ) {
    const task = createTask({
      ...input,
      organizationId: authenticated.organizationId,
      createdBy: authenticated.userId,
    });

    await this.tasks.create(task);
    return task;
  }

  public async getById(
    authenticated: AuthenticatedUser,
    id: string,
  ) {
    const task = await this.tasks.findById(id);

    if (!task) {
      throw new ApplicationError("Task not found", "NOT_FOUND");
    }

    if (task.organizationId !== authenticated.organizationId) {
      throw new ApplicationError("Task not found", "NOT_FOUND");
    }

    return task;
  }

  public async transition(
    authenticated: AuthenticatedUser,
    id: string,
    status: TaskStatus,
  ) {
    const task = await this.getById(authenticated, id);

    try {
      const updated = moveTask(task, status);
      await this.tasks.update(updated);
      return updated;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Invalid task transition:")
      ) {
        throw new ApplicationError(error.message, "BAD_REQUEST");
      }

      throw error;
    }
  }

  public async list(
    authenticated: AuthenticatedUser,
    limit: number,
    offset: number,
  ) {
    return this.tasks.listByOrganization(
      authenticated.organizationId,
      limit,
      offset,
    );
  }
}
