import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  FileText,
  ShieldAlert,
  Download,
  Package,
  Globe,
  Lock,
} from "lucide-react";
import {
  getActivityLogs,
  type AuditLogItem,
  type ActivityPagination,
  ActivityApiError,
} from "@/services/activityService";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

// Action localized mapping dictionary
const ACTION_LABELS_AR: Record<string, string> = {
  "auth.login.success": "تسجيل دخول ناجح",
  "admin.login": "تسجيل دخول مسؤول",
  "auth.password.changed": "تغيير كلمة المرور",
  "admin.password_changed": "تغيير كلمة المرور",
  "session.revoked": "إنهاء جلسة نشطة",
  "session.others_revoked": "إنهاء جميع الجلسات الأخرى",
  "release.created": "نشر إصدار جديد",
  "release.activated": "تفعيل إصدار للتحميل",
  "release.archived": "أرشفة إصدار",
  "release.updated": "تعديل بيانات إصدار",
  "download.enabled": "تفعيل التحميل للزوار",
  "download.disabled": "تعطيل التحميل للزوار",
  "website.contact.updated": "تحديث معلومات التواصل",
  "website.whatsapp.enabled": "تفعيل قناة واتساب",
  "website.whatsapp.disabled": "تعطيل قناة واتساب",
  "website.facebook.enabled": "تفعيل رابط فيسبوك",
  "website.facebook.disabled": "تعطيل رابط فيسبوك",
  "website.instagram.enabled": "تفعيل رابط إنستغرام",
  "website.instagram.disabled": "تعطيل رابط إنستغرام",
};

const ACTION_LABELS_FR: Record<string, string> = {
  "auth.login.success": "Connexion réussie",
  "admin.login": "Connexion administrateur",
  "auth.password.changed": "Mot de passe modifié",
  "admin.password_changed": "Mot de passe modifié",
  "session.revoked": "Session révoquée",
  "session.others_revoked": "Autres sessions révoquées",
  "release.created": "Nouvelle version publiée",
  "release.activated": "Version activée pour le public",
  "release.archived": "Version archivée",
  "release.updated": "Données de version mises à jour",
  "download.enabled": "Téléchargement activé",
  "download.disabled": "Téléchargement désactivé",
  "website.contact.updated": "Paramètres de contact mis à jour",
  "website.whatsapp.enabled": "Canal WhatsApp activé",
  "website.whatsapp.disabled": "Canal WhatsApp désactivé",
  "website.facebook.enabled": "Lien Facebook activé",
  "website.facebook.disabled": "Lien Facebook désactivé",
  "website.instagram.enabled": "Lien Instagram activé",
  "website.instagram.disabled": "Lien Instagram désactivé",
};

// Category styling config
const CATEGORY_STYLES: Record<string, { labelAr: string; labelFr: string; color: string; icon: any }> = {
  auth: {
    labelAr: "المصادقة",
    labelFr: "Authentification",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Lock,
  },
  releases: {
    labelAr: "الإصدارات",
    labelFr: "Versions",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Package,
  },
  downloads: {
    labelAr: "التحميلات",
    labelFr: "Téléchargements",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Download,
  },
  website: {
    labelAr: "الموقع",
    labelFr: "Site Web",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Globe,
  },
  security: {
    labelAr: "الأمان",
    labelFr: "Sécurité",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: ShieldAlert,
  },
};

