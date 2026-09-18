import { eq, sql, desc } from "drizzle-orm";
import { db, schema } from "../../_lib/db.js";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../../_lib/response.js";
import { requireAdmin } from "../../_lib/auth.js";
import type { ApiRequest, ApiResponse } from "../../_lib/types.js";

export interface ReleaseWithStats {
  id: string;
  platform: "windows" | "android";
  version: string;
  downloadUrl: string;
  fileSize: string | null;
  releaseDate: string;
  releaseNotesAr: string | null;
  releaseNotesFr: string | null;
  status: "draft" | "active" | "archived";
  downloadEnabled: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Prevent caching
  setCacheHeaders(res, "no-store");

  // 2. Enforce GET
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Require admin authentication
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    // Helper to query the current relevant release for a platform
    // Prefers active release; falls back to the latest created release
    const getCurrentPlatformRelease = async (
      platform: "windows" | "android",
    ): Promise<ReleaseWithStats | null> => {
      // 1. Query candidate releases ordered with active first, then newest
      const candidates = await db
        .select()
        .from(schema.releases)
        .where(eq(schema.releases.platform, platform))
        .orderBy(
          sql`CASE WHEN ${schema.releases.status} = 'active' THEN 0 ELSE 1 END`,
          desc(schema.releases.createdAt),
        )
        .limit(1);

      if (candidates.length === 0) {
        return null;
      }

      const release = candidates[0];

      // 2. Query real download count from download_events table
      let downloadCount = 0;
      try {
        const countRes = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.downloadEvents)
          .where(eq(schema.downloadEvents.releaseId, release.id));

        if (countRes.length > 0 && typeof countRes[0].count === "number") {
          downloadCount = countRes[0].count;
        }
      } catch (countErr) {
        console.warn("Could not query download count (non-fatal):", countErr);
      }

      return {
        id: release.id,
        platform: release.platform as "windows" | "android",
        version: release.version,
        downloadUrl: release.downloadUrl,
        fileSize: release.fileSize,
        releaseDate: release.releaseDate,
        releaseNotesAr: release.releaseNotesAr,
        releaseNotesFr: release.releaseNotesFr,
        status: release.status as "draft" | "active" | "archived",
        downloadEnabled: release.downloadEnabled,
        downloadCount,
        createdAt: release.createdAt,
        updatedAt: release.updatedAt,
      };
    };

    const [windowsRelease, androidRelease] = await Promise.all([
      getCurrentPlatformRelease("windows"),
      getCurrentPlatformRelease("android"),
    ]);

    sendSuccess(res, {
      windows: windowsRelease,
      android: androidRelease,
    });
  } catch (error) {
    handleApiError(res, error, "Failed to retrieve download configurations");
  }
}
