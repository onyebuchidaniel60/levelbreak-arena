import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");
const connectionString = process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error("DATABASE_URL_UNPOOLED is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (await client.query("SELECT version FROM schema_migrations")).rows.map(
      (row) => row.version,
    ),
  );

  const pending = files.filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log("No pending migrations.");
  }

  for (const file of pending) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  const result = await client.query(
    "SELECT version, applied_at FROM schema_migrations ORDER BY version",
  );
  console.log("Applied migrations:");
  for (const row of result.rows) {
    console.log(`- ${row.version} (${row.applied_at.toISOString()})`);
  }
} finally {
  await client.end();
}
