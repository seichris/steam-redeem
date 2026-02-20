const fs = require("node:fs/promises");
const path = require("node:path");
const { Client } = require("pg");

function getDatabaseUrlOrThrow() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("Missing DATABASE_URL");
  }
  return value;
}

function getSslConfig() {
  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

async function run() {
  const databaseUrl = getDatabaseUrlOrThrow();
  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: getSslConfig()
  });

  await client.connect();
  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        executed_at timestamptz not null default now()
      );
    `);

    const existingResult = await client.query("select filename from schema_migrations");
    const existing = new Set(existingResult.rows.map((row) => String(row.filename)));

    for (const file of files) {
      if (existing.has(file)) {
        console.log(`skip ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      console.log(`apply ${file}`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (filename) values ($1)", [file]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

