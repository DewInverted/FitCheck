import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL || "";

const globalForDb = globalThis as typeof globalThis & {
  __pool?: Pool;
};

let pool: Pool;
try {
  pool =
    globalForDb.__pool ??
    new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
      max: 5,
      connectionTimeoutMillis: 10000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pool = pool;
  }
} catch {
  pool = new Pool({ connectionString: databaseUrl });
}

export { pool };
export const db = drizzle(pool);
