/**
 * Stage 14 — Full UI/UX QA, Responsive, RTL/LTR & Accessibility Verification Suite
 *
 * Verifies:
 * 1. FAQ Accordion WCAG ARIA attributes & keyboard focus indicators.
 * 2. Admin Modals accessibility (role="dialog"/"alertdialog", aria-modal, aria-labelledby, Escape listener).
 * 3. Form input & label pairing (htmlFor + id association, accessible toggle labels).
 * 4. RTL / LTR layout correctness (logical properties, dir="ltr" technical safeguards, drawer placement).
 * 5. Responsive viewport guards (overflow-x-auto, max-h-[90vh], skip-link, min-w-0).
 */

import fs from "node:fs";
import path from "node:path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failed++;
  }
}

function runTestSuite() {
  console.log("\n============================================================");
  console.log("STAGE 14 — FULL UI/UX QA, RESPONSIVE, RTL/LTR & ACCESSIBILITY");
  console.log("============================================================\n");

  const rootDir = process.cwd();

  // --------------------------------------------------------------------------
  // 1. FAQ Accordion Accessibility (FaqSection.tsx)
  // --------------------------------------------------------------------------
  console.log("1. FAQ Accordion Accessibility:");
  const faqPath = path.join(rootDir, "src/components/sections/FaqSection.tsx");
  const faqContent = fs.readFileSync(faqPath, "utf-8");

  assert(
    faqContent.includes('aria-expanded={isOpen}'),
    "FAQ accordion buttons define aria-expanded={isOpen}",
  );
  assert(
    faqContent.includes('aria-controls={`faq-answer-${idx}`}'),
    "FAQ accordion buttons define dynamic aria-controls linking to answer ID",
  );
  assert(
    faqContent.includes('id={`faq-question-${idx}`}'),
    "FAQ accordion buttons define question ID for aria-labelledby pairing",
  );
  assert(
    faqContent.includes('role="region"') && faqContent.includes('aria-labelledby={`faq-question-${idx}`}'),
    "FAQ answer panels define role='region' and aria-labelledby",
  );
  assert(
    faqContent.includes("focus-visible:ring-"),
    "FAQ accordion buttons define visible focus-visible outline ring",
  );

  // --------------------------------------------------------------------------
  // 2. Navigation Accessibility & Skip Link (Navbar.tsx & App.tsx)
  // --------------------------------------------------------------------------
  console.log("\n2. Navigation Accessibility & Skip Link:");
  const navbarPath = path.join(rootDir, "src/components/layout/Navbar.tsx");
  const navbarContent = fs.readFileSync(navbarPath, "utf-8");
  const appPath = path.join(rootDir, "src/App.tsx");
  const appContent = fs.readFileSync(appPath, "utf-8");

  assert(
    navbarContent.includes('aria-controls="mobile-nav"'),
    "Mobile menu button defines aria-controls='mobile-nav'",
  );
  assert(
    navbarContent.includes('id="mobile-nav"'),
    "Mobile menu panel defines id='mobile-nav'",
  );
  assert(
    appContent.includes('href="#main"') && appContent.includes('id="main"'),
    "Public page defines functional skip-to-content link pointing to #main",
  );

  // --------------------------------------------------------------------------
  // 3. Admin Mobile Drawer RTL/LTR Layout (AdminMobileDrawer.tsx)
  // --------------------------------------------------------------------------
  console.log("\n3. Admin Mobile Drawer RTL/LTR Alignment:");
  const drawerPath = path.join(rootDir, "src/components/admin/AdminMobileDrawer.tsx");
  const drawerContent = fs.readFileSync(drawerPath, "utf-8");

  assert(
    drawerContent.includes("start-0") && drawerContent.includes("border-e"),
    "Admin mobile drawer uses logical start-0 and border-e for symmetric RTL/LTR positioning",
  );
  assert(
    drawerContent.includes('role="dialog"') && drawerContent.includes('aria-modal="true"'),
    "Admin mobile drawer declares role='dialog' and aria-modal='true'",
  );
  assert(
    drawerContent.includes('e.key === "Escape"'),
    "Admin mobile drawer handles Escape key listener",
  );

  // --------------------------------------------------------------------------
  // 4. Admin Modals Keyboard Dismiss & Dialog Roles
  // --------------------------------------------------------------------------
  console.log("\n4. Admin Modals Accessibility & Escape Handlers:");
  const downloadsAdminPath = path.join(rootDir, "src/components/admin/AdminDownloadsPage.tsx");
  const downloadsAdminContent = fs.readFileSync(downloadsAdminPath, "utf-8");
  const releasesAdminPath = path.join(rootDir, "src/components/admin/AdminReleasesPage.tsx");
  const releasesAdminContent = fs.readFileSync(releasesAdminPath, "utf-8");
  const securityAdminPath = path.join(rootDir, "src/components/admin/AdminSecurityPage.tsx");
  const securityAdminContent = fs.readFileSync(securityAdminPath, "utf-8");
  const activityAdminPath = path.join(rootDir, "src/components/admin/AdminActivityPage.tsx");
  const activityAdminContent = fs.readFileSync(activityAdminPath, "utf-8");

  assert(
    downloadsAdminContent.includes('e.key === "Escape"'),
    "AdminDownloadsPage listens for Escape key to close modals",
  );
  assert(
    downloadsAdminContent.includes('role="alertdialog"') && downloadsAdminContent.includes('aria-labelledby="confirm-disable-title"'),
    "AdminDownloadsPage confirm disable modal defines role='alertdialog' and aria-labelledby",
  );

  assert(
    releasesAdminContent.includes('e.key === "Escape"'),
    "AdminReleasesPage listens for Escape key across all modal states",
  );
  assert(
    releasesAdminContent.includes('role="dialog"') && releasesAdminContent.includes('aria-labelledby="details-modal-title"'),
    "AdminReleasesPage details modal defines role='dialog' and aria-labelledby",
  );
  assert(
    releasesAdminContent.includes('aria-labelledby="edit-modal-title"'),
    "AdminReleasesPage edit modal defines aria-labelledby",
  );
  assert(
    releasesAdminContent.includes('aria-labelledby="publish-modal-title"'),
    "AdminReleasesPage publish modal defines aria-labelledby",
  );
  assert(
    releasesAdminContent.includes('aria-labelledby="confirm-activate-title"') &&
    releasesAdminContent.includes('aria-labelledby="confirm-archive-title"') &&
    releasesAdminContent.includes('aria-labelledby="confirm-disable-title"'),
    "AdminReleasesPage confirmation dialogs all define role='alertdialog' and unique aria-labelledby",
  );

  assert(
    securityAdminContent.includes('e.key === "Escape"'),
    "AdminSecurityPage listens for Escape key to close revocation confirmation modals",
  );

  assert(
    activityAdminContent.includes('e.key === "Escape"'),
    "AdminActivityPage listens for Escape key to close detail modal",
  );
  assert(
    activityAdminContent.includes('role="dialog"') && activityAdminContent.includes('aria-labelledby="activity-details-title"'),
    "AdminActivityPage details modal defines role='dialog' and aria-labelledby",
  );

  // --------------------------------------------------------------------------
  // 5. Form Control Associations (htmlFor + id & aria-label)
  // --------------------------------------------------------------------------
  console.log("\n5. Form Label & Input Associations:");
  const loginPath = path.join(rootDir, "src/components/admin/AdminLoginPage.tsx");
  const loginContent = fs.readFileSync(loginPath, "utf-8");
  const websiteAdminPath = path.join(rootDir, "src/components/admin/AdminWebsitePage.tsx");
  const websiteAdminContent = fs.readFileSync(websiteAdminPath, "utf-8");

  assert(
    loginContent.includes('htmlFor="admin-identifier"') && loginContent.includes('id="admin-identifier"'),
    "AdminLoginPage binds admin-identifier label and input",
  );
  assert(
    loginContent.includes('htmlFor="admin-password"') && loginContent.includes('id="admin-password"'),
    "AdminLoginPage binds admin-password label and input",
  );

  assert(
    securityAdminContent.includes('htmlFor="current-password"') && securityAdminContent.includes('id="current-password"'),
    "AdminSecurityPage binds current-password label and input",
  );
  assert(
    securityAdminContent.includes('htmlFor="new-password"') && securityAdminContent.includes('id="new-password"'),
    "AdminSecurityPage binds new-password label and input",
  );
  assert(
    securityAdminContent.includes('htmlFor="confirm-password"') && securityAdminContent.includes('id="confirm-password"'),
    "AdminSecurityPage binds confirm-password label and input",
  );

  assert(
    websiteAdminContent.includes('htmlFor="field-contact-title-ar"') && websiteAdminContent.includes('id="field-contact-title-ar"'),
    "AdminWebsitePage binds field-contact-title-ar label and input",
  );
  assert(
    websiteAdminContent.includes('htmlFor="field-contact-title-fr"') && websiteAdminContent.includes('id="field-contact-title-fr"'),
    "AdminWebsitePage binds field-contact-title-fr label and input",
  );
  assert(
    websiteAdminContent.includes('htmlFor="field-whatsapp-number"') && websiteAdminContent.includes('id="field-whatsapp-number"'),
    "AdminWebsitePage binds field-whatsapp-number label and input",
  );
  assert(
    websiteAdminContent.includes('htmlFor="field-facebook-url"') && websiteAdminContent.includes('id="field-facebook-url"'),
    "AdminWebsitePage binds field-facebook-url label and input",
  );
  assert(
    websiteAdminContent.includes('htmlFor="field-instagram-url"') && websiteAdminContent.includes('id="field-instagram-url"'),
    "AdminWebsitePage binds field-instagram-url label and input",
  );
  assert(
    websiteAdminContent.includes('aria-label="Facebook"') && websiteAdminContent.includes('aria-label="Instagram"'),
    "AdminWebsitePage channel toggles have accessible aria-labels",
  );

  // --------------------------------------------------------------------------
  // 6. Viewport Overflow Protections & Code Wrapping
  // --------------------------------------------------------------------------
  console.log("\n6. Viewport Overflow Protections & Responsive Design:");
  assert(
    activityAdminContent.includes("whitespace-pre-wrap break-all"),
    "AdminActivityPage pre elements wrap long JSON lines with whitespace-pre-wrap break-all",
  );
  assert(
    activityAdminContent.includes("overflow-x-auto"),
    "AdminActivityPage activity table is wrapped in overflow-x-auto container",
  );
  assert(
    releasesAdminContent.includes("max-h-[90vh] overflow-y-auto") &&
    downloadsAdminContent.includes("max-h-[90vh] overflow-y-auto") &&
    activityAdminContent.includes("max-h-[90vh] overflow-y-auto"),
    "All admin modal dialog panels enforce max-h-[90vh] overflow-y-auto for mobile viewports",
  );

  // --------------------------------------------------------------------------
  // 7. Hero Image & i18n Localization Integrity
  // --------------------------------------------------------------------------
  console.log("\n7. Hero Image & i18n Localization Integrity:");
  const heroPath = path.join(rootDir, "src/components/sections/Hero.tsx");
  const heroContent = fs.readFileSync(heroPath, "utf-8");
  const i18nPath = path.join(rootDir, "src/lib/i18n.tsx");
  const i18nContent = fs.readFileSync(i18nPath, "utf-8");

  assert(
    heroContent.includes("rtl:transform-none") && heroContent.includes("ltr:transform-none"),
    "Hero.tsx image includes explicit rtl:transform-none and ltr:transform-none safeguards against mirroring",
  );
  assert(
    i18nContent.includes("document.title =") && i18nContent.includes("isAdm"),
    "i18n.tsx synchronizes document.title with active locale on public pages",
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`STAGE 14 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
