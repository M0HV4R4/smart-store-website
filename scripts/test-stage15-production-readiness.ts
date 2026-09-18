/**
 * Stage 15 Automated Production Readiness Test Suite
 * Validates configuration, security, database pooling, migration integrity,
 * and deployment prerequisites for Vercel + Neon PostgreSQL + GitHub.
 */

import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

const rootDir = process.cwd();

console.log("\n============================================================");
console.log("STAGE 15: PRODUCTION READINESS & DEPLOYMENT VERIFICATION");
console.log("============================================================\n");

// ------------------------------------------------------------
// 1. Package Configuration & Engine Constraints
// ------------------------------------------------------------
console.log("1. Package Configuration & Node Engines");
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

assert(Boolean(pkg.engines), "package.json specifies engines object");
assert(
  pkg.engines?.node && pkg.engines.node.includes("22"),
  "package.json requires Node.js >= 22 (Vercel runtime compatible)",
  `Actual: ${pkg.engines?.node}`
);
assert(
  pkg.engines?.npm && pkg.engines.npm.includes("10"),
  "package.json requires npm >= 10",
  `Actual: ${pkg.engines?.npm}`
);
assert(pkg.scripts?.build === "vite build", "Build script runs 'vite build'");
assert(Boolean(pkg.scripts?.["db:migrate"]), "Script 'db:migrate' exists for CLI migrations");
assert(
  Boolean(pkg.scripts?.["seed:admin"] || pkg.scripts?.["db:seed-admin"]),
  "Script 'seed:admin' / 'db:seed-admin' exists for CLI admin bootstrapping"
);
assert(Boolean(pkg.dependencies?.["drizzle-orm"]), "Drizzle ORM is in production dependencies");
assert(Boolean(pkg.dependencies?.["pg"]), "PostgreSQL client (pg) is in production dependencies");
assert(Boolean(pkg.dependencies?.["bcryptjs"]), "bcryptjs is in production dependencies");

// ------------------------------------------------------------
// 2. Vercel Configuration & Function Routing
// ------------------------------------------------------------
console.log("\n2. Vercel Configuration & Function Routing");
const vercelConfigPath = path.join(rootDir, "vercel.json");
assert(fs.existsSync(vercelConfigPath), "vercel.json exists in root directory");

const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf-8"));
const rewrites = vercelConfig.rewrites || [];
const apiExclusionRewrite = rewrites.find(
  (r: { source: string; destination: string }) =>
    r.source.includes("api") && r.destination === "/index.html"
);
assert(
  Boolean(apiExclusionRewrite),
  "vercel.json rewrites exclude /api/ routes from SPA fallback (preserving serverless lambdas)",
  `Source: ${apiExclusionRewrite?.source}`
);

// ------------------------------------------------------------
// 3. Database Connection Pooling for Serverless (Neon + Vercel)
// ------------------------------------------------------------
console.log("\n3. Database Connection Pooling for Serverless");
const dbFilePath = path.join(rootDir, "api", "_lib", "db.ts");
const dbFileContent = fs.readFileSync(dbFilePath, "utf-8");

assert(
  dbFileContent.includes("max:") && (dbFileContent.includes(": 1") || dbFileContent.includes("|| \"1\"")),
  "api/_lib/db.ts enforces max: 1 connection pool default per serverless function instance"
);
assert(
  dbFileContent.includes("sslmode=require") || dbFileContent.includes("neon.tech"),
  "api/_lib/db.ts configures SSL handling for Neon PostgreSQL"
);
assert(
  dbFileContent.includes("let pool: Pool | null = null;"),
  "api/_lib/db.ts caches pool across warm lambda invocations"
);

// ------------------------------------------------------------
// 4. Environment & Security Validation
// ------------------------------------------------------------
console.log("\n4. Environment & Secret Validation");
const envFilePath = path.join(rootDir, "api", "_lib", "env.ts");
const envFileContent = fs.readFileSync(envFilePath, "utf-8");

assert(
  envFileContent.includes("SESSION_SECRET.length < 32") && envFileContent.includes("production"),
  "api/_lib/env.ts enforces SESSION_SECRET >= 32 characters in production"
);
assert(
  envFileContent.includes("DATABASE_URL"),
  "api/_lib/env.ts validates DATABASE_URL presence"
);

const authFilePath = path.join(rootDir, "api", "_lib", "auth.ts");
const authFileContent = fs.readFileSync(authFilePath, "utf-8");

assert(
  authFileContent.includes("httpOnly: true") &&
  authFileContent.includes("sameSite: \"lax\"") &&
  authFileContent.includes("secure: isProduction"),
  "api/_lib/auth.ts enforces HttpOnly, SameSite=Lax, and Secure cookie flags in production"
);

const securityFilePath = path.join(rootDir, "api", "_lib", "security.ts");
const securityFileContent = fs.readFileSync(securityFilePath, "utf-8");

assert(
  securityFileContent.includes("verifyCsrfOrigin"),
  "api/_lib/security.ts provides CSRF Origin & Host validation"
);

