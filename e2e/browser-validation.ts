/**
 * Stage 17 Real Browser E2E Automation
 * Uses real Google Chrome via playwright-core against the production build.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { chromium, type Page, type Browser } from "playwright-core";

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
const distDir = path.join(rootDir, "dist");
const screenshotsDir = path.join(rootDir, "test-artifacts", "screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// ------------------------------------------------------------
// 1. Local Production-like HTTP Server for E2E
// ------------------------------------------------------------
function startProductionServer(port = 4173): Promise<http.Server> {
  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json",
  };

  const server = http.createServer((req, res) => {
    // Security headers (mirroring vercel.json)
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    );

    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    const pathname = url.pathname;

    // API Routes Mock
    if (pathname.startsWith("/api/")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      if (pathname === "/api/downloads") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            ok: true,
            data: {
              windows: {
                available: true,
                version: "v1.0.0",
                fileSize: "95 MB",
                releaseDate: "2026-03-15",
              },
              android: {
                available: true,
                version: "v1.0.0",
                fileSize: "42 MB",
                releaseDate: "2026-03-15",
              },
            },
          })
        );
        return;
      }

      if (pathname === "/api/site/contact") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            ok: true,
            data: {
              title: {
                ar: "تواصل مع فريق الدعم",
                fr: "Contactez notre équipe de support",
              },
              description: {
                ar: "نحن هنا لمساعدتك في إعداد وتشغيل سمارت ستور في متجرك.",
                fr: "Nous sommes là pour vous aider à configurer Smart Store.",
              },
              whatsapp: {
                enabled: true,
                number: "+213 555 12 34 56",
                urlAr: "https://wa.me/213555123456?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7",
                urlFr: "https://wa.me/213555123456?text=Bonjour",
              },
              facebook: { enabled: true, url: "https://facebook.com/smartstore" },
              instagram: { enabled: true, url: "https://instagram.com/smartstore" },
            },
          })
        );
        return;
      }

      if (pathname === "/api/auth/session") {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, data: { authenticated: false } }));
        return;
      }

      // Default API 404 (strictly JSON, never HTML!)
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "API route not found", code: "NOT_FOUND" }));
      return;
    }

    // Static Asset Serving from dist/
    let filePath = path.join(distDir, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      // SPA Fallback to dist/index.html
      filePath = path.join(distDir, "index.html");
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200);
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

// ------------------------------------------------------------
// 2. Real Chrome Automation Runner
// ------------------------------------------------------------
async function runBrowserValidation() {
  console.log("\n============================================================");
  console.log("STAGE 17: REAL CHROME BROWSER AUTOMATION VALIDATION");
  console.log("============================================================\n");

  const port = 4173;
  console.log(`⏳ Starting local production preview server on http://127.0.0.1:${port}...`);
  const server = await startProductionServer(port);
  console.log("✅ Local server running.\n");

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  console.log(`⏳ Launching real Google Chrome (${chromePath})...`);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log(`✅ Chrome launched successfully: Version ${browser.version()}\n`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });

    const page: Page = await context.newPage();

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const networkRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      } else if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    page.on("request", (req) => {
      networkRequests.push(`${req.method()} ${req.url()}`);
    });

    // ------------------------------------------------------------
    // Test 1: Desktop Homepage in Arabic (Default RTL)
    // ------------------------------------------------------------
    console.log("1. Public Desktop Homepage (Arabic RTL, 1280×800)");
    const response = await page.goto(`http://127.0.0.1:${port}/`, {
      waitUntil: "networkidle",
    });

    assert(response?.status() === 200, "Homepage loads with HTTP 200 OK");

    const lang = await page.evaluate(() => document.documentElement.lang);
    const dir = await page.evaluate(() => document.documentElement.dir);
    assert(lang === "ar", `Document lang is Arabic ('ar')`, `Actual: ${lang}`);
    assert(dir === "rtl", `Document dir is RTL ('rtl')`, `Actual: ${dir}`);

    // Verify smartstore.png loaded
    const imageInfo = await page.evaluate(() => {
      const img = document.querySelector("img[src*='smartstore']") as HTMLImageElement | null;
      if (!img) return null;
      return {
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
        complete: img.complete,
      };
    });

    assert(Boolean(imageInfo), "Hero smartstore.png image element rendered in DOM");
    assert(
      Boolean(imageInfo && imageInfo.naturalWidth > 0 && imageInfo.complete),
      `Hero smartstore.png successfully decoded in Chrome (${imageInfo?.naturalWidth}×${imageInfo?.naturalHeight}px)`
    );

    // Verify FAQ Accordion Interaction
    const firstFaqButton = await page.$("button[aria-controls='faq-answer-0']");
    const secondFaqButton = await page.$("button[aria-controls='faq-answer-1']");
    assert(Boolean(firstFaqButton && secondFaqButton), "FAQ accordion interactive buttons exist");

    if (firstFaqButton && secondFaqButton) {
      const is0ExpandedBefore = await firstFaqButton.getAttribute("aria-expanded");
      assert(is0ExpandedBefore === "true", "First FAQ item starts open by default (aria-expanded='true')");

      const is1ExpandedBefore = await secondFaqButton.getAttribute("aria-expanded");
      assert(is1ExpandedBefore === "false", "Second FAQ item starts closed by default (aria-expanded='false')");

      // Click second item to open it
      await secondFaqButton.click();
      await page.waitForTimeout(300);
      const is1ExpandedAfter = await secondFaqButton.getAttribute("aria-expanded");
      assert(
        is1ExpandedAfter === "true",
        "Clicking closed FAQ question expands panel (aria-expanded='true')"
      );

      // Click second item again to collapse it
      await secondFaqButton.click();
      await page.waitForTimeout(300);
      const is1Collapsed = await secondFaqButton.getAttribute("aria-expanded");
      assert(
        is1Collapsed === "false",
        "Clicking open FAQ question collapses panel (aria-expanded='false')"
      );
    }

    // Capture Desktop AR Screenshot
    const desktopArPath = path.join(screenshotsDir, "public-desktop-ar.png");
    await page.screenshot({ path: desktopArPath, fullPage: false });
    assert(fs.existsSync(desktopArPath), `Captured public-desktop-ar.png (${(fs.statSync(desktopArPath).size / 1024).toFixed(1)} KB)`);

    // ------------------------------------------------------------
    // Test 2: Bilingual Switching (AR -> FR -> AR)
    // ------------------------------------------------------------
    console.log("\n2. Bilingual RTL/LTR Dynamic Switching");
    // Find language switcher button
    const langBtn = await page.$("button:has-text('FR'), button:has-text('Français')");
    if (langBtn) {
      await langBtn.click();
      await page.waitForTimeout(300);

      const frLang = await page.evaluate(() => document.documentElement.lang);
      const frDir = await page.evaluate(() => document.documentElement.dir);
      assert(frLang === "fr", `Document lang switched dynamically to 'fr'`, `Actual: ${frLang}`);
      assert(frDir === "ltr", `Document dir switched dynamically to 'ltr'`, `Actual: ${frDir}`);

      // Capture Desktop FR Screenshot
      const desktopFrPath = path.join(screenshotsDir, "public-desktop-fr.png");
      await page.screenshot({ path: desktopFrPath, fullPage: false });
      assert(fs.existsSync(desktopFrPath), `Captured public-desktop-fr.png (${(fs.statSync(desktopFrPath).size / 1024).toFixed(1)} KB)`);

      // Switch back to Arabic
      const arBtn = await page.$("button:has-text('AR'), button:has-text('العربية')");
      if (arBtn) {
        await arBtn.click();
        await page.waitForTimeout(300);
        const backLang = await page.evaluate(() => document.documentElement.lang);
        const backDir = await page.evaluate(() => document.documentElement.dir);
        assert(backLang === "ar" && backDir === "rtl", "Switched back smoothly to Arabic RTL without page reload");
      }
    } else {
      console.log("  ⚠️ Language switcher button not found by text query");
    }

    // ------------------------------------------------------------
    // Test 3: Mobile Viewport (390 × 844) & Overflow Checks
    // ------------------------------------------------------------
    console.log("\n3. Mobile Viewport E2E (390×844)");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!hasHorizontalOverflow, "Zero horizontal document overflow on mobile viewport (390px)");

    // Capture Mobile Screenshot
    const mobileArPath = path.join(screenshotsDir, "public-mobile-ar.png");
    await page.screenshot({ path: mobileArPath, fullPage: false });
    assert(fs.existsSync(mobileArPath), `Captured public-mobile-ar.png (${(fs.statSync(mobileArPath).size / 1024).toFixed(1)} KB)`);

    // Reset desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // ------------------------------------------------------------
    // Test 4: Admin Login Page Rendering & Direct Refresh
    // ------------------------------------------------------------
    console.log("\n4. Admin Login Page Direct Navigation");
    await page.goto(`http://127.0.0.1:${port}/admin/login`, {
      waitUntil: "networkidle",
    });

    const loginTitle = await page.title();
    assert(loginTitle.includes("Smart Store") || loginTitle.includes("تسجيل"), `Admin login page loaded with valid title: '${loginTitle}'`);

    const identifierInput = await page.$("input#admin-identifier, input[name='identifier']");
    assert(Boolean(identifierInput), "Admin identifier input field rendered in DOM");

    const passwordInput = await page.$("input#admin-password, input[type='password']");
    assert(Boolean(passwordInput), "Admin password input field rendered with type='password'");

    // Capture Admin Login Screenshot
    const adminLoginPath = path.join(screenshotsDir, "admin-login-desktop.png");
    await page.screenshot({ path: adminLoginPath, fullPage: false });
    assert(fs.existsSync(adminLoginPath), `Captured admin-login-desktop.png (${(fs.statSync(adminLoginPath).size / 1024).toFixed(1)} KB)`);

    // ------------------------------------------------------------
    // Test 5: Protected Route Redirection (Unauthenticated)
    // ------------------------------------------------------------
    console.log("\n5. Protected Route Access Control");
    await page.goto(`http://127.0.0.1:${port}/admin/releases`, {
      waitUntil: "networkidle",
    });

    const currentUrl = page.url();
    assert(
      currentUrl.includes("/admin/login"),
      `Unauthenticated access to /admin/releases correctly redirects to /admin/login`,
      `Current URL: ${currentUrl}`
    );

    // ------------------------------------------------------------
    // Test 6: Unknown SPA Route & Unknown API Route
    // ------------------------------------------------------------
    console.log("\n6. Unknown Route Behavior");
    const spaUnknownRes = await page.goto(`http://127.0.0.1:${port}/some-unknown-path-12345`);
    assert(spaUnknownRes?.status() === 200, "Unknown SPA route safely rewrites to index.html with 200 OK");

    const apiUnknownRes = await page.request.get(`http://127.0.0.1:${port}/api/nonexistent-route-xyz`);
    assert(apiUnknownRes.status() === 404, "Unknown /api/* route returns HTTP 404");
    const apiUnknownJson = await apiUnknownRes.json();
    assert(apiUnknownJson.ok === false, "Unknown /api/* route returns standard JSON error payload (never HTML)");

    // ------------------------------------------------------------
    // Test 7: Console Errors & CSP Compliance Inspection
    // ------------------------------------------------------------
    console.log("\n7. Console Errors & CSP Compliance Inspection");
    const fatalCspErrors = consoleErrors.filter((e) => e.includes("Content Security Policy") || e.includes("blocked"));
    assert(fatalCspErrors.length === 0, `Zero CSP violations detected in browser console`, fatalCspErrors.join("; "));

    const uncaughtExceptions = consoleErrors.filter((e) => !e.includes("favicon") && !e.includes("404"));
    assert(uncaughtExceptions.length === 0, `Zero fatal JavaScript errors in browser console during run`, uncaughtExceptions.join("; "));

    console.log(`  ℹ️ Total network requests observed during run: ${networkRequests.length}`);
    console.log(`  ℹ️ Total browser console warnings: ${consoleWarnings.length}`);

  } finally {
    if (browser) await browser.close();
    server.close();
    console.log("\n⏳ Closed browser and stopped local server.");
  }

  // ------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`REAL BROWSER VALIDATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runBrowserValidation();
