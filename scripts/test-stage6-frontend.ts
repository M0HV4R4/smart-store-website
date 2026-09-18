import fs from "fs";
import path from "path";
import { ar } from "../src/locales/ar";
import { fr } from "../src/locales/fr";

async function runStage6Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 6: ADMIN LOGIN UI & APPLICATION SHELL");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
    }
  }

  // 1. Localization Integrity
  console.log("\n[1] Localization Integrity & Dictionaries:");
  assert(Boolean(ar.admin), "Arabic admin translation dictionary exists");
  assert(Boolean(fr.admin), "French admin translation dictionary exists");

  assert(
    ar.admin.login.errorGeneric === "بيانات تسجيل الدخول غير صحيحة",
    "Arabic generic login error matches exact requirement",
  );
  assert(
    fr.admin.login.errorGeneric === "Identifiants de connexion incorrects",
    "French generic login error matches exact requirement",
  );

  const requiredNavKeys = [
    "dashboard",
    "downloads",
    "releases",
    "analytics",
    "website",
    "settings",
    "security",
    "activity",
  ] as const;

  for (const key of requiredNavKeys) {
    assert(Boolean(ar.admin.nav[key]), `Arabic nav item '${key}' is localized`);
    assert(Boolean(fr.admin.nav[key]), `French nav item '${key}' is localized`);
  }

  assert(
    ar.admin.header.logout === "تسجيل الخروج",
    "Arabic logout label matches 'تسجيل الخروج'",
  );
  assert(
    fr.admin.header.logout === "Déconnexion",
    "French logout label matches 'Déconnexion'",
  );

  // 2. Component Files Existence
  console.log("\n[2] Component Files & Architecture:");
  const projectRoot = process.cwd();
  const filesToCheck = [
    "src/context/AuthContext.tsx",
    "src/components/admin/ProtectedRoute.tsx",
    "src/components/admin/GuestRoute.tsx",
    "src/components/admin/AdminLoadingScreen.tsx",
    "src/components/admin/AdminLoginPage.tsx",
    "src/components/admin/AdminLayout.tsx",
    "src/components/admin/AdminSidebar.tsx",
    "src/components/admin/AdminHeader.tsx",
    "src/components/admin/AdminMobileDrawer.tsx",
    "src/components/admin/AdminDashboardPage.tsx",
    "src/components/admin/AdminPlaceholderPage.tsx",
    "vercel.json",
  ];

  for (const file of filesToCheck) {
    const fullPath = path.join(projectRoot, file);
    assert(fs.existsSync(fullPath), `File exists: ${file}`);
  }

  // 3. Vercel SPA Routing Configuration
  console.log("\n[3] Vercel Routing Configuration:");
  const vercelConfigPath = path.join(projectRoot, "vercel.json");
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf-8"));
  assert(Array.isArray(vercelConfig.rewrites), "vercel.json contains rewrites array");
  const apiBypassRewrite = vercelConfig.rewrites.find(
    (r: any) => r.source.includes("api") && r.destination === "/index.html",
  );
  assert(
    Boolean(apiBypassRewrite),
    "vercel.json rewrites SPA routes while bypassing /api/* endpoints",
  );

  // 4. Bundle Isolation & Code Splitting Verification
  console.log("\n[4] Bundle Isolation & Production Chunks:");
  const distAssetsDir = path.join(projectRoot, "dist", "assets");
  if (fs.existsSync(distAssetsDir)) {
    const distFiles = fs.readdirSync(distAssetsDir);
    const hasLoginChunk = distFiles.some((f) => f.startsWith("AdminLoginPage-"));
    const hasLayoutChunk = distFiles.some((f) => f.startsWith("AdminLayout-"));
    const hasDashboardChunk = distFiles.some((f) => f.startsWith("AdminDashboardPage-"));
    const hasPlaceholderChunk = distFiles.some((f) => f.startsWith("AdminPlaceholderPage-"));

    assert(hasLoginChunk, "AdminLoginPage is isolated in its own code-split chunk");
    assert(hasLayoutChunk, "AdminLayout is isolated in its own code-split chunk");
    assert(hasDashboardChunk, "AdminDashboardPage is isolated in its own code-split chunk");
    assert(hasPlaceholderChunk, "AdminPlaceholderPage is isolated in its own code-split chunk");
  } else {
    assert(false, "dist/assets directory exists after build");
  }

  // 5. Auth Security Boundaries
  console.log("\n[5] Auth Security Boundaries:");
  const authContextCode = fs.readFileSync(
    path.join(projectRoot, "src/context/AuthContext.tsx"),
    "utf-8",
  );
  assert(
    !authContextCode.includes("localStorage.setItem('token'"),
    "AuthContext never writes tokens to localStorage",
  );
  assert(
    !authContextCode.includes("sessionStorage.setItem('token'"),
    "AuthContext never writes tokens to sessionStorage",
  );
  assert(
    authContextCode.includes("credentials: \"same-origin\""),
    "AuthContext enforces credentials: 'same-origin' for HttpOnly cookie exchange",
  );

  console.log("\n==================================================");
  console.log(`🏁 TESTS FINISHED: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL STAGE 6 FRONTEND CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}

runStage6Tests().catch((err) => {
  console.error("Test runner threw unexpected error:", err);
  process.exit(1);
});
