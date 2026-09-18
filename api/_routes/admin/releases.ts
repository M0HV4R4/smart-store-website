import { eq, and, ne, sql, desc, ilike, inArray } from "drizzle-orm";
import { db, schema } from "../../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  sendError,
  handleApiError,
} from "../../_lib/response";
import { requireAdmin } from "../../_lib/auth";
import { verifyCsrfOrigin, validateDownloadUrl } from "../../_lib/security";
import {
  validateData,
  releaseInputSchema,
  releaseUpdateSchema,
  releaseQuerySchema,
} from "../../_lib/validation";
import { logAudit } from "../../_lib/audit";
import type { ApiRequest, ApiResponse } from "../../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Prevent caching
  setCacheHeaders(res, "no-store");

  // 2. Enforce allowed methods (GET, POST, PATCH). Disallows DELETE, PUT, etc.
  if (!requireMethod(req, res, ["GET", "POST", "PATCH"])) return;

  const method = (req.method || "").toUpperCase();

  // 3. CSRF origin check for state-mutating requests (POST, PATCH)
  if (method !== "GET" && !verifyCsrfOrigin(req)) {
    sendError(res, "Cross-site request forgery protection triggered. Invalid origin.", 403, "CSRF_ERROR");
    return;
  }

  // 4. Require authenticated admin session
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    // =========================================================================
    // GET — Query Historical Releases (with filters, search, pagination, stats)
    // =========================================================================
    if (method === "GET") {
      const queryValidation = validateData(releaseQuerySchema, req.query);
      if (!queryValidation.success) {
        sendError(res, queryValidation.error, 400, "VALIDATION_ERROR", queryValidation.issues);
        return;
      }

      const { platform, status, search, page, pageSize } = queryValidation.data;
      const offset = (page - 1) * pageSize;

      // Build conditional SQL filters
      const conditions = [];

      if (platform && platform !== "all") {
        conditions.push(eq(schema.releases.platform, platform));
      }

      if (status && status !== "all") {
        conditions.push(eq(schema.releases.status, status));
      }

      if (search && search.trim().length > 0) {
        conditions.push(ilike(schema.releases.version, `%${search.trim()}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 1. Query total count matching the filters
      const countQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.releases);
      const countRes = whereClause ? await countQuery.where(whereClause) : await countQuery;
      const total = countRes.length > 0 && typeof countRes[0].count === "number" ? countRes[0].count : 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      // 2. Query paginated release records (ordered newest first)
      const baseReleasesQuery = db
        .select()
        .from(schema.releases);
      const releasesQuery = whereClause ? baseReleasesQuery.where(whereClause) : baseReleasesQuery;
      const releaseRecords = await releasesQuery
        .orderBy(desc(schema.releases.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 3. Batch query download counts for the returned page
      const countMap = new Map<string, number>();
      const releaseIds = releaseRecords.map((r) => r.id);

      if (releaseIds.length > 0) {
        try {
          const eventCounts = await db
            .select({
              releaseId: schema.downloadEvents.releaseId,
              count: sql<number>`count(*)::int`,
            })
            .from(schema.downloadEvents)
            .where(inArray(schema.downloadEvents.releaseId, releaseIds))
            .groupBy(schema.downloadEvents.releaseId);

          for (const ec of eventCounts) {
            if (ec.releaseId) {
              countMap.set(ec.releaseId, ec.count);
            }
          }
        } catch (countErr) {
          console.warn("Could not batch query download counts (non-fatal):", countErr);
        }
      }

      // 4. Map records with download stats and current release flag
      const formattedReleases = releaseRecords.map((r) => ({
        id: r.id,
        platform: r.platform as "windows" | "android",
        version: r.version,
        downloadUrl: r.downloadUrl,
        fileSize: r.fileSize,
        releaseDate: r.releaseDate,
        releaseNotesAr: r.releaseNotesAr,
        releaseNotesFr: r.releaseNotesFr,
        status: r.status as "draft" | "active" | "archived",
        downloadEnabled: r.downloadEnabled,
        downloadCount: countMap.get(r.id) ?? 0,
        isCurrent: r.status === "active",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      sendSuccess(res, {
        releases: formattedReleases,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
      return;
    }

    // =========================================================================
    // POST — Create New Release / Publish New Version
    // =========================================================================
    if (method === "POST") {
      const validation = validateData(releaseInputSchema, req.body);
      if (!validation.success) {
        sendError(res, validation.error, 400, "VALIDATION_ERROR", validation.issues);
        return;
      }

      const input = validation.data;

      // Authoritative server-side download URL validation
      const urlCheck = validateDownloadUrl(input.downloadUrl);
      if (!urlCheck.valid) {
        sendError(res, urlCheck.error, 400, "INVALID_DOWNLOAD_URL");
        return;
      }

      // Normalization: clean version string
      const cleanVersion = input.version.trim();

      // Transactional single-active release management:
      // If new release is 'active', archive any currently active release for that platform first
      if (input.status === "active") {
        await db
          .update(schema.releases)
          .set({
            status: "archived",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.releases.platform, input.platform),
              eq(schema.releases.status, "active"),
            ),
          );
      }

      // Insert new release record
      const inserted = await db
        .insert(schema.releases)
        .values({
          platform: input.platform,
          version: cleanVersion,
          downloadUrl: urlCheck.sanitizedUrl,
          fileSize: input.fileSize?.trim() || null,
          releaseDate: input.releaseDate || new Date().toISOString().split("T")[0],
          releaseNotesAr: input.releaseNotesAr || null,
          releaseNotesFr: input.releaseNotesFr || null,
          status: input.status,
          downloadEnabled: input.downloadEnabled ?? true,
        })
        .returning();

      const newRelease = inserted[0];

      // Audit log creation
      await logAudit({
        adminId: auth.adminId,
        adminUsername: auth.username,
        action: "release.created",
        entityType: "release",
        entityId: newRelease.id,
        metadata: {
          platform: newRelease.platform,
          version: newRelease.version,
          status: newRelease.status,
          downloadEnabled: newRelease.downloadEnabled,
        },
      });

      sendSuccess(res, newRelease, 201);
      return;
    }

    // =========================================================================
    // PATCH — Update Existing Release Metadata
    // =========================================================================
    if (method === "PATCH") {
      const bodyRecord = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
      const targetId = (req.query?.id as string) || (bodyRecord.id as string);
      if (!targetId || typeof targetId !== "string") {
        sendError(res, "معرّف الإصدار مطلوب (Release ID is required)", 400, "MISSING_ID");
        return;
      }

      const validation = validateData(releaseUpdateSchema, req.body);
      if (!validation.success) {
        sendError(res, validation.error, 400, "VALIDATION_ERROR", validation.issues);
        return;
      }

      const updates = validation.data;

      // Check if release exists
      const existing = await db
        .select()
        .from(schema.releases)
        .where(eq(schema.releases.id, targetId))
        .limit(1);

      if (existing.length === 0) {
        sendError(res, "الإصدار المطلوب غير موجود", 404, "RELEASE_NOT_FOUND");
        return;
      }

      const currentRelease = { ...existing[0] };

      // If downloadUrl was updated, validate strictly
      let sanitizedUrl: string | undefined = undefined;
      if (updates.downloadUrl) {
        const urlCheck = validateDownloadUrl(updates.downloadUrl);
        if (!urlCheck.valid) {
          sendError(res, urlCheck.error, 400, "INVALID_DOWNLOAD_URL");
          return;
        }
        sanitizedUrl = urlCheck.sanitizedUrl;
      }

      // Single-active invariant enforcement:
      // If status is transitioning to 'active' from another status
      if (updates.status === "active" && currentRelease.status !== "active") {
        await db
          .update(schema.releases)
          .set({
            status: "archived",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.releases.platform, currentRelease.platform),
              eq(schema.releases.status, "active"),
              ne(schema.releases.id, targetId),
            ),
          );
      }

      // Build safe update payload
      const updatePayload: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (updates.version !== undefined) updatePayload.version = updates.version.trim();
      if (sanitizedUrl !== undefined) updatePayload.downloadUrl = sanitizedUrl;
      if (updates.fileSize !== undefined) updatePayload.fileSize = updates.fileSize?.trim() || null;
      if (updates.releaseDate !== undefined) updatePayload.releaseDate = updates.releaseDate;
      if (updates.releaseNotesAr !== undefined) updatePayload.releaseNotesAr = updates.releaseNotesAr;
      if (updates.releaseNotesFr !== undefined) updatePayload.releaseNotesFr = updates.releaseNotesFr;
      if (updates.status !== undefined) updatePayload.status = updates.status;
      if (updates.downloadEnabled !== undefined) updatePayload.downloadEnabled = updates.downloadEnabled;

      const updated = await db
        .update(schema.releases)
        .set(updatePayload)
        .where(eq(schema.releases.id, targetId))
        .returning();

      const result = updated[0];

      // Audit logging with specific actions
      let auditAction = "release.updated";
      if (updates.status === "active" && currentRelease.status !== "active") {
        auditAction = "release.activated";
      } else if (updates.status === "archived" && currentRelease.status !== "archived") {
        auditAction = "release.archived";
      } else if (
        updates.downloadEnabled !== undefined &&
        updates.downloadEnabled !== currentRelease.downloadEnabled
      ) {
        auditAction = updates.downloadEnabled ? "download.enabled" : "download.disabled";
      }

      await logAudit({
        adminId: auth.adminId,
        adminUsername: auth.username,
        action: auditAction,
        entityType: "release",
        entityId: result.id,
        metadata: {
          platform: result.platform,
          version: result.version,
          status: result.status,
          downloadEnabled: result.downloadEnabled,
        },
      });

      sendSuccess(res, result);
      return;
    }
  } catch (error) {
    handleApiError(res, error, "Failed to process release request");
  }
}
