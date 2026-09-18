/**
 * Safe Schema Verification Script against Neon Database
 * Inspects tables, columns, indexes, and constraints.
 * NEVER prints credentials, connection strings, or sensitive data.
 */

import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

async function verifySchema() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL missing.");
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
    const client = await pool.connect();
    try {
      console.log("==================================================");
      console.log("NEON POSTGRESQL SCHEMA VERIFICATION");
      console.log("==================================================");

      // 1. Check Tables
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tables = tablesRes.rows.map((r: { table_name: string }) => r.table_name);
      console.log(`Discovered tables (${tables.length}): ${tables.join(", ")}`);

      const requiredTables = [
        "admins",
        "sessions",
        "releases",
        "download_events",
        "site_content",
        "site_settings",
        "audit_logs",
      ];

      const allRequiredPresent = requiredTables.every((t) => tables.includes(t));
      console.log(`Required Smart Store tables: ${allRequiredPresent ? "PASS" : "FAIL"}`);

      for (const reqTable of requiredTables) {
        const isPresent = tables.includes(reqTable);
        console.log(`  - Table '${reqTable}': ${isPresent ? "EXISTS" : "MISSING"}`);
      }

      // 2. Check Drizzle Migrations Journal
      try {
        const migrationsRes = await client.query(`
          SELECT id, hash, created_at 
          FROM drizzle.__drizzle_migrations 
          ORDER BY id;
        `);
        console.log(`Applied migration records count: ${migrationsRes.rows.length}`);
      } catch (e) {
        console.log("Drizzle migrations schema check: skipped");
      }

      // 3. Check Admins Table Columns
      const adminColsRes = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admins'
        ORDER BY ordinal_position;
      `);
      const adminCols = adminColsRes.rows.map((r: { column_name: string }) => r.column_name);
      console.log(`\n'admins' columns: ${adminCols.join(", ")}`);

      const hasPasswordHash = adminCols.includes("password_hash");
      const hasPlainPassword = adminCols.some((c: string) => c === "password" || c === "plaintext_password" || c === "pass");
      console.log(`'admins' has 'password_hash': ${hasPasswordHash ? "YES" : "NO"}`);
      console.log(`'admins' plaintext password column absent: ${!hasPlainPassword ? "YES (Secure)" : "NO (Insecure)"}`);

      // 4. Check Indexes
      const indexRes = await client.query(`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `);
      console.log(`\nTotal indexes created: ${indexRes.rows.length}`);
      const indexNames = indexRes.rows.map((r: { indexname: string }) => r.indexname);
      
      const keyIndexes = [
        "admins_username_unique",
        "admins_email_unique",
        "sessions_token_hash_unique",
      ];

      for (const idx of keyIndexes) {
        const hasIdx = indexNames.includes(idx);
        console.log(`  - Index '${idx}': ${hasIdx ? "EXISTS" : "MISSING"}`);
      }

      const requiredIndexesPass = keyIndexes.every((k) => indexNames.includes(k));
      console.log(`Required indexes: ${requiredIndexesPass ? "PASS" : "FAIL"}`);

      console.log("==================================================");
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Schema verification failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
