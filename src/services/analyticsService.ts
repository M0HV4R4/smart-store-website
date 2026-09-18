export interface AnalyticsSummary {
  totalDownloads: number;
  todayDownloads: number;
  last7DaysDownloads: number;
  last30DaysDownloads: number;
  windowsDownloads: number;
  androidDownloads: number;
}

export interface TimeseriesPoint {
  date: string;
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

export interface AnalyticsSummaryResponseData {
  timezone: string;
  summary: AnalyticsSummary;
  platforms: PlatformBreakdown;
  currentReleases: {
    windows: CurrentReleaseItem | null;
    android: CurrentReleaseItem | null;
  };
}

export class AnalyticsApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "AnalyticsApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Fetches the comprehensive analytics dataset for a selected date range (7d, 30d, 90d).
 */
export async function getAnalytics(
  range: "7d" | "30d" | "90d" = "30d",
): Promise<AnalyticsResponseData> {
  const res = await fetch(`/api/admin/analytics?range=${encodeURIComponent(range)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new AnalyticsApiError(
      body?.error || "Failed to load analytics",
      res.status,
      body?.code,
    );
  }

  return body.data;
}

/**
 * Fetches lightweight summary metrics for the Admin Dashboard.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummaryResponseData> {
  const res = await fetch("/api/admin/analytics/summary", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new AnalyticsApiError(
      body?.error || "Failed to load analytics summary",
      res.status,
      body?.code,
    );
  }

  return body.data;
}

