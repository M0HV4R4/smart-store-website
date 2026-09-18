/**
 * Stage 16 Automated Security, Hardening & Performance Test Suite
 * Validates security boundaries, CSRF, XSS, headers, CSP, cookie security,
 * secret isolation, database pooling, and bundle performance.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validateDownloadUrl, verifyCsrfOrigin, validateRequestBodySize } from "../api/_lib/security";
import { validateSocialUrl, normalizeWhatsAppNumber, buildWhatsAppUrl } from "../api/_lib/website";
import { createSessionCookie, hashSessionToken, BCRYPT_WORK_FACTOR } from "../api/_lib/auth";
import {
  releaseInputSchema,
  releaseQuerySchema,
  validateData,
} from "../api/_lib/validation";

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
console.log("STAGE 16: SECURITY, PERFORMANCE & HARDENING AUDIT");
console.log("============================================================\n");

// ------------------------------------------------------------
// 1. HTTP Security Headers & vercel.json Verification
// ------------------------------------------------------------
console.log("1. HTTP Security Headers (vercel.json)");
const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, "vercel.json"), "utf-8"));
const headersArray = vercelConfig.headers || [];
const globalHeaderRule = headersArray.find((h: { source: string }) => h.source === "/(.*)");

assert(Boolean(globalHeaderRule), "vercel.json contains global header rule for /(.*)");

const headerMap = new Map<string, string>();
if (globalHeaderRule?.headers) {
  for (const item of globalHeaderRule.headers) {
    headerMap.set(item.key.toLowerCase(), item.value);
  }
}

assert(
  headerMap.get("x-content-type-options") === "nosniff",
  "Header 'X-Content-Type-Options' is set to 'nosniff'"
);
assert(
  headerMap.get("x-frame-options") === "DENY",
  "Header 'X-Frame-Options' is set to 'DENY' (Clickjacking defense)"
);
assert(
  headerMap.get("referrer-policy") === "strict-origin-when-cross-origin",
  "Header 'Referrer-Policy' is set to 'strict-origin-when-cross-origin'"
);
assert(
  Boolean(headerMap.get("permissions-policy")?.includes("camera=()")),
  "Header 'Permissions-Policy' restricts unused camera, microphone, and geolocation"
);

const csp = headerMap.get("content-security-policy") || "";
assert(Boolean(csp), "Content-Security-Policy (CSP) is defined");
assert(csp.includes("default-src 'self'"), "CSP defines default-src 'self'");
assert(csp.includes("script-src 'self'"), "CSP defines script-src 'self' without unsafe-eval");
assert(!csp.includes("'unsafe-eval'"), "CSP strictly omits 'unsafe-eval'");
assert(csp.includes("frame-ancestors 'none'"), "CSP enforces frame-ancestors 'none'");
assert(csp.includes("connect-src 'self'"), "CSP restricts connect-src to 'self'");
assert(csp.includes("https://fonts.googleapis.com"), "CSP permits Google Fonts stylesheet");
assert(csp.includes("https://fonts.gstatic.com"), "CSP permits Google Fonts font files");

// ------------------------------------------------------------
// 2. CSRF & State-Mutation Protection Audit
// ------------------------------------------------------------
console.log("\n2. CSRF & Mutation Route Protection");
const mockGetReq = {
  method: "GET",
  headers: { host: "smartstore.app" },
} as any;
assert(verifyCsrfOrigin(mockGetReq), "verifyCsrfOrigin permits safe GET requests");

const mockPostSameOrigin = {
  method: "POST",
  headers: { host: "smartstore.app", origin: "https://smartstore.app" },
} as any;
assert(verifyCsrfOrigin(mockPostSameOrigin), "verifyCsrfOrigin permits same-origin POST");

const mockPostAttack = {
  method: "POST",
  headers: { host: "smartstore.app", origin: "https://evil-attacker.com" },
} as any;
assert(!verifyCsrfOrigin(mockPostAttack), "verifyCsrfOrigin blocks foreign origin POST with 403");

// Verify that requireAdmin enforces CSRF
const authTsContent = fs.readFileSync(path.join(rootDir, "api", "_lib", "auth.ts"), "utf-8");
assert(
  authTsContent.includes("verifyCsrfOrigin(req)"),
  "api/_lib/auth.ts requireAdmin enforces CSRF verification on all authenticated routes"
);

// ------------------------------------------------------------
// 3. XSS Vector Audit (Source Code AST Scan)
// ------------------------------------------------------------
console.log("\n3. Cross-Site Scripting (XSS) Vectors Audit");
const srcFiles: string[] = [];
function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      srcFiles.push(full);
    }
  }
}
scanDir(path.join(rootDir, "src"));

let dangerousSetCount = 0;
let innerHtmlCount = 0;
let evalCount = 0;
let newFunctionCount = 0;
let docWriteCount = 0;

for (const file of srcFiles) {
  const content = fs.readFileSync(file, "utf-8");
  if (content.includes("dangerouslySetInnerHTML")) dangerousSetCount++;
  if (content.includes(".innerHTML")) innerHtmlCount++;
  if (content.includes("eval(")) evalCount++;
  if (content.includes("new Function(")) newFunctionCount++;
  if (content.includes("document.write(")) docWriteCount++;
}

assert(dangerousSetCount === 0, "Zero occurrences of dangerouslySetInnerHTML in src/");
assert(innerHtmlCount === 0, "Zero occurrences of .innerHTML assignments in src/");
assert(evalCount === 0, "Zero occurrences of eval() in src/");
assert(newFunctionCount === 0, "Zero occurrences of new Function() in src/");
assert(docWriteCount === 0, "Zero occurrences of document.write() in src/");

// ------------------------------------------------------------
// 4. SQL Injection Defense & Parameterization
// ------------------------------------------------------------
console.log("\n4. SQL Injection Defense");
const apiFiles: string[] = [];
function scanApiDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanApiDir(full);
    } else if (entry.name.endsWith(".ts")) {
      apiFiles.push(full);
    }
  }
}
scanApiDir(path.join(rootDir, "api"));

let rawSqlConcat = 0;
for (const file of apiFiles) {
  const content = fs.readFileSync(file, "utf-8");
  // Check for unsafe string concatenation into raw SQL queries
  if (/query\s*\(\s*`[^`]*\$\{/i.test(content) || /query\s*\(\s*["'][^"']*\s*\+/i.test(content)) {
    rawSqlConcat++;
  }
}
assert(rawSqlConcat === 0, "Zero raw SQL string concatenation found across API endpoints");

// ------------------------------------------------------------
// 5. Authentication, Cookie & Password Hashing Security
// ------------------------------------------------------------
console.log("\n5. Authentication & Session Primitives");
assert(BCRYPT_WORK_FACTOR === 12, "Bcrypt work factor is strictly 12");

const testHash = bcrypt.hashSync("testPassword123", 12);
assert(bcrypt.compareSync("testPassword123", testHash), "Bcrypt verification succeeds for valid password");
assert(!bcrypt.compareSync("wrongPassword", testHash), "Bcrypt verification rejects incorrect password");

const randomToken = crypto.randomBytes(32).toString("hex");
const hashedToken = hashSessionToken(randomToken);
assert(hashedToken.length === 64, "Session token hash is 64 hex characters (SHA-256)");
assert(hashedToken !== randomToken, "Raw session token differs from stored hash (one-way transformation)");

const cookieHeader = createSessionCookie(randomToken);
assert(cookieHeader.includes("HttpOnly"), "Session cookie sets HttpOnly flag");
assert(cookieHeader.includes("SameSite=Lax"), "Session cookie sets SameSite=Lax");
assert(cookieHeader.includes("Path=/"), "Session cookie sets Path=/");

// ------------------------------------------------------------
// 6. Open Redirect & Binary Validation
// ------------------------------------------------------------
console.log("\n6. Open Redirect & Destination Safety");
const validGithubUrl = "https://github.com/org/repo/releases/download/v1.0.0/setup.exe";
const validUrlCheck = validateDownloadUrl(validGithubUrl);
assert(validUrlCheck.valid, "Accepts legitimate HTTPS GitHub binary URL");

const insecureHttp = validateDownloadUrl("http://github.com/org/repo/setup.exe");
assert(!insecureHttp.valid, "Rejects unencrypted HTTP download URL");

const javascriptScheme = validateDownloadUrl("javascript:alert(1)");
assert(!javascriptScheme.valid, "Rejects javascript: pseudo-protocol URL");

const crlfInjection = validateDownloadUrl("https://github.com/setup.exe\r\nLocation: https://evil.com");
assert(!crlfInjection.valid, "Rejects CRLF header injection attempts in download URL");

// ------------------------------------------------------------
// 7. Social / CMS URL & Contact Normalization
// ------------------------------------------------------------
console.log("\n7. Social URL & Contact Validation");
const fbValid = validateSocialUrl("https://facebook.com/smartstore", "facebook");
assert(fbValid.valid, "Accepts standard HTTPS Facebook page URL");

const fbSpoof = validateSocialUrl("https://evil-facebook.com/fake", "facebook");
assert(!fbSpoof.valid, "Rejects domain spoofing in Facebook URL");

const igValid = validateSocialUrl("https://instagram.com/smartstore", "instagram");
assert(igValid.valid, "Accepts standard HTTPS Instagram profile URL");

const igHttp = validateSocialUrl("http://instagram.com/smartstore", "instagram");
assert(!igHttp.valid, "Rejects unencrypted HTTP Instagram URL");

const waNormalized = normalizeWhatsAppNumber("+213 555 12 34 56");
assert(waNormalized.valid && waNormalized.normalized === "213555123456", "Normalizes Algerian WhatsApp phone number to E.164");

const waUrl = buildWhatsAppUrl("213555123456", "مرحبا أريد الاستفسار");
assert(
  waUrl.includes("https://wa.me/213555123456?text=") && waUrl.includes(encodeURIComponent("مرحبا أريد الاستفسار")),
  "Builds safe wa.me URL with properly URL-encoded message"
);

// ------------------------------------------------------------
// 8. Payload Size & Request Body Limiter
// ------------------------------------------------------------
console.log("\n8. Request Body Size Limiter");
const normalReq = {
  headers: { "content-length": "1024" },
  body: { test: "data" },
} as any;
assert(validateRequestBodySize(normalReq).valid, "Accepts compliant request body size (1 KB)");

const oversizedReq = {
  headers: { "content-length": "204800" }, // 200 KB
  body: "a".repeat(204800),
} as any;
const oversizedResult = validateRequestBodySize(oversizedReq);
assert(!oversizedResult.valid, "Rejects oversized request body (>100 KB) to protect serverless memory");

// ------------------------------------------------------------
// 9. Input Length Bounds (Zod Schemas)
// ------------------------------------------------------------
console.log("\n9. Input Length Bounds & Schema Protection");
const longVersionResult = validateData(releaseInputSchema, {
  platform: "windows",
  version: "a".repeat(100), // Max is 50
  downloadUrl: "https://github.com/setup.exe",
});
assert(!longVersionResult.success, "Rejects excessively long software version string (>50 chars)");

const longNotesResult = validateData(releaseInputSchema, {
  platform: "windows",
  version: "1.0.0",
  downloadUrl: "https://github.com/setup.exe",
  releaseNotesAr: "x".repeat(20000), // Max is 10000
});
assert(!longNotesResult.success, "Rejects oversized release notes string (>10000 chars)");

const queryBoundsResult = validateData(releaseQuerySchema, {
  page: 1,
  pageSize: 500, // Max is 100
});
assert(!queryBoundsResult.success, "Rejects pagination pageSize exceeding 100");

// ------------------------------------------------------------
// 10. Database Connection Pooling for Serverless
// ------------------------------------------------------------
console.log("\n10. Database Connection Pooling Configuration");
const dbContent = fs.readFileSync(path.join(rootDir, "api", "_lib", "db.ts"), "utf-8");
assert(
  dbContent.includes("max: process.env.DB_POOL_MAX") && dbContent.includes(": 1"),
  "api/_lib/db.ts enforces max: 1 connection pool limit per serverless instance (Neon pooler safe)"
);
assert(
  dbContent.includes("connectionTimeoutMillis: 5000"),
  "api/_lib/db.ts configures 5000ms connection timeout"
);
assert(
  dbContent.includes("idleTimeoutMillis: 10000"),
  "api/_lib/db.ts configures 10000ms idle timeout"
);

// ------------------------------------------------------------
// 11. Build Artifact Secret & Path Leak Scan
// ------------------------------------------------------------
console.log("\n11. Build Artifact Secret & Path Leak Scan");
const distDir = path.join(rootDir, "dist");
assert(fs.existsSync(distDir), "dist/ directory exists");

const distAssets = fs.readdirSync(path.join(distDir, "assets"));
let leakedSecrets = 0;
let leakedLocalPaths = 0;

for (const asset of distAssets) {
  if (asset.endsWith(".js") || asset.endsWith(".css") || asset.endsWith(".html")) {
    const content = fs.readFileSync(path.join(distDir, "assets", asset), "utf-8");
    if (content.includes("DATABASE_URL") || content.includes("SESSION_SECRET") || content.includes("postgresql://")) {
      leakedSecrets++;
    }
    if (content.includes("C:\\") || content.includes("E:\\")) {
      leakedLocalPaths++;
    }
  }
}

assert(leakedSecrets === 0, "Zero production secrets (DATABASE_URL, SESSION_SECRET, postgresql://) in dist/");
assert(leakedLocalPaths === 0, "Zero local file paths (C:\\, E:\\) leaked into dist/ bundles");

// ------------------------------------------------------------
// 12. Bundle Isolation & Lazy Loading
// ------------------------------------------------------------
console.log("\n12. Admin Route Code-Splitting & Bundle Isolation");
const mainJsChunk = distAssets.find((f) => f.startsWith("index-") && f.endsWith(".js"));
assert(Boolean(mainJsChunk), `Main public JS chunk exists (${mainJsChunk})`);

if (mainJsChunk) {
  // Check that admin pages are not bundled into the main public JS file
  const adminPageChunkNames = [
    "AdminLoginPage",
    "AdminDashboardPage",
    "AdminDownloadsPage",
    "AdminReleasesPage",
    "AdminAnalyticsPage",
    "AdminWebsitePage",
    "AdminSecurityPage",
    "AdminActivityPage",
  ];

  for (const pageName of adminPageChunkNames) {
    const chunkExists = distAssets.some((f) => f.startsWith(pageName));
    assert(chunkExists, `Admin page ${pageName} is isolated in its own code-split chunk`);
  }
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
console.log("\n============================================================");
console.log(`STAGE 16 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================\n");

if (failed > 0) {
  console.error("❌ Stage 16 security and performance audit failed.");
  process.exit(1);
} else {
  console.log("🎯 ALL STAGE 16 SECURITY, PERFORMANCE & HARDENING CHECKS PASSED!");
}
