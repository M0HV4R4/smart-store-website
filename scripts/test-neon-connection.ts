/**
 * Minimal Safe Neon Connection & Pre-Migration Safety Inspection
 * Tests connection with SELECT 1 and inspects existing public schema tables.
 * NEVER outputs credentials or connection strings.
 */

import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

async function testConnectionAndSafety() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }

  const isNeon = connectionString.includes("neon.tech");
  const pool = new Pool({
    connectionString,
    ssl: isNeon || connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    max: 1,
    connectionTimeoutMillis: 8000,
  });

  try {
    // 1. Connection Test
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT 1 as connected");
      if (res.rows?.[0]?.connected === 1) {
        console.log("Neon connection: PASS (Neon connection successful)");
      } else {
        console.log("Neon connection: FAIL (Unexpected query result)");
        process.exit(1);
      }

      // 2. Safety Pre-Migration Inspection
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tableNames = tablesRes.rows.map((r: { table_name: string }) => r.table_name);

      console.log(`Existing public tables count: ${tableNames.length}`);
      if (tableNames.length === 0) {
        console.log("Database initially empty/uninitialized: YES");
      } else {
        console.log(`Database initially empty/uninitialized: NO (Found tables: ${tableNames.join(", ")})`);
      }
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // Sanitize any potential connection details
    const sanitized = errorMsg
      .replace(/postgres(?:ql)?:\/\/[^@]+@/gi, "postgresql://***:***@")
      .replace(/password=[^\s]+/gi, "password=***");
    console.error("Neon connection: FAIL —", sanitized);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnectionAndSafety();

