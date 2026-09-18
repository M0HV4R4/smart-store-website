import { eq } from "drizzle-orm";
import { db, schema } from "../../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../_lib/response";
import {
  findAdminByIdentifier,
  verifyPassword,
  createAdminSession,
  cleanupExpiredSessions,
} from "../../_lib/auth";
import {
  verifyCsrfOrigin,
  validateRequestBodySize,
  getAnonymizedClientKey,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "../../_lib/security";
import { validateData, loginSchema } from "../../_lib/validation";
import { logAudit } from "../../_lib/audit";
import type { ApiRequest, ApiResponse } from "../../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Enforce cache prevention
  setCacheHeaders(res, "no-store");

  // 2. Restrict to POST
  if (!requireMethod(req, res, ["POST"])) return;

  // 3. CSRF origin check
  if (!verifyCsrfOrigin(req)) {
    sendError(res, "Cross-site request forgery protection triggered. Invalid origin.", 403, "CSRF_ERROR");
    return;
  }

  // 3.1 Body size limit check
  const sizeCheck = validateRequestBodySize(req);
  if (!sizeCheck.valid) {
    sendError(res, sizeCheck.error || "Payload too large", 413, "PAYLOAD_TOO_LARGE");
    return;
  }

  // 4. Validate input payload
  const validation = validateData(loginSchema, req.body);
  if (!validation.success) {
    sendError(res, validation.error, 400, "VALIDATION_ERROR", validation.issues);
    return;
  }

  const { identifier, password } = validation.data;

  // 5. Rate limiting check (In-memory privacy-safe sliding window)
  const clientKey = getAnonymizedClientKey(req, identifier);
  const rateLimit = checkLoginRateLimit(clientKey);
  if (!rateLimit.allowed) {
    if (rateLimit.retryAfterSeconds) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    }
    sendError(
      res,
      `تم تجاوز الحد الأقصى لمحاولات الدخول. يرجى المحاولة مرة أخرى بعد ${rateLimit.retryAfterSeconds} ثانية.`,
      429,
      "TOO_MANY_ATTEMPTS",
      { retryAfterSeconds: rateLimit.retryAfterSeconds },
    );
    return;
  }

  try {
    // 6. Look up administrator
    const admin = await findAdminByIdentifier(identifier);

    if (!admin) {
      recordFailedLogin(clientKey);
      // Uniform generic error prevents username enumeration
      sendError(res, "بيانات تسجيل الدخول غير صحيحة", 401, "INVALID_CREDENTIALS");
      return;
    }

    // 7. Verify administrator status (Uniform error prevents account existence leakage)
    if (admin.status !== "active") {
      recordFailedLogin(clientKey);
      sendError(res, "بيانات تسجيل الدخول غير صحيحة", 401, "INVALID_CREDENTIALS");
      return;
    }

    // 8. Verify password hash using bcrypt
    const passwordValid = await verifyPassword(password, admin.passwordHash);
    if (!passwordValid) {
      recordFailedLogin(clientKey);
      sendError(res, "بيانات تسجيل الدخول غير صحيحة", 401, "INVALID_CREDENTIALS");
      return;
    }

    // 9. Successful authentication
    clearLoginRateLimit(clientKey);

    // Opportunistic session cleanup (non-blocking)
    cleanupExpiredSessions().catch(() => {});

    // Create fresh session with 256-bit entropy token (session fixation defense)
    const session = await createAdminSession(admin.id);

    // Update admin lastLoginAt & updatedAt timestamps
    await db
      .update(schema.admins)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.admins.id, admin.id));

    // Audit log (passwords/tokens are never included)
    await logAudit({
      adminId: admin.id,
      adminUsername: admin.username,
      action: "admin.login",
      entityType: "admin",
      entityId: admin.id,
      metadata: {
        userAgent: req.headers["user-agent"] ? String(req.headers["user-agent"]).slice(0, 200) : "unknown",
      },
    });

    // Set secure HttpOnly cookie
    res.setHeader("Set-Cookie", session.cookie);

    // Return authenticated admin details (no sensitive fields)
    sendSuccess(res, {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    handleApiError(res, error, "فشل تسجيل الدخول");
  }
}

