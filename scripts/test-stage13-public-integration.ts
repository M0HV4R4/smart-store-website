import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setMockDb } from "../api/_lib/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import publicDownloadsHandler from "../api/_routes/downloads";
import publicContactHandler from "../api/_routes/site/contact";
import { ar } from "../src/locales/ar";
import { fr } from "../src/locales/fr";
import { siteConfig } from "../src/config/site";
import { mainNav, footerNav } from "../src/config/navigation";

// Minimal mock request/response helpers for API testing
function createMockReq(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
}): any {
  return {
    method: options.method || "GET",
    url: options.url || "/",
    headers: {
      host: "localhost:3000",
      ...options.headers,
    },
    query: {},
    body: {},
  };
}

function createMockRes(): {
  res: any;
  getStatus: () => number;
  getHeaders: () => Record<string, string>;
  getBody: () => any;
} {
  const headers: Record<string, string> = {};
  let body: any = null;

  const res: any = {
    statusCode: 200,
    setHeader(name: string, val: string) {
      headers[name.toLowerCase()] = val;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      body = data;
    },
    end(data: any) {
      if (data && !body) {
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
      }
    },
  };

  return {
    res,
    getStatus: () => res.statusCode,
    getHeaders: () => headers,
    getBody: () => body,
  };
}

