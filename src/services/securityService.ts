export interface AccountOverview {
  id: string;
  username: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  activeSessionCount: number;
}

export interface SecurityPolicy {
  minPasswordLength: number;
  maxPasswordLength: number;
  sessionTtlDays: number;
}

export interface SecurityOverviewData {
  account: AccountOverview;
  policy: SecurityPolicy;
}

export interface AdminSessionRecord {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class SecurityApiError extends Error {
  statusCode: number;
  code?: string;
  issues?: Array<{ message: string; path?: Array<string | number> }>;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    issues?: Array<{ message: string; path?: Array<string | number> }>,
  ) {
    super(message);
    this.name = "SecurityApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.issues = issues;
  }
}

/**
 * Fetches the admin account overview and security policy.
 */
export async function getSecurityOverview(): Promise<SecurityOverviewData> {
  const res = await fetch("/api/admin/security", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SecurityApiError(
      body?.error || "Failed to load security overview",
      res.status,
      body?.code,
    );
  }

  return body.data as SecurityOverviewData;
}

/**
 * Fetches all active sessions for the current admin.
 */
export async function getActiveSessions(): Promise<AdminSessionRecord[]> {
  const res = await fetch("/api/admin/security/sessions", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SecurityApiError(
      body?.error || "Failed to load active sessions",
      res.status,
      body?.code,
    );
  }

  return body.data as AdminSessionRecord[];
}

/**
 * Revokes a specific active session.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const res = await fetch(`/api/admin/security/sessions?id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ sessionId }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SecurityApiError(
      body?.error || "Failed to revoke session",
      res.status,
      body?.code,
    );
  }
}

/**
 * Revokes all other active sessions, preserving the current session.
 */
export async function revokeAllOtherSessions(): Promise<void> {
  const res = await fetch("/api/admin/security/sessions", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ action: "revoke_others" }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SecurityApiError(
      body?.error || "Failed to revoke other sessions",
      res.status,
      body?.code,
    );
  }
}

/**
 * Changes the admin password.
 */
export async function changeAdminPassword(
  payload: ChangePasswordPayload,
): Promise<{ message: string }> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SecurityApiError(
      body?.error || "Failed to change password",
      res.status,
      body?.code,
      body?.issues,
    );
  }

  return body.data as { message: string };
}

