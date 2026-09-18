export interface ReleaseRecord {
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
  isCurrent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetReleasesParams {
  platform?: "all" | "windows" | "android";
  status?: "all" | "draft" | "active" | "archived";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedReleasesResponse {
  releases: ReleaseRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DownloadsResponse {
  windows: ReleaseRecord | null;
  android: ReleaseRecord | null;
}

export interface CreateReleasePayload {
  platform: "windows" | "android";
  version: string;
  downloadUrl: string;
  fileSize?: string | null;
  releaseDate?: string;
  releaseNotesAr?: string | null;
  releaseNotesFr?: string | null;
  status?: "draft" | "active" | "archived";
  downloadEnabled?: boolean;
}

export interface UpdateReleasePayload {
  id?: string;
  version?: string;
  downloadUrl?: string;
  fileSize?: string | null;
  releaseDate?: string;
  releaseNotesAr?: string | null;
  releaseNotesFr?: string | null;
  status?: "draft" | "active" | "archived";
  downloadEnabled?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Retrieves the current configured release for Windows and Android
 */
export async function getAdminDownloads(): Promise<DownloadsResponse> {
  const res = await fetch("/api/admin/downloads", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.ok) {
    throw new ApiError(
      payload?.error || "Failed to fetch download configurations",
      res.status,
      payload?.code,
    );
  }

  return payload.data;
}

/**
 * Creates a new release record or publishes a new version
 */
export async function createRelease(
  data: CreateReleasePayload,
): Promise<ReleaseRecord> {
  const res = await fetch("/api/admin/releases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(data),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.ok) {
    throw new ApiError(
      payload?.error || "Failed to create release",
      res.status,
      payload?.code,
      payload?.details,
    );
  }

  return payload.data;
}

/**
 * Updates an existing release record's metadata
 */
export async function updateRelease(
  id: string,
  data: UpdateReleasePayload,
): Promise<ReleaseRecord> {
  const res = await fetch(`/api/admin/releases?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ ...data, id }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.ok) {
    throw new ApiError(
      payload?.error || "Failed to update release",
      res.status,
      payload?.code,
      payload?.details,
    );
  }

  return payload.data;
}

/**
 * Retrieves paginated releases history with optional filtering and search
 */
export async function getAdminReleases(
  params: GetReleasesParams = {},
): Promise<PaginatedReleasesResponse> {
  const searchParams = new URLSearchParams();
  if (params.platform && params.platform !== "all") {
    searchParams.set("platform", params.platform);
  }
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.search && params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.page !== undefined) {
    searchParams.set("page", params.page.toString());
  }
  if (params.pageSize !== undefined) {
    searchParams.set("pageSize", params.pageSize.toString());
  }

  const queryString = searchParams.toString();
  const url = `/api/admin/releases${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.ok) {
    throw new ApiError(
      payload?.error || "Failed to fetch releases",
      res.status,
      payload?.code,
      payload?.details,
    );
  }

  return payload.data;
}

export interface PublicPlatformMeta {
  available: boolean;
  version: string | null;
  fileSize: string | null;
  releaseDate: string | null;
}

export interface PublicDownloadsMeta {
  windows: PublicPlatformMeta;
  android: PublicPlatformMeta;
}

/**
 * Retrieves public download availability and metadata for the website
 */
export async function getPublicDownloadsMeta(): Promise<PublicDownloadsMeta> {
  const res = await fetch("/api/downloads", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.ok) {
    throw new ApiError(
      payload?.error || "Failed to fetch public download metadata",
      res.status,
      payload?.code,
    );
  }

  return payload.data;
}

