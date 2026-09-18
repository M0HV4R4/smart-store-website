import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Monitor,
  Smartphone,
  ExternalLink,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Download,
  Clock,
  Search,
  Eye,
  Edit2,
  Archive,
  Copy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
} from "lucide-react";
import {
  getAdminReleases,
  updateRelease,
  createRelease,
  type ReleaseRecord,
  type CreateReleasePayload,
  type UpdateReleasePayload,
  ApiError,
} from "@/services/downloadService";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function AdminReleasesPage() {
  const { checkSession } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.releases;

  // Data states
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters & Search
  const [filterPlatform, setFilterPlatform] = useState<"all" | "windows" | "android">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "active" | "archived">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Modals & Action States
  const [detailsRelease, setDetailsRelease] = useState<ReleaseRecord | null>(null);

  // Edit Modal State
  const [editRelease, setEditRelease] = useState<ReleaseRecord | null>(null);
  const [editForm, setEditForm] = useState<UpdateReleasePayload>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Publish New Version Modal State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishForm, setPublishForm] = useState<CreateReleasePayload>({
    platform: "windows",
    version: "",
    downloadUrl: "",
    fileSize: "",
    releaseDate: new Date().toISOString().split("T")[0],
    releaseNotesAr: "",
    releaseNotesFr: "",
    status: "active",
    downloadEnabled: true,
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Confirmation Modals
  const [confirmActivateRelease, setConfirmActivateRelease] = useState<ReleaseRecord | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [confirmArchiveRelease, setConfirmArchiveRelease] = useState<ReleaseRecord | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [confirmDisableRelease, setConfirmDisableRelease] = useState<ReleaseRecord | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  // Fetch paginated releases
  const fetchReleases = useCallback(
    async (
      page = pagination.page,
      platform = filterPlatform,
      status = filterStatus,
      search = activeSearch,
      pageSize = pagination.pageSize,
    ) => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getAdminReleases({
          page,
          pageSize,
          platform,
          status,
          search: search.trim() || undefined,
        });

        setReleases(data.releases);
        setPagination(data.pagination);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          checkSession();
          return;
        }
        setLoadError(
          err instanceof ApiError ? err.message : dict.errorLoading,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [checkSession, dict.errorLoading, filterPlatform, filterStatus, activeSearch, pagination.page, pagination.pageSize],
  );

  // Initial load and filter change trigger
  useEffect(() => {
    fetchReleases(1, filterPlatform, filterStatus, activeSearch, pagination.pageSize);
  }, [filterPlatform, filterStatus, activeSearch, pagination.pageSize]);

  // Close any active modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (detailsRelease) setDetailsRelease(null);
        if (editRelease) setEditRelease(null);
        if (publishModalOpen) setPublishModalOpen(false);
        if (confirmActivateRelease) setConfirmActivateRelease(null);
        if (confirmArchiveRelease) setConfirmArchiveRelease(null);
        if (confirmDisableRelease) setConfirmDisableRelease(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    detailsRelease,
    editRelease,
    publishModalOpen,
    confirmActivateRelease,
    confirmArchiveRelease,
    confirmDisableRelease,
  ]);

  // Handle search submission
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
  };

  const handleResetFilters = () => {
    setFilterPlatform("all");
    setFilterStatus("all");
    setSearchTerm("");
    setActiveSearch("");
  };

  // Copy download URL to clipboard
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(dict.toastUrlCopied, "success");
    } catch {
      showToast("تعذر نسخ الرابط", "error");
    }
  };

  // Open Edit Modal
  const openEditModal = (release: ReleaseRecord) => {
    setEditRelease(release);
    setEditForm({
      downloadUrl: release.downloadUrl,
      fileSize: release.fileSize || "",
      releaseDate: release.releaseDate,
      releaseNotesAr: release.releaseNotesAr || "",
      releaseNotesFr: release.releaseNotesFr || "",
    });
    setEditError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRelease) return;

    setIsEditing(true);
    setEditError(null);

    try {
      await updateRelease(editRelease.id, editForm);
      showToast(dict.toastUpdated, "success");
      setEditRelease(null);
      fetchReleases();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      setEditError(
        err instanceof ApiError ? err.message : "حدث خطأ أثناء تحديث بيانات الإصدار",
      );
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Publish New Version Submit
  const handlePublishSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setPublishError(null);

    try {
      await createRelease(publishForm);
      showToast(dict.toastCreated, "success");
      setPublishModalOpen(false);
      // Reset form
      setPublishForm({
        platform: "windows",
        version: "",
        downloadUrl: "",
        fileSize: "",
        releaseDate: new Date().toISOString().split("T")[0],
        releaseNotesAr: "",
        releaseNotesFr: "",
        status: "active",
        downloadEnabled: true,
      });
      fetchReleases(1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      setPublishError(
        err instanceof ApiError ? err.message : "فشل نشر الإصدار الجديد",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Activate Release (Single-active transactional swap)
  const handleActivateConfirm = async () => {
    if (!confirmActivateRelease) return;

    setIsActivating(true);
    try {
      await updateRelease(confirmActivateRelease.id, { status: "active" });
      showToast(dict.toastActivated, "success");
      setConfirmActivateRelease(null);
      fetchReleases();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      showToast(
        err instanceof ApiError ? err.message : "فشل تفعيل الإصدار",
        "error",
      );
    } finally {
      setIsActivating(false);
    }
  };

  // Handle Archive Release
  const handleArchiveConfirm = async () => {
    if (!confirmArchiveRelease) return;

    setIsArchiving(true);
    try {
      await updateRelease(confirmArchiveRelease.id, { status: "archived" });
      showToast(dict.toastArchived, "success");
      setConfirmArchiveRelease(null);
      fetchReleases();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      showToast(
        err instanceof ApiError ? err.message : "فشل أرشفة الإصدار",
        "error",
      );
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle Disable Download Confirm
  const handleDisableConfirm = async () => {
    if (!confirmDisableRelease) return;

    setIsDisabling(true);
    try {
      await updateRelease(confirmDisableRelease.id, { downloadEnabled: false });
      showToast("تم تعطيل التنزيل بنجاح", "success");
      setConfirmDisableRelease(null);
      fetchReleases();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      showToast(
        err instanceof ApiError ? err.message : "فشل تعديل إتاحة التنزيل",
        "error",
      );
    } finally {
      setIsDisabling(false);
    }
  };

  // Toggle Download Availability directly (with modal if disabling)
  const handleToggleDownload = (release: ReleaseRecord) => {
    if (release.downloadEnabled) {
      setConfirmDisableRelease(release);
    } else {
      // Enable immediately
      updateRelease(release.id, { downloadEnabled: true })
        .then(() => {
          showToast("تم تفعيل إتاحة التنزيل بنجاح", "success");
          fetchReleases();
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            checkSession();
            return;
          }
          showToast(err instanceof ApiError ? err.message : "فشل تفعيل التنزيل", "error");
        });
    }
  };

  const hasActiveFilters =
    filterPlatform !== "all" || filterStatus !== "all" || activeSearch.trim().length > 0;

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {dict.title}
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-400 sm:text-base max-w-2xl">
            {dict.subtitle}
          </p>
        </div>

        {/* Primary Action: Publish New Version */}
        <button
          type="button"
          onClick={() => setPublishModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>{dict.publishNew}</span>
        </button>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
          {/* Search by Version */}
          <div className="md:col-span-5">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 ${isAr ? "right-3" : "left-3"}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className={`w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isAr ? "pr-9 pl-10" : "pl-9 pr-10"
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white ${
                    isAr ? "left-3" : "right-3"
                  }`}
                  aria-label="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-2 md:col-span-3">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
              {dict.filterPlatform}:
            </span>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as any)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">{dict.allPlatforms}</option>
              <option value="windows">{dict.platformWindows}</option>
              <option value="android">{dict.platformAndroid}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 md:col-span-3">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
              {dict.filterStatus}:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">{dict.allStatuses}</option>
              <option value="active">{dict.statusActive}</option>
              <option value="draft">{dict.statusDraft}</option>
              <option value="archived">{dict.statusArchived}</option>
            </select>
          </div>

          {/* Reset Filters / Refresh */}
          <div className="flex items-center justify-end gap-2 md:col-span-1">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title={dict.resetFilters}
                aria-label={dict.resetFilters}
                className="rounded-xl border border-slate-800 bg-slate-800/60 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchReleases()}
              title="تحديث البيانات"
              aria-label="تحديث البيانات"
              disabled={isLoading}
              className="rounded-xl border border-slate-800 bg-slate-800/60 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Error Alert State */}
      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-sm font-medium">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchReleases()}
            className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/30"
          >
            {dict.retry}
          </button>
        </div>
      )}

      {/* 4. Content Area: Table / Cards / Empty / Loading */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-xl bg-slate-800/40"
              />
            ))}
          </div>
        </div>
      ) : releases.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-400">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">
            {hasActiveFilters ? dict.emptyFilteredTitle : dict.emptyTitle}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {hasActiveFilters ? dict.emptyFilteredDesc : dict.emptyDesc}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                {dict.resetFilters}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                <span>{dict.publishFirst}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* A. Desktop Professional Table (lg+) */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm" role="table">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderPlatform}
                    </th>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderVersion}
                    </th>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderStatus}
                    </th>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderDownload}
                    </th>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderDownloadsCount}
                    </th>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderSizeDate}
                    </th>
                    <th scope="col" className="px-5 py-4 text-start">
                      {dict.tableHeaderCreatedAt}
                    </th>
                    <th scope="col" className="px-5 py-4 text-end">
                      {dict.tableHeaderActions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {releases.map((rel) => {
                    const isWindows = rel.platform === "windows";
                    const isCurrentActive = rel.status === "active";

                    return (
                      <tr
                        key={rel.id}
                        className="transition-colors hover:bg-slate-800/30"
                      >
                        {/* 1. Platform */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${
                                isWindows
                                  ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                              }`}
                            >
                              {isWindows ? (
                                <Monitor className="h-4 w-4" />
                              ) : (
                                <Smartphone className="h-4 w-4" />
                              )}
                            </div>
                            <span className="font-semibold text-white">
                              {isWindows ? "Windows" : "Android"}
                            </span>
                          </div>
                        </td>

                        {/* 2. Version + Current Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-base" dir="ltr">
                              v{rel.version}
                            </span>
                            {isCurrentActive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                                <Check className="h-3 w-3" />
                                <span>{dict.currentBadge}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {rel.status === "active" && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                              {dict.statusActive}
                            </span>
                          )}
                          {rel.status === "draft" && (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
                              {dict.statusDraft}
                            </span>
                          )}
                          {rel.status === "archived" && (
                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-700">
                              {dict.statusArchived}
                            </span>
                          )}
                        </td>

                        {/* 4. Download Availability */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleDownload(rel)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                              rel.downloadEnabled
                                ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20 hover:bg-cyan-500/20"
                                : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
                            }`}
                            title={
                              rel.downloadEnabled
                                ? "التحميل متاح (انقر للتعطيل)"
                                : "التحميل معطل (انقر للتفعيل)"
                            }
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                rel.downloadEnabled ? "bg-cyan-400 animate-pulse" : "bg-rose-400"
                              }`}
                            />
                            <span>
                              {rel.downloadEnabled ? dict.downloadEnabled : dict.downloadDisabled}
                            </span>
                          </button>
                        </td>

                        {/* 5. Downloads Count */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Download className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-mono font-semibold" dir="ltr">
                              {rel.downloadCount.toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* 6. Size & Release Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium text-slate-300">
                              {rel.releaseDate}
                            </div>
                            <div className="font-mono text-xs text-slate-500" dir="ltr">
                              {rel.fileSize || "—"}
                            </div>
                          </div>
                        </td>

                        {/* 7. Created At */}
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                          {new Date(rel.createdAt).toLocaleDateString(isAr ? "ar-EG" : "fr-FR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* 8. Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Details Button */}
                            <button
                              type="button"
                              onClick={() => setDetailsRelease(rel)}
                              className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
                              title={dict.actionDetails}
                              aria-label={dict.actionDetails}
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Copy URL */}
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(rel.downloadUrl)}
                              className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
                              title={dict.actionCopyUrl}
                              aria-label={dict.actionCopyUrl}
                            >
                              <Copy className="h-4 w-4" />
                            </button>

                            {/* Test URL */}
                            <a
                              href={rel.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
                              title={dict.actionTestUrl}
                              aria-label={dict.actionTestUrl}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(rel)}
                              className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
                              title={dict.actionEdit}
                              aria-label={dict.actionEdit}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Activate (if not already active) */}
                            {rel.status !== "active" && (
                              <button
                                type="button"
                                onClick={() => setConfirmActivateRelease(rel)}
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                                title={dict.actionActivate}
                                aria-label={dict.actionActivate}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}

                            {/* Archive (if not already archived) */}
                            {rel.status !== "archived" && (
                              <button
                                type="button"
                                onClick={() => setConfirmArchiveRelease(rel)}
                                className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 transition-colors hover:border-amber-500/30 hover:text-amber-400"
                                title={dict.actionArchive}
                                aria-label={dict.actionArchive}
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* B. Mobile Responsive Cards (< lg) */}
          <div className="space-y-4 lg:hidden">
            {releases.map((rel) => {
              const isWindows = rel.platform === "windows";
              const isCurrentActive = rel.status === "active";

              return (
                <div
                  key={rel.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm space-y-4"
                >
                  {/* Card Header: Platform, Version, Current badge, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${
                          isWindows
                            ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        }`}
                      >
                        {isWindows ? (
                          <Monitor className="h-4 w-4" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base font-mono" dir="ltr">
                            v{rel.version}
                          </span>
                          {isCurrentActive && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                              <Check className="h-3 w-3" />
                              <span>{dict.currentBadge}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {isWindows ? "Windows" : "Android"}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {rel.status === "active" && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                          {dict.statusActive}
                        </span>
                      )}
                      {rel.status === "draft" && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
                          {dict.statusDraft}
                        </span>
                      )}
                      {rel.status === "archived" && (
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-700">
                          {dict.statusArchived}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {dict.tableHeaderDownload}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDownload(rel)}
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          rel.downloadEnabled ? "text-cyan-400" : "text-rose-400"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            rel.downloadEnabled ? "bg-cyan-400" : "bg-rose-400"
                          }`}
                        />
                        <span>
                          {rel.downloadEnabled ? dict.downloadEnabled : dict.downloadDisabled}
                        </span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {dict.tableHeaderDownloadsCount}
                      </span>
                      <div className="flex items-center gap-1 font-mono font-semibold text-white" dir="ltr">
                        <Download className="h-3 w-3 text-slate-500" />
                        <span>{rel.downloadCount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {dict.fieldReleaseDate}
                      </span>
                      <span>{rel.releaseDate}</span>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {dict.fieldFileSize}
                      </span>
                      <span className="font-mono text-slate-300" dir="ltr">
                        {rel.fileSize || "—"}
                      </span>
                    </div>
                  </div>

                  {/* URL preview */}
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
                    <span className="truncate text-xs font-mono text-slate-400" dir="ltr">
                      {rel.downloadUrl}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(rel.downloadUrl)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                        title={dict.actionCopyUrl}
                        aria-label={dict.actionCopyUrl}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={rel.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                        title={dict.actionTestUrl}
                        aria-label={dict.actionTestUrl}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Card Actions Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setDetailsRelease(rel)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{dict.actionDetails}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(rel)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>{dict.actionEdit}</span>
                    </button>

                    {rel.status !== "active" ? (
                      <button
                        type="button"
                        onClick={() => setConfirmActivateRelease(rel)}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{dict.actionActivate}</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center rounded-xl bg-slate-800/30 text-[11px] text-slate-500">
                        {dict.currentBadge}
                      </div>
                    )}

                    {rel.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => setConfirmArchiveRelease(rel)}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-amber-500/30 hover:text-amber-400"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>{dict.actionArchive}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Pagination Controls */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Range info */}
            <p className="text-xs text-slate-400">
              {dict.paginationShowing
                .replace(
                  "{from}",
                  String((pagination.page - 1) * pagination.pageSize + 1),
                )
                .replace(
                  "{to}",
                  String(
                    Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total,
                    ),
                  ),
                )
                .replace("{total}", String(pagination.total))}
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchReleases(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-40"
              >
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                <span>{dict.paginationPrevious}</span>
              </button>

              <span className="px-3 py-1 text-xs font-semibold text-white">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => fetchReleases(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-40"
              >
                <span>{dict.paginationNext}</span>
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: RELEASE DETAILS DRAWER/MODAL                                */}
      {/* ===================================================================== */}
      {detailsRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
            className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${
                    detailsRelease.platform === "windows"
                      ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                  }`}
                >
                  {detailsRelease.platform === "windows" ? (
                    <Monitor className="h-5 w-5" />
                  ) : (
                    <Smartphone className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="details-modal-title" className="text-lg font-bold text-white">
                      {dict.modalDetailsTitle} — {detailsRelease.platform === "windows" ? "Windows" : "Android"}
                    </h2>
                    <span className="font-mono font-bold text-blue-400" dir="ltr">
                      v{detailsRelease.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {dict.tableHeaderCreatedAt}: {new Date(detailsRelease.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailsRelease(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                aria-label={dict.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              {/* Status and Current */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <span className="text-xs text-slate-500 block mb-1">{dict.tableHeaderStatus}</span>
                  <span className="font-semibold text-white">
                    {detailsRelease.status === "active"
                      ? dict.statusActive
                      : detailsRelease.status === "draft"
                      ? dict.statusDraft
                      : dict.statusArchived}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <span className="text-xs text-slate-500 block mb-1">{dict.tableHeaderDownload}</span>
                  <span
                    className={`font-semibold ${
                      detailsRelease.downloadEnabled ? "text-cyan-400" : "text-rose-400"
                    }`}
                  >
                    {detailsRelease.downloadEnabled ? dict.downloadEnabled : dict.downloadDisabled}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <span className="text-xs text-slate-500 block mb-1">{dict.fieldDownloadsCount}</span>
                  <span className="font-mono font-bold text-white" dir="ltr">
                    {detailsRelease.downloadCount.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <span className="text-xs text-slate-500 block mb-1">{dict.fieldFileSize}</span>
                  <span className="font-mono text-white" dir="ltr">
                    {detailsRelease.fileSize || "—"}
                  </span>
                </div>
              </div>

              {/* Download URL */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  {dict.fieldDownloadUrl}
                </span>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                  <span className="break-all font-mono text-xs text-cyan-300" dir="ltr">
                    {detailsRelease.downloadUrl}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(detailsRelease.downloadUrl)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white"
                      title={dict.actionCopyUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={detailsRelease.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white"
                      title={dict.actionTestUrl}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Release Notes AR */}
              {detailsRelease.releaseNotesAr && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    {dict.fieldNotesAr}
                  </span>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap" dir="rtl">
                    {detailsRelease.releaseNotesAr}
                  </div>
                </div>
              )}

              {/* Release Notes FR */}
              {detailsRelease.releaseNotesFr && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    {dict.fieldNotesFr}
                  </span>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap" dir="ltr">
                    {detailsRelease.releaseNotesFr}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setDetailsRelease(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                {dict.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT RELEASE METADATA                                       */}
      {/* ===================================================================== */}
      {editRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 id="edit-modal-title" className="text-lg font-bold text-white">
                  {dict.modalEditTitle} — {editRelease.platform === "windows" ? "Windows" : "Android"}
                </h2>
                <p className="font-mono text-sm text-blue-400 mt-0.5" dir="ltr">
                  v{editRelease.version}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditRelease(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                aria-label={dict.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Version immutability notice */}
            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-300 leading-relaxed">
              {dict.versionImmutableNotice}
            </div>

            {editError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              {/* Download URL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldDownloadUrl} *
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={editForm.downloadUrl || ""}
                  onChange={(e) => setEditForm({ ...editForm, downloadUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* File Size & Release Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    {dict.fieldFileSize}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editForm.fileSize || ""}
                    onChange={(e) => setEditForm({ ...editForm, fileSize: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    {dict.fieldReleaseDate}
                  </label>
                  <input
                    type="date"
                    dir="ltr"
                    value={editForm.releaseDate || ""}
                    onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Release Notes AR */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldNotesAr}
                </label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={editForm.releaseNotesAr || ""}
                  onChange={(e) => setEditForm({ ...editForm, releaseNotesAr: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Release Notes FR */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldNotesFr}
                </label>
                <textarea
                  rows={3}
                  dir="ltr"
                  value={editForm.releaseNotesFr || ""}
                  onChange={(e) => setEditForm({ ...editForm, releaseNotesFr: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditRelease(null)}
                  disabled={isEditing}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{dict.saveChanges}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: PUBLISH NEW VERSION                                         */}
      {/* ===================================================================== */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-modal-title"
            className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 id="publish-modal-title" className="text-lg font-bold text-white">{dict.publishNew}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  سيتم تسجيل الإصدار الجديد في قاعدة البيانات وتفعيله كإصدار نشط مع أرشفة الإصدار السابق.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
                aria-label={dict.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {publishError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {publishError}
              </div>
            )}

            <form onSubmit={handlePublishSubmit} className="mt-5 space-y-4">
              {/* Platform Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldPlatform} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishForm({ ...publishForm, platform: "windows" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
                      publishForm.platform === "windows"
                        ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Windows</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishForm({ ...publishForm, platform: "android" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-all ${
                      publishForm.platform === "android"
                        ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Android</span>
                  </button>
                </div>
              </div>

              {/* Version */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldVersion} *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={publishForm.version}
                  onChange={(e) => setPublishForm({ ...publishForm, version: e.target.value })}
                  placeholder="مثال: 1.1.0"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Download URL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldDownloadUrl} *
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={publishForm.downloadUrl}
                  onChange={(e) => setPublishForm({ ...publishForm, downloadUrl: e.target.value })}
                  placeholder="https://github.com/.../release.exe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* File Size & Release Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    {dict.fieldFileSize}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={publishForm.fileSize || ""}
                    onChange={(e) => setPublishForm({ ...publishForm, fileSize: e.target.value })}
                    placeholder="مثال: 95 MB"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    {dict.fieldReleaseDate}
                  </label>
                  <input
                    type="date"
                    dir="ltr"
                    value={publishForm.releaseDate}
                    onChange={(e) => setPublishForm({ ...publishForm, releaseDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Release Notes AR */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldNotesAr}
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={publishForm.releaseNotesAr || ""}
                  onChange={(e) => setPublishForm({ ...publishForm, releaseNotesAr: e.target.value })}
                  placeholder="أهم التحسينات والميزات المضافة..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Release Notes FR */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  {dict.fieldNotesFr}
                </label>
                <textarea
                  rows={2}
                  dir="ltr"
                  value={publishForm.releaseNotesFr || ""}
                  onChange={(e) => setPublishForm({ ...publishForm, releaseNotesFr: e.target.value })}
                  placeholder="Notes de version en français..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  disabled={isPublishing}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{dict.confirm}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: CONFIRM ACTIVATION DIALOG                                    */}
      {/* ===================================================================== */}
      {confirmActivateRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-activate-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h3 id="confirm-activate-title" className="mt-4 text-lg font-bold text-white">
              {dict.confirmActivateTitle}
            </h3>

            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {dict.confirmActivateMsg.replace(
                "{platform}",
                confirmActivateRelease.platform === "windows" ? "Windows" : "Android",
              )}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmActivateRelease(null)}
                disabled={isActivating}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleActivateConfirm}
                disabled={isActivating}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {isActivating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{dict.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: CONFIRM ARCHIVE DIALOG                                      */}
      {/* ===================================================================== */}
      {confirmArchiveRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-archive-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 id="confirm-archive-title" className="mt-4 text-lg font-bold text-white">
              {dict.confirmArchiveTitle}
            </h3>

            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {dict.confirmArchiveMsg}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmArchiveRelease(null)}
                disabled={isArchiving}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={isArchiving}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-amber-500 disabled:opacity-50"
              >
                {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{dict.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: CONFIRM DISABLE DOWNLOAD DIALOG                             */}
      {/* ===================================================================== */}
      {confirmDisableRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-disable-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 id="confirm-disable-title" className="mt-4 text-lg font-bold text-white">
              {dict.confirmDisableTitle}
            </h3>

            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {dict.confirmDisableMsg}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDisableRelease(null)}
                disabled={isDisabling}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleDisableConfirm}
                disabled={isDisabling}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-500 disabled:opacity-50"
              >
                {isDisabling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{dict.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOAST FEEDBACK FLOATING NOTIFICATION                                 */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          )}
          <span className="text-sm font-medium text-white">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ms-2 text-slate-500 hover:text-white"
            aria-label={dict.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
