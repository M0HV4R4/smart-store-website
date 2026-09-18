import { setMockDb } from "../api/_lib/db";
import securityHandler from "../api/admin/security/index";
import sessionsHandler from "../api/admin/security/sessions";
import activityHandler from "../api/admin/activity/index";
import changePasswordHandler from "../api/auth/change-password";
import {
  generateSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  hashPassword,
  verifyPassword,
} from "../api/_lib/auth";
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

async function runStage12Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 12: ADMIN SECURITY & ACTIVITY LOG");
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

  // Setup Admin & Sessions in-memory store
  const mockAdminId = "11111111-1111-1111-1111-111111111111";
  const otherAdminId = "22222222-2222-2222-2222-222222222222";

  const initialPassword = "AdminSecurePassword123!";
  let currentPasswordHash = await hashPassword(initialPassword);

  const currentToken = generateSessionToken();
  const currentTokenHash = hashSessionToken(currentToken);
  const currentSessionId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  const secondToken = generateSessionToken();
  const secondTokenHash = hashSessionToken(secondToken);
  const secondSessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  const expiredSessionId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  const otherAdminSessionId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

  let mockAdmins: Array<{
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }> = [
    {
      id: mockAdminId,
      username: "smartadmin",
      email: "admin@smartstore.dz",
      passwordHash: currentPasswordHash,
      status: "active",
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date(),
      lastLoginAt: new Date(Date.now() - 3600000),
    },
    {
      id: otherAdminId,
      username: "otheradmin",
      email: "other@smartstore.dz",
      passwordHash: currentPasswordHash,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    },
  ];

  let mockSessions: Array<{
    id: string;
    adminId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }> = [
    {
      id: currentSessionId,
      adminId: mockAdminId,
      tokenHash: currentTokenHash,
      expiresAt: new Date(Date.now() + 7 * 86400000),
      createdAt: new Date(Date.now() - 2 * 3600000),
    },
    {
      id: secondSessionId,
      adminId: mockAdminId,
      tokenHash: secondTokenHash,
      expiresAt: new Date(Date.now() + 6 * 86400000),
      createdAt: new Date(Date.now() - 24 * 3600000),
    },
    {
      id: expiredSessionId,
      adminId: mockAdminId,
      tokenHash: "expired-hash",
      expiresAt: new Date(Date.now() - 10000), // Expired!
      createdAt: new Date(Date.now() - 8 * 86400000),
    },
    {
      id: otherAdminSessionId,
      adminId: otherAdminId,
      tokenHash: "other-admin-hash",
      expiresAt: new Date(Date.now() + 7 * 86400000),
      createdAt: new Date(),
    },
  ];

  let mockAuditLogs: Array<{
    id: string;
    adminId: string | null;
    adminUsername: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: any;
    createdAt: Date;
  }> = [
    {
      id: "log-1",
      adminId: mockAdminId,
      adminUsername: "smartadmin",
      action: "admin.login",
      entityType: "admin",
      entityId: mockAdminId,
      metadata: { userAgent: "Mozilla/5.0" },
      createdAt: new Date(Date.now() - 100000),
    },
    {
      id: "log-2",
      adminId: mockAdminId,
      adminUsername: "smartadmin",
      action: "release.created",
      entityType: "release",
      entityId: "rel-1",
      metadata: { platform: "windows", version: "1.0.0" },
      createdAt: new Date(Date.now() - 80000),
    },
    {
      id: "log-3",
      adminId: mockAdminId,
      adminUsername: "smartadmin",
      action: "download.enabled",
      entityType: "download",
      entityId: "rel-1",
      metadata: { platform: "windows" },
      createdAt: new Date(Date.now() - 60000),
    },
    {
      id: "log-4",
      adminId: mockAdminId,
      adminUsername: "smartadmin",
      action: "website.contact.updated",
      entityType: "content",
      entityId: "contact_settings",
      metadata: { whatsappEnabled: true },
      createdAt: new Date(Date.now() - 40000),
    },
  ];

  // Helper condition evaluator for tests
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
                      // Return authenticated admin session
                      return Promise.resolve([
                        {
                          sessionId: currentSessionId,
                          adminId: mockAdminId,
                          username: "smartadmin",
                          email: "admin@smartstore.dz",
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
              const now = new Date();

              if (tableName.includes("admins") || tableName === "admins") {
                return {
                  limit(_n: number) {
                    const match = mockAdmins.filter((a) => a.id === mockAdminId);
                    return Promise.resolve(match);
                  },
                };
              }

              if (tableName.includes("sessions") || tableName === "sessions") {
                return {
                  limit(_n: number) {
                    return Promise.resolve(mockSessions);
                  },
                  orderBy(_descCol: any) {
                    // Filter unexpired for admin
                    const filtered = mockSessions.filter(
                      (s) => s.adminId === mockAdminId && s.expiresAt > now,
                    );
                    return Promise.resolve(filtered);
                  },
                  then(onFulfilled?: any) {
                    const filtered = mockSessions.filter(
                      (s) => s.adminId === mockAdminId && s.expiresAt > now,
                    );
                    return Promise.resolve(filtered).then(onFulfilled);
                  },
                };
              }

              if (tableName.includes("audit_logs") || tableName === "audit_logs") {
                // If count query
                return {
                  orderBy(_descCol: any) {
                    return {
                      limit(_pageSize: number) {
                        return {
                          offset(_off: number) {
                            return Promise.resolve([...mockAuditLogs]);
                          },
                        };
                      },
                    };
                  },
                  then(onFulfilled?: any) {
                    return Promise.resolve([{ count: mockAuditLogs.length }]).then(onFulfilled);
                  },
                };
              }

              return Promise.resolve([]);
            },
            orderBy(_descCol: any) {
              return {
                limit(_pageSize: number) {
                  return {
                    offset(_off: number) {
                      return Promise.resolve([...mockAuditLogs]);
                    },
                  };
                },
              };
            },
            then(onFulfilled?: any) {
              return Promise.resolve([{ count: mockAuditLogs.length }]).then(onFulfilled);
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
          if (tableName.includes("audit_logs") || tableName === "audit_logs") {
            mockAuditLogs.unshift({
              id: `log-${Date.now()}`,
              adminId: data.adminId || null,
              adminUsername: data.adminUsername || null,
              action: data.action,
              entityType: data.entityType,
              entityId: data.entityId || null,
              metadata: data.metadata || {},
              createdAt: new Date(),
            });
          }
          return Promise.resolve();
        },
      };
    },
    update(tableObj: any) {
      const tableName =
        (tableObj as any)?.[Symbol.for("drizzle:Name")] ||
        tableObj?._?.name ||
        tableObj?.tableName ||
        "";

      return {
        set(data: any) {
          return {
            where() {
              if (tableName.includes("admins") || tableName === "admins") {
                if (data.passwordHash) {
                  currentPasswordHash = data.passwordHash;
                  const idx = mockAdmins.findIndex((a) => a.id === mockAdminId);
                  if (idx >= 0) mockAdmins[idx].passwordHash = data.passwordHash;
                }
              }
              return Promise.resolve();
            },
          };
        },
      };
    },
    delete(tableObj: any) {
      const tableName =
        (tableObj as any)?.[Symbol.for("drizzle:Name")] ||
        tableObj?._?.name ||
        tableObj?.tableName ||
        "";

      return {
        where(_predicate?: any) {
          if (tableName.includes("sessions") || tableName === "sessions") {
            // Can simulate deleting other sessions or target session
            return Promise.resolve();
          }
          return Promise.resolve();
        },
      };
    },
  };

  setMockDb(mockDb as any);

  const validCookies = { [SESSION_COOKIE_NAME]: currentToken };

  // =========================================================================
  // GROUP 1: Security Overview & Safe Account Profile
  // =========================================================================
  console.log("\n--- GROUP 1: Security Overview (GET /api/admin/security) ---");

  // Unauthenticated request
  const unauthReq = createMockReq({ method: "GET" });
  const unauthRes = createMockRes();
  await securityHandler(unauthReq, unauthRes.res);
  assert(unauthRes.getStatus() === 401, "1. Rejects unauthenticated GET /api/admin/security with 401");

  // Authenticated request
  const authReq = createMockReq({ method: "GET", cookies: validCookies });
  const authRes = createMockRes();
  await securityHandler(authReq, authRes.res);

  assert(authRes.getStatus() === 200, "2. Authenticated GET /api/admin/security returns 200 OK");
  const secData = authRes.getBody()?.data;
  assert(
    secData?.account?.username === "smartadmin" && secData?.account?.email === "admin@smartstore.dz",
    "3. Returns safe account profile fields (username, email, status)",
  );

  assert(
    secData?.account?.passwordHash === undefined &&
      secData?.account?.password === undefined &&
      secData?.account?.secret === undefined,
    "4. Never leaks password hash or internal credentials in account overview",
  );

  const secHeaders = authRes.getHeaders()["cache-control"];
  assert(secHeaders?.includes("no-store"), "5. Emits strict no-store Cache-Control headers");

  // =========================================================================
  // GROUP 2: Active Sessions Management
  // =========================================================================
  console.log("\n--- GROUP 2: Active Sessions (GET & DELETE & POST) ---");

  // GET sessions list
  const sessListReq = createMockReq({ method: "GET", cookies: validCookies });
  const sessListRes = createMockRes();
  await sessionsHandler(sessListReq, sessListRes.res);

  assert(sessListRes.getStatus() === 200, "6. GET /api/admin/security/sessions returns 200 OK");
  const sessionsList = sessListRes.getBody()?.data as any[];
  assert(Array.isArray(sessionsList), "7. Returns sessions array");

  // Current session identification
  const currentSessItem = sessionsList.find((s) => s.id === currentSessionId);
  const otherSessItem = sessionsList.find((s) => s.id === secondSessionId);

  assert(currentSessItem?.isCurrent === true, "8. Correctly flags current caller session with isCurrent = true");
  assert(otherSessItem?.isCurrent === false, "9. Other active sessions have isCurrent = false");

  assert(
    currentSessItem?.token === undefined &&
      currentSessItem?.tokenHash === undefined &&
      otherSessItem?.tokenHash === undefined,
    "10. Sessions list strictly conceals token and tokenHash from response",
  );

  // Expired session excluded
  const expiredSessItem = sessionsList.find((s) => s.id === expiredSessionId);
  assert(expiredSessItem === undefined, "11. Expired sessions are completely excluded from active sessions list");

  // CSRF protection on DELETE
  const csrfDelReq = createMockReq({
    method: "DELETE",
    headers: { origin: "https://evil.attacker.com" },
    cookies: validCookies,
    query: { id: secondSessionId },
  });
  const csrfDelRes = createMockRes();
  await sessionsHandler(csrfDelReq, csrfDelRes.res);
  assert(csrfDelRes.getStatus() === 403, "12. Blocks CSRF origin on session deletion with 403 CSRF_ERROR");

  // Cannot revoke current session via DELETE
  const selfRevokeReq = createMockReq({
    method: "DELETE",
    cookies: validCookies,
    query: { id: currentSessionId },
  });
  const selfRevokeRes = createMockRes();
  await sessionsHandler(selfRevokeReq, selfRevokeRes.res);
  assert(
    selfRevokeRes.getStatus() === 400 &&
      selfRevokeRes.getBody()?.code === "CANNOT_REVOKE_CURRENT_SESSION",
    "13. Rejects revoking current session via delete endpoint (requires logout)",
  );

  // Successfully revoke another session
  const revokeOtherReq = createMockReq({
    method: "DELETE",
    cookies: validCookies,
    query: { id: secondSessionId },
  });
  const revokeOtherRes = createMockRes();
  await sessionsHandler(revokeOtherReq, revokeOtherRes.res);
  assert(revokeOtherRes.getStatus() === 200, "14. Successfully revokes another active session with 200 OK");

  // Check that session.revoked was audit logged
  const revokeAudit = mockAuditLogs.find((l) => l.action === "session.revoked");
  assert(
    revokeAudit !== undefined && revokeAudit.entityId === secondSessionId,
    "15. Session revocation records audit event (session.revoked)",
  );

  // Revoke all other sessions (POST)
  const revokeAllReq = createMockReq({
    method: "POST",
    cookies: validCookies,
    body: { action: "revoke_others" },
  });
  const revokeAllRes = createMockRes();
  await sessionsHandler(revokeAllReq, revokeAllRes.res);
  assert(revokeAllRes.getStatus() === 200, "16. Revoke-all-others returns 200 OK");

  // Check audit log for bulk revocation
  const bulkAudit = mockAuditLogs.find((l) => l.action === "session.others_revoked");
  assert(
    bulkAudit !== undefined && bulkAudit.metadata?.currentSessionKept === currentSessionId,
    "17. Bulk revocation logs session.others_revoked preserving current session",
  );

  // =========================================================================
  // GROUP 3: Password Change Policy & Execution
  // =========================================================================
  console.log("\n--- GROUP 3: Password Change (POST /api/auth/change-password) ---");

  // Rejects incorrect current password
  const wrongPassReq = createMockReq({
    method: "POST",
    cookies: validCookies,
    body: {
      currentPassword: "WrongPassword123!",
      newPassword: "BrandNewPassword2026!",
      confirmPassword: "BrandNewPassword2026!",
    },
  });
  const wrongPassRes = createMockRes();
  await changePasswordHandler(wrongPassReq, wrongPassRes.res);
  assert(
    wrongPassRes.getStatus() === 400 && wrongPassRes.getBody()?.code === "INVALID_CURRENT_PASSWORD",
    "18. Rejects incorrect current password with 400 INVALID_CURRENT_PASSWORD",
  );

  // Rejects short new password (< 8 chars)
  const shortPassReq = createMockReq({
    method: "POST",
    cookies: validCookies,
    body: {
      currentPassword: initialPassword,
      newPassword: "short",
      confirmPassword: "short",
    },
  });
  const shortPassRes = createMockRes();
  await changePasswordHandler(shortPassReq, shortPassRes.res);
  assert(shortPassRes.getStatus() === 400, "19. Rejects new password shorter than 8 characters");

  // Rejects mismatched confirm password
  const mismatchReq = createMockReq({
    method: "POST",
    cookies: validCookies,
    body: {
      currentPassword: initialPassword,
      newPassword: "ValidPassword123!",
      confirmPassword: "DifferentPassword123!",
    },
  });
  const mismatchRes = createMockRes();
  await changePasswordHandler(mismatchReq, mismatchRes.res);
  assert(mismatchRes.getStatus() === 400, "20. Rejects mismatched confirm password");

  // Rejects new password identical to current password
  const samePassReq = createMockReq({
    method: "POST",
    cookies: validCookies,
    body: {
      currentPassword: initialPassword,
      newPassword: initialPassword,
      confirmPassword: initialPassword,
    },
  });
  const samePassRes = createMockRes();
  await changePasswordHandler(samePassReq, samePassRes.res);
  assert(samePassRes.getStatus() === 400, "21. Rejects new password identical to current password");

  // Successful password change
  const newSecret = "BrandNewValidPassword2026!";
  const validPassReq = createMockReq({
    method: "POST",
    cookies: validCookies,
    body: {
      currentPassword: initialPassword,
      newPassword: newSecret,
      confirmPassword: newSecret,
    },
  });
  const validPassRes = createMockRes();
  await changePasswordHandler(validPassReq, validPassRes.res);

  assert(validPassRes.getStatus() === 200, "22. Successful password change returns 200 OK");
  assert(validPassRes.getBody()?.ok === true, "23. Password change returns standard {ok: true}");

  // Verify updated hash with bcrypt
  const isNewHashValid = await verifyPassword(newSecret, currentPasswordHash);
  assert(isNewHashValid, "24. Updated password hash correctly verifies with new password");

  const isOldHashValid = await verifyPassword(initialPassword, currentPasswordHash);
  assert(!isOldHashValid, "25. Old password no longer verifies against new hash");

  // Verify auth.password.changed was logged
  const passAudit = mockAuditLogs.find((l) => l.action === "auth.password.changed");
  assert(
    passAudit !== undefined && passAudit.metadata?.otherSessionsRevoked === true,
    "26. Audit log records auth.password.changed with otherSessionsRevoked metadata",
  );

  // =========================================================================
  // GROUP 4: Audit Activity API (GET /api/admin/activity)
  // =========================================================================
  console.log("\n--- GROUP 4: Activity API (GET /api/admin/activity) ---");

  // Unauthenticated request
  const unauthActReq = createMockReq({ method: "GET" });
  const unauthActRes = createMockRes();
  await activityHandler(unauthActReq, unauthActRes.res);
  assert(unauthActRes.getStatus() === 401, "27. Rejects unauthenticated GET /api/admin/activity with 401");

  // Rejects POST (Read-only guarantee)
  const postActReq = createMockReq({ method: "POST", cookies: validCookies });
  const postActRes = createMockRes();
  await activityHandler(postActReq, postActRes.res);
  assert(postActRes.getStatus() === 405, "28. Strictly rejects POST with 405 (Read-only guarantee)");

  // Authenticated list
  const actReq = createMockReq({ method: "GET", cookies: validCookies });
  const actRes = createMockRes();
  await activityHandler(actReq, actRes.res);

  assert(actRes.getStatus() === 200, "29. Authenticated GET /api/admin/activity returns 200 OK");
  const actData = actRes.getBody()?.data;
  assert(Array.isArray(actData?.items), "30. Returns items array");
  assert(
    actData?.pagination?.page === 1 &&
      actData?.pagination?.pageSize === 20 &&
      typeof actData?.pagination?.total === "number",
    "31. Returns structured server-side pagination metadata",
  );

  // Category filtering query
  const catReq = createMockReq({
    method: "GET",
    cookies: validCookies,
    query: { category: "security" },
  });
  const catRes = createMockRes();
  await activityHandler(catReq, catRes.res);
  assert(catRes.getStatus() === 200, "32. Category filtering ?category=security returns 200 OK");

  // Search query
  const searchReq = createMockReq({
    method: "GET",
    cookies: validCookies,
    query: { search: "smartadmin" },
  });
  const searchRes = createMockRes();
  await activityHandler(searchReq, searchRes.res);
  assert(searchRes.getStatus() === 200, "33. Search filtering ?search=smartadmin returns 200 OK");

  // Security check: zero sensitive credentials in audit responses
  const firstItem = actData?.items[0];
  assert(
    firstItem?.password === undefined &&
      firstItem?.passwordHash === undefined &&
      firstItem?.tokenHash === undefined,
    "34. Audit items contain strictly zero password hashes or token secrets",
  );

  // =========================================================================
  // GROUP 5: Locales & Dictionaries (Arabic & French)
  // =========================================================================
  console.log("\n--- GROUP 5: Localization Integrity ---");

  assert(
    typeof ar.admin.security?.title === "string" &&
      typeof fr.admin.security?.title === "string" &&
      typeof ar.admin.security?.passwordTitle === "string" &&
      typeof fr.admin.security?.passwordTitle === "string" &&
      typeof ar.admin.security?.savePassword === "string" &&
      typeof fr.admin.security?.savePassword === "string",
    "35. Both Arabic and French dictionaries contain complete admin.security keys",
  );

  assert(
    typeof ar.admin.security?.revokeAllOthers === "string" &&
      typeof fr.admin.security?.revokeAllOthers === "string" &&
      ar.admin.security.revokeAllOthers.includes("تسجيل الخروج من جميع الجلسات الأخرى") &&
      fr.admin.security.revokeAllOthers.includes("Déconnecter toutes les autres sessions"),
    "36. Exact Arabic and French translations for 'revoke all other sessions'",
  );

  assert(
    typeof ar.admin.activity?.title === "string" &&
      typeof fr.admin.activity?.title === "string" &&
      typeof ar.admin.activity?.refresh === "string" &&
      typeof fr.admin.activity?.refresh === "string",
    "37. Both Arabic and French dictionaries contain complete admin.activity keys",
  );

  assert(
    typeof ar.admin.activity?.security === "string" &&
      typeof fr.admin.activity?.security === "string" &&
      typeof ar.admin.activity?.releases === "string" &&
      typeof fr.admin.activity?.releases === "string",
    "38. Both Arabic and French dictionaries contain category filter labels",
  );

  console.log("\n==================================================");
  console.log(`RESULTS: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runStage12Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
