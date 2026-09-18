import { eq, or, and, desc, sql, ilike } from "drizzle-orm";
import { db, schema } from "../../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../../_lib/response";
import { requireAdmin } from "../../_lib/auth";
import type { ApiRequest, ApiResponse } from "../../_lib/types";

const VALID_CATEGORIES = ["all", "auth", "releases", "downloads", "website", "security"] as const;
type ActivityCategory = (typeof VALID_CATEGORIES)[number];

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Strict no-store caching
  setCacheHeaders(res, "no-store");

  // 2. Read-only: Only GET is allowed
  if (!requireMethod(req, res, ["GET"])) return;

  // 3. Require authenticated admin session
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    // 4. Parse query parameters
    const page = Math.max(1, parseInt((req.query?.page as string) || "1", 10) || 1);
    const rawPageSize = parseInt((req.query?.pageSize as string) || "20", 10) || 20;
    const pageSize = Math.min(100, Math.max(1, rawPageSize));

    const rawCategory = ((req.query?.category as string) || "all").toLowerCase().trim();
    const category: ActivityCategory = VALID_CATEGORIES.includes(rawCategory as any)
      ? (rawCategory as ActivityCategory)
      : "all";

    const search = typeof req.query?.search === "string" ? req.query.search.trim().slice(0, 100) : "";

    // 5. Build filter conditions
    const conditions: any[] = [];

    // Category filtering
    if (category === "auth") {
      conditions.push(
        or(
          ilike(schema.auditLogs.action, "auth.%"),
          ilike(schema.auditLogs.action, "admin.login%"),
          eq(schema.auditLogs.action, "admin.password_changed"),
        ),
      );
    } else if (category === "releases") {
      conditions.push(
        or(
          ilike(schema.auditLogs.action, "release.%"),
          eq(schema.auditLogs.entityType, "release"),
        ),
      );
    } else if (category === "downloads") {
      conditions.push(
        or(
          ilike(schema.auditLogs.action, "download.%"),
          eq(schema.auditLogs.entityType, "download"),
        ),
      );
    } else if (category === "website") {
      conditions.push(
        or(
          ilike(schema.auditLogs.action, "website.%"),
          eq(schema.auditLogs.entityType, "content"),
          eq(schema.auditLogs.entityType, "setting"),
        ),
      );
    } else if (category === "security") {
      conditions.push(
        or(
          ilike(schema.auditLogs.action, "session.%"),
          ilike(schema.auditLogs.action, "%password%"),
          eq(schema.auditLogs.entityType, "session"),
        ),
      );
    }

    // Search query filtering (searches in action or adminUsername)
    if (search) {
      conditions.push(
        or(
          ilike(schema.auditLogs.action, `%${search}%`),
          ilike(schema.auditLogs.adminUsername, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 6. Query total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.auditLogs)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;

    // 7. Query paginated records (newest first)
    const records = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        entityId: schema.auditLogs.entityId,
        adminUsername: schema.auditLogs.adminUsername,
        metadata: schema.auditLogs.metadata,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .where(whereClause)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset);

    sendSuccess(res, {
      items: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      categories: VALID_CATEGORIES,
    });
  } catch (error) {
    handleApiError(res, error, "Failed to load audit activity logs");
  }
}
