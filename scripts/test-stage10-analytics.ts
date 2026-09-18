import { setMockDb } from "../api/_lib/db";
import analyticsHandler from "../api/admin/analytics/index";
import analyticsSummaryHandler from "../api/admin/analytics/summary";
import analyticsTimeseriesHandler from "../api/admin/analytics/timeseries";
import analyticsReleasesHandler from "../api/admin/analytics/releases";
import { generateSessionToken, SESSION_COOKIE_NAME } from "../api/_lib/auth";
import {
  REPORTING_TIMEZONE,
  getAlgiersDateString,
  parseAlgiersDateToUtc,
  generateAlgiersDateSeries,
  getReportingIntervalCutoffs,
} from "../api/_lib/analytics";
import fs from "fs";
import path from "path";

function createMockReq(options: {
  method?: string;
  url?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
}): any {
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

async function runStage10Tests() {
  console.log("==================================================");
  console.log("🧪 TESTING STAGE 10: REAL ANALYTICS ENGINE & ADMIN DASHBOARD");
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

  // Setup test admin auth
  const mockAdminId = "99999999-9999-9999-9999-999999999999";
  const mockRawToken = generateSessionToken();
  const validAuthCookies = { [SESSION_COOKIE_NAME]: mockRawToken };

  interface MockRelease {
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

  interface MockDownloadEvent {
    id: number;
    releaseId: string;
    platform: string;
    version: string;
    createdAt: Date;
  }

  let mockReleases: MockRelease[] = [];
  let mockEvents: MockDownloadEvent[] = [];
  let shouldSimulateDbError = false;

  // Safe condition parser avoiding circular references
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
            if (op && (op.includes("=") || op.includes("<>") || op.includes("in"))) {
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

  function filterReleases(predicate: any): MockRelease[] {
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
      }
    }
    return result;
  }

  // Mock database query emulator
  const mockDb = {
    select(selection?: any) {
      return {
        from(table: any) {
          const tableName =
            (table as any)?.[Symbol.for("drizzle:Name")] ||
            table?._?.name ||
            table?.tableName ||
            "";

          if (shouldSimulateDbError) {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      limit() {
                        return Promise.reject(new Error("Simulated database connection crash"));
                      },
                    };
                  },
                };
              },
              where() {
                return Promise.reject(new Error("Simulated database connection crash"));
              },
              orderBy() {
                return Promise.reject(new Error("Simulated database connection crash"));
              },
              then() {
                return Promise.reject(new Error("Simulated database connection crash"));
              },
            };
          }

          // 1. Sessions table (auth check)
          if (tableName === "sessions" || String(tableName).includes("sessions")) {
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
            };
          }

          // 2. downloadEvents table
          if (tableName === "download_events" || String(tableName).includes("download_events")) {
            // Check if this is the summary conditional aggregation query
            if (
              selection &&
              typeof selection === "object" &&
              "totalDownloads" in selection &&
              "todayDownloads" in selection
            ) {
              const cutoffs = getReportingIntervalCutoffs();
              const totalDownloads = mockEvents.length;
              const todayDownloads = mockEvents.filter(
                (e) => e.createdAt >= cutoffs.todayStartUtc,
              ).length;
              const last7DaysDownloads = mockEvents.filter(
                (e) => e.createdAt >= cutoffs.sevenDaysAgoUtc,
              ).length;
              const last30DaysDownloads = mockEvents.filter(
                (e) => e.createdAt >= cutoffs.thirtyDaysAgoUtc,
              ).length;
              const windowsDownloads = mockEvents.filter((e) => e.platform === "windows").length;
              const androidDownloads = mockEvents.filter((e) => e.platform === "android").length;

              return Promise.resolve([
                {
                  totalDownloads,
                  todayDownloads,
                  last7DaysDownloads,
                  last30DaysDownloads,
                  windowsDownloads,
                  androidDownloads,
                },
              ]);
            }

            return {
              where(predicate?: any) {
                const isSingleReleaseCount =
                  selection && typeof selection === "object" && "count" in selection;

                const groupByHandler = (..._args: any[]) => {
                  return {
                    orderBy(..._orderArgs: any[]) {
                      // Grouping for timeseries: returns [{ dateStr, platform, count }]
                      const groups = new Map<string, number>();
                      for (const ev of mockEvents) {
                        const dateStr = getAlgiersDateString(ev.createdAt);
                        const key = `${dateStr}___${ev.platform}`;
                        groups.set(key, (groups.get(key) || 0) + 1);
                      }

                      const result = Array.from(groups.entries()).map(([key, count]) => {
                        const [dateStr, platform] = key.split("___");
                        return { dateStr, platform, count };
                      });
                      return Promise.resolve(result);
                    },
                    then(resolve: (val: any) => void) {
                      // Grouping for top releases (awaiting groupBy directly)
                      const countMap = new Map<string, number>();
                      for (const ev of mockEvents) {
                        if (ev.releaseId) {
                          countMap.set(ev.releaseId, (countMap.get(ev.releaseId) || 0) + 1);
                        }
                      }
                      const res = Array.from(countMap.entries()).map(([releaseId, count]) => ({
                        releaseId,
                        count,
                      }));
                      return resolve(res);
                    },
                  };
                };

                return {
                  groupBy: groupByHandler,
                  then(resolve: any) {
                    if (isSingleReleaseCount) {
                      const conds = parseConditions(predicate);
                      const relCond = conds.find((c) => c.col === "release_id");
                      const relId = relCond?.val;
                      const matching = relId
                        ? mockEvents.filter((e) => e.releaseId === relId)
                        : [];
                      return resolve([{ count: matching.length }]);
                    }
                    return resolve([]);
                  },
                };
              },
              orderBy(..._orderArgs: any[]) {
                return {
                  limit(limitNum: number) {
                    // Recent download activity
                    const sorted = [...mockEvents].sort(
                      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                    );
                    const sliced = sorted.slice(0, limitNum);
                    return Promise.resolve(
                      sliced.map((e) => ({
                        id: e.id,
                        platform: e.platform,
                        version: e.version,
                        createdAt: e.createdAt,
                      })),
                    );
                  },
                };
              },
            };
          }

          // 3. releases table
          if (tableName === "releases" || String(tableName).includes("releases")) {
            return {
              where(predicate?: any) {
                return {
                  orderBy(..._orderArgs: any[]) {
                    return {
                      limit(limitNum: number) {
                        let items = filterReleases(predicate);
                        // prefer active
                        items.sort((a, b) => {
                          if (a.status === "active" && b.status !== "active") return -1;
                          if (b.status === "active" && a.status !== "active") return 1;
                          return b.createdAt.getTime() - a.createdAt.getTime();
                        });
                        return Promise.resolve(items.slice(0, limitNum));
                      },
                    };
                  },
                };
              },
              then(resolve: any) {
                // Return all releases (for top releases mapping)
                return Promise.resolve(
                  mockReleases.map((r) => ({
                    id: r.id,
                    platform: r.platform,
                    version: r.version,
                    status: r.status,
                    downloadEnabled: r.downloadEnabled,
                    createdAt: r.createdAt,
                  })),
                ).then(resolve);
              },
            };
          }

          // Default fallback
          return Promise.resolve([]);
        },
      };
    },
  };

  // Connect mockDb
  setMockDb(mockDb);

  // =========================================================================
  // TEST 1: Method Restrictions & Authentication
  // =========================================================================
  console.log("\n[1] Authentication & Method Enforcement:");
  {
    // Rejects unauthenticated request with 401
    const { res, getStatus, getBody } = createMockRes();
    await analyticsHandler(createMockReq({ method: "GET" }), res);
    assert(getStatus() === 401, "Rejects unauthenticated GET /api/admin/analytics with 401");
    assert(getBody()?.code === "UNAUTHORIZED", "Error code is UNAUTHORIZED");

    // Rejects non-GET methods
    const { res: postRes, getStatus: getPostStatus, getHeaders: getPostHeaders } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "POST",
        cookies: validAuthCookies,
      }),
      postRes,
    );
    assert(getPostStatus() === 405, "Rejects POST /api/admin/analytics with 405 Method Not Allowed");
    assert(getPostHeaders()["allow"] === "GET", "Allow header enforces GET");

    // Rejects summary unauthenticated
    const { res: sumRes, getStatus: getSumStatus } = createMockRes();
    await analyticsSummaryHandler(createMockReq({ method: "GET" }), sumRes);
    assert(getSumStatus() === 401, "Rejects unauthenticated GET /api/admin/analytics/summary with 401");

    // Rejects timeseries unauthenticated
    const { res: tsRes, getStatus: getTsStatus } = createMockRes();
    await analyticsTimeseriesHandler(createMockReq({ method: "GET" }), tsRes);
    assert(getTsStatus() === 401, "Rejects unauthenticated GET /api/admin/analytics/timeseries with 401");

    // Rejects releases unauthenticated
    const { res: relRes, getStatus: getRelStatus } = createMockRes();
    await analyticsReleasesHandler(createMockReq({ method: "GET" }), relRes);
    assert(getRelStatus() === 401, "Rejects unauthenticated GET /api/admin/analytics/releases with 401");
  }

  // =========================================================================
  // TEST 2: Empty Database Behavior (Real Zero Metrics, No Fake Numbers)
  // =========================================================================
  console.log("\n[2] Empty Database Zero Metrics:");
  {
    mockReleases = [];
    mockEvents = [];

    const { res, getStatus, getBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "30d" },
      }),
      res,
    );

    assert(getStatus() === 200, "Returns 200 OK for empty database");
    const data = getBody()?.data;
    assert(data?.summary?.totalDownloads === 0, "totalDownloads is exact 0");
    assert(data?.summary?.todayDownloads === 0, "todayDownloads is exact 0");
    assert(data?.summary?.last7DaysDownloads === 0, "last7DaysDownloads is exact 0");
    assert(data?.summary?.last30DaysDownloads === 0, "last30DaysDownloads is exact 0");
    assert(data?.summary?.windowsDownloads === 0, "windowsDownloads is exact 0");
    assert(data?.summary?.androidDownloads === 0, "androidDownloads is exact 0");
    assert(data?.platforms?.windows === 0 && data?.platforms?.android === 0, "Platforms are 0");
    assert(data?.platforms?.windowsPercentage === 0, "Windows percentage is 0%");
    assert(data?.topReleases?.length === 0, "Top releases array is empty (no fake rankings)");
    assert(data?.recentActivity?.length === 0, "Recent activity is empty");
    assert(data?.currentReleases?.windows === null, "Current windows release is null");
    assert(data?.currentReleases?.android === null, "Current android release is null");

    // Check zero-filling for 30d timeseries
    assert(data?.timeseries?.length === 30, "Timeseries contains exactly 30 days for 30d range");
    const allZero = data?.timeseries?.every(
      (pt: any) => pt.total === 0 && pt.windows === 0 && pt.android === 0,
    );
    assert(allZero, "All missing days are zero-filled with 0 total, 0 windows, 0 android");
  }

  // =========================================================================
  // TEST 3: Range Parameter Validation & Timeseries Counts (7d, 30d, 90d)
  // =========================================================================
  console.log("\n[3] Date Range Validation & Time Series Periods:");
  {
    // Invalid range
    const { res: invRes, getStatus: getInvStatus, getBody: getInvBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "365d" },
      }),
      invRes,
    );
    assert(getInvStatus() === 400, "Rejects invalid range ?range=365d with 400");
    assert(getInvBody()?.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");

    // 7 days range
    const { res: res7, getBody: getBody7 } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "7d" },
      }),
      res7,
    );
    assert(getBody7()?.data?.timeseries?.length === 7, "7d range produces exactly 7 time-series points");

    // 30 days range
    const { res: res30, getBody: getBody30 } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "30d" },
      }),
      res30,
    );
    assert(getBody30()?.data?.timeseries?.length === 30, "30d range produces exactly 30 time-series points");

    // 90 days range
    const { res: res90, getBody: getBody90 } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "90d" },
      }),
      res90,
    );
    assert(getBody90()?.data?.timeseries?.length === 90, "90d range produces exactly 90 time-series points");
  }

  // =========================================================================
  // TEST 4: Timezone Semantics & Boundary Calculations (Africa/Algiers)
  // =========================================================================
  console.log("\n[4] Timezone Semantics & Africa/Algiers Calculations:");
  {
    assert(REPORTING_TIMEZONE === "Africa/Algiers", "Reporting timezone is strictly Africa/Algiers");

    // Verify date formatting in Algiers (+01:00)
    // 2026-09-17 23:30:00 UTC is 2026-09-18 00:30:00 in Algiers
    const dateUtcLate = new Date("2026-09-17T23:30:00.000Z");
    const algiersDateLate = getAlgiersDateString(dateUtcLate);
    assert(algiersDateLate === "2026-09-18", "23:30 UTC belongs to the NEXT day (00:30) in Algiers");

    // 2026-09-17 22:30:00 UTC is 2026-09-17 23:30:00 in Algiers
    const dateUtcEarly = new Date("2026-09-17T22:30:00.000Z");
    const algiersDateEarly = getAlgiersDateString(dateUtcEarly);
    assert(algiersDateEarly === "2026-09-17", "22:30 UTC belongs to 23:30 same day in Algiers");

    // Parse Algiers Date to UTC
    const utcParsed = parseAlgiersDateToUtc("2026-09-18");
    assert(
      utcParsed.toISOString() === "2026-09-17T23:00:00.000Z",
      "Algiers midnight converts to 23:00:00Z previous day UTC",
    );

    // Unbroken consecutive date series
    const series = generateAlgiersDateSeries(7, new Date("2026-09-18T12:00:00+01:00"));
    assert(series.length === 7, "Generated unbroken 7-day series");
    assert(series[6] === "2026-09-18", "Last item in series is today");
    assert(series[0] === "2026-09-12", "First item in 7-day series is 6 days prior");
  }

  // =========================================================================
  // TEST 5: Population with Real Events & KPI Aggregation
  // =========================================================================
  console.log("\n[5] Real KPI Aggregation & Event Calculation:");
  {
    const now = new Date();
    const cutoffs = getReportingIntervalCutoffs(now);

    const winRelId = "11111111-1111-1111-1111-111111111111";
    const andRelId = "22222222-2222-2222-2222-222222222222";
    const oldWinRelId = "33333333-3333-3333-3333-333333333333";

    mockReleases = [
      {
        id: winRelId,
        platform: "windows",
        version: "2.0.0",
        downloadUrl: "https://example.com/win2.exe",
        fileSize: "95 MB",
        releaseDate: "2026-09-15",
        releaseNotesAr: "إصدار حديث",
        releaseNotesFr: "Nouvelle version",
        status: "active",
        downloadEnabled: true,
        createdAt: new Date(now.getTime() - 2 * 86400000),
        updatedAt: new Date(),
      },
      {
        id: andRelId,
        platform: "android",
        version: "1.5.0",
        downloadUrl: "https://example.com/android.apk",
        fileSize: "40 MB",
        releaseDate: "2026-09-10",
        releaseNotesAr: "تحديث أندرويد",
        releaseNotesFr: "Mise à jour Android",
        status: "active",
        downloadEnabled: true,
        createdAt: new Date(now.getTime() - 5 * 86400000),
        updatedAt: new Date(),
      },
      {
        id: oldWinRelId,
        platform: "windows",
        version: "1.0.0",
        downloadUrl: "https://example.com/win1.exe",
        fileSize: "80 MB",
        releaseDate: "2026-08-01",
        releaseNotesAr: null,
        releaseNotesFr: null,
        status: "archived",
        downloadEnabled: false,
        createdAt: new Date(now.getTime() - 40 * 86400000),
        updatedAt: new Date(),
      },
    ];

    // Seed download events:
    // Today: 4 Windows, 2 Android = 6 total
    // 3 days ago (in 7d): 5 Windows, 3 Android = 8 total
    // 15 days ago (in 30d): 3 Windows, 1 Android = 4 total
    // 50 days ago (in 90d): 2 Windows (old release) = 2 total
    // Total all time: 20 total (14 Windows, 6 Android)
    mockEvents = [
      // Today
      { id: 1, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(cutoffs.todayStartUtc.getTime() + 1000) },
      { id: 2, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(cutoffs.todayStartUtc.getTime() + 2000) },
      { id: 3, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(cutoffs.todayStartUtc.getTime() + 3000) },
      { id: 4, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(cutoffs.todayStartUtc.getTime() + 4000) },
      { id: 5, releaseId: andRelId, platform: "android", version: "1.5.0", createdAt: new Date(cutoffs.todayStartUtc.getTime() + 5000) },
      { id: 6, releaseId: andRelId, platform: "android", version: "1.5.0", createdAt: new Date(cutoffs.todayStartUtc.getTime() + 6000) },

      // 3 days ago (within 7d and 30d)
      { id: 7, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 8, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 9, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 10, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 11, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 12, releaseId: andRelId, platform: "android", version: "1.5.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 13, releaseId: andRelId, platform: "android", version: "1.5.0", createdAt: new Date(now.getTime() - 3 * 86400000) },
      { id: 14, releaseId: andRelId, platform: "android", version: "1.5.0", createdAt: new Date(now.getTime() - 3 * 86400000) },

      // 15 days ago (within 30d)
      { id: 15, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 15 * 86400000) },
      { id: 16, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 15 * 86400000) },
      { id: 17, releaseId: winRelId, platform: "windows", version: "2.0.0", createdAt: new Date(now.getTime() - 15 * 86400000) },
      { id: 18, releaseId: andRelId, platform: "android", version: "1.5.0", createdAt: new Date(now.getTime() - 15 * 86400000) },

      // 50 days ago (within 90d, outside 30d)
      { id: 19, releaseId: oldWinRelId, platform: "windows", version: "1.0.0", createdAt: new Date(now.getTime() - 50 * 86400000) },
      { id: 20, releaseId: oldWinRelId, platform: "windows", version: "1.0.0", createdAt: new Date(now.getTime() - 50 * 86400000) },
    ];

    const { res, getStatus, getBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "30d" },
      }),
      res,
    );

    assert(getStatus() === 200, "Returns 200 OK for populated analytics");
    const data = getBody()?.data;

    // Total counts verification
    assert(data?.summary?.totalDownloads === 20, "Total downloads equals 20");
    assert(data?.summary?.todayDownloads === 6, "Today downloads equals 6");
    assert(data?.summary?.last7DaysDownloads === 14, "Last 7 days downloads equals 14 (6 + 8)");
    assert(data?.summary?.last30DaysDownloads === 18, "Last 30 days downloads equals 18 (6 + 8 + 4)");
    assert(data?.summary?.windowsDownloads === 14, "Windows downloads equals 14 (4 + 5 + 3 + 2)");
    assert(data?.summary?.androidDownloads === 6, "Android downloads equals 6 (2 + 3 + 1)");

    // Platform summation check
    assert(
      data?.summary?.totalDownloads ===
        data?.summary?.windowsDownloads + data?.summary?.androidDownloads,
      "totalDownloads strictly equals windowsDownloads + androidDownloads",
    );

    // Platform percentage check
    assert(data?.platforms?.windowsPercentage === 70, "Windows is 70.0% (14/20)");
    assert(data?.platforms?.androidPercentage === 30, "Android is 30.0% (6/20)");
  }

  // =========================================================================
  // TEST 6: Top Releases, Invariants & Release With Zero Downloads
  // =========================================================================
  console.log("\n[6] Top Releases & Zero Downloads Handling:");
  {
    // Add a release with 0 downloads to mockReleases
    const zeroDownloadReleaseId = "44444444-4444-4444-4444-444444444444";
    mockReleases.push({
      id: zeroDownloadReleaseId,
      platform: "windows",
      version: "3.0.0-beta",
      downloadUrl: "https://example.com/win3beta.exe",
      fileSize: "105 MB",
      releaseDate: "2026-09-17",
      releaseNotesAr: null,
      releaseNotesFr: null,
      status: "draft",
      downloadEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { res, getBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
      }),
      res,
    );

    const topReleases = getBody()?.data?.topReleases;
    assert(Array.isArray(topReleases), "topReleases is an array");
    assert(topReleases[0]?.version === "2.0.0", "Top release #1 is v2.0.0 (highest count: 12)");
    assert(topReleases[0]?.downloadCount === 12, "v2.0.0 has exact 12 downloads");

    // Check release with zero downloads
    const zeroRel = topReleases.find((r: any) => r.id === zeroDownloadReleaseId);
    assert(zeroRel !== undefined, "Release with zero downloads is included in list");
    assert(zeroRel?.downloadCount === 0, "Release with zero downloads displays exact 0 (not null or fake)");

    // Verify ordering is strictly descending
    let isDescending = true;
    for (let i = 0; i < topReleases.length - 1; i++) {
      if (topReleases[i].downloadCount < topReleases[i + 1].downloadCount) {
        isDescending = false;
        break;
      }
    }
    assert(isDescending, "Top releases are sorted descending by real downloadCount");
  }

  // =========================================================================
  // TEST 7: Current Active Releases in Dashboard & Analytics
  // =========================================================================
  console.log("\n[7] Current Active Releases:");
  {
    const { res, getBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
      }),
      res,
    );

    const current = getBody()?.data?.currentReleases;
    assert(current?.windows?.version === "2.0.0", "Current Windows release is v2.0.0");
    assert(current?.windows?.status === "active", "Current Windows release status is active");
    assert(current?.windows?.downloadEnabled === true, "Current Windows release is enabled");
    assert(current?.android?.version === "1.5.0", "Current Android release is v1.5.0");
    assert(current?.android?.status === "active", "Current Android release status is active");
  }

  // =========================================================================
  // TEST 8: Privacy & Security Guarantees (No PII, No Raw URLs)
  // =========================================================================
  console.log("\n[8] Privacy & Security Guarantees:");
  {
    const { res, getBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
      }),
      res,
    );

    const payloadStr = JSON.stringify(getBody());

    // 1. Never exposes IP address
    assert(!payloadStr.includes("ipAddress") && !payloadStr.includes("client_ip"), "Never exposes IP addresses");

    // 2. Never exposes user agents or fingerprints
    assert(!payloadStr.includes("userAgent") && !payloadStr.includes("fingerprint"), "Never exposes user agents or fingerprints");

    // 3. Never exposes raw download URLs
    assert(!payloadStr.includes(".exe") && !payloadStr.includes(".apk"), "Never exposes raw destination download URLs in analytics payload");

    // 4. Checks recent activity structure
    const recent = getBody()?.data?.recentActivity;
    assert(recent?.length > 0, "Recent activity returns items");
    const first = recent[0];
    assert("platform" in first && "version" in first && "createdAt" in first, "Recent activity records only platform, version, and createdAt");
    assert(!("ip" in first) && !("userAgent" in first), "Recent activity items contain zero PII");
  }

  // =========================================================================
  // TEST 9: Sub-endpoints Testing (/summary, /timeseries, /releases)
  // =========================================================================
  console.log("\n[9] Dedicated Sub-Endpoints:");
  {
    // GET /api/admin/analytics/summary
    const { res: sumRes, getStatus: sumStatus, getBody: sumBody } = createMockRes();
    await analyticsSummaryHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
      }),
      sumRes,
    );
    assert(sumStatus() === 200, "GET /api/admin/analytics/summary returns 200 OK");
    assert(sumBody()?.data?.summary?.totalDownloads === 20, "Summary total matches 20");
    assert(sumBody()?.data?.timezone === "Africa/Algiers", "Summary timezone is Africa/Algiers");

    // GET /api/admin/analytics/timeseries?range=7d
    const { res: tsRes, getStatus: tsStatus, getBody: tsBody } = createMockRes();
    await analyticsTimeseriesHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
        query: { range: "7d" },
      }),
      tsRes,
    );
    assert(tsStatus() === 200, "GET /api/admin/analytics/timeseries returns 200 OK");
    assert(tsBody()?.data?.timeseries?.length === 7, "Timeseries sub-endpoint returns 7 items");

    // GET /api/admin/analytics/releases
    const { res: relRes, getStatus: relStatus, getBody: relBody } = createMockRes();
    await analyticsReleasesHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
      }),
      relRes,
    );
    assert(relStatus() === 200, "GET /api/admin/analytics/releases returns 200 OK");
    assert(Array.isArray(relBody()?.data?.topReleases), "Releases sub-endpoint returns topReleases array");
  }

  // =========================================================================
  // TEST 10: Database Error Safety
  // =========================================================================
  console.log("\n[10] Database Error Safety:");
  {
    shouldSimulateDbError = true;
    const { res: errRes, getStatus: errStatus, getBody: errBody } = createMockRes();
    await analyticsHandler(
      createMockReq({
        method: "GET",
        cookies: validAuthCookies,
      }),
      errRes,
    );
    assert(
      errStatus() === 500 || errStatus() === 503,
      "Returns 500 or 503 on database connection failure",
    );
    assert(errBody()?.ok === false, "ok is false on error");
    assert(
      errBody()?.code === "DATABASE_UNAVAILABLE" || errBody()?.code === "INTERNAL_SERVER_ERROR",
      "Error code indicates database error safely without leaking SQL internals",
    );
    shouldSimulateDbError = false;
  }

  // =========================================================================
  // TEST 11: Source Code & Integrity Audit
  // =========================================================================
  console.log("\n[11] Frontend Source Code & Architecture Verification:");
  {
    const dashboardPath = path.resolve("src/components/admin/AdminDashboardPage.tsx");
    const dashboardContent = fs.readFileSync(dashboardPath, "utf-8");

    assert(
      dashboardContent.includes("getAnalyticsSummary"),
      "AdminDashboardPage uses real getAnalyticsSummary() API call",
    );
    assert(
      !dashboardContent.includes("Math.random()"),
      "AdminDashboardPage has zero Math.random() calls",
    );

    const analyticsPath = path.resolve("src/components/admin/AdminAnalyticsPage.tsx");
    const analyticsContent = fs.readFileSync(analyticsPath, "utf-8");

    assert(
      analyticsContent.includes("getAnalytics"),
      "AdminAnalyticsPage uses real getAnalytics() API call",
    );
    assert(
      !analyticsContent.includes("Math.random()"),
      "AdminAnalyticsPage has zero Math.random() calls",
    );

    const chartPath = path.resolve("src/components/admin/AnalyticsChart.tsx");
    const chartContent = fs.readFileSync(chartPath, "utf-8");

    assert(
      !chartContent.includes("Math.random()"),
      "AnalyticsChart has zero Math.random() calls",
    );
    assert(
      chartContent.includes("sr-only"),
      "AnalyticsChart includes screen-reader accessible data table fallback",
    );
    assert(
      chartContent.includes('role="region"'),
      "AnalyticsChart includes accessible ARIA role and label",
    );

    const appPath = path.resolve("src/App.tsx");
    const appContent = fs.readFileSync(appPath, "utf-8");

    assert(
      appContent.includes("AdminAnalyticsPage"),
      "App.tsx routes /admin/analytics to real AdminAnalyticsPage",
    );
    assert(
      appContent.includes('lazy(() => import("@/components/admin/AdminAnalyticsPage"))'),
      "AdminAnalyticsPage is loaded with route-level code-splitting (lazy)",
    );

    // Semantics check: metric labeled downloads/requests, not installations/users
    assert(
      !dashboardContent.includes("Installations") && !dashboardContent.includes("المثبتة"),
      "Semantics strictly respect 'Downloads' (never 'Installations' or 'Users')",
    );
  }

  console.log("\n==================================================");
  console.log(`🏁 STAGE 10 TESTS FINISHED: ${passed}/${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL STAGE 10 ANALYTICS & DASHBOARD TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error(`⚠️ SOME TESTS FAILED: ${total - passed} failure(s)`);
    process.exit(1);
  }
}

runStage10Tests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
