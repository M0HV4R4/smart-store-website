import { eq, and } from "drizzle-orm";
import { db, schema } from "./db";
import {
  requireMethod,
  setCacheHeaders,
  sendError,
  handleApiError,
} from "./response";
import { validateDownloadUrl } from "./security";
import type { ApiRequest, ApiResponse } from "./types";

/**
 * Handles public download resolution, privacy-safe tracking event persistence,
 * and secure temporary redirection to the saved validated binary URL.
 *
 * Prevents open redirects by resolving the destination URL exclusively
 * from PostgreSQL release records (never from client parameters).
 */
export async function handlePlatformDownload(
  req: ApiRequest,
  res: ApiResponse,
  platform: "windows" | "android",
): Promise<void> {
  // 1. Ensure zero caching so that every download hit is counted
  setCacheHeaders(res, "no-store");

  // 2. Enforce allowed HTTP method: GET only
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    // 3. Resolve current active and downloadable release from PostgreSQL
    // Single-active release invariant guarantees exactly one active release per platform
    const activeReleases = await db
      .select()
      .from(schema.releases)
      .where(
        and(
          eq(schema.releases.platform, platform),
          eq(schema.releases.status, "active"),
          eq(schema.releases.downloadEnabled, true),
        ),
      )
      .limit(1);

    if (activeReleases.length === 0) {
      sendError(
        res,
        platform === "windows"
          ? "تحميل برنامج Windows غير متاح حاليًا"
          : "تحميل تطبيق Android غير متاح حاليًا",
        404,
        "DOWNLOAD_UNAVAILABLE",
      );
      return;
    }

    const release = activeReleases[0];

    // 4. Validate stored download URL with authoritative security checks
    const urlCheck = validateDownloadUrl(release.downloadUrl);
    if (!urlCheck.valid) {
      console.error(
        `Invalid download URL stored in database for release ${release.id}:`,
        urlCheck.error,
      );
      sendError(
        res,
        "رابط التحميل المعتمد في الخادم غير صالح",
        500,
        "INVALID_CONFIGURED_URL",
      );
      return;
    }

    // 5. Write Before Redirect: Await download event insertion
    // If the database insert fails, do not silently redirect without tracking integrity.
    try {
      await db.insert(schema.downloadEvents).values({
        releaseId: release.id,
        platform: release.platform,
        version: release.version,
      });
    } catch (eventErr) {
      console.error("Failed to record download event:", eventErr);
      sendError(
        res,
        "خدمة التنزيل غير متاحة مؤقتًا. يرجى المحاولة بعد قليل.",
        503,
        "DOWNLOAD_TEMPORARILY_UNAVAILABLE",
      );
      return;
    }

    // 6. Temporary Redirect (HTTP 307 Temporary Redirect)
    // 307 ensures browser maintains GET method and never caches the destination permanently
    res.setHeader("Location", urlCheck.sanitizedUrl);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (typeof res.status === "function") {
      res.status(307).end();
    } else {
      res.statusCode = 307;
      res.end();
    }
  } catch (error) {
    handleApiError(res, error, "Failed to process download request");
  }
}
