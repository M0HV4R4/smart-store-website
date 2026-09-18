/**
 * Smart Store Central API Router
 * Unified router that dispatches incoming requests to canonical handlers.
 * Fits entire backend into Vercel Hobby serverless limits (1-2 functions).
 */

import { parseCookie } from "cookie";
import type { ApiRequest, ApiResponse } from "../_lib/types";

// Import canonical route handlers
import loginHandler from "./auth/login";
import logoutHandler from "./auth/logout";
import sessionHandler from "./auth/session";
import changePasswordHandler from "./auth/change-password";
import releasesHandler from "./admin/releases";
import downloadsHandler from "./admin/downloads";
import analyticsHandler from "./admin/analytics/index";
import analyticsSummaryHandler from "./admin/analytics/summary";
import analyticsTimeseriesHandler from "./admin/analytics/timeseries";
import analyticsReleasesHandler from "./admin/analytics/releases";
import websiteHandler from "./admin/website";
import securityHandler from "./admin/security/index";
import securitySessionsHandler from "./admin/security/sessions";
import activityHandler from "./admin/activity/index";
import publicDownloadsMetaHandler from "./downloads";
import winDownloadHandler from "./download/windows";
import androidDownloadHandler from "./download/android";
import contactHandler from "./site/contact";

async function rootHealthHandler(_req: ApiRequest, res: ApiResponse): Promise<void> {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
      name: "Smart Store API",
      status: "healthy",
      timestamp: new Date().toISOString(),
    })
  );
}

// Canonical route dispatch table
export const apiRoutes: Record<string, (req: ApiRequest, res: ApiResponse) => Promise<void>> = {
  "/api": rootHealthHandler,
  "/api/auth/login": loginHandler,
  "/api/auth/logout": logoutHandler,
  "/api/auth/session": sessionHandler,
  "/api/auth/change-password": changePasswordHandler,
  "/api/admin/releases": releasesHandler,
  "/api/admin/downloads": downloadsHandler,
  "/api/admin/analytics": analyticsHandler,
  "/api/admin/analytics/summary": analyticsSummaryHandler,
  "/api/admin/analytics/timeseries": analyticsTimeseriesHandler,
  "/api/admin/analytics/releases": analyticsReleasesHandler,
  "/api/admin/website": websiteHandler,
  "/api/admin/security": securityHandler,
  "/api/admin/security/sessions": securitySessionsHandler,
  "/api/admin/activity": activityHandler,
  "/api/downloads": publicDownloadsMetaHandler,
  "/api/download/windows": winDownloadHandler,
  "/api/download/android": androidDownloadHandler,
  "/api/site/contact": contactHandler,
};

/**
 * Resolves the canonical /api/... path from request query, headers, or URL
 */
export function resolveRoutePath(req: ApiRequest): string {
  // 1. Dynamic route parameter from Vercel catch-all (...route or ...path)
  const routeParam = req.query?.route || req.query?.path;
  if (routeParam) {
    const segments = Array.isArray(routeParam) ? routeParam : [routeParam];
    const cleanSegments = segments.filter(Boolean);
    if (cleanSegments.length > 0) {
      return `/api/${cleanSegments.join("/")}`.replace(/\/+/g, "/").replace(/\/+$/, "");
    }
  }

  // 2. Header clues from Vercel edge / rewrites
  const matchedHeader = (req.headers["x-matched-path"] as string) || (req.headers["x-forwarded-uri"] as string);
  if (matchedHeader && matchedHeader.startsWith("/api") && !matchedHeader.includes("[")) {
    return matchedHeader.split("?")[0].replace(/\/+$/, "");
  }

  // 3. Fallback to raw URL parsing
  try {
    const parsed = new URL(req.url || "/", "http://localhost");
    let pathname = parsed.pathname;
    if (!pathname.startsWith("/api")) {
      pathname = `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    }
    const clean = pathname.replace(/\/+/g, "/").replace(/\/+$/, "");
    return clean || "/api";
  } catch {
    return "/api";
  }
}

/**
 * Main router handler to execute in Vercel Serverless Functions
 */
export default async function routerHandler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const targetPath = resolveRoutePath(req);

  // Clean up internal routing parameters from req.query so handlers receive pure query params
  if (req.query && ("route" in req.query || "path" in req.query)) {
    const restQuery = { ...req.query };
    delete restQuery.route;
    delete restQuery.path;
    req.query = restQuery;
  }

  // Ensure req.cookies is populated
  if (!req.cookies && req.headers.cookie) {
    try {
      req.cookies = parseCookie(req.headers.cookie);
    } catch {
      req.cookies = {};
    }
  }

  const handler = apiRoutes[targetPath];

  if (!handler) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: false,
        error: "API route not found",
        code: "NOT_FOUND",
        path: targetPath,
      })
    );
    return;
  }

  try {
    await handler(req, res);
  } catch (err: unknown) {
    console.error(`Unhandled error in API handler for ${targetPath}:`, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: false,
          error: "Internal server error",
          code: "INTERNAL_ERROR",
        })
      );
    }
  }
}
