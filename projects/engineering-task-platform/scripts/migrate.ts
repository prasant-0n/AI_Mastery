import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { loadConfig } from "../src/infrastructure/config.js";

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl });

const migrations = [
  {
    version: "001_initial_schema",
    path: "../docs/migrations/001_initial_schema.sql",
  },
  {
    version: "002_migration_tracking",
    path: "../docs/migrations/002_migration_tracking.sql",
  },
] as const;

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  for (const migration of migrations) {
    const result = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1",
      [migration.version],
    );

    if (result.rowCount !== 0) {
      console.log(`migration already applied: ${migration.version}`);
      continue;
    }

    const sql = await readFile(
      new URL(migration.path, import.meta.url),
      "utf8",
    );

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [migration.version],
      );
      await client.query("COMMIT");
      console.log(`migration applied: ${migration.version}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
