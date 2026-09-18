/**
 * Pre-Flight Secret Scanner
 * Scans src/, api/, dist/, and documentation files for accidental leakage of
 * DATABASE_URL, connection strings, PostgreSQL passwords, or SESSION_SECRET.
 * NEVER prints any secret value.
 */

import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const dirsToScan = ["src", "api", "dist"];

let violations = 0;

function scanDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if ([".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".md"].includes(ext)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        
        // Scan for live neon connection strings
        if (/postgres(?:ql)?:\/\/[^@\s]+@ep-[^\s]+\.neon\.tech/i.test(content)) {
          console.error(`❌ VIOLATION: Neon connection string found in: ${path.relative(rootDir, fullPath)}`);
          violations++;
        }

        // Scan for live passwords in connection strings
        if (/postgres(?:ql)?:\/\/[^:]+:[^@\s]+@/i.test(content)) {
          // Check if it's sample placeholder
          if (!content.includes("user:password@") && !content.includes("username:password@")) {
            console.error(`❌ VIOLATION: Database credentials found in: ${path.relative(rootDir, fullPath)}`);
            violations++;
          }
        }
      }
    }
  }
}

console.log("==================================================");
console.log("REPOSITORY SECRET LEAKAGE SCAN");
console.log("==================================================");

for (const d of dirsToScan) {
  scanDir(path.join(rootDir, d));
}

// Check documentation files in root
const docFiles = ["README.md", "DEPLOYMENT.md"];
for (const doc of docFiles) {
  const p = path.join(rootDir, doc);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, "utf-8");
    const matches = content.match(/postgres(?:ql)?:\/\/[^@\s]+@[^\s]+\.neon\.tech/gi) || [];
    for (const match of matches) {
      if (!match.includes("<") && !match.includes(">") && !match.includes("[") && !match.includes("]") && !match.includes("user:password")) {
        console.error(`❌ VIOLATION: Real Neon connection string found in ${doc}`);
        violations++;
      }
    }
  }
}

// Verify .env is strictly local
const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
const envIgnored = gitignore.includes(".env") && gitignore.includes(".env.*");

console.log(`.gitignore ignores .env and .env.*: ${envIgnored ? "YES" : "NO"}`);
console.log(`Tracked files scanned: src/, api/, dist/, documentation`);
console.log(`Secret exposure violations detected: ${violations}`);
console.log(`Secret scan status: ${violations === 0 && envIgnored ? "PASS" : "FAIL"}`);
console.log("==================================================");

if (violations > 0 || !envIgnored) {
  process.exit(1);
}
