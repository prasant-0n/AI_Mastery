import type { TaskRepository } from "../../../application/repositories.js";
import type { Task, TaskStatus } from "../../../domain/task.js";
import type { PostgresExecutor } from "./types.js";

type TaskRow = {
  id: string;
  organization_id: string;
  created_by: string;
  type: string;
  status: TaskStatus;
  attempt_count: number;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
};

export class PostgresTaskRepository implements TaskRepository {
  public constructor(private readonly db: PostgresExecutor) {}

  public async create(task: Task): Promise<void> {
    await this.db.query(
      `INSERT INTO tasks (
         id, organization_id, created_by, type, status,
         attempt_count, created_at, started_at, completed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        task.id,
        task.organizationId,
        task.createdBy,
        task.type,
        task.status,
        task.attemptCount,
        task.createdAt,
        task.startedAt ?? null,
        task.completedAt ?? null,
      ],
    );
  }

  public async findById(id: string): Promise<Task | null> {
    const result = await this.db.query<TaskRow>(
      `SELECT id, organization_id, created_by, type, status,
              attempt_count, created_at, started_at, completed_at
       FROM tasks
       WHERE id = $1`,
      [id],
    );

    return this.toDomain(result.rows[0]);
  }

  public async update(task: Task): Promise<void> {
    await this.db.query(
      `UPDATE tasks
       SET status = $2,
           attempt_count = $3,
           started_at = $4,
           completed_at = $5
       WHERE id = $1`,
      [
        task.id,
        task.status,
        task.attemptCount,
        task.startedAt ?? null,
        task.completedAt ?? null,
      ],
    );
  }

  public async listByOrganization(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<readonly Task[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Task list limit must be between 1 and 100");
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new Error("Task list offset must be non-negative");
    }

    const result = await this.db.query<TaskRow>(
      `SELECT id, organization_id, created_by, type, status,
              attempt_count, created_at, started_at, completed_at
       FROM tasks
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset],
    );

    return result.rows.map((row) => this.toDomain(row)!);
  }

  private toDomain(row: TaskRow | undefined): Task | null {
    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      type: row.type,
      status: row.status,
      attemptCount: row.attempt_count,
      createdAt: row.created_at,
      ...(row.started_at ? { startedAt: row.started_at } : {}),
      ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    };
  }
}
