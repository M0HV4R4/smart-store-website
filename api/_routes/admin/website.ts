import { db } from "../../_lib/db.js";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";
import { verifyCsrfOrigin } from "../../_lib/security.js";
import { validateData } from "../../_lib/validation.js";
import {
  getWebsiteConfig,
  updateWebsiteConfig,
  websiteUpdateZodSchema,
} from "../../_lib/website.js";
import type { ApiRequest, ApiResponse } from "../../_lib/types.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Enforce cache control
  setCacheHeaders(res, "no-store");

  // 2. Allowed methods: GET, PATCH, PUT
  if (!requireMethod(req, res, ["GET", "PATCH", "PUT"])) return;

  const method = (req.method || "").toUpperCase();

  // 3. CSRF origin check for state-mutating requests
  if (method !== "GET" && !verifyCsrfOrigin(req)) {
    sendError(res, "Cross-site request forgery protection triggered. Invalid origin.", 403, "CSRF_ERROR");
    return;
  }

  // 4. Require authenticated admin session
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    // GET: Query current website configuration
    if (method === "GET") {
      const config = await getWebsiteConfig(db);
      sendSuccess(res, config);
      return;
    }

    // PATCH / PUT: Update website configuration
    const validation = validateData(websiteUpdateZodSchema, req.body);
    if (!validation.success) {
      sendError(res, validation.error, 400, "VALIDATION_ERROR", validation.issues);
      return;
    }

    const updated = await updateWebsiteConfig(db, validation.data, auth);
    sendSuccess(res, updated);
  } catch (error) {
    handleApiError(res, error, "Failed to process website configuration");
  }
}

