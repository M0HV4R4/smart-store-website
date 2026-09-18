import { validateDownloadUrl } from "../api/_lib/security";
import { generateSessionToken, hashSessionToken, createSessionCookie, createClearSessionCookie, hashPassword, verifyPassword } from "../api/_lib/auth";
import { validateData, releaseInputSchema, loginSchema, changePasswordSchema } from "../api/_lib/validation";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 4: VERCEL API FOUNDATION");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // 1. Download URL Security
  console.log("\n[1] Download URL Security:");
  const validGithubUrl = "https://github.com/smartstore/releases/download/v1.0.0/SmartStore-Setup.exe";
  const validS3Url = "https://downloads.smartstore.app/releases/SmartStore.apk";
  const invalidHttpUrl = "http://example.com/Setup.exe";
  const dangerousJsUrl = "javascript:alert(1)";
  const crlfUrl = "https://github.com/releases\r\nLocation: https://attacker.com";
  const dataUrl = "data:text/html,<script>alert(1)</script>";

  assert(validateDownloadUrl(validGithubUrl).valid === true, "Accepts valid HTTPS GitHub Release URL");
  assert(validateDownloadUrl(validS3Url).valid === true, "Accepts valid HTTPS custom CDN / S3 URL");
  assert(validateDownloadUrl(invalidHttpUrl).valid === false, "Rejects unencrypted HTTP URL");
  assert(validateDownloadUrl(dangerousJsUrl).valid === false, "Rejects javascript: URI scheme");
  assert(validateDownloadUrl(crlfUrl).valid === false, "Rejects CRLF header injection characters");
  assert(validateDownloadUrl(dataUrl).valid === false, "Rejects data: URI scheme");

  // 2. Cryptographic Tokens & Cookies
  console.log("\n[2] Session Tokens & Cookies:");
  const token1 = generateSessionToken();
  const token2 = generateSessionToken();
  assert(token1.length === 64, "Session token is 64 hex characters (256-bit entropy)");
  assert(token1 !== token2, "Successive session tokens are uniquely generated");

  const hash1 = hashSessionToken(token1);
  const hash2 = hashSessionToken(token1);
  assert(hash1.length === 64, "Token hash is 64 hex characters (SHA-256)");
  assert(hash1 === hash2, "SHA-256 token hashing is deterministic");

  const cookieHeader = createSessionCookie(token1, 604800);
  assert(cookieHeader.includes("HttpOnly"), "Session cookie enforces HttpOnly flag");
  assert(cookieHeader.includes("SameSite=Lax"), "Session cookie enforces SameSite=Lax");
  assert(cookieHeader.includes("Path=/"), "Session cookie path is /");

  const clearCookieHeader = createClearSessionCookie();
  assert(clearCookieHeader.includes("Max-Age=0"), "Clear cookie sets Max-Age=0 for immediate expiration");

  // 3. Password Hashing
  console.log("\n[3] Password Hashing (bcryptjs work factor 12):");
  const plainPassword = "SuperSecretPassword123!";
  const hashedPassword = await hashPassword(plainPassword);
  assert(hashedPassword.startsWith("$2"), "Password is valid bcrypt hash");
  assert(await verifyPassword(plainPassword, hashedPassword) === true, "Bcrypt verification succeeds for correct password");
  assert(await verifyPassword("WrongPassword", hashedPassword) === false, "Bcrypt verification fails for incorrect password");

  // 4. Zod Runtime Validation
  console.log("\n[4] Zod Runtime Validation:");
  const validRelease = {
    platform: "windows",
    version: "1.0.0",
    downloadUrl: "https://downloads.smartstore.app/SmartStore-Setup.exe",
    fileSize: "95 MB",
    status: "active",
    downloadEnabled: true,
  };
  assert(validateData(releaseInputSchema, validRelease).success === true, "Validates compliant release input");

  const invalidPlatformRelease = { ...validRelease, platform: "linux" };
  assert(validateData(releaseInputSchema, invalidPlatformRelease).success === false, "Rejects unsupported platform");

  const validLogin = { emailOrUsername: "admin@smartstore.app", password: "SecretPassword123" };
  assert(validateData(loginSchema, validLogin).success === true, "Validates compliant login payload");

  const invalidLogin = { emailOrUsername: "a", password: "" };
  assert(validateData(loginSchema, invalidLogin).success === false, "Rejects undersized login payload");

  const validPasswordChange = {
    currentPassword: "OldPassword123",
    newPassword: "BrandNewPassword123",
    confirmPassword: "BrandNewPassword123",
  };
  assert(validateData(changePasswordSchema, validPasswordChange).success === true, "Validates matching password change");

  const mismatchPasswordChange = {
    ...validPasswordChange,
    confirmPassword: "DifferentPassword123",
  };
  assert(validateData(changePasswordSchema, mismatchPasswordChange).success === false, "Rejects mismatched confirmation password");

  console.log("==================================================");
  console.log(`🏁 TEST RESULTS: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});

