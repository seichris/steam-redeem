import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __dbPool: Pool | undefined;
}

function getDatabaseUrlOrThrow() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("Missing DATABASE_URL");
  return value;
}

function getSslConfig() {
  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false } as const;
  }
  return undefined;
}

export function getDbPool() {
  if (!globalThis.__dbPool) {
    globalThis.__dbPool = new Pool({
      connectionString: getDatabaseUrlOrThrow(),
      ssl: getSslConfig()
    });
  }
  return globalThis.__dbPool;
}

export async function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<Row>> {
  return getDbPool().query<Row>(text, params);
}

