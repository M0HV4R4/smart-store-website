import crypto from "crypto";
import type { ApiRequest } from "./types";
import { downloadUrlSchema, validateData } from "./validation";

// =============================================================================
// 1. DOWNLOAD URL SECURITY VALIDATOR
// =============================================================================
export function validateDownloadUrl(url: unknown): { valid: true; sanitizedUrl: string } | { valid: false; error: string } {
  if (typeof url !== "string") {
    return { valid: false, error: "Download URL must be a non-empty string" };
  }

  const result = validateData(downloadUrlSchema, url.trim());
  if (!result.success) {
    return { valid: false, error: result.error };
  }

  try {
    const parsed = new URL(result.data);
    // Extra safety checks
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS destination URLs are permitted" };
    }
    if (parsed.username || parsed.password) {
      return { valid: false, error: "Embedded credentials in download URLs are forbidden" };
    }

    return { valid: true, sanitizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: "Malformed destination URL" };
  }
}

// =============================================================================
// 2. CSRF & ORIGIN INTEGRITY VERIFIER
// =============================================================================
export function verifyCsrfOrigin(req: ApiRequest): boolean {
  const method = (req.method || "GET").toUpperCase();
  // Safe HTTP read methods don't mutate state
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const originHeader = req.headers["origin"] as string | undefined;
  const refererHeader = req.headers["referer"] as string | undefined;
  const hostHeader = req.headers["host"] as string | undefined;

  if (!hostHeader) return false;

  // Verify Origin header if present
  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      // Origin host must match request host
      return originUrl.host.toLowerCase() === hostHeader.toLowerCase();
    } catch {
      return false;
    }
  }

  // Fallback to Referer header if Origin is not provided
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      return refererUrl.host.toLowerCase() === hostHeader.toLowerCase();
    } catch {
      return false;
    }
  }

  // In production, reject state mutations without Origin/Referer
  return process.env.NODE_ENV !== "production";
}

// =============================================================================
// 3. PRIVACY-SAFE LOGIN RATE LIMITER (In-Memory Sliding Window)
// =============================================================================
// Note: We hash the client IP with a salt so raw IP addresses are NEVER stored.
// This memory store works across warm serverless function invocations without
// requiring an external paid service. For multi-region distributed setups, an
// external KV store (e.g. Upstash Redis) can be dropped in seamlessly.
interface RateLimitEntry {
  attempts: number;
  resetAt: number; // unix timestamp in ms
}

const loginAttempts = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of loginAttempts.entries()) {
    if (entry.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

/**
 * Anonymizes the client identifier (IP + username) using SHA-256
 */
export function getAnonymizedClientKey(req: ApiRequest, identifier: string): string {
  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown-ip";

  const salt = process.env.SESSION_SECRET?.slice(0, 16) || "smartstore_rate_limit_salt";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${rawIp}:${identifier.toLowerCase()}`)
    .digest("hex");
}

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

export function checkLoginRateLimit(
  clientKey: string,
  maxAttempts = 5,
): RateLimitStatus {
  cleanupExpired();

  const now = Date.now();
  const entry = loginAttempts.get(clientKey);

  if (!entry || entry.resetAt <= now) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  if (entry.attempts >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.attempts,
  };
}

export function recordFailedLogin(clientKey: string, windowMinutes = 15): void {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const entry = loginAttempts.get(clientKey);

  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(clientKey, { attempts: 1, resetAt: now + windowMs });
  } else {
    entry.attempts += 1;
  }
}

export function clearLoginRateLimit(clientKey: string): void {
  loginAttempts.delete(clientKey);
}

// =============================================================================
// 4. REQUEST BODY SIZE ENFORCER
// =============================================================================
/**
 * Ensures incoming request body size does not exceed reasonable limits (e.g. 100 KB)
 * to protect serverless memory from abuse.
 */
export function validateRequestBodySize(
  req: ApiRequest,
  maxBytes = 100 * 1024, // 100 KB default
): { valid: boolean; error?: string } {
  const contentLength = req.headers["content-length"];
  if (contentLength) {
    const bytes = parseInt(contentLength as string, 10);
    if (!isNaN(bytes) && bytes > maxBytes) {
      return {
        valid: false,
        error: `Payload too large. Maximum permitted request body size is ${Math.round(maxBytes / 1024)} KB.`,
      };
    }
  }

  // If body is already stringified or buffered
  if (typeof req.body === "string" && Buffer.byteLength(req.body, "utf8") > maxBytes) {
    return {
      valid: false,
      error: `Payload too large. Maximum permitted request body size is ${Math.round(maxBytes / 1024)} KB.`,
    };
  }

  return { valid: true };
}
