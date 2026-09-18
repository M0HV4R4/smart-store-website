import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";

async function runMigrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL is not set in environment or .env file.");
    console.error("Please set DATABASE_URL=postgres://... in your .env file or Vercel settings.");
    process.exit(1);
  }

  console.log("⏳ Connecting to PostgreSQL database...");
  const isNeon = connectionString.includes("neon.tech");
  const pool = new Pool({
    connectionString,
    ssl: isNeon || connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    console.log(`📁 Applying migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log("✅ All migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrate();

