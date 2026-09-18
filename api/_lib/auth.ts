import crypto from "crypto";
import bcrypt from "bcryptjs";
import { parseCookie, stringifySetCookie } from "cookie";
import { eq, ne, and, gt, lt, or, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { verifyCsrfOrigin, validateRequestBodySize } from "./security";
import { sendError, handleApiError } from "./response";
import type { ApiRequest, ApiResponse, AuthContext } from "./types";

export const SESSION_COOKIE_NAME = "smartstore_admin_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const BCRYPT_WORK_FACTOR = 12;

// =============================================================================
// 1. CRYPTOGRAPHIC TOKEN PRIMITIVES
// =============================================================================
export function generateSessionToken(): string {
  // 32 cryptographically secure random bytes = 256 bits of entropy
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// =============================================================================
// 2. COOKIE HELPERS
// =============================================================================
export function getSessionTokenFromRequest(req: ApiRequest): string | null {
  if (req.cookies && typeof req.cookies[SESSION_COOKIE_NAME] === "string") {
    return req.cookies[SESSION_COOKIE_NAME] || null;
  }

  const rawCookieHeader = (req.headers["cookie"] as string) || "";
  if (!rawCookieHeader) return null;

  try {
    const parsed = parseCookie(rawCookieHeader);
    return parsed[SESSION_COOKIE_NAME] || null;
  } catch {
    return null;
  }
}

export function createSessionCookie(token: string, maxAgeSeconds = SESSION_TTL_SECONDS): string {
  const isProduction = process.env.NODE_ENV === "production";

  return stringifySetCookie({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function createClearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === "production";

  return stringifySetCookie({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

// =============================================================================
// 3. PASSWORD UTILITIES
// =============================================================================
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_WORK_FACTOR);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// =============================================================================
// 4. AUTHORIZATION GUARD: requireAdmin
// =============================================================================
export async function requireAdmin(
  req: ApiRequest,
  res: ApiResponse,
): Promise<AuthContext | null> {
  // Enforce CSRF Origin verification on state-changing requests
  if (!verifyCsrfOrigin(req)) {
    sendError(res, "Cross-site request forgery protection triggered. Request origin invalid.", 403, "CSRF_ERROR");
    return null;
  }

  // Enforce request body size limits on state-changing requests
  const method = (req.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const sizeCheck = validateRequestBodySize(req);
    if (!sizeCheck.valid) {
      sendError(res, sizeCheck.error || "Payload too large", 413, "PAYLOAD_TOO_LARGE");
      return null;
    }
  }

  const rawToken = getSessionTokenFromRequest(req);
  if (!rawToken || rawToken.length < 32) {
    sendError(res, "Authentication required. No active session found.", 401, "UNAUTHORIZED");
    return null;
  }

  try {
    const tokenHash = hashSessionToken(rawToken);
    const now = new Date();

    // Query database for active, unexpired session and associated active admin
    const results = await db
      .select({
        sessionId: schema.sessions.id,
        expiresAt: schema.sessions.expiresAt,
        adminId: schema.admins.id,
        username: schema.admins.username,
        email: schema.admins.email,
        adminStatus: schema.admins.status,
      })
      .from(schema.sessions)
      .innerJoin(schema.admins, eq(schema.sessions.adminId, schema.admins.id))
      .where(
        and(
          eq(schema.sessions.tokenHash, tokenHash),
          gt(schema.sessions.expiresAt, now),
          eq(schema.admins.status, "active"),
        ),
      )
      .limit(1);

    if (results.length === 0) {
      // Clear stale/invalid cookie
      res.setHeader("Set-Cookie", createClearSessionCookie());
      sendError(res, "Session has expired or is invalid. Please log in again.", 401, "SESSION_EXPIRED");
      return null;
    }

    const session = results[0];

    return {
      adminId: session.adminId,
      username: session.username,
      email: session.email,
      sessionId: session.sessionId,
    };
  } catch (error) {
    handleApiError(res, error, "Failed to authenticate session");
    return null;
  }
}

// =============================================================================
// 5. SESSION & ADMIN LIFECYCLE MANAGEMENT
// =============================================================================

/**
 * Looks up an administrator by email OR username (case-insensitive)
 */
export async function findAdminByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  const results = await db
    .select()
    .from(schema.admins)
    .where(
      or(
        eq(sql`lower(${schema.admins.email})`, normalized),
        eq(sql`lower(${schema.admins.username})`, normalized),
      ),
    )
    .limit(1);

  return results[0] || null;
}

/**
 * Creates a new authenticated session for an admin.
 * Enforces session fixation prevention by issuing a fresh 256-bit token.
 * Only the SHA-256 hash is persisted in the database.
 */
export async function createAdminSession(adminId: string): Promise<{
  token: string;
  cookie: string;
  expiresAt: Date;
}> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.insert(schema.sessions).values({
    adminId,
    tokenHash,
    expiresAt,
  });

  const cookie = createSessionCookie(token);
  return { token, cookie, expiresAt };
}

/**
 * Deletes a session by its raw session token (e.g. upon user logout)
 */
export async function deleteSessionByToken(token: string): Promise<boolean> {
  if (!token || token.length < 32) return false;
  const tokenHash = hashSessionToken(token);
  await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
  return true;
}

/**
 * Deletes all other active sessions for an admin, keeping the current session intact.
 * Used during password change so all other active sessions are revoked.
 */
export async function deleteOtherAdminSessions(
  adminId: string,
  currentSessionId: string,
): Promise<void> {
  await db
    .delete(schema.sessions)
    .where(
      and(
        eq(schema.sessions.adminId, adminId),
        ne(schema.sessions.id, currentSessionId),
      ),
    );
}

/**
 * Opportunistically cleans up expired sessions to keep the database lean.
 * Safe and non-blocking.
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  } catch (err) {
    console.error("Session cleanup error (non-fatal):", err);
  }
}