export default function AdminActivityPage() {
  const { checkSession } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.activity;

  // Data state
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<ActivityPagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Selected item for details modal
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null);

  // Fetch activity logs
  const fetchActivity = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getActivityLogs({
        page,
        pageSize: 20,
        category: category !== "all" ? category : undefined,
        search: activeSearch ? activeSearch : undefined,
      });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      if (err instanceof ActivityApiError && err.statusCode === 401) {
        checkSession();
        return;
      }
      setLoadError(err instanceof Error ? err.message : dict.errorLoading);
    } finally {
      setIsLoading(false);
    }
  }, [checkSession, dict.errorLoading, page, category, activeSearch]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Close details modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItem) {
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchTerm.trim());
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setPage(1);
  };

  // Safe fallback formatter for unknown action names
  const formatActionName = (action: string) => {
    const dictMap = isAr ? ACTION_LABELS_AR : ACTION_LABELS_FR;
    if (dictMap[action]) return dictMap[action];

    // Fallback: split by dot and capitalize words safely
    return action
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  // Determine category key for an item
  const getItemCategory = (item: AuditLogItem): string => {
    if (item.action.startsWith("auth.") || item.action.startsWith("admin.login")) return "auth";
    if (item.action.startsWith("release.") || item.entityType === "release") return "releases";
    if (item.action.startsWith("download.") || item.entityType === "download") return "downloads";
    if (item.action.startsWith("website.") || item.entityType === "content" || item.entityType === "setting") return "website";
    if (item.action.startsWith("session.") || item.action.includes("password") || item.entityType === "session") return "security";
    return "security";
  };

  // Format date in Africa/Algiers timezone
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-FR", {
        timeZone: "Africa/Algiers",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Activity className="size-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              {dict.title}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {dict.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchActivity}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{dict.refresh}</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: dict.all },
            { id: "auth", label: dict.auth },
            { id: "releases", label: dict.releases },
            { id: "downloads", label: dict.downloads },
            { id: "website", label: dict.website },
            { id: "security", label: dict.security },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                category === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 ps-9 pe-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
            <Search className="size-3.5" />
          </span>
        </form>
      </div>

      {/* Main Table / Event List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-500">{isAr ? "جارٍ تحميل السجلات..." : "Chargement..."}</p>
          </div>
        ) : loadError ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto size-8 text-rose-500" />
            <p className="mt-2 text-sm font-semibold text-rose-700">{loadError}</p>
            <button
              type="button"
              onClick={fetchActivity}
              className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              {dict.retry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">{dict.emptyTitle}</h3>
            <p className="mt-1 text-xs text-slate-500">{dict.emptyDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-start">{dict.colAction}</th>
                  <th className="px-4 py-3 text-start">{dict.colActor}</th>
                  <th className="px-4 py-3 text-start">{dict.colTime}</th>
                  <th className="px-4 py-3 text-center">{dict.colDetails}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const catKey = getItemCategory(item);
                  const style = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.security;
                  const Icon = style.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Action & Category */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`grid size-8 place-items-center rounded-lg border shrink-0 ${style.color}`}>
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {formatActionName(item.action)}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                              {item.action}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3 text-slate-400" />
                          <span>{item.adminUsername || (isAr ? "النظام" : "Système")}</span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-slate-600 font-mono" dir="ltr">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-slate-400" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </td>

                      {/* Details View Button */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                        >
                          <Eye className="size-3" />
                          <span>{dict.colDetails}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && pagination.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs sm:flex-row">
            <span className="text-slate-500">
              {dict.paginationShowing
                .replace("{from}", String((pagination.page - 1) * pagination.pageSize + 1))
                .replace("{to}", String(Math.min(pagination.page * pagination.pageSize, pagination.total)))
                .replace("{total}", String(pagination.total))}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 transition"
              >
                {isAr ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
                <span>{dict.previous}</span>
              </button>

              <span className="px-2 font-bold text-slate-700">
                {page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <span>{dict.next}</span>
                {isAr ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-blue-600" />
                <h3 id="activity-details-title" className="text-sm font-bold text-slate-900">
                  {dict.detailsTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">{dict.colAction}:</span>
                <span className="col-span-2 font-mono text-slate-800 font-bold">{selectedItem.action}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">{dict.colActor}:</span>
                <span className="col-span-2 text-slate-800">{selectedItem.adminUsername || (isAr ? "النظام" : "Système")}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">{dict.colTime}:</span>
                <span className="col-span-2 font-mono text-slate-800" dir="ltr">{formatDate(selectedItem.createdAt)}</span>
              </div>

              {selectedItem.entityId && (
                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500">{isAr ? "المعرّف:" : "Entité:"}</span>
                  <span className="col-span-2 font-mono text-slate-700">{selectedItem.entityId}</span>
                </div>
              )}

              {/* Metadata JSON Inspection */}
              <div className="pt-2">
                <span className="block font-semibold text-slate-500 mb-1.5">
                  {isAr ? "البيانات الإضافية (Context):" : "Métadonnées de contexte :"}
                </span>
                <pre
                  dir="ltr"
                  className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 whitespace-pre-wrap break-all"
                >
                  {JSON.stringify(selectedItem.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {dict.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