async function runStage13Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 13: PUBLIC SITE INTEGRATION & CONSISTENCY");
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

  // =========================================================================
  // GROUP 1: Source Files & Source of Truth Audit
  // =========================================================================
  console.log("\n--- GROUP 1: Public Download & Contact Source of Truth ---");

  const downloadCtaPath = path.resolve(__dirname, "../src/components/sections/DownloadCtaSection.tsx");
  const downloadCtaCode = fs.readFileSync(downloadCtaPath, "utf-8");

  const appPath = path.resolve(__dirname, "../src/App.tsx");
  const appCode = fs.readFileSync(appPath, "utf-8");

  const heroPath = path.resolve(__dirname, "../src/components/sections/Hero.tsx");
  const heroCode = fs.readFileSync(heroPath, "utf-8");

  const navbarPath = path.resolve(__dirname, "../src/components/layout/Navbar.tsx");
  const navbarCode = fs.readFileSync(navbarPath, "utf-8");

  const footerPath = path.resolve(__dirname, "../src/components/layout/Footer.tsx");
  const footerCode = fs.readFileSync(footerPath, "utf-8");

  // 1. Windows public button points to /api/download/windows
  assert(
    downloadCtaCode.includes('href="/api/download/windows"'),
    "1. Windows public download button uses /api/download/windows",
  );

  // 2. Android public button points to /api/download/android
  assert(
    downloadCtaCode.includes('href="/api/download/android"'),
    "2. Android public download button uses /api/download/android",
  );

  // 3. No direct GitHub binary releases or external .exe/.apk in React
  const hasDirectGithubBinary = /https?:\/\/github\.com\/[^\s"']+\.(exe|apk|zip|msi)/i.test(downloadCtaCode);
  assert(!hasDirectGithubBinary, "3. No direct GitHub release binary URLs in public React components");

  // 4. Hero and Navbar CTA scroll to #download anchor, no direct binary bypass
  assert(
    heroCode.includes('href="#download"') && !heroCode.includes("/api/download/"),
    "4. Hero CTA button smoothly anchors to #download without bypassing tracking",
  );
  assert(
    navbarCode.includes('href="#download"') && !navbarCode.includes("/api/download/"),
    "5. Navbar CTA button smoothly anchors to #download without bypassing tracking",
  );

  // =========================================================================
  // GROUP 2: Legacy File Cleanup & Dead Code Removal
  // =========================================================================
  console.log("\n--- GROUP 2: Legacy Dead Code Cleanup ---");

  const legacyDownloadExists = fs.existsSync(
    path.resolve(__dirname, "../src/components/sections/Download.tsx"),
  );
  assert(!legacyDownloadExists, "6. Legacy unused Download.tsx has been safely removed");

  const obsoleteDownloadsConfigExists = fs.existsSync(
    path.resolve(__dirname, "../src/config/downloads.ts"),
  );
  assert(!obsoleteDownloadsConfigExists, "7. Obsolete config/downloads.ts has been safely removed");

  const previewImgExists = fs.existsSync(
    path.resolve(__dirname, "../src/images/preview.png"),
  );
  assert(!previewImgExists, "8. Stale preview.png (1.2 MB) has been safely removed");

  // Verify smartstore.png is present in root
  const smartstorePngExists = fs.existsSync(path.resolve(__dirname, "../smartstore.png"));
  assert(smartstorePngExists, "9. Production smartstore.png exists in root directory");

  // Verify smartstore.png is imported safely and not mirrored in RTL
  assert(
    heroCode.includes("smartstore.png") &&
      heroCode.includes("rtl:transform-none") &&
      heroCode.includes("ltr:transform-none"),
    "10. smartstore.png uses production-safe asset path and prevents RTL mirroring",
  );

  // =========================================================================
  // GROUP 3: Public Metadata API Integrity (/api/downloads)
  // =========================================================================
  console.log("\n--- GROUP 3: Public Metadata API (/api/downloads) ---");

  // Setup mock DB for metadata
  const mockReleases = [
    {
      id: "rel-win",
      platform: "windows",
      version: "2.1.0",
      downloadUrl: "https://secure-cdn.smartstore.dz/releases/SmartStore-v2.1.0.exe",
      fileSize: "78 MB",
      releaseDate: "2026-03-15",
      status: "active",
      downloadEnabled: true,
      createdAt: new Date(),
    },
    {
      id: "rel-and",
      platform: "android",
      version: "1.4.0",
      downloadUrl: "https://secure-cdn.smartstore.dz/releases/SmartStore-v1.4.0.apk",
      fileSize: "32 MB",
      releaseDate: "2026-03-10",
      status: "active",
      downloadEnabled: false, // Disabled!
      createdAt: new Date(),
    },
  ];

  let queryIndex = 0;
  const mockDbDownloads = {
    select(_selection?: any) {
      return {
        from(_tableObj: any) {
          return {
            where(_predicate: any) {
              return {
                limit(_n: number) {
                  const idx = queryIndex++;
                  const platform = idx % 2 === 0 ? "windows" : "android";
                  const match = mockReleases.filter(
                    (r) => r.platform === platform && r.status === "active",
                  );
                  return Promise.resolve(match);
                },
              };
            },
          };
        },
      };
    },
  };

  setMockDb(mockDbDownloads as any);

  const metaReq = createMockReq({ method: "GET" });
  const metaRes = createMockRes();
  await publicDownloadsHandler(metaReq, metaRes.res);

  assert(metaRes.getStatus() === 200, "11. Public GET /api/downloads returns 200 OK");
  const metaBody = metaRes.getBody()?.data;

  // Cache-Control is no-store
  const metaCache = metaRes.getHeaders()["cache-control"];
  assert(metaCache?.includes("no-store"), "12. /api/downloads enforces strict no-store Cache-Control");

  // Zero raw destination URLs or database IDs exposed
  assert(
    metaBody?.windows?.downloadUrl === undefined &&
      metaBody?.windows?.id === undefined &&
      metaBody?.android?.downloadUrl === undefined &&
      metaBody?.android?.id === undefined,
    "13. Never exposes raw downloadUrl or database ID in public metadata",
  );

  // Correct platform availability
  assert(metaBody?.windows?.available === true, "14. Windows reports available: true when enabled");
  assert(metaBody?.android?.available === false, "15. Android reports available: false when disabled");
  assert(metaBody?.windows?.version === "2.1.0", "16. Windows version reflects PostgreSQL record");
  assert(metaBody?.windows?.fileSize === "78 MB", "17. Windows fileSize reflects PostgreSQL record");

  // =========================================================================
  // GROUP 4: Public Contact & Support API (/api/site/contact)
  // =========================================================================
  console.log("\n--- GROUP 4: Public Contact & Support API (/api/site/contact) ---");

  const mockContentRows = [
    { key: "contact_title", contentAr: "تواصل مع فريق الدعم", contentFr: "Contactez le support" },
    { key: "contact_description", contentAr: "نحن هنا لمساعدتكم", contentFr: "Nous sommes là pour vous" },
    { key: "whatsapp_message", contentAr: "مرحبا، أريد تجربة البرنامج", contentFr: "Bonjour, je souhaite tester" },
  ];

  const mockSettingsRows = [
    { key: "whatsapp_enabled", value: "true" },
    { key: "whatsapp_number", value: "+213 555 12 34 56" },
    { key: "whatsapp_normalized_number", value: "213555123456" },
    { key: "facebook_enabled", value: "true" },
    { key: "facebook_url", value: "https://facebook.com/smartstore.algerie" },
    { key: "instagram_enabled", value: "false" }, // Disabled channel
    { key: "instagram_url", value: "https://instagram.com/smartstore.dz" },
  ];

  const mockDbContact = {
    select(_selection?: any) {
      return {
        from(tableObj: any) {
          const tableName =
            (tableObj as any)?.[Symbol.for("drizzle:Name")] ||
            tableObj?._?.name ||
            tableObj?.tableName ||
            "";

          return {
            where(_predicate: any) {
              if (tableName.includes("site_content")) {
                return Promise.resolve(mockContentRows);
              }
              return Promise.resolve(mockSettingsRows);
            },
            then(onFulfilled: any) {
              if (tableName.includes("site_content")) {
                return Promise.resolve(mockContentRows).then(onFulfilled);
              }
              return Promise.resolve(mockSettingsRows).then(onFulfilled);
            },
          };
        },
      };
    },
  };

  setMockDb(mockDbContact as any);

  const contactReq = createMockReq({ method: "GET" });
  const contactRes = createMockRes();
  await publicContactHandler(contactReq, contactRes.res);

  assert(contactRes.getStatus() === 200, "18. Public GET /api/site/contact returns 200 OK");
  const contactBody = contactRes.getBody()?.data;

  // Short CDN cache header with revalidation
  const contactCache = contactRes.getHeaders()["cache-control"];
  assert(
    contactCache?.includes("public") && contactCache?.includes("s-maxage=60"),
    "19. /api/site/contact emits safe short CDN cache with fast revalidation",
  );

  // WhatsApp locale URLs
  assert(
    contactBody?.whatsapp?.enabled === true &&
      contactBody.whatsapp.urlAr.includes("wa.me/213555123456") &&
      contactBody.whatsapp.urlAr.includes(encodeURIComponent("مرحبا، أريد تجربة البرنامج")),
    "20. Builds trusted WhatsApp URL with pre-filled Arabic message for Arabic locale",
  );

  assert(
    contactBody?.whatsapp?.urlFr.includes("wa.me/213555123456") &&
      contactBody.whatsapp.urlFr.includes(encodeURIComponent("Bonjour, je souhaite tester")),
    "21. Builds trusted WhatsApp URL with pre-filled French message for French locale",
  );

  // Facebook enabled, Instagram disabled
  assert(
    contactBody?.facebook?.enabled === true &&
      contactBody.facebook.url === "https://facebook.com/smartstore.algerie",
    "22. Enabled Facebook channel returns validated HTTPS URL",
  );

  assert(
    contactBody?.instagram?.enabled === false,
    "23. Disabled Instagram channel is flagged enabled: false",
  );

  // =========================================================================
  // GROUP 5: Navigation, Footer & Pricing Consistency
  // =========================================================================
  console.log("\n--- GROUP 5: Navigation, Footer & Pricing Integrity ---");

  // Verify mainNav does not contain #pricing
  const hasPricingInMainNav = mainNav.some((n: any) => n.href === "#pricing" || n.key === "pricing");
  assert(!hasPricingInMainNav, "24. mainNav contains zero stale #pricing navigation entries");

  // Verify footerNav does not contain #pricing
  const hasPricingInFooter =
    footerNav.site.some((n: any) => n.href === "#pricing" || n.key === "pricing") ||
    footerNav.product.some((n: any) => n.href === "#pricing" || n.key === "pricing");
  assert(!hasPricingInFooter, "25. footerNav contains zero stale #pricing navigation entries");

  // Footer has zero hardcoded contact info
  assert(
    siteConfig.contact.email === null &&
      siteConfig.contact.phone === null &&
      siteConfig.contact.address === null,
    "26. siteConfig.contact contains zero fabricated contact placeholders (all null)",
  );

  // Footer is minimal and doesn't invent fake social profiles
  assert(
    Array.isArray(siteConfig.social) && siteConfig.social.length === 0,
    "27. siteConfig.social is empty (Footer remains minimal without fabricated profiles)",
  );

  // =========================================================================
  // GROUP 6: Frontend Security & Bundle Isolation
  // =========================================================================
  console.log("\n--- GROUP 6: Security, Vercel Routing & Bundle Isolation ---");

  // Zero localhost URLs in src/
  const srcFiles = [appCode, downloadCtaCode, heroCode, navbarCode, footerCode];
  const hasLocalhostInSrc = srcFiles.some((code) => /https?:\/\/localhost/i.test(code));
  assert(!hasLocalhostInSrc, "28. Zero localhost URLs present in public React source files");

  // Zero absolute Windows drive letters in src/
  const hasWindowsDrivePath = srcFiles.some((code) => /[C-Z]:[\\\/]/i.test(code));
  assert(!hasWindowsDrivePath, "29. Zero absolute local Windows file paths in public code");

  // Zero VITE_ environment secrets in frontend
  const hasViteSecret = srcFiles.some((code) => /VITE_.*(SECRET|PASSWORD|DATABASE|TOKEN)/i.test(code));
  assert(!hasViteSecret, "30. Zero VITE_ client environment secrets introduced in frontend");

  // Vercel rewrite configuration preserves /api/*
  const vercelJsonPath = path.resolve(__dirname, "../vercel.json");
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
  const apiBypassRewrite = vercelJson.rewrites?.some(
    (r: any) => r.source.includes("(?!api/)") && r.destination === "/index.html",
  );
  assert(apiBypassRewrite, "31. vercel.json rewrites SPA routes while allowing /api/* to execute");

  // Admin pages are strictly code-split / lazy-loaded in App.tsx
  assert(
    appCode.includes('lazy(() => import("@/components/admin/AdminDashboardPage"))') &&
      appCode.includes('lazy(() => import("@/components/admin/AdminDownloadsPage"))') &&
      appCode.includes('lazy(() => import("@/components/admin/AdminReleasesPage"))') &&
      appCode.includes('lazy(() => import("@/components/admin/AdminAnalyticsPage"))') &&
      appCode.includes('lazy(() => import("@/components/admin/AdminWebsitePage"))') &&
      appCode.includes('lazy(() => import("@/components/admin/AdminSecurityPage"))') &&
      appCode.includes('lazy(() => import("@/components/admin/AdminActivityPage"))'),
    "32. All Admin pages are strictly code-split with React.lazy() to protect public bundle size",
  );

  // =========================================================================
  // GROUP 7: Bilingual Localization & Accessibility
  // =========================================================================
  console.log("\n--- GROUP 7: Bilingual Dictionaries & Accessibility ---");

  // Complete Arabic download keys
  assert(
    typeof ar.download?.windows?.desc === "string" &&
      Array.isArray(ar.download?.windows?.features) &&
      ar.download.windows.features.length === 3 &&
      typeof ar.download?.android?.desc === "string" &&
      Array.isArray(ar.download?.android?.features) &&
      ar.download.android.features.length === 3 &&
      typeof ar.download?.safeNotice === "string",
    "33. Arabic dictionary contains complete localized download copy, bullets & safety notice",
  );

  // Complete French download keys
  assert(
    typeof fr.download?.windows?.desc === "string" &&
      Array.isArray(fr.download?.windows?.features) &&
      fr.download.windows.features.length === 3 &&
      typeof fr.download?.android?.desc === "string" &&
      Array.isArray(fr.download?.android?.features) &&
      fr.download.android.features.length === 3 &&
      typeof fr.download?.safeNotice === "string",
    "34. French dictionary contains complete localized download copy, bullets & safety notice",
  );

  // Disabled button accessibility in DownloadCtaSection
  assert(
    downloadCtaCode.includes('aria-disabled="true"') &&
      downloadCtaCode.includes("cursor-not-allowed") &&
      !downloadCtaCode.includes('href="/api/download/windows" className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md border border-slate-200 bg-slate-100'),
    "35. Unavailable download is rendered as an unactivatable div with aria-disabled='true'",
  );

  // Safe external link attributes on social and contact links
  assert(
    downloadCtaCode.includes('target="_blank"') &&
      downloadCtaCode.includes('rel="noopener noreferrer"'),
    "36. External contact links enforce target='_blank' and rel='noopener noreferrer'",
  );

  // Focus-visible keyboard accessibility rings
  assert(
    downloadCtaCode.includes("focus-visible:ring-2") &&
      downloadCtaCode.includes("focus-visible:ring-offset-2"),
    "37. Interactive download and contact buttons include visible keyboard focus rings",
  );

  // Ordering check: Contact appears AFTER download cards and BEFORE footer
  const windowsCardPos = downloadCtaCode.indexOf("t.download.windows.title");
  const androidCardPos = downloadCtaCode.indexOf("t.download.android.title");
  const contactBlockPos = downloadCtaCode.indexOf("contactData &&");
  assert(
    windowsCardPos < contactBlockPos && androidCardPos < contactBlockPos,
    "38. Contact/Support block renders strictly after Windows & Android download cards",
  );

  console.log("\n==================================================");
  console.log(`RESULTS: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runStage13Tests().catch((err) => {
  console.error("Fatal error during Stage 13 tests:", err);
  process.exit(1);
});
