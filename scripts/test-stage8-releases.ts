import { setMockDb } from "../api/_lib/db";
import { generateSessionToken, createSessionCookie } from "../api/_lib/auth";
import releasesHandler from "../api/admin/releases";
import downloadsHandler from "../api/admin/downloads";
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

async function runStage8Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 8: RELEASES MANAGEMENT");
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
  const mockAdminId = "88888888-8888-8888-8888-888888888888";
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
  // TEST SUITE 1: AUTHENTICATION & METHOD RESTRICTION
  // ===========================================================================
  console.log("\n[1] Authentication & Method Enforcement:");

  {
    // Unauthenticated GET
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({ method: "GET" });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 401, "Rejects unauthenticated GET /api/admin/releases with 401");
    assert(getBody()?.code === "UNAUTHORIZED", "Error code is UNAUTHORIZED");
  }

  {
    // Rejects DELETE method (no permanent deletion route allowed)
    const { res, getStatus, getBody, getHeaders } = createMockRes();
    const req = createMockReq({
      method: "DELETE",
      headers: { cookie: validCookie },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 405, "Rejects DELETE method with 405 Method Not Allowed");
    assert(getBody()?.code === "METHOD_NOT_ALLOWED", "Error code is METHOD_NOT_ALLOWED");
    assert(getHeaders()?.allow?.includes("GET"), "Allow header informs permitted methods");
  }

  // ===========================================================================
  // TEST SUITE 2: EMPTY RELEASES LIST & QUERY VALIDATION
  // ===========================================================================
  console.log("\n[2] Empty Releases List & Query Validation:");

  {
    // Authenticated GET with empty DB
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Returns 200 OK for authenticated GET /api/admin/releases");
    assert(getBody()?.ok === true, "Response payload ok is true");
    assert(Array.isArray(getBody()?.data?.releases), "Releases is an array");
    assert(getBody()?.data?.releases.length === 0, "Releases array is empty when DB has zero records");
    assert(getBody()?.data?.pagination?.total === 0, "Pagination total is 0");
    assert(getBody()?.data?.pagination?.totalPages === 1, "Pagination totalPages is 1");
  }

  {
    // Invalid platform query
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
      query: { platform: "ios_invalid" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 400, "Rejects invalid platform parameter with 400");
    assert(getBody()?.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");
  }

  {
    // Invalid status query
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
      query: { status: "deleted_status" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 400, "Rejects invalid status parameter with 400");
    assert(getBody()?.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");
  }

  // ===========================================================================
  // TEST SUITE 3: POPULATE HISTORICAL RELEASES & SINGLE-ACTIVE INVARIANT
  // ===========================================================================
  console.log("\n[3] Populate Historical Releases & Invariants:");

  let win1Id = "";
  let win2Id = "";
  let and1Id = "";

  {
    // Create Windows v1.0.0 (active)
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "windows",
        version: "1.0.0",
        downloadUrl: "https://github.com/smartstore/releases/v1.0.0/Setup.exe",
        fileSize: "95 MB",
        status: "active",
        downloadEnabled: true,
        releaseNotesAr: "الإصدار الأولي",
        releaseNotesFr: "Version initiale",
      },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 201, "Creates Windows v1.0.0 active");
    win1Id = getBody()?.data?.id;
  }

  {
    // Create Android v1.0.0 (active)
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "android",
        version: "1.0.0",
        downloadUrl: "https://github.com/smartstore/releases/v1.0.0/app.apk",
        fileSize: "45 MB",
        status: "active",
        downloadEnabled: true,
      },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 201, "Creates Android v1.0.0 active");
    and1Id = getBody()?.data?.id;
  }

  {
    // Publish Windows v1.1.0 (active) -> Should automatically archive v1.0.0
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "POST",
      headers: { cookie: validCookie },
      body: {
        platform: "windows",
        version: "1.1.0",
        downloadUrl: "https://github.com/smartstore/releases/v1.1.0/Setup.exe",
        fileSize: "98 MB",
        status: "active",
        downloadEnabled: true,
      },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 201, "Publishes Windows v1.1.0 active");
    win2Id = getBody()?.data?.id;

    // Verify Windows v1.0.0 was archived, Android was untouched
    const win1 = mockReleases.find((r) => r.id === win1Id);
    const win2 = mockReleases.find((r) => r.id === win2Id);
    const and1 = mockReleases.find((r) => r.id === and1Id);

    assert(win1?.status === "archived", "Previous Windows release v1.0.0 is now archived");
    assert(win2?.status === "active", "New Windows release v1.1.0 is active");
    assert(and1?.status === "active", "Android release is unaffected by Windows update");
    assert(mockReleases.length === 3, "All 3 releases preserved in history (no deletion)");
  }

  // ===========================================================================
  // TEST SUITE 4: RETRIEVAL, PAGINATION, AND STATS AGGREGATION
  // ===========================================================================
  console.log("\n[4] Querying, Pagination, and Download Counts:");

  // Add 15 download events to win2 and 0 to win1
  for (let i = 0; i < 15; i++) {
    mockDownloadEvents.push({ id: i + 1, releaseId: win2Id });
  }

  {
    // Query all releases
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Fetches releases list successfully");

    const data = getBody()?.data;
    assert(data?.releases.length === 3, "Returns all 3 releases");
    assert(data?.pagination?.total === 3, "Pagination total is 3");

    // Check stats aggregation
    const win2Item = data?.releases.find((r: any) => r.id === win2Id);
    const win1Item = data?.releases.find((r: any) => r.id === win1Id);

    assert(win2Item?.downloadCount === 15, "Aggregates real download count (15 events)");
    assert(win2Item?.isCurrent === true, "Current active release has isCurrent = true");
    assert(win1Item?.downloadCount === 0, "Zero-event release displays exact 0 (no fake numbers)");
    assert(win1Item?.isCurrent === false, "Archived release has isCurrent = false");
  }

  // ===========================================================================
  // TEST SUITE 5: FILTERING (PLATFORM, STATUS, SEARCH)
  // ===========================================================================
  console.log("\n[5] Platform, Status, and Search Filters:");

  {
    // Platform Filter: Windows
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
      query: { platform: "windows" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Windows filter returns 200 OK");
    const list = getBody()?.data?.releases;
    assert(list?.length === 2, "Filters by platform=windows (2 releases)");
    assert(list?.every((r: any) => r.platform === "windows"), "All items are Windows");
  }

  {
    // Platform Filter: Android
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
      query: { platform: "android" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Android filter returns 200 OK");
    const list = getBody()?.data?.releases;
    assert(list?.length === 1, "Filters by platform=android (1 release)");
    assert(list?.[0]?.platform === "android", "Item is Android");
  }

  {
    // Status Filter: Archived
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
      query: { status: "archived" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Archived filter returns 200 OK");
    const list = getBody()?.data?.releases;
    assert(list?.length === 1, "Filters by status=archived (1 release)");
    assert(list?.[0]?.version === "1.0.0", "Archived item is v1.0.0");
  }

  {
    // Version Search Filter: search="1.1"
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
      query: { search: "1.1" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Search query returns 200 OK");
    const list = getBody()?.data?.releases;
    assert(list?.length === 1, "Search by version '1.1' finds exact match");
    assert(list?.[0]?.version === "1.1.0", "Matched release is v1.1.0");
  }

  // ===========================================================================
  // TEST SUITE 6: REACTIVATION & SINGLE-ACTIVE PRESERVATION
  // ===========================================================================
  console.log("\n[6] Reactivate Archived Release & Synchronization:");

  {
    // Reactivate Windows v1.0.0 (win1Id)
    const { res, getStatus } = createMockRes();
    const req = createMockReq({
      method: "PATCH",
      headers: { cookie: validCookie },
      query: { id: win1Id },
      body: { status: "active" },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Reactivates Windows v1.0.0 with 200 OK");

    const win1 = mockReleases.find((r) => r.id === win1Id);
    const win2 = mockReleases.find((r) => r.id === win2Id);

    assert(win1?.status === "active", "Windows v1.0.0 is now active");
    assert(win2?.status === "archived", "Windows v1.1.0 is automatically archived");
  }

  {
    // Stage 7 Synchronization Check:
    // Calling GET /api/admin/downloads should now return Windows v1.0.0 as active!
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "GET",
      headers: { cookie: validCookie },
    });
    await downloadsHandler(req as any, res as any);
    assert(getStatus() === 200, "Downloads endpoint returns 200 OK");
    assert(
      getBody()?.data?.windows?.version === "1.0.0",
      "Downloads endpoint automatically synchronizes to new active Windows version (1.0.0)",
    );
  }

  // ===========================================================================
  // TEST SUITE 7: EDIT METADATA & DOWNLOAD TOGGLE
  // ===========================================================================
  console.log("\n[7] Metadata Editing & Download Toggle:");

  {
    // Update release notes and file size
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "PATCH",
      headers: { cookie: validCookie },
      query: { id: win1Id },
      body: {
        fileSize: "96 MB",
        releaseNotesAr: "ملاحظات الإصدار المحدثة",
      },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Updates release metadata successfully");
    assert(getBody()?.data?.fileSize === "96 MB", "File size updated to 96 MB");
    assert(getBody()?.data?.releaseNotesAr === "ملاحظات الإصدار المحدثة", "Arabic notes updated");
  }

  {
    // Disable download availability
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({
      method: "PATCH",
      headers: { cookie: validCookie },
      query: { id: win1Id },
      body: { downloadEnabled: false },
    });
    await releasesHandler(req as any, res as any);
    assert(getStatus() === 200, "Toggles download availability to false");
    assert(getBody()?.data?.downloadEnabled === false, "downloadEnabled is false");
  }

  // ===========================================================================
  // TEST SUITE 8: AUDIT TRAILS & LOCALIZATION INTEGRITY
  // ===========================================================================
  console.log("\n[8] Audit Trails & Localization Verification:");

  {
    // Verify audit logs
    const actions = mockAuditLogs.map((l) => l.action);
    assert(actions.includes("release.created"), "Audit trail contains release.created");
    assert(actions.includes("release.activated"), "Audit trail contains release.activated");
    assert(actions.includes("download.disabled"), "Audit trail contains download.disabled");
  }

  {
    // Localization verification
    assert(Boolean(ar.admin.releases), "Arabic releases dictionary exists");
    assert(Boolean(fr.admin.releases), "French releases dictionary exists");
    assert(ar.admin.releases.allPlatforms === "الكل", "Arabic allPlatforms matches");
    assert(fr.admin.releases.allPlatforms === "Tous", "French allPlatforms matches");
    assert(ar.admin.releases.currentBadge === "الحالي", "Arabic currentBadge matches");
    assert(fr.admin.releases.currentBadge === "Actuel", "French currentBadge matches");
    assert(ar.admin.releases.statusActive === "نشط", "Arabic statusActive matches");
    assert(ar.admin.releases.statusArchived === "مؤرشف", "Arabic statusArchived matches");
    assert(fr.admin.releases.statusArchived === "Archivé", "French statusArchived matches");
  }

  console.log("==================================================");
  console.log(`🏁 STAGE 8 TESTS FINISHED: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL STAGE 8 RELEASES MANAGEMENT TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED");
    process.exit(1);
  }
}

runStage8Tests().catch((err) => {
  console.error("Test execution encountered an unhandled error:", err);
  process.exit(1);
});
