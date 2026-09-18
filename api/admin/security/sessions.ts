import { eq, and, gt, desc } from "drizzle-orm";
import { db, schema } from "../../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../_lib/response";
import {
  requireAdmin,
  deleteOtherAdminSessions,
  cleanupExpiredSessions,
} from "../../_lib/auth";
import { verifyCsrfOrigin } from "../../_lib/security";
import { logAudit } from "../../_lib/audit";
import type { ApiRequest, ApiResponse } from "../../_lib/types";

// UUID format validation regex (standard 32 hex chars with hyphens)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Strict no-store caching
  setCacheHeaders(res, "no-store");

  // 2. Allowed methods: GET, DELETE, POST
  if (!requireMethod(req, res, ["GET", "DELETE", "POST"])) return;

  const method = (req.method || "").toUpperCase();

  // 3. CSRF origin check for state-mutating requests (DELETE, POST)
  if (method !== "GET" && !verifyCsrfOrigin(req)) {
    sendError(res, "Cross-site request forgery protection triggered. Invalid origin.", 403, "CSRF_ERROR");
    return;
  }

  // 4. Require authenticated admin session
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    // =========================================================================
    // GET: List active sessions for this admin
    // =========================================================================
    if (method === "GET") {
      // Opportunistically purge genuinely expired sessions
      cleanupExpiredSessions().catch(() => {});

      const now = new Date();
      const sessionRows = await db
        .select({
          id: schema.sessions.id,
          createdAt: schema.sessions.createdAt,
          expiresAt: schema.sessions.expiresAt,
        })
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.adminId, auth.adminId),
            gt(schema.sessions.expiresAt, now),
          ),
        )
        .orderBy(desc(schema.sessions.createdAt));

      // Map to safe public session objects (NEVER expose token or tokenHash)
      const safeSessions = sessionRows.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === auth.sessionId,
      }));

      sendSuccess(res, safeSessions);
      return;
    }

    // =========================================================================
    // DELETE: Revoke a specific session
    // =========================================================================
    if (method === "DELETE") {
      // Target session id can come from query (?id=...) or JSON body ({ sessionId: ... })
      const body = req.body as any;
      const rawId = (req.query?.id as string) || body?.sessionId || body?.id;
      const targetId = typeof rawId === "string" ? rawId.trim() : "";

      if (!targetId || !UUID_REGEX.test(targetId)) {
        sendError(res, "معرّف الجلسة غير صالح أو مفقود", 400, "INVALID_SESSION_ID");
        return;
      }

      // Safeguard: Cannot revoke the current session here (standard logout must be used)
      if (targetId === auth.sessionId) {
        sendError(
          res,
          "لا يمكن إنهاء الجلسة الحالية من هنا. استخدم تسجيل الخروج القياسي.",
          400,
          "CANNOT_REVOKE_CURRENT_SESSION",
        );
        return;
      }

      // Ensure session exists and strictly belongs to this admin (cross-admin isolation)
      const existing = await db
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, targetId),
            eq(schema.sessions.adminId, auth.adminId),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        sendError(res, "الجلسة غير موجودة أو منتهية الصلاحية بالفعل", 404, "SESSION_NOT_FOUND");
        return;
      }

      // Delete target session
      await db
        .delete(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, targetId),
            eq(schema.sessions.adminId, auth.adminId),
          ),
        );

      // Audit log the revocation
      await logAudit({
        adminId: auth.adminId,
        adminUsername: auth.username,
        action: "session.revoked",
        entityType: "session",
        entityId: targetId,
      });

      sendSuccess(res, { message: "تم إنهاء الجلسة بنجاح" });
      return;
    }

    // =========================================================================
    // POST: Revoke all other active sessions (preserving current session)
    // =========================================================================
    if (method === "POST") {
      // Revoke all other sessions belonging to this admin
      await deleteOtherAdminSessions(auth.adminId, auth.sessionId);

      // Audit log the bulk revocation
      await logAudit({
        adminId: auth.adminId,
        adminUsername: auth.username,
        action: "session.others_revoked",
        entityType: "session",
        entityId: auth.adminId,
        metadata: {
          currentSessionKept: auth.sessionId,
        },
      });

      sendSuccess(res, { message: "تم إنهاء جميع الجلسات الأخرى بنجاح" });
      return;
    }
  } catch (error) {
    handleApiError(res, error, "فشلت معالجة إدارة الجلسات");
  }
}
