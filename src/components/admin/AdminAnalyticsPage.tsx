import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  Download,
  Monitor,
  Smartphone,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  Package,
  Layers,
  CheckCircle2,
  Archive,
  FileCode2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import {
  getAnalytics,
  type AnalyticsResponseData,
  AnalyticsApiError,
} from "@/services/analyticsService";
import { AnalyticsChart } from "./AnalyticsChart";

export default function AdminAnalyticsPage() {
  const { t, locale } = useI18n();
  const { logout } = useAuth();
  const isAr = locale === "ar";
  const dict = t.admin.analytics;

  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<AnalyticsResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(
    async (selectedRange: "7d" | "30d" | "90d") => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await getAnalytics(selectedRange);
        setData(response);
      } catch (err: any) {
        console.error("Failed to fetch analytics:", err);
        if (err instanceof AnalyticsApiError && err.statusCode === 401) {
          logout();
          return;
        }
        setErrorMessage(dict.errorLoading);
      } finally {
        setIsLoading(false);
      }
    },
    [dict.errorLoading, logout],
  );

  useEffect(() => {
    fetchAnalyticsData(range);
  }, [range, fetchAnalyticsData]);

  // Format helpers
  const formatNumber = (num: number) =>
    new Intl.NumberFormat(isAr ? "ar-DZ" : "fr-DZ").format(num);

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-DZ", {
        timeZone: "Africa/Algiers",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Compute daily average for current range
  const dailyAverage = useMemo(() => {
    if (!data || data.timeseries.length === 0) return 0;
    const totalInRange = data.timeseries.reduce((acc, pt) => acc + pt.total, 0);
    return Math.round((totalInRange / data.timeseries.length) * 10) / 10;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Range Controls */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-400">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{dict.timezoneBadge}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {dict.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">{dict.subtitle}</p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setRange("7d")}
            disabled={isLoading}
            aria-pressed={range === "7d"}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              range === "7d"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {dict.range7d}
          </button>
          <button
            type="button"
            onClick={() => setRange("30d")}
            disabled={isLoading}
            aria-pressed={range === "30d"}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              range === "30d"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {dict.range30d}
          </button>
          <button
            type="button"
            onClick={() => setRange("90d")}
            disabled={isLoading}
            aria-pressed={range === "90d"}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              range === "90d"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {dict.range90d}
          </button>
        </div>
      </section>

      {/* Error Banner with Retry */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalyticsData(range)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{dict.retry}</span>
          </button>
        </div>
      )}

      {/* 2. KPI Summary Cards Strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{dict.kpiTotal}</span>
            <Download className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {isLoading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-slate-800" />
            ) : (
              formatNumber(data?.summary.totalDownloads ?? 0)
            )}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            {isAr ? "جميع الفترات" : "Toutes périodes"}
          </span>
        </div>

        {/* Today Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{dict.kpiToday}</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-400">
            {isLoading ? (
              <div className="h-7 w-12 animate-pulse rounded bg-slate-800" />
            ) : (
              formatNumber(data?.summary.todayDownloads ?? 0)
            )}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            {isAr ? "توقيت الجزائر" : "Heure d'Algérie"}
          </span>
        </div>

        {/* Windows Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{dict.kpiWindows}</span>
            <Monitor className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-cyan-400">
            {isLoading ? (
              <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
            ) : (
              formatNumber(data?.summary.windowsDownloads ?? 0)
            )}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            {data?.platforms ? `${data.platforms.windowsPercentage}%` : "0%"}
          </span>
        </div>

        {/* Android Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{dict.kpiAndroid}</span>
            <Smartphone className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-teal-400">
            {isLoading ? (
              <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
            ) : (
              formatNumber(data?.summary.androidDownloads ?? 0)
            )}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            {data?.platforms ? `${data.platforms.androidPercentage}%` : "0%"}
          </span>
        </div>

        {/* Daily Average Card */}
        <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{dict.kpiDailyAvg}</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-purple-400">
            {isLoading ? (
              <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
            ) : (
              formatNumber(dailyAverage)
            )}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            {range === "7d" ? dict.range7d : range === "90d" ? dict.range90d : dict.range30d}
          </span>
        </div>
      </section>

      {/* 3. Main Chart: Downloads Over Time */}
      <AnalyticsChart data={data?.timeseries ?? []} isLoading={isLoading} />

      {/* 4. Secondary Grid: Platform Breakdown & Top Releases */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Platform Breakdown */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Layers className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">{dict.platformBreakdownTitle}</h3>
          </div>

          <div className="mt-5 space-y-4">
            {/* Windows Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Windows</span>
                </span>
                <span className="font-bold text-white">
                  {formatNumber(data?.platforms.windows ?? 0)}{" "}
                  <span className="text-slate-500 font-normal">
                    ({data?.platforms.windowsPercentage ?? 0}%)
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${data?.platforms.windowsPercentage ?? 0}%` }}
                />
              </div>
            </div>

            {/* Android Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Android</span>
                </span>
                <span className="font-bold text-white">
                  {formatNumber(data?.platforms.android ?? 0)}{" "}
                  <span className="text-slate-500 font-normal">
                    ({data?.platforms.androidPercentage ?? 0}%)
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${data?.platforms.androidPercentage ?? 0}%` }}
                />
              </div>
            </div>

            <p className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/60">
              {dict.platformBreakdownSubtitle}
            </p>
          </div>
        </div>

        {/* Top Releases */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">{dict.topReleasesTitle}</h3>
            </div>
            <span className="text-[11px] text-slate-500">{dict.topReleasesSubtitle}</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            {!data || data.topReleases.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-4 text-center">
                <p className="text-xs font-semibold text-slate-400">
                  {dict.emptyTopReleasesTitle}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {dict.emptyTopReleasesDesc}
                </p>
              </div>
            ) : (
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 text-start font-medium">{dict.tableVersion}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{dict.tablePlatform}</th>
                    <th className="py-2.5 px-3 text-start font-medium">{dict.tableStatus}</th>
                    <th className="py-2.5 px-3 text-end font-medium">{dict.tableDownloads}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.topReleases.map((release) => (
                    <tr key={release.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        v{release.version}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            release.platform === "windows"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {release.platform === "windows" ? (
                            <Monitor className="h-3 w-3" />
                          ) : (
                            <Smartphone className="h-3 w-3" />
                          )}
                          <span className="capitalize">{release.platform}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {release.status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>{isAr ? "نشط" : "Actif"}</span>
                          </span>
                        ) : release.status === "archived" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
                            <Archive className="h-2.5 w-2.5" />
                            <span>{isAr ? "مؤرشف" : "Archivé"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                            <FileCode2 className="h-2.5 w-2.5" />
                            <span>{isAr ? "مسودة" : "Brouillon"}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-end font-bold text-white font-mono">
                        {formatNumber(release.downloadCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* 5. Privacy-Safe Recent Activity Feed */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">{dict.recentActivityTitle}</h3>
          </div>
          <span className="text-[11px] text-slate-500">{dict.recentActivitySubtitle}</span>
        </div>

        <div className="mt-4">
          {!data || data.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              {dict.emptyRecentActivity}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {data.recentActivity.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-lg p-1.5 ${
                        ev.platform === "windows"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {ev.platform === "windows" ? (
                        <Monitor className="h-3.5 w-3.5" />
                      ) : (
                        <Smartphone className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div>
                      <span className="font-semibold text-white capitalize">
                        {ev.platform} v{ev.version}
                      </span>
                      <p className="text-[10px] text-slate-500">{dict.downloadRequest}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {formatTimestamp(ev.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
