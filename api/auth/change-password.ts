import { eq } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../_lib/response";
import {
  requireAdmin,
  verifyPassword,
  hashPassword,
  deleteOtherAdminSessions,
} from "../_lib/auth";
import { validateData, changePasswordSchema } from "../_lib/validation";
import { logAudit } from "../_lib/audit";
import type { ApiRequest, ApiResponse } from "../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Enforce cache prevention
  setCacheHeaders(res, "no-store");

  // 2. Restrict to POST
  if (!requireMethod(req, res, ["POST"])) return;

  // 3. Require active admin session (includes CSRF verification)
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  // 4. Validate request body
  const validation = validateData(changePasswordSchema, req.body);
  if (!validation.success) {
    sendError(res, validation.error, 400, "VALIDATION_ERROR", validation.issues);
    return;
  }

  const { currentPassword, newPassword } = validation.data;

  try {
    // 5. Retrieve current admin password hash from database
    const adminRecords = await db
      .select({
        id: schema.admins.id,
        passwordHash: schema.admins.passwordHash,
      })
      .from(schema.admins)
      .where(eq(schema.admins.id, auth.adminId))
      .limit(1);

    if (adminRecords.length === 0) {
      sendError(res, "لم يتم العثور على حساب المسؤول", 404, "ADMIN_NOT_FOUND");
      return;
    }

    const admin = adminRecords[0];

    // 6. Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      sendError(res, "كلمة المرور الحالية غير صحيحة", 400, "INVALID_CURRENT_PASSWORD");
      return;
    }

    // 7. Hash new password with bcrypt work factor 12
    const newPasswordHash = await hashPassword(newPassword);

    // 8. Update database with new password hash
    await db
      .update(schema.admins)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.admins.id, auth.adminId));

    // 9. Invalidate all other sessions belonging to this admin
    // Keeps current session active so the admin remains logged in on this browser
    await deleteOtherAdminSessions(auth.adminId, auth.sessionId);

    // 10. Audit log the password change
    await logAudit({
      adminId: auth.adminId,
      adminUsername: auth.username,
      action: "auth.password.changed",
      entityType: "admin",
      entityId: auth.adminId,
      metadata: {
        otherSessionsRevoked: true,
      },
    });

    // 11. Return success
    sendSuccess(res, {
      message: "تم تحديث كلمة المرور بنجاح وإلغاء الجلسات الأخرى النشطة",
    });
  } catch (error) {
    handleApiError(res, error, "فشل تحديث كلمة المرور");
  }
}

