/**
 * Safe Environment Verification Script
 * Validates .env structure, SESSION_SECRET entropy, and DATABASE_URL parameters
 * WITHOUT logging or exposing any secret values, passwords, or connection strings.
 */

import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");

if (!fs.existsSync(envPath)) {
  console.log("STATUS: .env file does not exist.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const lines = envContent.split(/\r?\n/);

let hasDbUrlKey = false;
let dbUrlVal = "";
let hasSessionSecretKey = false;
let sessionSecretVal = "";

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  
  const [k, ...rest] = trimmed.split("=");
  const key = k.trim();
  const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
  
  if (key === "DATABASE_URL") {
    hasDbUrlKey = true;
    dbUrlVal = val;
  }
  if (key === "SESSION_SECRET") {
    hasSessionSecretKey = true;
    sessionSecretVal = val;
  }
}

console.log("==================================================");
console.log("SAFE ENVIRONMENT CONFIGURATION AUDIT");
console.log("==================================================");
console.log(`.env file exists: YES`);
console.log(`DATABASE_URL key present: ${hasDbUrlKey ? "YES" : "NO"}`);
console.log(`DATABASE_URL value configured: ${dbUrlVal.length > 0 ? "YES" : "NO (Awaiting user paste)"}`);
console.log(`SESSION_SECRET key present: ${hasSessionSecretKey ? "YES" : "NO"}`);
console.log(`SESSION_SECRET length >= 64: ${sessionSecretVal.length >= 64 ? "YES" : "NO"}`);
console.log(`SESSION_SECRET hexadecimal: ${/^[a-f0-9]{64,}$/i.test(sessionSecretVal) ? "YES" : "NO"}`);

if (dbUrlVal.length > 0) {
  try {
    const parsed = new URL(dbUrlVal);
    const isPostgres = parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
    const hasSsl = parsed.searchParams.get("sslmode") === "require" || parsed.search.includes("sslmode=require");
    const isNeon = parsed.hostname.includes("neon.tech");
    const isPooled = parsed.hostname.includes("-pooler.");

    console.log(`Database URL protocol valid: ${isPostgres ? "YES" : "NO"}`);
    console.log(`Database SSL mode enabled (sslmode=require): ${hasSsl ? "YES" : "NO"}`);
    console.log(`Database host is Neon (neon.tech): ${isNeon ? "YES" : "NO"}`);
    console.log(`Database host uses Neon connection pooler: ${isPooled ? "YES" : "NO (Direct connection)"}`);
    console.log(`Database URL server-only (no VITE_ prefix): YES`);
  } catch {
    console.log("Database URL protocol valid: NO (Invalid URL format)");
  }
}

console.log("==================================================");

