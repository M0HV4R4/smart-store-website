import { db, schema } from "./db";

// Blacklist of sensitive keys that MUST NEVER enter audit log metadata
const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "passwordhash",
  "newpassword",
  "currentpassword",
  "confirmpassword",
  "token",
  "token_hash",
  "tokenhash",
  "session_secret",
  "database_url",
  "cookie",
  "authorization",
  "secret",
]);

/**
 * Deeply sanitizes metadata object to guarantee no passwords, hashes,
 * or tokens can ever be stored in the database audit log.
 */
function sanitizeMetadata(data: unknown): unknown {
  if (data === null || data === undefined) return {};
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeMetadata);
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export interface AuditLogParams {
  adminId?: string | null;
  adminUsername?: string | null;
  action: string;
  entityType: "release" | "content" | "setting" | "admin" | "session";
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Server-side audit log helper.
 * Records administrative actions with safe, redacted metadata.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const cleanMeta = sanitizeMetadata(params.metadata);

    await db.insert(schema.auditLogs).values({
      adminId: params.adminId || null,
      adminUsername: params.adminUsername || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      metadata: cleanMeta as Record<string, unknown>,
    });
  } catch (error) {
    // Non-blocking: log error to server console without breaking primary admin transaction
    console.error("Failed to write to audit log:", error);
  }
}

