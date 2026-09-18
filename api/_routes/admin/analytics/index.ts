import { db } from "../../../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../../_lib/response";
import { requireAdmin } from "../../../_lib/auth";
import {
  REPORTING_TIMEZONE,
  getAnalyticsSummary,
  computePlatformBreakdown,
  getAnalyticsTimeseries,
  getTopReleases,
  getCurrentActiveReleases,
  getRecentActivity,
  type AnalyticsResponseData,
} from "../../../_lib/analytics";
import type { ApiRequest, ApiResponse } from "../../../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Prevent caching
  setCacheHeaders(res, "no-store");

  // 2. Enforce GET
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Require admin authentication
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  // 4. Validate range parameter
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
    // 5. Query analytics aggregates concurrently
    const [summary, timeseries, topReleases, currentReleases, recentActivity] = await Promise.all([
      getAnalyticsSummary(db),
      getAnalyticsTimeseries(db, range),
      getTopReleases(db, 10),
      getCurrentActiveReleases(db),
      getRecentActivity(db, 10),
    ]);

    const platforms = computePlatformBreakdown(summary);

    const data: AnalyticsResponseData = {
      timezone: REPORTING_TIMEZONE,
      range,
      summary,
      timeseries,
      platforms,
      topReleases,
      currentReleases,
      recentActivity,
    };

    sendSuccess(res, data);
  } catch (error) {
    handleApiError(res, error, "Failed to compute analytics");
  }
}

