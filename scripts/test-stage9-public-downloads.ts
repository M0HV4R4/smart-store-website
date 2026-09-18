import { setMockDb } from "../api/_lib/db";
import windowsDownloadHandler from "../api/_routes/download/windows";
import androidDownloadHandler from "../api/_routes/download/android";
import publicDownloadsMetaHandler from "../api/_routes/downloads";
import adminDownloadsHandler from "../api/_routes/admin/downloads";
import adminReleasesHandler from "../api/_routes/admin/releases";
import { generateSessionToken, createSessionCookie } from "../api/_lib/auth";
import fs from "fs";
import path from "path";

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

async function runStage9Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 9: PUBLIC DOWNLOAD ROUTING & TRACKING");
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

  // Set up test credentials & storage
  const mockAdminId = "77777777-7777-7777-7777-777777777777";
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
  let mockDownloadEvents: { id: number; releaseId: string; platform: string; version: string; createdAt: Date }[] = [];
  let shouldSimulateDbInsertFailure = false;

  // Recursive SQL chunk parser to reliably extract filter conditions
  function parseConditions(sqlObj: any): { col: string; op: string; val: any }[] {
    const list: { col: string; op: string; val: any }[] = [];
    function walk(obj: any) {
      if (!obj) return;
      if (obj.queryChunks) {
        const chunks = obj.queryChunks;
        for (let i = 0; i < chunks.length; i++) {
          const c = chunks[i];
          if (c?.constructor?.name === "StringChunk") {
            const op = c.value?.[0];
            if (op && (op.includes("=") || op.includes("<>") || op.includes("like"))) {
              const left = chunks[i - 1];
              const right = chunks[i + 1];
              const col = left?.name || left?.config?.name;
              const val = right?.value ?? right;
              if (col && val !== undefined) {
                list.push({ col, op: op.trim(), val });
              }
            }
          } else if (c?.queryChunks) {
            walk(c);
          }
        }
      }
    }
    walk(sqlObj);
    return list;
  }

  function filterReleases(predicate: any): ReleaseDbRecord[] {
    let result = [...mockReleases];
    if (!predicate) return result;

    const conds = parseConditions(predicate);
    if (conds.length === 0) return result;

    for (const cond of conds) {
      const { col, op, val } = cond;
      if (col === "platform") {
        result = result.filter((r) => (op === "=" ? r.platform === val : r.platform !== val));
      } else if (col === "status") {
        result = result.filter((r) => (op === "=" ? r.status === val : r.status !== val));
      } else if (col === "download_enabled") {
        result = result.filter((r) => (op === "=" ? r.downloadEnabled === val : r.downloadEnabled !== val));
      } else if (col === "id") {
        result = result.filter((r) => (op === "<>" ? r.id !== val : r.id === val));
      } else if (col === "version") {
        const clean = String(val).replace(/%/g, "").toLowerCase();
        result = result.filter((r) => r.version.toLowerCase().includes(clean));
      }
    }

    return result;
  }

  // Mock DB Implementation
  const mockDb = {
    select(selection?: any) {
      const isCount = selection && typeof selection === "object" && "count" in selection;

      return {
        from(table: any) {
          const tableName =
            (table as any)?.[Symbol.for("drizzle:Name")] ||
            table?._?.name ||
            table?.tableName ||
            "";

          // downloadEvents query
          if (tableName === "download_events" || String(tableName).includes("download_events")) {
            return {
              where(_predicate: any) {
                return {
                  groupBy(_col: any) {
                    const countsMap = new Map<string, number>();
                    for (const ev of mockDownloadEvents) {
                      countsMap.set(ev.releaseId, (countsMap.get(ev.releaseId) || 0) + 1);
                    }
                    const res = Array.from(countsMap.entries()).map(([releaseId, count]) => ({
                      releaseId,
                      count,
                    }));
                    return Promise.resolve(res);
                  },
                  then(resolve: (val: any) => void) {
                    return resolve([{ count: mockDownloadEvents.length }]);
                  },
                };
              },
            };
          }

          // sessions / auth query
          return {
            innerJoin(_joinTable: any, _condition: any) {
              return {
                where(_predicate: any) {
                  return {
                    limit(_n: number) {
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

            // Count query on releases without where
            then(resolve: (val: any) => void) {
              if (isCount) {
                return resolve([{ count: mockReleases.length }]);
              }
              return resolve(mockReleases);
            },

            where(predicate: any) {
              const matched = filterReleases(predicate);

              return {
                then(resolve: (val: any) => void) {
                  if (isCount) {
                    return resolve([{ count: matched.length }]);
                  }
                  return resolve(matched);
                },
                orderBy(_expr1: any, _expr2?: any) {
                  const sorted = [...matched].sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                  );

                  return {
                    limit(limitNum: number) {
                      return {
                        offset(offsetNum: number) {
                          const page = sorted.slice(offsetNum, offsetNum + limitNum);
                          return Promise.resolve(page);
                        },
                        then(resolve: (val: any) => void) {
                          if (sorted.length === 0) return resolve([]);
                          const activeFirst = [...sorted].sort((a, b) => {
                            if (a.status === "active" && b.status !== "active") return -1;
                            if (b.status === "active" && a.status !== "active") return 1;
                            return b.createdAt.getTime() - a.createdAt.getTime();
                          });
                          return resolve([activeFirst[0]]);
                        },
                      };
                    },
                  };
                },
                limit(limitNum: number) {
                  return Promise.resolve(matched.slice(0, limitNum));
                },
              };
            },

            orderBy(_expr1: any, _expr2?: any) {
              const sorted = [...mockReleases].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              );
              return {
                limit(limitNum: number) {
                  return {
                    offset(offsetNum: number) {
                      const page = sorted.slice(offsetNum, offsetNum + limitNum);
                      return Promise.resolve(page);
                    },
                    then(resolve: (val: any) => void) {
                      return resolve(sorted.slice(0, limitNum));
                    },
                  };
                },
              };
            },
          };
        },
      };
    },

    insert(table: any) {
      return {
        values(data: any) {
          const tableName =
            (table as any)?.[Symbol.for("drizzle:Name")] ||
            table?._?.name ||
            table?.tableName ||
            "";

          if (tableName === "download_events" || String(tableName).includes("download_events")) {
            if (shouldSimulateDbInsertFailure) {
              return Promise.reject(new Error("Database connection timeout during event insert"));
            }
            const newEvent = {
              id: mockDownloadEvents.length + 1,
              releaseId: data.releaseId,
              platform: data.platform,
              version: data.version,
              createdAt: new Date(),
            };
            mockDownloadEvents.push(newEvent);
            return Promise.resolve([newEvent]);
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
          };
        },
      };
    },

    update(_table: any) {
      return {
        set(updates: any) {
          return {
            where(predicate: any) {
              const targetReleases = filterReleases(predicate);
              for (const r of targetReleases) {
                Object.assign(r, updates);
              }
              return {
                returning() {
                  return Promise.resolve(targetReleases);
                },
                then(resolve: (val: any) => void) {
                  return resolve(targetReleases);
                },
              };
            },
          };
        },
      };
    },
  };

  setMockDb(mockDb);

  // ===========================================================================
  // TEST SUITE 1: METHOD RESTRICTIONS & UNAVAILABLE INITIAL STATE
  // ===========================================================================
  console.log("\n[1] Method Restrictions & Unavailable Initial State:");

  {
    // Rejects POST on /api/download/windows
    const { res, getStatus, getBody, getHeaders } = createMockRes();
    const req = createMockReq({ method: "POST" });
    await windowsDownloadHandler(req as any, res as any);
    assert(getStatus() === 405, "Rejects POST /api/download/windows with 405 Method Not Allowed");
    assert(getBody()?.code === "METHOD_NOT_ALLOWED", "Error code is METHOD_NOT_ALLOWED");
    assert(getHeaders()?.allow?.includes("GET"), "Allow header contains GET");
  }

  {
    // Rejects DELETE on /api/download/android
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({ method: "DELETE" });
    await androidDownloadHandler(req as any, res as any);
    assert(getStatus() === 405, "Rejects DELETE /api/download/android with 405 Method Not Allowed");
    assert(getBody()?.code === "METHOD_NOT_ALLOWED", "Error code is METHOD_NOT_ALLOWED");
  }

  {
    // When no active release exists: returns 404 DOWNLOAD_UNAVAILABLE
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await windowsDownloadHandler(req as any, res as any);
    assert(getStatus() === 404, "Returns 404 when no active Windows release exists");
    assert(getBody()?.code === "DOWNLOAD_UNAVAILABLE", "Error code is DOWNLOAD_UNAVAILABLE");
    assert(mockDownloadEvents.length === 0, "No download event inserted on 404");
  }

  // ===========================================================================
  // TEST SUITE 2: CONFIGURE ACTIVE RELEASES
  // ===========================================================================
  console.log("\n[2] Configure Active Releases in PostgreSQL:");

  const winReleaseId = "rel-win-prod";
  const andReleaseId = "rel-and-prod";

  mockReleases.push({
    id: winReleaseId,
    platform: "windows",
    version: "1.4.0",
    downloadUrl: "https://github.com/smartstore/releases/download/v1.4.0/SmartStore-Setup.exe",
    fileSize: "95 MB",
    releaseDate: "2026-03-15",
    releaseNotesAr: "تحسينات الأداء",
    releaseNotesFr: "Améliorations de performance",
    status: "active",
    downloadEnabled: true,
    createdAt: new Date("2026-03-15T10:00:00Z"),
    updatedAt: new Date("2026-03-15T10:00:00Z"),
  });

  mockReleases.push({
    id: andReleaseId,
    platform: "android",
    version: "1.2.0",
    downloadUrl: "https://github.com/smartstore/releases/download/v1.2.0/SmartStore.apk",
    fileSize: "42 MB",
    releaseDate: "2026-03-10",
    releaseNotesAr: "دعم الباركود",
    releaseNotesFr: "Support code-barres",
    status: "active",
    downloadEnabled: true,
    createdAt: new Date("2026-03-10T10:00:00Z"),
    updatedAt: new Date("2026-03-10T10:00:00Z"),
  });

  assert(mockReleases.length === 2, "Configured active Windows and Android releases in DB");

  // ===========================================================================
  // TEST SUITE 3: SUCCESSFUL PUBLIC DOWNLOAD & TRACKING
  // ===========================================================================
  console.log("\n[3] Windows & Android Download Resolution, Tracking & Redirection:");

  {
    // Windows download resolution
    const { res, getStatus, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await windowsDownloadHandler(req as any, res as any);

    assert(getStatus() === 307, "Windows download issues HTTP 307 Temporary Redirect");
    assert(
      getHeaders()?.location === "https://github.com/smartstore/releases/download/v1.4.0/SmartStore-Setup.exe",
      "Redirect Location matches stored validated URL",
    );
    assert(
      getHeaders()?.["cache-control"]?.includes("no-store"),
      "Enforces Cache-Control: no-store to prevent CDN/browser tracking bypass",
    );
    assert(mockDownloadEvents.length === 1, "Exactly one download event inserted");

    const event = mockDownloadEvents[0];
    assert(event.releaseId === winReleaseId, "Event records correct releaseId");
    assert(event.platform === "windows", "Event records correct platform");
    assert(event.version === "1.4.0", "Event records correct version");
  }

  {
    // Android download resolution
    const { res, getStatus, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await androidDownloadHandler(req as any, res as any);

    assert(getStatus() === 307, "Android download issues HTTP 307 Temporary Redirect");
    assert(
      getHeaders()?.location === "https://github.com/smartstore/releases/download/v1.2.0/SmartStore.apk",
      "Redirect Location matches stored Android URL",
    );
    assert(mockDownloadEvents.length === 2, "Second event inserted for Android");

    const event = mockDownloadEvents[1];
    assert(event.releaseId === andReleaseId, "Android event records correct releaseId");
    assert(event.platform === "android", "Android event records correct platform");
    assert(event.version === "1.2.0", "Android event records correct version");
  }

  // ===========================================================================
  // TEST SUITE 4: SECURITY & OPEN REDIRECT IMMUNITY
  // ===========================================================================
  console.log("\n[4] Open Redirect Immunity & Parameter Tampering:");

  {
    // Malicious query parameter override attempt
    const { res, getStatus, getHeaders } = createMockRes();
    const req = createMockReq({
      method: "GET",
      query: { url: "https://attacker.evil.com/malware.exe", destination: "https://phishing.com" },
    });
    await windowsDownloadHandler(req as any, res as any);

    assert(getStatus() === 307, "Returns 307 redirect");
    assert(
      getHeaders()?.location === "https://github.com/smartstore/releases/download/v1.4.0/SmartStore-Setup.exe",
      "Client query parameters strictly ignored; open redirect completely prevented",
    );
  }

  // ===========================================================================
  // TEST SUITE 5: DATABASE FAILURE & INTEGRITY SAFETY
  // ===========================================================================
  console.log("\n[5] Database Event Insertion Failure Handling:");

  {
    // Simulate database failure during event insert
    shouldSimulateDbInsertFailure = true;
    const initialEventsCount = mockDownloadEvents.length;

    const { res, getStatus, getBody, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await windowsDownloadHandler(req as any, res as any);

    assert(getStatus() === 503, "Returns 503 DOWNLOAD_TEMPORARILY_UNAVAILABLE on DB insert failure");
    assert(getBody()?.code === "DOWNLOAD_TEMPORARILY_UNAVAILABLE", "Error code is DOWNLOAD_TEMPORARILY_UNAVAILABLE");
    assert(!getHeaders()?.location, "Does NOT redirect when tracking fails (preserves tracking integrity)");
    assert(mockDownloadEvents.length === initialEventsCount, "No partial event counted");

    shouldSimulateDbInsertFailure = false;
  }

  // ===========================================================================
  // TEST SUITE 6: DOWNLOAD DISABLED AVAILABILITY
  // ===========================================================================
  console.log("\n[6] Download Disabled Availability:");

  {
    // Disable Windows download
    const win = mockReleases.find((r) => r.id === winReleaseId)!;
    win.downloadEnabled = false;

    const { res, getStatus, getBody, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await windowsDownloadHandler(req as any, res as any);

    assert(getStatus() === 404, "Returns 404 when downloadEnabled is false");
    assert(getBody()?.code === "DOWNLOAD_UNAVAILABLE", "Returns DOWNLOAD_UNAVAILABLE");
    assert(!getHeaders()?.location, "Does not redirect disabled release");

    // Restore enabled
    win.downloadEnabled = true;
  }

  // ===========================================================================
  // TEST SUITE 7: PUBLIC METADATA API
  // ===========================================================================
  console.log("\n[7] Public Metadata API (/api/downloads):");

  {
    // Public metadata retrieval
    const { res, getStatus, getBody, getHeaders } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await publicDownloadsMetaHandler(req as any, res as any);

    assert(getStatus() === 200, "Returns 200 OK for public metadata");
    assert(getHeaders()?.["cache-control"]?.includes("no-store"), "Sets no-store cache headers");

    const data = getBody()?.data;
    assert(data?.windows?.available === true, "Windows is available");
    assert(data?.windows?.version === "1.4.0", "Windows version is 1.4.0");
    assert(data?.windows?.fileSize === "95 MB", "Windows fileSize is 95 MB");
    assert(data?.windows?.releaseDate === "2026-03-15", "Windows releaseDate is 2026-03-15");

    assert(data?.android?.available === true, "Android is available");
    assert(data?.android?.version === "1.2.0", "Android version is 1.2.0");
    assert(data?.android?.fileSize === "42 MB", "Android fileSize is 42 MB");

    // Zero secret leakage check
    assert(data?.windows?.downloadUrl === undefined, "Never exposes Windows raw downloadUrl");
    assert(data?.android?.downloadUrl === undefined, "Never exposes Android raw downloadUrl");
    assert(data?.windows?.id === undefined, "Never exposes internal Windows releaseId");
    assert(data?.android?.id === undefined, "Never exposes internal Android releaseId");
    assert(data?.windows?.releaseNotesAr === undefined, "Never exposes release notes in metadata");
  }

  {
    // Public metadata reflects downloadEnabled = false
    const win = mockReleases.find((r) => r.id === winReleaseId)!;
    win.downloadEnabled = false;

    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await publicDownloadsMetaHandler(req as any, res as any);

    assert(getStatus() === 200, "Returns 200 OK");
    assert(getBody()?.data?.windows?.available === false, "Windows availability switches to false when disabled");

    win.downloadEnabled = true;
  }

  // ===========================================================================
  // TEST SUITE 8: ADMIN SYNCHRONIZATION
  // ===========================================================================
  console.log("\n[8] Synchronization with Admin Dashboards:");

  {
    // Stage 7 Admin Downloads check: count must derive from download_events
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await adminDownloadsHandler(req as any, res as any);

    assert(getStatus() === 200, "Admin downloads returns 200 OK");
    assert(
      typeof getBody()?.data?.windows?.downloadCount === "number",
      "Admin downloads reports numeric download count",
    );
    assert(
      getBody()?.data?.windows?.downloadCount >= 1,
      "Admin download count reflects newly created public download events",
    );
  }

  {
    // Stage 8 Admin Releases check: count must derive from download_events
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await adminReleasesHandler(req as any, res as any);

    assert(getStatus() === 200, "Admin releases returns 200 OK");
    const releasesList = getBody()?.data?.releases;
    const winRel = releasesList?.find((r: any) => r.id === winReleaseId);
    assert(winRel?.downloadCount >= 1, "Admin releases list reflects real download events aggregation");
  }

  // ===========================================================================
  // TEST SUITE 9: FRONTEND SOURCE CODE CHECKS
  // ===========================================================================
  console.log("\n[9] Frontend Source Code & Architecture Verification:");

  {
    const downloadCtaPath = path.resolve(
      process.cwd(),
      "src/components/sections/DownloadCtaSection.tsx",
    );
    const content = fs.readFileSync(downloadCtaPath, "utf-8");

    assert(
      content.includes("/api/download/windows"),
      "DownloadCtaSection uses /api/download/windows route",
    );
    assert(
      content.includes("/api/download/android"),
      "DownloadCtaSection uses /api/download/android route",
    );
    assert(
      !content.includes("https://github.com/smartstore/releases"),
      "No hardcoded GitHub download URLs in React",
    );
    assert(
      content.includes("getPublicDownloadsMeta"),
      "DownloadCtaSection fetches real metadata via getPublicDownloadsMeta()",
    );
  }

  console.log("==================================================");
  console.log(`🏁 STAGE 9 TESTS FINISHED: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL STAGE 9 PUBLIC DOWNLOAD TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED");
    process.exit(1);
  }
}

runStage9Tests().catch((err) => {
  console.error("Test execution encountered an unhandled error:", err);
  process.exit(1);
});

