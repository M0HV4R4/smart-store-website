import { db } from "../../../_lib/db.js";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../../../_lib/response.js";
import { requireAdmin } from "../../../_lib/auth.js";
import { getTopReleases } from "../../../_lib/analytics.js";
import type { ApiRequest, ApiResponse } from "../../../_lib/types.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Prevent caching
  setCacheHeaders(res, "no-store");

  // 2. Enforce GET
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Require admin authentication
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const topReleases = await getTopReleases(db, 10);

    sendSuccess(res, {
      topReleases,
    });
  } catch (error) {
    handleApiError(res, error, "Failed to compute releases analytics");
  }
}

