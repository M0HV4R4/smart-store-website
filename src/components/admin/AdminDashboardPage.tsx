import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Package,
  Globe,
  Settings,
  Server,
  ArrowUpRight,
  Database,
  BarChart3,
  Calendar,
  Clock,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";
import {
  getAnalyticsSummary,
  type AnalyticsSummaryResponseData,
  AnalyticsApiError,
} from "@/services/analyticsService";

export default function AdminDashboardPage() {
  const { admin, logout } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.dashboard;

  const username = admin?.username || (isAr ? "المسؤول" : "Administrateur");
  const welcomeText = dict.welcome.replace("{username}", username);

  const [data, setData] = useState<AnalyticsSummaryResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummaryData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const summary = await getAnalyticsSummary();
      setData(summary);
    } catch (err: any) {
      console.error("Failed to load dashboard summary:", err);
      if (err instanceof AnalyticsApiError && err.statusCode === 401) {
        logout();
        return;
      }
      setErrorMessage(dict.errorLoading);
    } finally {
      setIsLoading(false);
    }
  }, [dict.errorLoading, logout]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat(isAr ? "ar-DZ" : "fr-DZ").format(num);

  const quickActions = [
    {
      to: "/admin/analytics",
      label: t.admin.nav.analytics,
      desc: isAr
        ? "استعراض الرسوم البيانية وتطور التحميلات وحركة المنصات بالتفصيل"
        : "Explorer les graphiques d'évolution et les métriques détaillées",
      icon: BarChart3,
      color: "from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30",
    },
    {
      to: "/admin/releases",
      label: t.admin.nav.releases,
      desc: isAr
        ? "سجل الإصدارات ونشر نسخ جديدة لـ Windows و Android"
        : "Historique des versions et publication des mises à jour",
      icon: Package,
      color: "from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/30",
    },
    {
      to: "/admin/downloads",
      label: t.admin.nav.downloads,
      desc: isAr
        ? "تكوين وتعديل روابط الإصدارات النشطة الحالية"
        : "Configuration et liens des versions actives actuelles",
      icon: Download,
      color: "from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30",
    },
    {
      to: "/admin/website",
      label: t.admin.nav.website,
      desc: isAr
        ? "تعديل نصوص الموقع وأرقام التواصل الاجتماعي"
        : "Modifier les contenus du site et coordonnées de contact",
      icon: Globe,
      color: "from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-500/30",
    },
    {
      to: "/admin/settings",
      label: t.admin.nav.settings,
      desc: isAr
        ? "إعدادات المنظومة وتفضيلات التشغيل العامة"
        : "Paramètres globaux du système et préférences",
      icon: Settings,
      color: "from-slate-600/20 to-slate-700/20 text-slate-300 border-slate-700/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Status Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 end-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {dict.activeStatus} &bull; {dict.systemStatus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {welcomeText}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">{dict.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-300">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Neon PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-300">
              <Server className="h-3.5 w-3.5 text-blue-400" />
              <span>Vercel Serverless</span>
            </div>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={loadSummaryData}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{dict.retry}</span>
          </button>
        </div>
      )}

      {/* 2. Real Operational KPI Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {dict.kpisTitle}
            </h2>
            <p className="text-xs text-slate-400">{dict.kpisSubtitle}</p>
          </div>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>{dict.viewAnalytics}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Total Downloads */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{dict.totalDownloads}</span>
              <Download className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
              {isLoading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-800" />
              ) : (
                formatNumber(data?.summary.totalDownloads ?? 0)
              )}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              {dict.downloadRequests}
            </span>
          </div>

          {/* Today */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{dict.todayDownloads}</span>
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-400">
              {isLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-slate-800" />
              ) : (
                formatNumber(data?.summary.todayDownloads ?? 0)
              )}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              {isAr ? "اليوم الحالي" : "Aujourd'hui"}
            </span>
          </div>

          {/* Last 7 Days */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{dict.last7Days}</span>
              <Clock className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-purple-400">
              {isLoading ? (
                <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
              ) : (
                formatNumber(data?.summary.last7DaysDownloads ?? 0)
              )}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              {isAr ? "7 أيام" : "7 jours"}
            </span>
          </div>

          {/* Last 30 Days */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{dict.last30Days}</span>
              <BarChart3 className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-amber-400">
              {isLoading ? (
                <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
              ) : (
                formatNumber(data?.summary.last30DaysDownloads ?? 0)
              )}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              {isAr ? "30 يومًا" : "30 jours"}
            </span>
          </div>

          {/* Windows */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{dict.windowsDownloads}</span>
              <Monitor className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-cyan-400">
              {isLoading ? (
                <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
              ) : (
                formatNumber(data?.summary.windowsDownloads ?? 0)
              )}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              {data?.platforms ? `${data.platforms.windowsPercentage}%` : "0%"}
            </span>
          </div>

          {/* Android */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{dict.androidDownloads}</span>
              <Smartphone className="h-4 w-4 text-teal-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-teal-400">
              {isLoading ? (
                <div className="h-7 w-14 animate-pulse rounded bg-slate-800" />
              ) : (
                formatNumber(data?.summary.androidDownloads ?? 0)
              )}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              {data?.platforms ? `${data.platforms.androidPercentage}%` : "0%"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Current Releases Status Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {dict.currentReleasesTitle}
            </h2>
            <p className="text-xs text-slate-400">{dict.currentReleasesSubtitle}</p>
          </div>
          <Link
            to="/admin/downloads"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>{dict.manageDownloads}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Windows Current Release */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Monitor className="h-4 w-4" />
                  <span>{dict.activeWindowsRelease}</span>
                </span>
                {data?.currentReleases?.windows?.downloadEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>{isAr ? "متاح للتحميل" : "Disponible"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                    <XCircle className="h-2.5 w-2.5" />
                    <span>{isAr ? "معطل" : "Désactivé"}</span>
                  </span>
                )}
              </div>

              <div className="mt-3">
                {isLoading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
                ) : data?.currentReleases?.windows ? (
                  <div className="space-y-1">
                    <p className="text-base font-black text-white font-mono">
                      v{data.currentReleases.windows.version}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isAr ? "إجمالي التحميلات المسجلة:" : "Téléchargements totaux :"}{" "}
                      <span className="font-bold text-white font-mono">
                        {formatNumber(data.currentReleases.windows.downloadCount)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">{dict.noActiveRelease}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {data?.currentReleases?.windows?.releaseDate
                  ? `${isAr ? "تاريخ الإصدار:" : "Date :"} ${data.currentReleases.windows.releaseDate}`
                  : ""}
              </span>
              <Link
                to="/admin/downloads"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
              >
                <span>{dict.manageDownloads}</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Android Current Release */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Smartphone className="h-4 w-4" />
                  <span>{dict.activeAndroidRelease}</span>
                </span>
                {data?.currentReleases?.android?.downloadEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>{isAr ? "متاح للتحميل" : "Disponible"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                    <XCircle className="h-2.5 w-2.5" />
                    <span>{isAr ? "معطل" : "Désactivé"}</span>
                  </span>
                )}
              </div>

              <div className="mt-3">
                {isLoading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
                ) : data?.currentReleases?.android ? (
                  <div className="space-y-1">
                    <p className="text-base font-black text-white font-mono">
                      v{data.currentReleases.android.version}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isAr ? "إجمالي التحميلات المسجلة:" : "Téléchargements totaux :"}{" "}
                      <span className="font-bold text-white font-mono">
                        {formatNumber(data.currentReleases.android.downloadCount)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">{dict.noActiveRelease}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {data?.currentReleases?.android?.releaseDate
                  ? `${isAr ? "تاريخ الإصدار:" : "Date :"} ${data.currentReleases.android.releaseDate}`
                  : ""}
              </span>
              <Link
                to="/admin/downloads"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
              >
                <span>{dict.manageDownloads}</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quick Navigation Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {dict.quickLinks}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/80"
              >
                <div>
                  <div className={`mb-3 inline-flex rounded-lg border p-2 ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    {action.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-medium text-slate-500 group-hover:text-blue-400 transition-colors">
                  <span>{isAr ? "فتح القسم" : "Accéder"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
