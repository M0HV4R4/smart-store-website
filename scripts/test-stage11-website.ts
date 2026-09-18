import { setMockDb } from "../api/_lib/db";
import publicContactHandler from "../api/_routes/site/contact";
import adminWebsiteHandler from "../api/_routes/admin/website";
import { generateSessionToken, SESSION_COOKIE_NAME } from "../api/_lib/auth";
import {
  normalizeWhatsAppNumber,
  validateSocialUrl,
  buildWhatsAppUrl,
  websiteUpdateZodSchema,
} from "../api/_lib/website";
import { ar } from "../src/locales/ar";
import { fr } from "../src/locales/fr";

function createMockReq(options: {
  method?: string;
  url?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
}): any {
  return {
    method: options.method || "GET",
    url: options.url || "/",
    query: options.query || {},
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...options.headers,
    },
    cookies: options.cookies || {},
    body: options.body || {},
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

async function runStage11Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 11: WEBSITE CMS + CONTACT / SOCIAL");
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

  // Setup test admin auth
  const mockAdminId = "88888888-8888-8888-8888-888888888888";
  const mockRawToken = generateSessionToken();
  const validAuthCookies = { [SESSION_COOKIE_NAME]: mockRawToken };

  // In-memory tables emulator
  let mockSiteContent: Array<{
    key: string;
    contentAr: string | null;
    contentFr: string | null;
    updatedAt: Date;
  }> = [
    {
      key: "contact_title",
      contentAr: "هل تحتاج إلى استفسار أو مساعدة؟",
      contentFr: "Besoin d'aide ou d'un renseignement ?",
      updatedAt: new Date(),
    },
    {
      key: "contact_description",
      contentAr: "فريقنا متواجد للإجابة على استفساراتكم.",
      contentFr: "Notre équipe est à votre écoute.",
      updatedAt: new Date(),
    },
    {
      key: "whatsapp_message",
      contentAr: "مرحبًا، أود الاستفسار عن Smart Store",
      contentFr: "Bonjour, je souhaite des infos",
      updatedAt: new Date(),
    },
  ];

  let mockSiteSettings: Array<{
    key: string;
    value: string;
    updatedAt: Date;
  }> = [
    { key: "whatsapp_enabled", value: "true", updatedAt: new Date() },
    { key: "whatsapp_number", value: "+213 555 12 34 56", updatedAt: new Date() },
    { key: "whatsapp_normalized_number", value: "213555123456", updatedAt: new Date() },
    { key: "facebook_enabled", value: "true", updatedAt: new Date() },
    { key: "facebook_url", value: "https://facebook.com/smartstore.algerie", updatedAt: new Date() },
    { key: "instagram_enabled", value: "true", updatedAt: new Date() },
    { key: "instagram_url", value: "https://instagram.com/smartstore.dz", updatedAt: new Date() },
  ];

  let mockAuditLogs: any[] = [];
  let shouldSimulateDbError = false;

  // Mock DB query engine
  const mockDb = {
    select(_selection?: any) {
      return {
        from(tableObj: any) {
          const tableName =
            (tableObj as any)?.[Symbol.for("drizzle:Name")] ||
            tableObj?._?.name ||
            tableObj?.tableName ||
            "";

          return {
            innerJoin(_joinTable: any, _condition: any) {
              return {
                where(_predicate: any) {
                  return {
                    limit(_n: number) {
                      return Promise.resolve([
                        {
                          sessionId: "mock-session-id",
                          adminId: mockAdminId,
                          username: "admin",
                          email: "admin@smartstore.app",
                          adminStatus: "active",
                          expiresAt: new Date(Date.now() + 86400000),
                        },
                      ]);
                    },
                  };
                },
              };
            },
            where(_predicate?: any) {
              if (shouldSimulateDbError) {
                return Promise.reject(new Error("Database connection lost"));
              }
              if (tableName.includes("site_content") || tableName === "site_content") {
                return Promise.resolve([...mockSiteContent]);
              }
              if (tableName.includes("site_settings") || tableName === "site_settings") {
                return Promise.resolve([...mockSiteSettings]);
              }
              return Promise.resolve([]);
            },
          };
        },
      };
    },
    insert(tableObj: any) {
      const tableName =
        (tableObj as any)?.[Symbol.for("drizzle:Name")] ||
        tableObj?._?.name ||
        tableObj?.tableName ||
        "";

      return {
        values(data: any) {
          const promise = Promise.resolve().then(() => {
            if (tableName.includes("audit_logs") || tableName === "audit_logs") {
              mockAuditLogs.push(data);
            }
          });

          return {
            onConflictDoUpdate(conflictObj: any) {
              if (shouldSimulateDbError) {
                return Promise.reject(new Error("Database write error"));
              }
              if (tableName.includes("site_content") || tableName === "site_content") {
                const idx = mockSiteContent.findIndex((c) => c.key === data.key);
                if (idx >= 0) {
                  mockSiteContent[idx] = { ...mockSiteContent[idx], ...conflictObj.set };
                } else {
                  mockSiteContent.push(data);
                }
                return Promise.resolve();
              }
              if (tableName.includes("site_settings") || tableName === "site_settings") {
                const idx = mockSiteSettings.findIndex((s) => s.key === data.key);
                if (idx >= 0) {
                  mockSiteSettings[idx] = { ...mockSiteSettings[idx], ...conflictObj.set };
                } else {
                  mockSiteSettings.push(data);
                }
                return Promise.resolve();
              }
              return Promise.resolve();
            },
            then(onFulfilled?: any, onRejected?: any) {
              return promise.then(onFulfilled, onRejected);
            },
          };
        },
      };
    },
    update(_tableObj: any) {
      return {
        set(_data: any) {
          return {
            where() {
              return Promise.resolve();
            },
          };
        },
      };
    },
  };

  setMockDb(mockDb as any);

  // =========================================================================
  // GROUP 1: WhatsApp Number Normalization Unit Tests
  // =========================================================================
  console.log("\n--- GROUP 1: WhatsApp Normalization ---");

  const norm1 = normalizeWhatsAppNumber("+213 555 12 34 56");
  assert(
    norm1.valid && norm1.normalized === "213555123456",
    "1. Normalizes Algerian number with + and spaces",
  );

  const norm2 = normalizeWhatsAppNumber("+33 (0) 6 12 34 56 78");
  assert(
    norm2.valid && norm2.normalized === "330612345678",
    "2. Strips punctuation and returns E.164 digits",
  );

  const norm3 = normalizeWhatsAppNumber("0555123456");
  assert(
    !norm3.valid && Boolean(norm3.error?.includes("Local phone number starting with 0")),
    "3. Strictly rejects local numbers starting with 0 without country code",
  );

  const norm4 = normalizeWhatsAppNumber("+1234");
  assert(
    !norm4.valid && Boolean(norm4.error?.includes("too short")),
    "4. Rejects numbers shorter than 8 digits",
  );

  const norm5 = normalizeWhatsAppNumber("+12345678901234567");
  assert(
    !norm5.valid && Boolean(norm5.error?.includes("too long")),
    "5. Rejects numbers longer than 15 digits",
  );

  const norm6 = normalizeWhatsAppNumber("invalid-text");
  assert(!norm6.valid, "6. Rejects non-numeric alphabetic input");

  const norm7 = normalizeWhatsAppNumber("");
  assert(!norm7.valid && Boolean(norm7.error?.includes("required")), "7. Rejects empty phone number");

  // =========================================================================
  // GROUP 2: Social URL Validation Unit Tests
  // =========================================================================
  console.log("\n--- GROUP 2: Social URL Validation ---");

  const fb1 = validateSocialUrl("https://facebook.com/smartstore", "facebook");
  assert(fb1.valid, "8. Accepts standard HTTPS Facebook page URL");

  const fb2 = validateSocialUrl("https://www.facebook.com/groups/123456", "facebook");
  assert(fb2.valid, "9. Accepts www.facebook.com group URL");

  const fb3 = validateSocialUrl("https://fb.me/smartstore", "facebook");
  assert(fb3.valid, "10. Accepts official fb.me short link");

  const fb4 = validateSocialUrl("http://facebook.com/smartstore", "facebook");
  assert(!fb4.valid && Boolean(fb4.error?.includes("HTTPS")), "11. Strictly rejects plain HTTP Facebook URL");

  const fb5 = validateSocialUrl("https://fake-facebook.com/phish", "facebook");
  assert(
    !fb5.valid && Boolean(fb5.error?.includes("Facebook domain")),
    "12. Strictly rejects spoofed non-Facebook domains",
  );

  const ig1 = validateSocialUrl("https://instagram.com/smartstore.dz", "instagram");
  assert(ig1.valid, "13. Accepts standard HTTPS Instagram account URL");

  const ig2 = validateSocialUrl("https://instagr.am/smartstore", "instagram");
  assert(ig2.valid, "14. Accepts official instagr.am short domain");

  const ig3 = validateSocialUrl("https://phishing.com/instagram.com", "instagram");
  assert(
    !ig3.valid && Boolean(ig3.error?.includes("Instagram domain")),
    "15. Strictly rejects spoofed subpath Instagram lookalikes",
  );

  const xssUrl = validateSocialUrl("javascript:alert('xss')", "facebook");
  assert(!xssUrl.valid, "16. Strictly rejects javascript: URI scheme");

  // =========================================================================
  // GROUP 3: WhatsApp Public URL Builder
  // =========================================================================
  console.log("\n--- GROUP 3: WhatsApp URL Generation ---");

  const waUrl1 = buildWhatsAppUrl("213555123456", "مرحبًا بك في Smart Store");
  assert(
    waUrl1.startsWith("https://wa.me/213555123456?text=") &&
      waUrl1.includes(encodeURIComponent("مرحبًا بك في Smart Store")),
    "17. Builds URL-encoded wa.me link with Arabic pre-filled message",
  );

  const waUrl2 = buildWhatsAppUrl("213555123456", "");
  assert(
    waUrl2 === "https://wa.me/213555123456",
    "18. Builds clean wa.me link without ?text when message is empty",
  );

  const waUrl3 = buildWhatsAppUrl("", "test");
  assert(waUrl3 === "", "19. Returns empty string if normalized number is empty");

  // =========================================================================
  // GROUP 4: Zod Validation & Anti-XSS Protection
  // =========================================================================
  console.log("\n--- GROUP 4: CMS Schema & Anti-XSS ---");

  const validPayload = {
    contact: {
      titleAr: "عنوان نظيف",
      titleFr: "Titre propre",
      descriptionAr: "وصف بدون كود",
      descriptionFr: "Description sans balises",
    },
    whatsapp: {
      enabled: true,
      number: "+213 555 12 34 56",
      messageAr: "رسالة",
      messageFr: "Message",
    },
    facebook: {
      enabled: true,
      url: "https://facebook.com/smartstore",
    },
    instagram: {
      enabled: true,
      url: "https://instagram.com/smartstore",
    },
  };

  const zodValid = websiteUpdateZodSchema.safeParse(validPayload);
  assert(zodValid.success, "20. Accepts fully valid clean CMS payload");

  const xssPayload = {
    ...validPayload,
    contact: {
      ...validPayload.contact,
      titleAr: "عنوان مع <script>alert(1)</script>",
    },
  };
  const zodXss = websiteUpdateZodSchema.safeParse(xssPayload);
  assert(!zodXss.success, "21. Strictly rejects HTML/script tags in contact title");

  const xssDescPayload = {
    ...validPayload,
    contact: {
      ...validPayload.contact,
      descriptionFr: "<img src=x onerror=alert(1)>",
    },
  };
  const zodXssDesc = websiteUpdateZodSchema.safeParse(xssDescPayload);
  assert(!zodXssDesc.success, "22. Strictly rejects HTML tags in contact description");

  // =========================================================================
  // GROUP 5: Public Contact Endpoint (GET /api/site/contact)
  // =========================================================================
  console.log("\n--- GROUP 5: Public Endpoint (GET /api/site/contact) ---");

  const pubReq = createMockReq({ method: "GET" });
  const pubRes = createMockRes();
  await publicContactHandler(pubReq, pubRes.res);

  assert(pubRes.getStatus() === 200, "23. Public endpoint returns HTTP 200");

  const pubBody = pubRes.getBody();
  assert(pubBody?.ok === true && pubBody?.data, "24. Returns standard API envelope {ok: true, data}");

  const data = pubBody?.data;
  assert(
    data?.whatsapp?.enabled === true &&
      data?.whatsapp?.urlAr?.includes("wa.me/213555123456") &&
      data?.facebook?.enabled === true &&
      data?.instagram?.enabled === true,
    "25. Public payload contains valid pre-built channel URLs",
  );

  assert(
    data?.id === undefined &&
      data?.adminId === undefined &&
      data?.secret === undefined &&
      data?.audit === undefined,
    "26. Exposes zero internal IDs, secrets, or audit metadata to public visitors",
  );

  const cacheHeader = pubRes.getHeaders()["cache-control"];
  assert(
    cacheHeader?.includes("s-maxage=60") && cacheHeader?.includes("stale-while-revalidate="),
    "27. Emits proper fast-revalidation public CDN Cache-Control headers",
  );

  // Method check
  const postReq = createMockReq({ method: "POST" });
  const postRes = createMockRes();
  await publicContactHandler(postReq, postRes.res);
  assert(postRes.getStatus() === 405, "28. Public endpoint rejects POST with 405 Method Not Allowed");

  // =========================================================================
  // GROUP 6: Admin Endpoint Security & Auth (GET & PATCH /api/admin/website)
  // =========================================================================
  console.log("\n--- GROUP 6: Admin Endpoint Security ---");

  // Unauthenticated GET
  const unauthReq = createMockReq({ method: "GET" });
  const unauthRes = createMockRes();
  await adminWebsiteHandler(unauthReq, unauthRes.res);
  assert(unauthRes.getStatus() === 401, "29. Rejects unauthenticated Admin GET with 401");

  // CSRF invalid origin
  const csrfReq = createMockReq({
    method: "PATCH",
    headers: { origin: "https://attacker.evil.com" },
    cookies: validAuthCookies,
    body: validPayload,
  });
  const csrfRes = createMockRes();
  await adminWebsiteHandler(csrfReq, csrfRes.res);
  assert(csrfRes.getStatus() === 403, "30. Blocks CSRF origin attack with 403 CSRF_ERROR");

  // Authenticated Admin GET
  const adminGetReq = createMockReq({
    method: "GET",
    cookies: validAuthCookies,
  });
  const adminGetRes = createMockRes();
  await adminWebsiteHandler(adminGetReq, adminGetRes.res);
  assert(adminGetRes.getStatus() === 200, "31. Authenticated Admin GET returns HTTP 200");
  const adminGetData = adminGetRes.getBody()?.data;
  assert(
    adminGetData?.whatsapp?.normalizedNumber === "213555123456",
    "32. Admin GET returns full config including E.164 normalized phone number",
  );

  const adminHeaders = adminGetRes.getHeaders()["cache-control"];
  assert(
    adminHeaders?.includes("no-store"),
    "33. Admin endpoint emits strictly no-store cache headers",
  );

  // =========================================================================
  // GROUP 7: Admin Update (PATCH /api/admin/website) & Persistence
  // =========================================================================
  console.log("\n--- GROUP 7: Admin Update & Persistence ---");

  const updateReq = createMockReq({
    method: "PATCH",
    cookies: validAuthCookies,
    body: {
      contact: {
        titleAr: "عنوان محدث جديد",
        titleFr: "Nouveau titre mis a jour",
        descriptionAr: "وصف محدث جديد",
        descriptionFr: "Nouvelle description mise a jour",
      },
      whatsapp: {
        enabled: true,
        number: "+213 666 99 88 77",
        messageAr: "رسالة جديدة",
        messageFr: "Nouveau message",
      },
      facebook: {
        enabled: false,
        url: "https://facebook.com/smartstore.new",
      },
      instagram: {
        enabled: true,
        url: "https://instagram.com/smartstore.official",
      },
    },
  });
  const updateRes = createMockRes();
  await adminWebsiteHandler(updateReq, updateRes.res);

  assert(updateRes.getStatus() === 200, "34. Successfully updates CMS configuration via PATCH");
  const updatedData = updateRes.getBody()?.data;
  assert(
    updatedData?.whatsapp?.normalizedNumber === "213666998877",
    "35. Correctly re-computes and persists new normalized WhatsApp number",
  );

  // Check that public endpoint now reflects the updated data
  const pubReq2 = createMockReq({ method: "GET" });
  const pubRes2 = createMockRes();
  await publicContactHandler(pubReq2, pubRes2.res);
  const pubData2 = pubRes2.getBody()?.data;
  assert(
    pubData2?.whatsapp?.urlAr?.includes("wa.me/213666998877") &&
      pubData2?.facebook?.enabled === false &&
      pubData2?.facebook?.url === "" &&
      pubData2?.instagram?.enabled === true,
    "36. Public endpoint immediately reflects new settings (disabled Facebook URL sanitized to empty)",
  );

  // =========================================================================
  // GROUP 8: Locale Dictionary Integrity (AR & FR)
  // =========================================================================
  console.log("\n--- GROUP 8: Locale Consistency ---");

  assert(
    typeof ar.contactSupport?.defaultTitle === "string" &&
      typeof fr.contactSupport?.defaultTitle === "string" &&
      typeof ar.contactSupport?.whatsappCta === "string" &&
      typeof fr.contactSupport?.whatsappCta === "string",
    "37. Both Arabic and French dictionaries contain complete contactSupport strings",
  );

  assert(
    typeof ar.admin.website?.title === "string" &&
      typeof fr.admin.website?.title === "string" &&
      typeof ar.admin.website?.saveChanges === "string" &&
      typeof fr.admin.website?.saveChanges === "string" &&
      typeof ar.admin.website?.whatsappEnabled === "string" &&
      typeof fr.admin.website?.whatsappEnabled === "string",
    "38. Both Arabic and French dictionaries contain complete admin.website CMS strings",
  );

  console.log("\n==================================================");
  console.log(`RESULTS: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runStage11Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
