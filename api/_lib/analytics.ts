import { sql, gte, eq, desc, inArray } from "drizzle-orm";
import { schema } from "./db";

// =============================================================================
// REPORTING TIMEZONE SPECIFICATION: Africa/Algiers (UTC+1)
// Standard offset: +01:00 all year round (no DST in Algeria since 1981)
// =============================================================================
export const REPORTING_TIMEZONE = "Africa/Algiers";

/**
 * Formats a Date into 'YYYY-MM-DD' strictly using Africa/Algiers timezone.
 */
export function getAlgiersDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORTING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Parses an Algiers date string 'YYYY-MM-DD' into a UTC Date representing 00:00:00+01:00.
 */
export function parseAlgiersDateToUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+01:00`);
}

/**
 * Generates an unbroken chronological array of date strings ['YYYY-MM-DD', ...]
 * ending on referenceDate's Algiers date, covering exactly `daysCount` days.
 */
export function generateAlgiersDateSeries(
  daysCount: number,
  referenceDate: Date = new Date(),
): string[] {
  const todayStr = getAlgiersDateString(referenceDate);
  const todayUtcMidnight = parseAlgiersDateToUtc(todayStr);

  const dates: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    // Offset each day by 86,400,000 ms with a 1-hour midday buffer to guarantee stability
    const targetDate = new Date(todayUtcMidnight.getTime() - i * 86400000 + 3600000);
    dates.push(getAlgiersDateString(targetDate));
  }
  return dates;
}

/**
 * Computes the UTC cutoff timestamps for various reporting intervals in Africa/Algiers.
 */
export function getReportingIntervalCutoffs(referenceDate: Date = new Date()) {
  const todayStr = getAlgiersDateString(referenceDate);
  const todayStartUtc = parseAlgiersDateToUtc(todayStr);

  // 7 days inclusive: today and the prior 6 days
  const sevenDaysAgoUtc = new Date(todayStartUtc.getTime() - 6 * 86400000);

  // 30 days inclusive: today and the prior 29 days
  const thirtyDaysAgoUtc = new Date(todayStartUtc.getTime() - 29 * 86400000);

  // 90 days inclusive: today and the prior 89 days
  const ninetyDaysAgoUtc = new Date(todayStartUtc.getTime() - 89 * 86400000);

  return {
    todayStr,
    todayStartUtc,
    sevenDaysAgoUtc,
    thirtyDaysAgoUtc,
    ninetyDaysAgoUtc,
  };
}

// =============================================================================
// INTERFACES
// =============================================================================
export interface AnalyticsSummary {
  totalDownloads: number;
  todayDownloads: number;
  last7DaysDownloads: number;
  last30DaysDownloads: number;
  windowsDownloads: number;
  androidDownloads: number;
}

export interface TimeseriesPoint {
  date: string; // 'YYYY-MM-DD'
  total: number;
  windows: number;
  android: number;
}

export interface PlatformBreakdown {
  windows: number;
  android: number;
  total: number;
  windowsPercentage: number;
  androidPercentage: number;
}

export interface ReleaseAnalyticsItem {
  id: string;
  platform: "windows" | "android";
  version: string;
  status: "draft" | "active" | "archived";
  downloadEnabled: boolean;
  downloadCount: number;
}

export interface CurrentReleaseItem {
  id: string;
  platform: "windows" | "android";
  version: string;
  status: "draft" | "active" | "archived";
  downloadEnabled: boolean;
  downloadCount: number;
  releaseDate: string;
}

export interface RecentDownloadActivityItem {
  id: number;
  platform: "windows" | "android";
  version: string;
  createdAt: string;
}

export interface AnalyticsResponseData {
  timezone: string;
  range: "7d" | "30d" | "90d";
  summary: AnalyticsSummary;
  timeseries: TimeseriesPoint[];
  platforms: PlatformBreakdown;
  topReleases: ReleaseAnalyticsItem[];
  currentReleases: {
    windows: CurrentReleaseItem | null;
    android: CurrentReleaseItem | null;
  };
  recentActivity: RecentDownloadActivityItem[];
}

// =============================================================================
// DATABASE QUERY & AGGREGATION ENGINE
// =============================================================================

/**
 * Computes summary metrics across download_events.
 * Operates efficiently using single-pass conditional aggregation.
 */
export async function getAnalyticsSummary(db: any): Promise<AnalyticsSummary> {
  const cutoffs = getReportingIntervalCutoffs();

  try {
    const result = await db
      .select({
        totalDownloads: sql<number>`count(*)::int`,
        todayDownloads: sql<number>`count(*) filter (where ${schema.downloadEvents.createdAt} >= ${cutoffs.todayStartUtc})::int`,
        last7DaysDownloads: sql<number>`count(*) filter (where ${schema.downloadEvents.createdAt} >= ${cutoffs.sevenDaysAgoUtc})::int`,
        last30DaysDownloads: sql<number>`count(*) filter (where ${schema.downloadEvents.createdAt} >= ${cutoffs.thirtyDaysAgoUtc})::int`,
        windowsDownloads: sql<number>`count(*) filter (where ${schema.downloadEvents.platform} = 'windows')::int`,
        androidDownloads: sql<number>`count(*) filter (where ${schema.downloadEvents.platform} = 'android')::int`,
      })
      .from(schema.downloadEvents);

    const row = result[0] || {};
    return {
      totalDownloads: Number(row.totalDownloads) || 0,
      todayDownloads: Number(row.todayDownloads) || 0,
      last7DaysDownloads: Number(row.last7DaysDownloads) || 0,
      last30DaysDownloads: Number(row.last30DaysDownloads) || 0,
      windowsDownloads: Number(row.windowsDownloads) || 0,
      androidDownloads: Number(row.androidDownloads) || 0,
    };
  } catch (err) {
    // If the database has a mock driver or specific query builder, fallback gracefully
    console.warn("Drizzle conditional filter aggregation fallback:", err);
    throw err;
  }
}

/**
 * Computes platform breakdown percentages and totals from summary.
 */
export function computePlatformBreakdown(summary: AnalyticsSummary): PlatformBreakdown {
  const total = summary.totalDownloads;
  const windows = summary.windowsDownloads;
  const android = summary.androidDownloads;

  const windowsPercentage = total > 0 ? Math.round((windows / total) * 1000) / 10 : 0;
  const androidPercentage = total > 0 ? Math.round((android / total) * 1000) / 10 : 0;

  return {
    windows,
    android,
    total,
    windowsPercentage,
    androidPercentage,
  };
}

/**
 * Generates continuous daily timeseries with ZERO-DAY FILLING for missing days.
 */
export async function getAnalyticsTimeseries(
  db: any,
  range: "7d" | "30d" | "90d",
): Promise<TimeseriesPoint[]> {
  const daysCount = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const dateSeries = generateAlgiersDateSeries(daysCount);
  const cutoffs = getReportingIntervalCutoffs();

  const cutoffUtc =
    range === "7d"
      ? cutoffs.sevenDaysAgoUtc
      : range === "90d"
        ? cutoffs.ninetyDaysAgoUtc
        : cutoffs.thirtyDaysAgoUtc;

  // Initialize zero-filled map for every date in range
  const pointMap = new Map<string, TimeseriesPoint>();
  for (const d of dateSeries) {
    pointMap.set(d, {
      date: d,
      total: 0,
      windows: 0,
      android: 0,
    });
  }

  try {
    const rows = await db
      .select({
        dateStr: sql<string>`to_char(${schema.downloadEvents.createdAt} AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD')`,
        platform: schema.downloadEvents.platform,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.downloadEvents)
      .where(gte(schema.downloadEvents.createdAt, cutoffUtc))
      .groupBy(
        sql`to_char(${schema.downloadEvents.createdAt} AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD')`,
        schema.downloadEvents.platform,
      )
      .orderBy(sql`to_char(${schema.downloadEvents.createdAt} AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD')`);

    for (const r of rows) {
      const dateKey = String(r.dateStr);
      const point = pointMap.get(dateKey);
      if (point) {
        const count = Number(r.count) || 0;
        if (r.platform === "windows") {
          point.windows += count;
        } else if (r.platform === "android") {
          point.android += count;
        }
        point.total = point.windows + point.android;
      }
    }
  } catch (err) {
    console.warn("Timeseries query execution error:", err);
    throw err;
  }

  // Return continuous array sorted chronologically
  return dateSeries.map((d) => pointMap.get(d)!);
}

