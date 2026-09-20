import type { OrganizationRepository } from "../../../application/repositories.js";
import type { Organization } from "../../../domain/organization.js";
import type { PostgresExecutor } from "./types.js";

type OrganizationRow = {
  id: string;
  name: string;
  created_at: Date;
};

export class PostgresOrganizationRepository implements OrganizationRepository {
  public constructor(private readonly db: PostgresExecutor) {}

  public async create(organization: Organization): Promise<void> {
    await this.db.query(
      `INSERT INTO organizations (id, name, created_at)
       VALUES ($1, $2, $3)`,
      [organization.id, organization.name, organization.createdAt],
    );
  }

  public async findById(id: string): Promise<Organization | null> {
    const result = await this.db.query<OrganizationRow>(
      `SELECT id, name, created_at
       FROM organizations
       WHERE id = $1`,
      [id],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }
}
