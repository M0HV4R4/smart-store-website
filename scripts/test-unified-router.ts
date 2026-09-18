/**
 * Verification test for Smart Store Unified API Router
 * Validates catch-all dispatching, route normalization, query cleanup,
 * and canonical endpoint execution across all API domains.
 */

import routerHandler, { resolveRoutePath, apiRoutes } from "../api/_routes/router.js";
import { setMockDb } from "../api/_lib/db.js";
import type { ApiRequest, ApiResponse } from "../api/_lib/types.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

function createMockReq(options: {
  method?: string;
  url?: string;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
}): ApiRequest {
  return {
    method: options.method || "GET",
    url: options.url || "/",
    query: options.query || {},
    headers: options.headers || { host: "localhost:3000" },
    cookies: options.cookies,
    body: options.body || {},
  } as unknown as ApiRequest;
}

function createMockRes(): {
  res: ApiResponse;
  getStatus: () => number;
  getBody: () => any;
  getHeaders: () => Record<string, string>;
} {
  let statusCode = 200;
  let bodyData: any = null;
  const headers: Record<string, string> = {};

  const res: any = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      bodyData = data;
      return this;
    },
    end(data?: any) {
      if (data && typeof data === "string") {
        try {
          bodyData = JSON.parse(data);
        } catch {
          bodyData = data;
        }
      }
      return this;
    },
    redirect(statusOrUrl: number | string, optUrl?: string) {
      if (typeof statusOrUrl === "number") {
        statusCode = statusOrUrl;
        headers["location"] = optUrl || "/";
      } else {
        statusCode = 307;
        headers["location"] = statusOrUrl;
      }
      return this;
    },
    headersSent: false,
  } as unknown as ApiResponse;

  return {
    res,
    getStatus: () => res.statusCode || statusCode,
    getBody: () => bodyData,
    getHeaders: () => headers,
  };
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING UNIFIED API ROUTER & CATCH-ALL ROUTING");
  console.log("==================================================");

  // Setup Mock Database for safe tests
  const queryResult: any = Promise.resolve([]);
  queryResult.where = () => queryResult;
  queryResult.orderBy = () => queryResult;
  queryResult.limit = () => queryResult;

  const mockDb: any = {
    select: () => ({
      from: () => queryResult,
    }),
  };
  setMockDb(mockDb);

  // 1. Path Resolution
  console.log("\n[1] Route Path Resolution:");
  assert(
    resolveRoutePath(createMockReq({ query: { route: ["auth", "login"] } })) === "/api/auth/login",
    "Resolves string array from Vercel dynamic route ['auth', 'login'] -> /api/auth/login"
  );
  assert(
    resolveRoutePath(createMockReq({ query: { route: "downloads" } })) === "/api/downloads",
    "Resolves string parameter route='downloads' -> /api/downloads"
  );
  assert(
    resolveRoutePath(createMockReq({ query: { path: ["download", "windows"] } })) === "/api/download/windows",
    "Resolves path parameter ['download', 'windows'] -> /api/download/windows"
  );
  assert(
    resolveRoutePath(createMockReq({ url: "/api/site/contact" })) === "/api/site/contact",
    "Resolves raw URL /api/site/contact -> /api/site/contact"
  );
  assert(
    resolveRoutePath(createMockReq({ url: "/api" })) === "/api",
    "Resolves root /api -> /api"
  );
  assert(
    resolveRoutePath(createMockReq({ url: "/api/" })) === "/api",
    "Strips trailing slash /api/ -> /api"
  );

  // 2. Canonical Route Table
  console.log("\n[2] Canonical Route Registry:");
  const expectedEndpoints = [
    "/api",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/session",
    "/api/auth/change-password",
    "/api/admin/releases",
    "/api/admin/downloads",
    "/api/admin/analytics",
    "/api/admin/analytics/summary",
    "/api/admin/analytics/timeseries",
    "/api/admin/analytics/releases",
    "/api/admin/website",
    "/api/admin/security",
    "/api/admin/security/sessions",
    "/api/admin/activity",
    "/api/downloads",
    "/api/download/windows",
    "/api/download/android",
    "/api/site/contact",
  ];

  for (const ep of expectedEndpoints) {
    assert(typeof apiRoutes[ep] === "function", `Registered handler for ${ep}`);
  }

  // 3. Dispatch Execution via Router
  console.log("\n[3] Dispatch Execution & Handling:");

  // 3a. Root Health Check (/api)
  {
    const req = createMockReq({ url: "/api" });
    const { res, getStatus, getBody } = createMockRes();
    await routerHandler(req, res);
    assert(getStatus() === 200, "GET /api returns 200 OK");
    assert(getBody()?.ok === true && getBody()?.status === "healthy", "GET /api returns healthy status payload");
  }

  // 3b. Public Downloads Metadata (/api/downloads)
  {
    const req = createMockReq({ query: { route: ["downloads"] } });
    const { res, getStatus, getBody } = createMockRes();
    await routerHandler(req, res);
    assert(getStatus() === 200, "GET /api/downloads through catch-all returns 200 OK");
    assert(getBody()?.ok === true, "Public downloads envelope ok is true");
  }

  // 3c. Public Site Contact (/api/site/contact)
  {
    const req = createMockReq({ query: { route: ["site", "contact"] } });
    const { res, getStatus, getBody } = createMockRes();
    await routerHandler(req, res);
    assert(getStatus() === 200, "GET /api/site/contact through catch-all returns 200 OK");
    assert(getBody()?.ok === true, "Contact payload ok is true");
  }

  // 3d. Session inspection unauthenticated (/api/auth/session)
  {
    const req = createMockReq({ query: { route: ["auth", "session"] } });
    const { res, getStatus, getBody } = createMockRes();
    await routerHandler(req, res);
    assert(getStatus() === 200, "GET /api/auth/session returns 200 OK");
    assert(getBody()?.data?.authenticated === false, "Unauthenticated session check reports authenticated: false");
  }

  // 3e. Protected admin route without session (/api/admin/releases)
  {
    const req = createMockReq({ query: { route: ["admin", "releases"] } });
    const { res, getStatus, getBody } = createMockRes();
    await routerHandler(req, res);
    assert(getStatus() === 401, "GET /api/admin/releases without session returns 401 UNAUTHORIZED");
    assert(getBody()?.code === "UNAUTHORIZED", "Returns UNAUTHORIZED error code");
  }

  // 3f. Query Parameter Cleansing
  {
    const req = createMockReq({
      query: { route: ["admin", "releases"], page: "2", status: "active" },
    });
    const { res } = createMockRes();
    await routerHandler(req, res);
    assert(!("route" in (req.query || {})), "Removes 'route' routing artifact from req.query");
    assert(req.query?.page === "2", "Preserves user query parameter 'page'");
    assert(req.query?.status === "active", "Preserves user query parameter 'status'");
  }

  // 3g. 404 Route Not Found
  {
    const req = createMockReq({ query: { route: ["nonexistent", "endpoint"] } });
    const { res, getStatus, getBody } = createMockRes();
    await routerHandler(req, res);
    assert(getStatus() === 404, "Unknown API route returns 404 NOT_FOUND");
    assert(getBody()?.code === "NOT_FOUND", "Error response has code NOT_FOUND");
  }

  console.log("\n==================================================");
  console.log(`🏁 UNIFIED ROUTER RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Router test failed:", err);
  process.exit(1);
});
