import type { ApiRequest, ApiResponse, ApiSuccessResponse, ApiErrorResponse } from "./types.js";

/**
 * Sends a standardized JSON success response
 */
export function sendSuccess<T>(
  res: ApiResponse,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): void {
  const payload: ApiSuccessResponse<T> = { ok: true, data };
  if (meta) payload.meta = meta;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(payload);
  } else {
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  }
}

/**
 * Sends a standardized JSON error response
 */
export function sendError(
  res: ApiResponse,
  message: string,
  status = 400,
  code?: string,
  details?: unknown,
): void {
  const payload: ApiErrorResponse = { ok: false, error: message };
  if (code) payload.code = code;
  if (details && process.env.NODE_ENV !== "production") {
    payload.details = details;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(payload);
  } else {
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  }
}

/**
 * Enforces allowed HTTP methods for a serverless endpoint.
 * Returns false and sends 405 if method is disallowed.
 */
export function requireMethod(
  req: ApiRequest,
  res: ApiResponse,
  allowedMethods: string[],
): boolean {
  const method = (req.method || "").toUpperCase();
  const normalizedAllowed = allowedMethods.map((m) => m.toUpperCase());

  if (!normalizedAllowed.includes(method)) {
    res.setHeader("Allow", normalizedAllowed.join(", "));
    sendError(
      res,
      `HTTP method ${method || "UNKNOWN"} not allowed. Allowed methods: ${normalizedAllowed.join(", ")}`,
      405,
      "METHOD_NOT_ALLOWED",
    );
    return false;
  }

  return true;
}

/**
 * Sets appropriate caching headers
 */
export function setCacheHeaders(
  res: ApiResponse,
  mode: "no-store" | "public-cached",
  maxAgeSeconds = 60,
): void {
  if (mode === "no-store") {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else {
    res.setHeader(
      "Cache-Control",
      `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${Math.floor(maxAgeSeconds / 2)}`,
    );
  }
}

/**
 * Catch-all safe API error handler that prevents leaking internal stack traces or SQL details
 */
export function handleApiError(
  res: ApiResponse,
  error: unknown,
  fallbackMessage = "An unexpected server error occurred",
): void {
  console.error("API Error encountered:", error);

  let message = fallbackMessage;
  let status = 500;
  let code = "INTERNAL_SERVER_ERROR";

  if (error instanceof Error) {
    const errLower = error.message.toLowerCase();
    const isDbError =
      errLower.includes("database") ||
      errLower.includes("relation") ||
      errLower.includes("syntax error") ||
      errLower.includes("connection") ||
      errLower.includes("connect") ||
      errLower.includes("econnrefused") ||
      errLower.includes("pool");

    if (isDbError) {
      message = "Database service temporarily unavailable. Please try again shortly.";
      status = 503;
      code = "DATABASE_UNAVAILABLE";
    } else if (process.env.NODE_ENV !== "production") {
      message = error.message;
    }
  }

  sendError(res, message, status, code);
}

