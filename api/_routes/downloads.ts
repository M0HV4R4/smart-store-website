import { eq, and } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../_lib/response";
import type { ApiRequest, ApiResponse } from "../_lib/types";

export interface PublicPlatformMeta {
  available: boolean;
  version: string | null;
  fileSize: string | null;
  releaseDate: string | null;
}

export interface PublicDownloadsPayload {
  windows: PublicPlatformMeta;
  android: PublicPlatformMeta;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Prevent caching so metadata changes in admin take effect quickly
  setCacheHeaders(res, "no-store");

  // 2. Enforce allowed HTTP method: GET only
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    // 3. Query active releases for both platforms in parallel
    const [windowsReleases, androidReleases] = await Promise.all([
      db
        .select({
          version: schema.releases.version,
          fileSize: schema.releases.fileSize,
          releaseDate: schema.releases.releaseDate,
          downloadEnabled: schema.releases.downloadEnabled,
        })
        .from(schema.releases)
        .where(
          and(
            eq(schema.releases.platform, "windows"),
            eq(schema.releases.status, "active"),
          ),
        )
        .limit(1),
      db
        .select({
          version: schema.releases.version,
          fileSize: schema.releases.fileSize,
          releaseDate: schema.releases.releaseDate,
          downloadEnabled: schema.releases.downloadEnabled,
        })
        .from(schema.releases)
        .where(
          and(
            eq(schema.releases.platform, "android"),
            eq(schema.releases.status, "active"),
          ),
        )
        .limit(1),
    ]);

    const win = windowsReleases[0];
    const andr = androidReleases[0];

    const responseData: PublicDownloadsPayload = {
      windows: {
        available: Boolean(win && win.downloadEnabled),
        version: win?.version ?? null,
        fileSize: win?.fileSize ?? null,
        releaseDate: win?.releaseDate ?? null,
      },
      android: {
        available: Boolean(andr && andr.downloadEnabled),
        version: andr?.version ?? null,
        fileSize: andr?.fileSize ?? null,
        releaseDate: andr?.releaseDate ?? null,
      },
    };

    sendSuccess(res, responseData);
  } catch (error) {
    handleApiError(res, error, "Failed to retrieve public download metadata");
  }
}

