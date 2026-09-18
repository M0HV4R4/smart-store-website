import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../_lib/response";
import {
  getSessionTokenFromRequest,
  hashSessionToken,
  createClearSessionCookie,
} from "../_lib/auth";
import type { ApiRequest, ApiResponse } from "../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Enforce cache prevention for dynamic session state
  setCacheHeaders(res, "no-store");

  // 2. Restrict to GET
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Extract session token from cookie
  const rawToken = getSessionTokenFromRequest(req);
  if (!rawToken || rawToken.length < 32) {
    sendSuccess(res, { authenticated: false });
    return;
  }

  try {
    const tokenHash = hashSessionToken(rawToken);
    const now = new Date();

    // 4. Query session and verify admin status
    const results = await db
      .select({
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
      // Clear expired or invalid cookie on client
      res.setHeader("Set-Cookie", createClearSessionCookie());
      sendSuccess(res, { authenticated: false });
      return;
    }

    const admin = results[0];

    // 5. Return active session information (no sensitive fields)
    sendSuccess(res, {
      authenticated: true,
      admin: {
        id: admin.adminId,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    handleApiError(res, error, "Failed to verify session status");
  }
}

