import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "../../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../_lib/response";
import { requireAdmin, SESSION_TTL_SECONDS } from "../../_lib/auth";
import type { ApiRequest, ApiResponse } from "../../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Strict no-store caching
  setCacheHeaders(res, "no-store");

  // 2. Allow only GET
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Authenticated admin check
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    // Query admin profile details (safe fields only: no password hash, no secret)
    const adminRows = await db
      .select({
        id: schema.admins.id,
        username: schema.admins.username,
        email: schema.admins.email,
        status: schema.admins.status,
        createdAt: schema.admins.createdAt,
        lastLoginAt: schema.admins.lastLoginAt,
      })
      .from(schema.admins)
      .where(eq(schema.admins.id, auth.adminId))
      .limit(1);

    if (adminRows.length === 0) {
      sendError(res, "Admin account not found", 404, "ADMIN_NOT_FOUND");
      return;
    }

    const admin = adminRows[0];

    // Query count of active unexpired sessions for this admin
    const activeSessions = await db
      .select({
        id: schema.sessions.id,
      })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.adminId, auth.adminId),
          gt(schema.sessions.expiresAt, new Date()),
        ),
      );

    sendSuccess(res, {
      account: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
        activeSessionCount: activeSessions.length,
      },
      policy: {
        minPasswordLength: 8,
        maxPasswordLength: 255,
        sessionTtlDays: Math.round(SESSION_TTL_SECONDS / 86400),
      },
    });
  } catch (error) {
    handleApiError(res, error, "Failed to load security overview");
  }
}
