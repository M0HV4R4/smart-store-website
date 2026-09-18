import { db } from "../../../_lib/db.js";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../../_lib/response.js";
import { requireAdmin } from "../../../_lib/auth.js";
import {
  REPORTING_TIMEZONE,
  getAnalyticsTimeseries,
} from "../../../_lib/analytics.js";
import type { ApiRequest, ApiResponse } from "../../../_lib/types.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Prevent caching
  setCacheHeaders(res, "no-store");

  // 2. Enforce GET
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Require admin authentication
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  // 4. Validate range
  const rawRange = req.query?.range;
  const range: "7d" | "30d" | "90d" =
    typeof rawRange === "string" && rawRange.length > 0
      ? (rawRange as "7d" | "30d" | "90d")
      : "30d";

  if (range !== "7d" && range !== "30d" && range !== "90d") {
    sendError(res, "Invalid range. Allowed values: 7d, 30d, 90d", 400, "VALIDATION_ERROR");
    return;
  }

  try {
    const timeseries = await getAnalyticsTimeseries(db, range);

    sendSuccess(res, {
      timezone: REPORTING_TIMEZONE,
      range,
      timeseries,
    });
  } catch (error) {
    handleApiError(res, error, "Failed to compute analytics timeseries");
  }
}