/**
 * Retrieves top releases by actual download events count.
 * Includes both releases from the releases table and groups events.
 */
export async function getTopReleases(db: any, limit: number = 10): Promise<ReleaseAnalyticsItem[]> {
  try {
    // 1. Fetch all releases to have metadata
    const allReleases = await db
      .select({
        id: schema.releases.id,
        platform: schema.releases.platform,
        version: schema.releases.version,
        status: schema.releases.status,
        downloadEnabled: schema.releases.downloadEnabled,
        createdAt: schema.releases.createdAt,
      })
      .from(schema.releases);

    if (allReleases.length === 0) {
      return [];
    }

    const releaseIds = allReleases.map((r: any) => r.id);

    // 2. Count download events for each releaseId
    const countMap = new Map<string, number>();
    if (releaseIds.length > 0) {
      const counts = await db
        .select({
          releaseId: schema.downloadEvents.releaseId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.downloadEvents)
        .where(inArray(schema.downloadEvents.releaseId, releaseIds))
        .groupBy(schema.downloadEvents.releaseId);

      for (const c of counts) {
        if (c.releaseId) {
          countMap.set(c.releaseId, Number(c.count) || 0);
        }
      }
    }

    // 3. Construct items with actual download counts
    const items: ReleaseAnalyticsItem[] = allReleases.map((r: any) => ({
      id: r.id,
      platform: r.platform as "windows" | "android",
      version: r.version,
      status: r.status as "draft" | "active" | "archived",
      downloadEnabled: Boolean(r.downloadEnabled),
      downloadCount: countMap.get(r.id) || 0,
    }));

    // 4. Sort by real downloadCount descending, then version/recency
    items.sort((a, b) => b.downloadCount - a.downloadCount);

    return items.slice(0, limit);
  } catch (err) {
    console.warn("Top releases query error:", err);
    throw err;
  }
}

/**
 * Retrieves current active release for Windows and Android with live download counts.
 */
export async function getCurrentActiveReleases(db: any): Promise<{
  windows: CurrentReleaseItem | null;
  android: CurrentReleaseItem | null;
}> {
  const getForPlatform = async (platform: "windows" | "android"): Promise<CurrentReleaseItem | null> => {
    const candidates = await db
      .select()
      .from(schema.releases)
      .where(eq(schema.releases.platform, platform))
      .orderBy(
        sql`CASE WHEN ${schema.releases.status} = 'active' THEN 0 ELSE 1 END`,
        desc(schema.releases.createdAt),
      )
      .limit(1);

    if (candidates.length === 0) return null;
    const release = candidates[0];

    // Download count from download_events
    let downloadCount = 0;
    try {
      const countRes = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.downloadEvents)
        .where(eq(schema.downloadEvents.releaseId, release.id));

      if (countRes.length > 0 && typeof countRes[0].count === "number") {
        downloadCount = countRes[0].count;
      }
    } catch {
      // Non-fatal
    }

    return {
      id: release.id,
      platform: release.platform as "windows" | "android",
      version: release.version,
      status: release.status as "draft" | "active" | "archived",
      downloadEnabled: Boolean(release.downloadEnabled),
      downloadCount,
      releaseDate: release.releaseDate,
    };
  };

  const [windows, android] = await Promise.all([
    getForPlatform("windows"),
    getForPlatform("android"),
  ]);

  return { windows, android };
}

/**
 * Retrieves the 10 most recent download events (Strictly privacy-safe: NO IP, NO PII, NO raw URLs).
 */
export async function getRecentActivity(
  db: any,
  limit: number = 10,
): Promise<RecentDownloadActivityItem[]> {
  try {
    const rows = await db
      .select({
        id: schema.downloadEvents.id,
        platform: schema.downloadEvents.platform,
        version: schema.downloadEvents.version,
        createdAt: schema.downloadEvents.createdAt,
      })
      .from(schema.downloadEvents)
      .orderBy(desc(schema.downloadEvents.createdAt))
      .limit(limit);

    return rows.map((r: any) => ({
      id: Number(r.id),
      platform: r.platform as "windows" | "android",
      version: r.version,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    }));
  } catch (err) {
    console.warn("Recent activity query error:", err);
    return [];
  }
}

