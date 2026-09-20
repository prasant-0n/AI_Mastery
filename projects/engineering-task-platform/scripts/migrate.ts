import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { loadConfig } from "../src/infrastructure/config.js";

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl });

try {
  const migration = await readFile(
    new URL("../docs/migrations/001_initial_schema.sql", import.meta.url),
    "utf8",
  );

  await pool.query(migration);
  console.log("database migration applied");
} finally {
  await pool.end();
}
