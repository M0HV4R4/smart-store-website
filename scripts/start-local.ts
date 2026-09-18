/**
 * Smart Store Local Full-Stack Runtime Server
 * Serves compiled production frontend (dist/) with Vercel security headers & SPA routing,
 * and mounts the unified Vercel Serverless Function API router connected directly to Neon PostgreSQL.
 */

import * as dotenv from "dotenv";
dotenv.config();

import http from "http";
import fs from "fs";
import path from "path";
import { parseCookie } from "cookie";

// Import unified API router
import routerHandler from "../api/_routes/router";
import type { ApiRequest, ApiResponse } from "../api/_lib/types";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

if (!fs.existsSync(distDir)) {
  console.error("❌ 'dist/' directory does not exist. Please run 'npm run build' first.");
  process.exit(1);
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (req, res) => {
  // 1. Global Vercel Security Headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );

  const url = new URL(req.url || "/", `http://${req.headers.host || `localhost:${PORT}`}`);
  const pathname = url.pathname;

  // 2. Handle API Routes via Unified Router
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", async () => {
      let parsedBody: any = {};
      if (rawBody.trim()) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = rawBody;
        }
      }

      const cookies = parseCookie(req.headers["cookie"] || "");

      // Decorate request
      const apiReq = req as unknown as ApiRequest;
      apiReq.body = parsedBody;
      apiReq.cookies = cookies;
      apiReq.query = Object.fromEntries(url.searchParams.entries());

      // Decorate response
      const apiRes = res as unknown as ApiResponse;
      apiRes.status = function (code: number) {
        this.statusCode = code;
        return this;
      };
      apiRes.json = function (data: any) {
        this.setHeader("Content-Type", "application/json; charset=utf-8");
        this.end(JSON.stringify(data));
        return this;
      };
      apiRes.redirect = function (statusOrUrl: number | string, optUrl?: string) {
        let status = 307;
        let dest = "";
        if (typeof statusOrUrl === "number") {
          status = statusOrUrl;
          dest = optUrl || "/";
        } else {
          dest = statusOrUrl;
        }
        this.statusCode = status;
        this.setHeader("Location", dest);
        this.end();
        return this;
      };

      try {
        await routerHandler(apiReq, apiRes);
      } catch (err: unknown) {
        console.error(`API Error on ${pathname}:`, err);
        if (!res.headersSent) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: "Internal server error", code: "INTERNAL_ERROR" }));
        }
      }
    });

    return;
  }

  // 3. Static Assets & SPA Fallback from dist/
  let filePath = path.join(distDir, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    // SPA Fallback
    filePath = path.join(distDir, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200);
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("==================================================");
  console.log("🚀 SMART STORE LOCAL SERVER IS READY");
  console.log("==================================================");
  console.log(`Public Website:       http://localhost:${PORT}/`);
  console.log(`Admin Login:          http://localhost:${PORT}/admin/login`);
  console.log(`Admin Dashboard:      http://localhost:${PORT}/admin`);
  console.log(`Database Backend:     Neon PostgreSQL (Connected)`);
  console.log("==================================================");
});
