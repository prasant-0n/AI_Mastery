import { createTask, type CreateTaskInput, moveTask } from "./task-service.js";
import { ApplicationError } from "./http-errors.js";
import type { TaskRepository } from "./repositories.js";
import type { TaskStatus } from "../domain/task.js";

export class TaskApiService {
  public constructor(private readonly tasks: TaskRepository) {}

  public async create(input: CreateTaskInput) {
    const task = createTask(input);
    await this.tasks.create(task);
    return task;
  }

  public async getById(id: string) {
    const task = await this.tasks.findById(id);

    if (!task) {
      throw new ApplicationError("Task not found", "NOT_FOUND");
    }

    return task;
  }

  public async transition(id: string, status: TaskStatus) {
    const task = await this.getById(id);
    const updated = moveTask(task, status);
    await this.tasks.update(updated);
    return updated;
  }

  public async list(
    organizationId: string,
    limit: number,
    offset: number,
  ) {
    return this.tasks.listByOrganization(organizationId, limit, offset);
  }
}
