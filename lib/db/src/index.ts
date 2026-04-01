import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function buildConnectionConfig(rawUrl: string): pg.PoolConfig {
  const url = new URL(rawUrl);

  const sslParam = url.searchParams.get("sslmode") ?? url.searchParams.get("ssl");
  const ssl: pg.PoolConfig["ssl"] =
    sslParam === "disable"
      ? false
      : sslParam === "no-verify"
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: false };

  return {
    connectionString: rawUrl,
    ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}

export const pool = new Pool(buildConnectionConfig(process.env.DATABASE_URL));

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
