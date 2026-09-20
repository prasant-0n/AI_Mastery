import type { UserRepository } from "../../../application/repositories.js";
import type { User } from "../../../domain/user.js";
import type { PostgresExecutor } from "./types.js";

type UserRow = {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  created_at: Date;
};

export class PostgresUserRepository implements UserRepository {
  public constructor(private readonly db: PostgresExecutor) {}

  public async create(user: User): Promise<void> {
    await this.db.query(
      `INSERT INTO users (
         id, organization_id, email, password_hash, created_at
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        user.organizationId,
        user.email,
        user.passwordHash,
        user.createdAt,
      ],
    );
  }

  public async findById(id: string): Promise<User | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id, organization_id, email, password_hash, created_at
       FROM users
       WHERE id = $1`,
      [id],
    );

    return this.toDomain(result.rows[0]);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id, organization_id, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()],
    );

    return this.toDomain(result.rows[0]);
  }

  private toDomain(row: UserRow | undefined): User | null {
    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }
}
