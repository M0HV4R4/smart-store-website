export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  adminUsername: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ActivityResponse {
  items: AuditLogItem[];
  pagination: ActivityPagination;
  categories: string[];
}

export interface ActivityQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export class ActivityApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "ActivityApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Fetches paginated, filtered audit activity logs.
 */
export async function getActivityLogs(query: ActivityQuery = {}): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.search) params.set("search", query.search);

  const url = `/api/admin/activity${params.toString() ? `?${params.toString()}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new ActivityApiError(
      body?.error || "Failed to load audit activity",
      res.status,
      body?.code,
    );
  }

  return body.data as ActivityResponse;
}

