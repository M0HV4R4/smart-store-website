import { setMockDb } from "../api/_lib/db";
import { generateSessionToken, createSessionCookie } from "../api/_lib/auth";
import downloadsHandler from "../api/admin/downloads";
import releasesHandler from "../api/admin/releases";
import { ar } from "../src/locales/ar";
import { fr } from "../src/locales/fr";

function createMockReq(options: {
  method?: string;
  url?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
}) {
  return {
    method: options.method || "GET",
    url: options.url || "/",
    query: options.query || {},
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      ...options.headers,
    },
    cookies: options.cookies || {},
    body: options.body || {},
  };
}

function createMockRes(): {
  res: any;
  getStatus: () => number;
  getHeaders: () => Record<string, string>;
  getBody: () => any;
} {
  const headers: Record<string, string> = {};
  let body: any = null;

  const res: any = {
    statusCode: 200,
    setHeader(name: string, val: string) {
      headers[name.toLowerCase()] = val;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      body = data;
    },
    end(data: any) {
      if (data && !body) {
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
      }
    },
  };

  return {
    res,
    getStatus: () => res.statusCode,
    getHeaders: () => headers,
    getBody: () => body,
  };
}

async function runStage7Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 7: DOWNLOAD MANAGEMENT");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
    }
  }

  // Set up mock DB state
  const mockAdminId = "99999999-9999-9999-9999-999999999999";
  const mockRawToken = generateSessionToken();
  const validCookie = createSessionCookie(mockRawToken);

  interface ReleaseDbRecord {
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
    createdAt: Date;
    updatedAt: Date;
  }

  let mockReleases: ReleaseDbRecord[] = [];
  const mockAuditLogs: any[] = [];
  const mockDownloadEvents: { id: number; releaseId: string }[] = [];

  // Implement mock DB for Drizzle
  const mockDb = {
    select(_selection?: any) {
      return {
        from(_table: any) {
          return {
            innerJoin(_joinTable: any, _condition: any) {
              return {
                where(_predicate: any) {
                  return {
                    limit(_n: number) {
                      // Session auth query
                      return Promise.resolve([
                        {
                          sessionId: "mock-session-id",
                          adminId: mockAdminId,
                          username: "smartadmin",
                          email: "admin@smartstore.app",
                          adminStatus: "active",
                          expiresAt: new Date(Date.now() + 100000),
                        },
                      ]);
                    },
                  };
                },
              };
            },
            where(predicate: any) {
              return {
                orderBy(_expr1: any, _expr2: any) {
                  return {
                    limit(_n: number) {
                      // Release candidates query
                      let platform: "windows" | "android" = "windows";
                      const rawVal =
                        predicate?.value ??
                        predicate?.right?.value ??
                        predicate?.right?.val ??
                        predicate?.right;

                      if (typeof rawVal === "string" && rawVal.toLowerCase().includes("android")) {
                        platform = "android";
                      }

                      const filtered = mockReleases.filter((r) => r.platform === platform);
                      if (filtered.length === 0) return Promise.resolve([]);

                      // Sort active first, then newest
                      filtered.sort((a, b) => {
                        if (a.status === "active" && b.status !== "active") return -1;
                        if (b.status === "active" && a.status !== "active") return 1;
                        return b.createdAt.getTime() - a.createdAt.getTime();
                      });

                      return Promise.resolve([filtered[0]]);
                    },
                  };
                },
                limit(_n: number) {
                  // Release lookup by ID
                  if (mockReleases.length > 0) {
                    return Promise.resolve([{ ...mockReleases[mockReleases.length - 1] }]);
                  }
                  return Promise.resolve([]);
                },
                then(resolve: (val: any) => void) {
                  // Download events count query
                  return resolve([{ count: mockDownloadEvents.length }]);
                },
              };
            },
          };
        },
      };
    },
    insert(_table: any) {
      return {
        values(data: any) {
          if (data.action) {
            mockAuditLogs.push(data);
          }
          return {
            returning() {
              const newRecord: ReleaseDbRecord = {
                id: "rel-" + Math.random().toString(36).substring(2, 9),
                platform: data.platform,
                version: data.version,
                downloadUrl: data.downloadUrl,
                fileSize: data.fileSize || null,
                releaseDate: data.releaseDate,
                releaseNotesAr: data.releaseNotesAr || null,
                releaseNotesFr: data.releaseNotesFr || null,
                status: data.status,
                downloadEnabled: data.downloadEnabled ?? true,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              mockReleases.push(newRecord);
              return Promise.resolve([newRecord]);
            },
            then(resolve: any) {
              return resolve([data]);
            },
          };
        },
      };
    },
    update(_table: any) {
      return {
        set(data: any) {
          return {
            where(_predicate: any) {
              return {
                returning() {
                  if (mockReleases.length > 0) {
                    const target = mockReleases[mockReleases.length - 1];
                    Object.assign(target, data);
                    return Promise.resolve([target]);
                  }
                  return Promise.resolve([]);
                },
                then(resolve: any) {
                  // If setting other active releases to archived
                  if (data.status === "archived") {
                    for (const r of mockReleases) {
                      if (r.status === "active") {
                        r.status = "archived";
                      }
                    }
                  }
                  return resolve();
                },
              };
            },
          };
        },
      };
    },
    delete(_table: any) {
      return {
        where(_predicate: any) {
          return Promise.resolve();
        },
      };
    },
  };

  setMockDb(mockDb);

  // =========================================================================
  // 1. AUTHENTICATION GUARDS
  // =========================================================================
  console.log("\n[1] Authentication Enforcement:");
  {
    // Unauthenticated GET
    const { res, getStatus } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await downloadsHandler(req as any, res);
    assert(getStatus() === 401, "Rejects unauthenticated GET /api/admin/downloads with 401");
  }
  {
    // Unauthenticated POST
    const { res, getStatus } = createMockRes();
    const req = createMockReq({ method: "POST" });
    await releasesHandler(req as any, res);
    assert(getStatus() === 401, "Rejects unauthenticated POST /api/admin/releases with 401");
  }
  {
    // Unauthenticated PATCH
    const { res, getStatus } = createMockRes();
    const req = createMockReq({ method: "PATCH" });
    await releasesHandler(req as any, res);
    assert(getStatus() === 401, "Rejects unauthenticated PATCH /api/admin/releases with 401");
  }

  // =========================================================================
  // 2. EMPTY STATE RETRIEVAL
  // =========================================================================
  console.log("\n[2] Initial Empty State Retrieval:");
  {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await downloadsHandler(req as any, res);
    assert(getStatus() === 200, "Returns 200 OK for authenticated GET /api/admin/downloads");
    assert(getBody()?.ok === true, "Payload ok is true");
    assert(getBody()?.data?.windows === null, "Returns windows: null when no release exists");
    assert(getBody()?.data?.android === null, "Returns android: null when no release exists");
  }

  // =========================================================================
  // 3. INPUT VALIDATION & SECURITY
  // =========================================================================
  console.log("\n[3] Input Validation & URL Security:");
  {
    // Invalid platform
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "linux",
        version: "1.0.0",
        downloadUrl: "https://github.com/smartstore/releases/Setup.exe",
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 400, "Rejects unsupported platform with 400");
    assert(getBody()?.code === "VALIDATION_ERROR", "Returns VALIDATION_ERROR code");
  }
  {
    // Insecure HTTP download URL
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "windows",
        version: "1.0.0",
        downloadUrl: "http://downloads.smartstore.app/Setup.exe",
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 400, "Rejects unencrypted HTTP download URL");
    assert(getBody()?.code === "VALIDATION_ERROR" || getBody()?.code === "INVALID_DOWNLOAD_URL", "Rejects insecure URL");
  }
  {
    // Dangerous javascript: URI
    const { res, getStatus } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "android",
        version: "1.0.0",
        downloadUrl: "javascript:alert(1)",
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 400, "Rejects dangerous javascript: scheme in downloadUrl");
  }

  // =========================================================================
  // 4. CREATE FIRST RELEASE (WINDOWS & ANDROID)
  // =========================================================================
  console.log("\n[4] Create Initial Releases:");
  let winReleaseId = "";
  {
    // Create Windows Release
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "windows",
        version: "1.0.0",
        downloadUrl: "https://github.com/smartstore/releases/download/v1.0.0/SmartStore-Setup.exe",
        fileSize: "95 MB",
        releaseDate: "2026-03-01",
        releaseNotesAr: "الإصدار الأولي لنظام ويندوز",
        releaseNotesFr: "Version initiale Windows",
        status: "active",
        downloadEnabled: true,
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 201, "Creates first Windows release with 201 Created");
    assert(getBody()?.ok === true, "Creation payload ok is true");
    assert(getBody()?.data?.platform === "windows", "Release platform is windows");
    assert(getBody()?.data?.status === "active", "Release status is active");
    winReleaseId = getBody()?.data?.id;
  }
  {
    // Create Android Release
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "android",
        version: "1.0.0",
        downloadUrl: "https://downloads.smartstore.app/SmartStore-v1.0.0.apk",
        fileSize: "42 MB",
        releaseDate: "2026-03-01",
        status: "active",
        downloadEnabled: true,
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 201, "Creates first Android release with 201 Created");
    assert(getBody()?.data?.platform === "android", "Release platform is android");
  }

  // =========================================================================
  // 5. RETRIEVE CURRENT DOWNLOADS AFTER CREATION
  // =========================================================================
  console.log("\n[5] Retrieve Configured Releases:");
  {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await downloadsHandler(req as any, res);
    assert(getStatus() === 200, "Fetches current configurations with 200 OK");
    assert(getBody()?.data?.windows?.version === "1.0.0", "Windows version is 1.0.0");
    assert(getBody()?.data?.android?.version === "1.0.0", "Android version is 1.0.0");
    assert(getBody()?.data?.windows?.downloadEnabled === true, "Windows downloadEnabled is true");
    assert(typeof getBody()?.data?.windows?.downloadCount === "number", "Reports real download count number");
  }

  // =========================================================================
  // 6. EDIT CURRENT RELEASE METADATA (PATCH)
  // =========================================================================
  console.log("\n[6] Edit Current Release (PATCH):");
  {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "PATCH",
      headers: { cookie: validCookie },
      body: {
        id: winReleaseId,
        fileSize: "98.5 MB",
        downloadEnabled: false, // temporarily disable
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 200, "Updates release metadata with 200 OK");
    assert(getBody()?.data?.fileSize === "98.5 MB", "Updated fileSize is persisted");
    assert(getBody()?.data?.downloadEnabled === false, "downloadEnabled is set to false");
  }

  // =========================================================================
  // 7. PUBLISH NEW VERSION & HISTORICAL PRESERVATION
  // =========================================================================
  console.log("\n[7] Publish New Version & History Preservation:");
  {
    const previousReleaseCount = mockReleases.length;

    // Publish Windows v1.1.0 as active
    const { res, getStatus } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "windows",
        version: "1.1.0",
        downloadUrl: "https://github.com/smartstore/releases/download/v1.1.0/SmartStore-Setup.exe",
        fileSize: "102 MB",
        status: "active",
        downloadEnabled: true,
      },
    });
    await releasesHandler(req as any, res);
    assert(getStatus() === 201, "Publishes new version v1.1.0 with 201 Created");
    assert(mockReleases.length === previousReleaseCount + 1, "Preserves previous release record (no deletion/overwrite)");

    // Verify previous release is now archived
    const prevRel = mockReleases.find((r) => r.version === "1.0.0" && r.platform === "windows");
    assert(prevRel?.status === "archived", "Previous active release is archived to maintain single-active invariant");
  }

  // =========================================================================
  // 8. AUDIT LOGGING VERIFICATION
  // =========================================================================
  console.log("\n[8] Audit Logging Verification:");
  {
    assert(mockAuditLogs.length > 0, "Audit logs recorded in database audit_logs table");
    const actions = mockAuditLogs.map((a) => a.action);
    assert(actions.includes("release.created"), "Recorded release.created audit event");
    assert(actions.includes("download.disabled"), "Recorded download.disabled audit event");

    // Verify no secrets leaked in audit logs
    const hasSecrets = mockAuditLogs.some(
      (a) => a.metadata?.password || a.metadata?.token || a.metadata?.database_url,
    );
    assert(!hasSecrets, "Audit logs metadata is deeply sanitized (zero secrets)");
  }

  // =========================================================================
  // 9. LOCALIZATION INTEGRITY
  // =========================================================================
  console.log("\n[9] Localization Integrity:");
  {
    assert(Boolean(ar.admin.downloads), "Arabic downloads dictionary exists");
    assert(Boolean(fr.admin.downloads), "French downloads dictionary exists");
    assert(ar.admin.downloads.windowsPanel === "إصدار Windows", "Arabic windowsPanel label matches");
    assert(fr.admin.downloads.windowsPanel === "Version Windows", "French windowsPanel label matches");
    assert(ar.admin.downloads.statusActive === "نشط", "Arabic active badge text matches");
    assert(fr.admin.downloads.statusActive === "Actif", "French active badge text matches");
  }

  // Final summary
  console.log("\n==================================================");
  console.log(`🏁 TESTS FINISHED: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL STAGE 7 DOWNLOAD MANAGEMENT TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}

runStage7Tests().catch((err) => {
  console.error("Test runner threw unexpected fatal error:", err);
  process.exit(1);
});
