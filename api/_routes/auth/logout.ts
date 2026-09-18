import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../_lib/response.js";
import {
  getSessionTokenFromRequest,
  deleteSessionByToken,
  createClearSessionCookie,
} from "../../_lib/auth.js";
import { verifyCsrfOrigin } from "../../_lib/security.js";
import { logAudit } from "../../_lib/audit.js";
import type { ApiRequest, ApiResponse } from "../../_lib/types.js";

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

  try {
    // 4. Retrieve session token
    const rawToken = getSessionTokenFromRequest(req);

    if (rawToken && rawToken.length >= 32) {
      await deleteSessionByToken(rawToken);

      await logAudit({
        action: "admin.logout",
        entityType: "session",
        metadata: {
          userAgent: req.headers["user-agent"] ? String(req.headers["user-agent"]).slice(0, 200) : "unknown",
        },
      });
    }

    // 5. Invalidate cookie in client browser
    res.setHeader("Set-Cookie", createClearSessionCookie());

    // 6. Return success
    sendSuccess(res, {
      loggedOut: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    handleApiError(res, error, "حدث خطأ أثناء تسجيل الخروج");
  }
}