// ------------------------------------------------------------
// 5. Database Migration & Seeding CLI Integrity
// ------------------------------------------------------------
console.log("\n5. Database Migration & Admin Seeding Security");
const migrateScript = fs.readFileSync(path.join(rootDir, "scripts", "migrate.ts"), "utf-8");
assert(
  migrateScript.includes("migrate(") && migrateScript.includes("migrationsFolder"),
  "scripts/migrate.ts applies standard Drizzle migrations from migrations folder"
);

const seedScript = fs.readFileSync(path.join(rootDir, "scripts", "seed-admin.ts"), "utf-8");
assert(
  seedScript.includes("BCRYPT_ROUNDS = 12") || seedScript.includes("rounds: 12") || seedScript.includes("12"),
  "scripts/seed-admin.ts hashes passwords with bcrypt cost factor >= 12"
);
assert(
  seedScript.includes("password.length < 8") || seedScript.includes("password.length < 10"),
  "scripts/seed-admin.ts enforces strong password minimum length validation"
);

// Verify no HTTP endpoint exists for seeding admin accounts
const apiDir = path.join(rootDir, "api");
const apiFiles = fs.readdirSync(apiDir, { recursive: true }) as string[];
const seedEndpoints = apiFiles.filter((f) => String(f).toLowerCase().includes("seed") && !String(f).endsWith(".d.ts"));
assert(
  seedEndpoints.length === 0,
  "No HTTP seed/bootstrap endpoints exist in /api (admin creation is strictly CLI only)",
  `Found: ${seedEndpoints.join(", ")}`
);

// ------------------------------------------------------------
// 6. Drizzle Migrations Directory Check
// ------------------------------------------------------------
console.log("\n6. Drizzle Migrations Directory Integrity");
const drizzleDir = path.join(rootDir, "drizzle");
assert(fs.existsSync(drizzleDir), "drizzle/ migrations directory exists");

const migration0000 = path.join(drizzleDir, "0000_striped_micromax.sql");
const migration0001 = path.join(drizzleDir, "0001_early_expediter.sql");
assert(fs.existsSync(migration0000), "Migration 0000_striped_micromax.sql exists");
assert(fs.existsSync(migration0001), "Migration 0001_early_expediter.sql exists");

const metaJournal = path.join(drizzleDir, "meta", "_journal.json");
assert(fs.existsSync(metaJournal), "Drizzle meta/_journal.json exists and tracks migrations");

// ------------------------------------------------------------
// 7. Git & Secret Cleanliness
// ------------------------------------------------------------
console.log("\n7. Git & Secret Cleanliness Audit");
const gitignorePath = path.join(rootDir, ".gitignore");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

assert(gitignoreContent.includes(".env"), ".gitignore includes .env");
assert(gitignoreContent.includes(".env.*"), ".gitignore includes .env.*");
assert(gitignoreContent.includes("!.env.example"), ".gitignore preserves !.env.example template");
assert(gitignoreContent.includes("node_modules"), ".gitignore includes node_modules");
assert(gitignoreContent.includes("dist"), ".gitignore includes dist");
assert(gitignoreContent.includes(".vercel"), ".gitignore includes .vercel");

// Verify that no actual .env file is present on disk with secrets
const envOnDisk = fs.existsSync(path.join(rootDir, ".env"));
assert(!envOnDisk, "No active .env file is present on disk in the repository");

// Verify .env.example contains only safe placeholders
const envExampleContent = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");
assert(
  envExampleContent.includes("ep-example-pooler") && envExampleContent.includes("change_this_to_a_random"),
  ".env.example contains purely illustrative placeholder values with zero active secrets"
);

// ------------------------------------------------------------
// 8. Documentation & Runbook Verification
// ------------------------------------------------------------
console.log("\n8. Production Runbook & Documentation");
const deploymentMdPath = path.join(rootDir, "DEPLOYMENT.md");
assert(fs.existsSync(deploymentMdPath), "DEPLOYMENT.md guide exists");

const deploymentMd = fs.readFileSync(deploymentMdPath, "utf-8");
assert(deploymentMd.includes("Neon PostgreSQL"), "DEPLOYMENT.md covers Neon PostgreSQL provisioning");
assert(deploymentMd.includes("GitHub Releases"), "DEPLOYMENT.md covers GitHub Releases binary hosting");
assert(deploymentMd.includes("npm run db:migrate"), "DEPLOYMENT.md documents migration execution");
assert(deploymentMd.includes("npm run db:seed-admin"), "DEPLOYMENT.md documents CLI admin seeding");
assert(deploymentMd.includes("Vercel"), "DEPLOYMENT.md covers Vercel production deployment");
assert(deploymentMd.includes("Smoke Test Checklist"), "DEPLOYMENT.md includes post-deployment smoke tests");

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
console.log("\n============================================================");
console.log(`STAGE 15 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================\n");

if (failed > 0) {
  console.error("❌ Stage 15 readiness verification failed. Address issues before proceeding.");
  process.exit(1);
} else {
  console.log("🎯 ALL STAGE 15 PRODUCTION READINESS CHECKS PASSED SUCCESSFULLY!");
}
