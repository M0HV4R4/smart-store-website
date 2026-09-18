import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Cache connection pool across warm serverless function invocations
let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is missing. Please configure it in your .env or Vercel project settings.",
    );
  }

  // Neon connection pooling uses ?sslmode=require
  const isNeon = connectionString.includes("neon.tech");

  pool = new Pool({
    connectionString,
    ssl: isNeon || connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 1, // Serverless safe connection pool limit (1 per lambda instance for Neon pooler)
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err);
  });

  return pool;
}

let mockDbInstance: unknown = null;

export function setMockDb(mock: unknown): void {
  mockDbInstance = mock;
}

export function getDb() {
  if (mockDbInstance) {
    return mockDbInstance as ReturnType<typeof drizzle>;
  }
  const p = getPool();
  return drizzle(p, { schema });
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === "function") {
      return val.bind(instance);
    }
    return val;
  },
});

export { schema };

