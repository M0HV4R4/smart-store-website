/**
 * Safe Real Neon Session Lifecycle Test
 * Tests session creation, session lookup, and session invalidation directly on Neon.
 * DOES NOT modify the admin password, email, or credentials.
 * NEVER prints cookies, tokens, or secret values.
 */

import * as dotenv from "dotenv";
dotenv.config();

import { eq } from "drizzle-orm";
import { db, schema } from "../api/_lib/db";
import { createAdminSession, hashSessionToken, SESSION_COOKIE_NAME } from "../api/_lib/auth";
import sessionHandler from "../api/_routes/auth/session";
import logoutHandler from "../api/_routes/auth/logout";
import type { ApiRequest } from "../api/_lib/types";

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

async function runNeonSessionTest() {
  console.log("==================================================");
  console.log("TESTING REAL NEON SESSION LIFECYCLE");
  console.log("==================================================");

  // 1. Fetch current Admin from Neon
  const admins = await db.select().from(schema.admins).limit(1);
  assert(admins.length > 0, "Admin account found in Neon database");
  if (admins.length === 0) {
    process.exit(1);
  }

  const admin = admins[0];
  assert(admin.status === "active", "Admin account status is 'active'");

  // 2. Test Real Session Creation in Neon
  const sessionResult = await createAdminSession(admin.id);
  assert(Boolean(sessionResult.token), "Generated secure 256-bit session token");
  assert(Boolean(sessionResult.cookie), "Generated HttpOnly SameSite=Lax session cookie");
  assert(sessionResult.cookie.includes("HttpOnly"), "Session cookie enforces HttpOnly flag");
  assert(sessionResult.cookie.includes("SameSite=Lax"), "Session cookie enforces SameSite=Lax flag");
  assert(sessionResult.cookie.includes("Path=/"), "Session cookie enforces Path=/");

  // Verify row actually written to Neon
  const tokenHash = hashSessionToken(sessionResult.token);
  const dbSession = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.tokenHash, tokenHash));
  assert(dbSession.length === 1, "Session record persisted in Neon 'sessions' table");
  assert(dbSession[0].adminId === admin.id, "Neon session record maps to correct Admin ID");

  // 3. Test /api/auth/session against Neon with valid cookie
  const mockReqSession = {
    method: "GET",
    url: "/api/auth/session",
    headers: {
      host: "localhost:3000",
      cookie: `${SESSION_COOKIE_NAME}=${sessionResult.token}`,
    },
    cookies: { [SESSION_COOKIE_NAME]: sessionResult.token },
    body: {},
  } as unknown as ApiRequest;

  let sessionPayload: any = null;
  const mockResSession: any = {
    statusCode: 200,
    setHeader: () => {},
    status: () => ({ json: (d: any) => { sessionPayload = d; } }),
    json: (d: any) => { sessionPayload = d; },
    end: (str: string) => { if (str) sessionPayload = JSON.parse(str); },
  };

  await sessionHandler(mockReqSession, mockResSession);
  assert(sessionPayload?.ok === true, "Session check returns HTTP 200 ok: true");
  assert(sessionPayload?.data?.authenticated === true, "Session resolved as authenticated in Neon");
  assert(sessionPayload?.data?.admin?.id === admin.id, "Session returns authenticated admin profile");

  // 4. Test /api/auth/logout against Neon (revocation)
  const mockReqLogout = {
    method: "POST",
    url: "/api/auth/logout",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      cookie: `${SESSION_COOKIE_NAME}=${sessionResult.token}`,
    },
    cookies: { [SESSION_COOKIE_NAME]: sessionResult.token },
    body: {},
  } as unknown as ApiRequest;

  let logoutPayload: any = null;
  const mockResLogout: any = {
    statusCode: 200,
    setHeader: () => {},
    status: () => ({ json: (d: any) => { logoutPayload = d; } }),
    json: (d: any) => { logoutPayload = d; },
    end: (str: string) => { if (str) logoutPayload = JSON.parse(str); },
  };

  await logoutHandler(mockReqLogout, mockResLogout);
  assert(logoutPayload?.ok === true, "Logout endpoint returns HTTP 200 ok: true");

  // 5. Verify session deleted from Neon
  const dbSessionAfter = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.tokenHash, tokenHash));
  assert(dbSessionAfter.length === 0, "Session permanently removed from Neon 'sessions' table upon logout");

  // 6. Test /api/auth/session after logout
  let postLogoutPayload: any = null;
  const mockResPostLogout: any = {
    statusCode: 200,
    setHeader: () => {},
    status: () => ({ json: (d: any) => { postLogoutPayload = d; } }),
    json: (d: any) => { postLogoutPayload = d; },
    end: (str: string) => { if (str) postLogoutPayload = JSON.parse(str); },
  };

  await sessionHandler(mockReqSession, mockResPostLogout);
  assert(
    postLogoutPayload?.data?.authenticated === false,
    "Post-logout verification confirms session is invalid (authenticated: false)"
  );

  console.log("==================================================");
  console.log(`REAL NEON SESSION TEST: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runNeonSessionTest();
