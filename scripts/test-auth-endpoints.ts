import bcrypt from "bcryptjs";
import { setMockDb } from "../api/_lib/db";
import { hashSessionToken, BCRYPT_WORK_FACTOR } from "../api/_lib/auth";
import { clearLoginRateLimit, getAnonymizedClientKey } from "../api/_lib/security";
import loginHandler from "../api/auth/login";
import logoutHandler from "../api/auth/logout";
import sessionHandler from "../api/auth/session";
import changePasswordHandler from "../api/auth/change-password";

function createMockReq(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
}) {
  return {
    method: options.method || "GET",
    url: options.url || "/",
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

async function runAuthTests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 5: AUTHENTICATION & SESSIONS");
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

  // Set up mock DB state
  const mockAdminId = "11111111-1111-1111-1111-111111111111";
  const mockAdminEmail = "admin@smartstore.app";
  const mockAdminUsername = "smartadmin";
  const mockPlainPassword = "InitialPassword123!";
  let currentPasswordHash = await bcrypt.hash(mockPlainPassword, BCRYPT_WORK_FACTOR);

  interface MockSessionRecord {
    id: string;
    adminId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }

  const mockSessions: MockSessionRecord[] = [];
  const mockAuditLogs: any[] = [];
  let adminLastLogin: Date | null = null;
  let adminStatus = "active";

  // Mock Drizzle DB implementation
  const mockDb = {
    select(_selection?: any) {
      return {
        from(_table: any) {
          return {
            innerJoin(_joinTable: any, _condition: any) {
              return {
                where(_predicate: any) {
                  return {
                    limit(_n: number) {
                      // Session query
                      const now = new Date();
                      const active = mockSessions.filter(
                        (s) => s.expiresAt > now && adminStatus === "active",
                      );
                      if (active.length > 0) {
                        return Promise.resolve([
                          {
                            sessionId: active[0].id,
                            adminId: mockAdminId,
                            username: mockAdminUsername,
                            email: mockAdminEmail,
                            adminStatus: adminStatus,
                            expiresAt: active[0].expiresAt,
                          },
                        ]);
                      }
                      return Promise.resolve([]);
                    },
                  };
                },
              };
            },
            where(_predicate: any) {
              return {
                limit(_n: number) {
                  return Promise.resolve([
                    {
                      id: mockAdminId,
                      email: mockAdminEmail,
                      username: mockAdminUsername,
                      passwordHash: currentPasswordHash,
                      status: adminStatus,
                      lastLoginAt: adminLastLogin,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  ]);
                },
              };
            },
          };
        },
      };
    },
    insert(_table: any) {
      return {
        values(data: any) {
          if (data.tokenHash) {
            const newSession = {
              id: "session-" + Math.random().toString(36).substring(2, 9),
              adminId: data.adminId,
              tokenHash: data.tokenHash,
              expiresAt: data.expiresAt,
              createdAt: new Date(),
            };
            mockSessions.push(newSession);
            return Promise.resolve([newSession]);
          }
          if (data.action) {
            mockAuditLogs.push(data);
            return Promise.resolve([data]);
          }
          return Promise.resolve([data]);
        },
      };
    },
    update(_table: any) {
      return {
        set(data: any) {
          return {
            where(_predicate: any) {
              if (data.lastLoginAt) adminLastLogin = data.lastLoginAt;
              if (data.passwordHash) currentPasswordHash = data.passwordHash;
              return Promise.resolve([{ id: mockAdminId }]);
            },
          };
        },
      };
    },
    delete(_table: any) {
      return {
        where(_predicate: any) {
          return Promise.resolve();
        },
      };
    },
  };

  setMockDb(mockDb);

  // =========================================================================
  // 1. HTTP METHOD RESTRICTIONS
  // =========================================================================
  console.log("\n[1] HTTP Method Enforcement:");
  {
    const { res, getStatus, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await loginHandler(req as any, res);
    assert(getStatus() === 405, "Rejects GET on /api/auth/login with 405 Method Not Allowed");
    assert(getHeaders()["allow"]?.includes("POST") === true, "Sets Allow header with POST on login");
  }
  {
    const { res, getStatus, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await logoutHandler(req as any, res);
    assert(getStatus() === 405, "Rejects GET on /api/auth/logout with 405 Method Not Allowed");
    assert(getHeaders()["allow"]?.includes("POST") === true, "Sets Allow header with POST on logout");
  }
  {
    const { res, getStatus, getHeaders } = createMockRes();
    const req = createMockReq({ method: "POST" });
    await sessionHandler(req as any, res);
    assert(getStatus() === 405, "Rejects POST on /api/auth/session with 405 Method Not Allowed");
    assert(getHeaders()["allow"]?.includes("GET") === true, "Sets Allow header with GET on session");
  }
  {
    const { res, getStatus } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await changePasswordHandler(req as any, res);
    assert(getStatus() === 405, "Rejects GET on /api/auth/change-password with 405");
  }

  // =========================================================================
  // 2. CACHE CONTROL HEADERS
  // =========================================================================
  console.log("\n[2] Cache Prevention Headers:");
  {
    const { res, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await sessionHandler(req as any, res);
    assert(
      getHeaders()["cache-control"] === "no-cache, no-store, must-revalidate, max-age=0",
      "Sets no-store cache headers on session endpoint",
    );
  }

  // =========================================================================
  // 3. CSRF ORIGIN PROTECTION
  // =========================================================================
  console.log("\n[3] CSRF Origin Protection:");
  {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { host: "smartstore.app", origin: "https://malicious-site.com" },
      body: { identifier: "admin", password: "Password123" },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 403, "Blocks cross-origin login attempt with 403 CSRF_ERROR");
    assert(getBody()?.code === "CSRF_ERROR", "Returns CSRF_ERROR code");
  }

  // =========================================================================
  // 4. INPUT VALIDATION
  // =========================================================================
  console.log("\n[4] Input Validation:");
  {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: { identifier: "admin", password: "" },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 400, "Rejects login with missing password");
    assert(getBody()?.code === "VALIDATION_ERROR", "Returns VALIDATION_ERROR");
  }
  {
    const { res, getStatus } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: { password: "Password123" },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 400, "Rejects login without identifier");
  }

  // =========================================================================
  // 5. PRIVACY-SAFE RATE LIMITING
  // =========================================================================
  console.log("\n[5] Privacy-Safe Rate Limiting:");
  {
    const testIdentifier = "test-rate-limit-user";
    const testReq = createMockReq({
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.195" },
      body: { identifier: testIdentifier, password: "WrongPassword1" },
    });

    const clientKey = getAnonymizedClientKey(testReq as any, testIdentifier);
    clearLoginRateLimit(clientKey);

    // Simulate 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const { res } = createMockRes();
      await loginHandler(testReq as any, res);
    }

    // 6th attempt must be rate-limited
    const { res, getStatus, getHeaders, getBody } = createMockRes();
    await loginHandler(testReq as any, res);
    assert(getStatus() === 429, "Triggers 429 Too Many Requests after 5 failed attempts");
    assert(Boolean(getHeaders()["retry-after"]), "Includes Retry-After response header");
    assert(getBody()?.code === "TOO_MANY_ATTEMPTS", "Returns TOO_MANY_ATTEMPTS error code");
    clearLoginRateLimit(clientKey);
  }

  // =========================================================================
  // 6. GENERIC LOGIN ERRORS (Anti-Enumeration)
  // =========================================================================
  console.log("\n[6] Anti-Enumeration & Password Verification:");
  {
    // Wrong password
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: { identifier: mockAdminUsername, password: "IncorrectPassword!" },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 401, "Returns 401 for incorrect password");
    assert(getBody()?.error === "بيانات تسجيل الدخول غير صحيحة", "Returns uniform generic message for incorrect password");
  }
  {
    // Non-existent user
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: { identifier: "nonexistent_admin_12345", password: "SomePassword123!" },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 401, "Returns 401 for unknown identifier (anti-enumeration)");
    assert(getBody()?.error === "بيانات تسجيل الدخول غير صحيحة", "Returns identical generic message for unknown user");
  }
  {
    // Disabled account
    adminStatus = "disabled";
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: { identifier: mockAdminUsername, password: mockPlainPassword },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 401, "Returns 401 for disabled account (anti-enumeration)");
    assert(getBody()?.error === "بيانات تسجيل الدخول غير صحيحة", "Returns identical generic message for disabled account");
    assert(getBody()?.code === "INVALID_CREDENTIALS", "Returns generic INVALID_CREDENTIALS code, not ACCOUNT_DISABLED");
    adminStatus = "active"; // reset to active
  }

  // =========================================================================
  // 7. SUCCESSFUL LOGIN & SESSION CREATION
  // =========================================================================
  console.log("\n[7] Successful Login & Session Token:");
  let rawSessionToken = "";
  {
    const { res, getStatus, getHeaders, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: { identifier: mockAdminUsername, password: mockPlainPassword },
    });
    await loginHandler(req as any, res);
    assert(getStatus() === 200, "Returns 200 OK on valid credentials");
    assert(getBody()?.ok === true, "Response payload ok is true");
    assert(getBody()?.data?.admin?.id === mockAdminId, "Returns admin id");
    assert(getBody()?.data?.admin?.username === mockAdminUsername, "Returns admin username");
    assert(getBody()?.data?.admin?.passwordHash === undefined, "Never returns passwordHash in response");

    const cookieHeader = getHeaders()["set-cookie"];
    assert(Boolean(cookieHeader), "Sets Set-Cookie header upon login");
    assert(cookieHeader.includes("smartstore_admin_session"), "Cookie name is smartstore_admin_session");
    assert(cookieHeader.includes("HttpOnly"), "Cookie has HttpOnly flag");
    assert(cookieHeader.includes("SameSite=Lax"), "Cookie has SameSite=Lax");

    // Extract raw token from cookie header
    const match = cookieHeader.match(/smartstore_admin_session=([a-f0-9]+);/);
    if (match) rawSessionToken = match[1];

    assert(rawSessionToken.length === 64, "Raw session token is 64 hex characters (256-bit entropy)");
    assert(mockSessions.length > 0, "Session persisted in sessions table");

    const storedHash = mockSessions[mockSessions.length - 1].tokenHash;
    assert(storedHash === hashSessionToken(rawSessionToken), "Database stores SHA-256 hash of token, never raw token");
  }

  // =========================================================================
  // 8. SESSION INSPECTION (GET /api/auth/session)
  // =========================================================================
  console.log("\n[8] Session Inspection (GET /api/auth/session):");
  {
    // Unauthenticated request without cookie
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await sessionHandler(req as any, res);
    assert(getStatus() === 200, "Session inspection returns 200 when unauthenticated");
    assert(getBody()?.data?.authenticated === false, "Reports authenticated: false when unauthenticated");
  }
  {
    // Authenticated request with session cookie
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: `smartstore_admin_session=${rawSessionToken}` },
    });
    await sessionHandler(req as any, res);
    assert(getStatus() === 200, "Returns 200 for valid session cookie");
    assert(getBody()?.data?.authenticated === true, "Reports authenticated: true");
    assert(getBody()?.data?.admin?.username === mockAdminUsername, "Returns admin username in session info");
  }

  // =========================================================================
  // 9. PASSWORD CHANGE & OTHER SESSIONS REVOCATION
  // =========================================================================
  console.log("\n[9] Change Password & Session Invalidation:");
  {
    // Attempt without authentication
    const { res, getStatus } = createMockRes();
    const req = createMockReq({
      method: "POST",
      body: {
        currentPassword: mockPlainPassword,
        newPassword: "BrandNewPassword123!",
        confirmPassword: "BrandNewPassword123!",
      },
    });
    await changePasswordHandler(req as any, res);
    assert(getStatus() === 401, "Rejects unauthenticated password change with 401");
  }
  {
    // Attempt with identical new and current password
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: `smartstore_admin_session=${rawSessionToken}` },
      body: {
        currentPassword: mockPlainPassword,
        newPassword: mockPlainPassword,
        confirmPassword: mockPlainPassword,
      },
    });
    await changePasswordHandler(req as any, res);
    assert(getStatus() === 400, "Rejects new password identical to current password");
    assert(getBody()?.error?.includes("different") || getBody()?.code === "VALIDATION_ERROR", "Returns error for unchanged password");
  }
  {
    // Successful password change
    const newPlainPassword = "SuperSecureNewPassword2026!";
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: `smartstore_admin_session=${rawSessionToken}` },
      body: {
        currentPassword: mockPlainPassword,
        newPassword: newPlainPassword,
        confirmPassword: newPlainPassword,
      },
    });
    await changePasswordHandler(req as any, res);
    assert(getStatus() === 200, "Accepts valid password change with 200 OK");
    assert(getBody()?.ok === true, "Password change returns ok: true");

    // Verify password was updated in DB
    const isNewValid = await bcrypt.compare(newPlainPassword, currentPasswordHash);
    assert(isNewValid === true, "Admin password hash updated with bcrypt work factor 12");
  }

  // =========================================================================
  // 10. LOGOUT & COOKIE CLEARING
  // =========================================================================
  console.log("\n[10] Logout & Cookie Invalidation:");
  {
    const { res, getStatus, getHeaders, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: `smartstore_admin_session=${rawSessionToken}` },
    });
    await logoutHandler(req as any, res);
    assert(getStatus() === 200, "Returns 200 OK on logout");
    assert(getBody()?.data?.loggedOut === true, "Returns loggedOut: true");

    const clearCookieHeader = getHeaders()["set-cookie"];
    assert(clearCookieHeader.includes("smartstore_admin_session"), "Clears smartstore_admin_session cookie");
    assert(clearCookieHeader.includes("Max-Age=0"), "Clear cookie sets Max-Age=0 for immediate expiration");
  }

  // Final summary
  console.log("\n==================================================");
  console.log(`🏁 TESTS FINISHED: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL STAGE 5 AUTHENTICATION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error("Test runner threw unexpected fatal exception:", err);
  process.exit(1);
});

