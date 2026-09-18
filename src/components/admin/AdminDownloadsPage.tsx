import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  Monitor,
  Smartphone,
  ExternalLink,
  Save,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Download,
  Calendar,
  HardDrive,
  Tag,
  FileText,
  Clock,
  Radio,
} from "lucide-react";
import {
  getAdminDownloads,
  updateRelease,
  createRelease,
  type ReleaseRecord,
  type CreateReleasePayload,
  ApiError,
} from "@/services/downloadService";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function AdminDownloadsPage() {
  const { checkSession } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.downloads;

  // Data state
  const [windowsRelease, setWindowsRelease] = useState<ReleaseRecord | null>(null);
  const [androidRelease, setAndroidRelease] = useState<ReleaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form edit states (dirty checking)
  const [windowsForm, setWindowsForm] = useState<Partial<ReleaseRecord>>({});
  const [androidForm, setAndroidForm] = useState<Partial<ReleaseRecord>>({});
  const [windowsSaving, setWindowsSaving] = useState(false);
  const [androidSaving, setAndroidSaving] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal states
  const [publishModalPlatform, setPublishModalPlatform] = useState<"windows" | "android" | null>(null);
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

  // Confirmation dialogs
  const [confirmDisablePlatform, setConfirmDisablePlatform] = useState<"windows" | "android" | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminDownloads();
      setWindowsRelease(data.windows);
      setAndroidRelease(data.android);

      if (data.windows) {
        setWindowsForm({ ...data.windows });
      }
      if (data.android) {
        setAndroidForm({ ...data.android });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      setLoadError(isAr ? "تعذر تحميل إعدادات التحميل" : "Impossible de charger les données");
    } finally {
      setIsLoading(false);
    }
  }, [checkSession, isAr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (publishModalPlatform) setPublishModalPlatform(null);
        if (confirmDisablePlatform) setConfirmDisablePlatform(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [publishModalPlatform, confirmDisablePlatform]);

  // Handle saving Windows changes
  const handleSaveWindows = async (e: FormEvent) => {
    e.preventDefault();
    if (!windowsRelease || windowsSaving) return;

    setWindowsSaving(true);
    try {
      const updated = await updateRelease(windowsRelease.id, windowsForm);
      setWindowsRelease(updated);
      setWindowsForm({ ...updated });
      showToast(dict.toastSaved.replace("{platform}", "Windows"), "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      const message = err instanceof Error ? err.message : dict.toastError;
      showToast(message, "error");
    } finally {
      setWindowsSaving(false);
    }
  };

  // Handle saving Android changes
  const handleSaveAndroid = async (e: FormEvent) => {
    e.preventDefault();
    if (!androidRelease || androidSaving) return;

    setAndroidSaving(true);
    try {
      const updated = await updateRelease(androidRelease.id, androidForm);
      setAndroidRelease(updated);
      setAndroidForm({ ...updated });
      showToast(dict.toastSaved.replace("{platform}", "Android"), "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      const message = err instanceof Error ? err.message : dict.toastError;
      showToast(message, "error");
    } finally {
      setAndroidSaving(false);
    }
  };

  // Handle Publish New Version submission
  const handlePublishSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!publishModalPlatform || isPublishing) return;

    if (!publishForm.version.trim() || !publishForm.downloadUrl.trim()) {
      setPublishError(
        isAr ? "يرجى تعبئة رقم الإصدار ورابط التحميل" : "Veuillez remplir la version et l'URL",
      );
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const payload: CreateReleasePayload = {
        ...publishForm,
        platform: publishModalPlatform,
        status: "active", // New version becomes the active version
      };

      const created = await createRelease(payload);

      if (publishModalPlatform === "windows") {
        setWindowsRelease(created);
        setWindowsForm({ ...created });
      } else {
        setAndroidRelease(created);
        setAndroidForm({ ...created });
      }

      showToast(
        dict.toastPublished.replace(
          "{platform}",
          publishModalPlatform === "windows" ? "Windows" : "Android",
        ),
        "success",
      );
      setPublishModalPlatform(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        checkSession();
        return;
      }
      setPublishError(err instanceof Error ? err.message : dict.toastError);
    } finally {
      setIsPublishing(false);
    }
  };

  // Open Publish modal helper
  const openPublishModal = (platform: "windows" | "android") => {
    setPublishModalPlatform(platform);
    setPublishError(null);
    setPublishForm({
      platform,
      version: "",
      downloadUrl: "",
      fileSize: platform === "windows" ? "95 MB" : "45 MB",
      releaseDate: new Date().toISOString().split("T")[0],
      releaseNotesAr: "",
      releaseNotesFr: "",
      status: "active",
      downloadEnabled: true,
    });
  };

  // Check if form is dirty
  const isWindowsDirty =
    Boolean(windowsRelease) &&
    JSON.stringify(windowsForm) !== JSON.stringify(windowsRelease);

  const isAndroidDirty =
    Boolean(androidRelease) &&
    JSON.stringify(androidForm) !== JSON.stringify(androidRelease);

  const renderStatusBadge = (status?: string) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {dict.statusActive}
        </span>
      );
    }
    if (status === "draft") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {dict.statusDraft}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        {dict.statusArchived}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-xs font-medium">
          {isAr ? "جارٍ تحميل إعدادات التحميل..." : "Chargement des téléchargements..."}
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-200">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
        <p className="text-sm font-bold">{loadError}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-4 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          {isAr ? "إعادة المحاولة" : "Réessayer"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {dict.title}
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            {dict.subtitle}
          </p>
        </div>
      </div>

      {/* Main Panels Grid (Side by side on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ================================================================= */}
        {/* 1. WINDOWS PANEL */}
        {/* ================================================================= */}
        <section className="flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          {/* Panel Top Header */}
          <div className="mb-5 flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/10 text-blue-400 shadow-sm">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {dict.windowsPanel}
                </h2>
                <span className="text-[11px] text-slate-400">
                  PC &bull; Windows 10/11 &bull; 64-bit
                </span>
              </div>
            </div>

            {windowsRelease && renderStatusBadge(windowsRelease.status)}
          </div>

          {/* Body: Form or Empty State */}
          {windowsRelease ? (
            <form onSubmit={handleSaveWindows} className="flex-1 space-y-4">
              {/* Version & Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="win-version"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Tag className="h-3.5 w-3.5 text-blue-400" />
                    {dict.versionLabel}
                  </label>
                  <input
                    id="win-version"
                    type="text"
                    required
                    dir="ltr"
                    value={windowsForm.version || ""}
                    onChange={(e) =>
                      setWindowsForm((prev) => ({ ...prev, version: e.target.value }))
                    }
                    placeholder={dict.versionPlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="win-date"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    {dict.releaseDateLabel}
                  </label>
                  <input
                    id="win-date"
                    type="date"
                    required
                    value={windowsForm.releaseDate || ""}
                    onChange={(e) =>
                      setWindowsForm((prev) => ({ ...prev, releaseDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label
                  htmlFor="win-url"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" />
                  {dict.downloadUrlLabel}
                </label>
                <input
                  id="win-url"
                  type="url"
                  required
                  dir="ltr"
                  value={windowsForm.downloadUrl || ""}
                  onChange={(e) =>
                    setWindowsForm((prev) => ({ ...prev, downloadUrl: e.target.value }))
                  }
                  placeholder={dict.downloadUrlPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {dict.downloadUrlHelper}
                </p>
              </div>

              {/* File Size & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="win-size"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-blue-400" />
                    {dict.fileSizeLabel}
                  </label>
                  <input
                    id="win-size"
                    type="text"
                    dir="ltr"
                    value={windowsForm.fileSize || ""}
                    onChange={(e) =>
                      setWindowsForm((prev) => ({ ...prev, fileSize: e.target.value }))
                    }
                    placeholder={dict.fileSizePlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="win-status"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Radio className="h-3.5 w-3.5 text-blue-400" />
                    {dict.statusLabel}
                  </label>
                  <select
                    id="win-status"
                    value={windowsForm.status || "draft"}
                    onChange={(e) =>
                      setWindowsForm((prev) => ({
                        ...prev,
                        status: e.target.value as "draft" | "active" | "archived",
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">{dict.statusActive}</option>
                    <option value="draft">{dict.statusDraft}</option>
                    <option value="archived">{dict.statusArchived}</option>
                  </select>
                </div>
              </div>

              {/* Download Enabled Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">
                    {dict.downloadEnabledLabel}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {windowsForm.downloadEnabled
                      ? isAr
                        ? "التحميل متاح حالياً للعملاء"
                        : "Téléchargement actuellement ouvert"
                      : isAr
                      ? "التحميل معطل مؤقتاً"
                      : "Téléchargement temporairement désactivé"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={windowsForm.downloadEnabled ?? true}
                  onClick={() => {
                    const nextVal = !windowsForm.downloadEnabled;
                    if (!nextVal) {
                      setConfirmDisablePlatform("windows");
                    } else {
                      setWindowsForm((prev) => ({ ...prev, downloadEnabled: true }));
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    windowsForm.downloadEnabled ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      windowsForm.downloadEnabled ? (isAr ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Release Notes AR */}
              <div>
                <label
                  htmlFor="win-notes-ar"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  {dict.notesArLabel}
                </label>
                <textarea
                  id="win-notes-ar"
                  rows={2}
                  dir="rtl"
                  value={windowsForm.releaseNotesAr || ""}
                  onChange={(e) =>
                    setWindowsForm((prev) => ({ ...prev, releaseNotesAr: e.target.value }))
                  }
                  placeholder={dict.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Release Notes FR */}
              <div>
                <label
                  htmlFor="win-notes-fr"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-400" />
                  {dict.notesFrLabel}
                </label>
                <textarea
                  id="win-notes-fr"
                  rows={2}
                  dir="ltr"
                  value={windowsForm.releaseNotesFr || ""}
                  onChange={(e) =>
                    setWindowsForm((prev) => ({ ...prev, releaseNotesFr: e.target.value }))
                  }
                  placeholder={dict.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Metadata & Actions Bar */}
              <div className="border-t border-slate-800/80 pt-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {dict.lastUpdated}:{" "}
                    <span className="text-slate-300">
                      {new Date(windowsRelease.updatedAt).toLocaleDateString(
                        locale === "ar" ? "ar-DZ" : "fr-FR",
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    {dict.totalDownloads}:{" "}
                    <span className="font-bold text-white">
                      {windowsRelease.downloadCount}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Test download button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (windowsRelease.downloadUrl) {
                          window.open(windowsRelease.downloadUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{dict.testDownload}</span>
                    </button>

                    {/* Publish new version button */}
                    <button
                      type="button"
                      onClick={() => openPublishModal("windows")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-600/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{dict.publishNewVersion}</span>
                    </button>
                  </div>

                  {/* Save changes button */}
                  <button
                    type="submit"
                    disabled={!isWindowsDirty || windowsSaving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {windowsSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>{windowsSaving ? dict.saving : dict.saveChanges}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Windows Empty State */
            <div className="my-auto flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-500">
                <Monitor className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-white">{dict.emptyTitle}</h3>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                {dict.emptyDesc.replace("{platform}", "Windows")}
              </p>
              <button
                type="button"
                onClick={() => openPublishModal("windows")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                <span>{dict.createFirstButton.replace("{platform}", "Windows")}</span>
              </button>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* 2. ANDROID PANEL */}
        {/* ================================================================= */}
        <section className="flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          {/* Panel Top Header */}
          <div className="mb-5 flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-600/10 text-emerald-400 shadow-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {dict.androidPanel}
                </h2>
                <span className="text-[11px] text-slate-400">
                  Mobile &bull; Android APK &bull; ARM64
                </span>
              </div>
            </div>

            {androidRelease && renderStatusBadge(androidRelease.status)}
          </div>

          {/* Body: Form or Empty State */}
          {androidRelease ? (
            <form onSubmit={handleSaveAndroid} className="flex-1 space-y-4">
              {/* Version & Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="and-version"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Tag className="h-3.5 w-3.5 text-emerald-400" />
                    {dict.versionLabel}
                  </label>
                  <input
                    id="and-version"
                    type="text"
                    required
                    dir="ltr"
                    value={androidForm.version || ""}
                    onChange={(e) =>
                      setAndroidForm((prev) => ({ ...prev, version: e.target.value }))
                    }
                    placeholder={dict.versionPlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="and-date"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    {dict.releaseDateLabel}
                  </label>
                  <input
                    id="and-date"
                    type="date"
                    required
                    value={androidForm.releaseDate || ""}
                    onChange={(e) =>
                      setAndroidForm((prev) => ({ ...prev, releaseDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label
                  htmlFor="and-url"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  {dict.downloadUrlLabel}
                </label>
                <input
                  id="and-url"
                  type="url"
                  required
                  dir="ltr"
                  value={androidForm.downloadUrl || ""}
                  onChange={(e) =>
                    setAndroidForm((prev) => ({ ...prev, downloadUrl: e.target.value }))
                  }
                  placeholder={dict.downloadUrlPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {dict.downloadUrlHelper}
                </p>
              </div>

              {/* File Size & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="and-size"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                    {dict.fileSizeLabel}
                  </label>
                  <input
                    id="and-size"
                    type="text"
                    dir="ltr"
                    value={androidForm.fileSize || ""}
                    onChange={(e) =>
                      setAndroidForm((prev) => ({ ...prev, fileSize: e.target.value }))
                    }
                    placeholder={dict.fileSizePlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="and-status"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                  >
                    <Radio className="h-3.5 w-3.5 text-emerald-400" />
                    {dict.statusLabel}
                  </label>
                  <select
                    id="and-status"
                    value={androidForm.status || "draft"}
                    onChange={(e) =>
                      setAndroidForm((prev) => ({
                        ...prev,
                        status: e.target.value as "draft" | "active" | "archived",
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="active">{dict.statusActive}</option>
                    <option value="draft">{dict.statusDraft}</option>
                    <option value="archived">{dict.statusArchived}</option>
                  </select>
                </div>
              </div>

              {/* Download Enabled Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">
                    {dict.downloadEnabledLabel}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {androidForm.downloadEnabled
                      ? isAr
                        ? "التحميل متاح حالياً للعملاء"
                        : "Téléchargement actuellement ouvert"
                      : isAr
                      ? "التحميل معطل مؤقتاً"
                      : "Téléchargement temporairement désactivé"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={androidForm.downloadEnabled ?? true}
                  onClick={() => {
                    const nextVal = !androidForm.downloadEnabled;
                    if (!nextVal) {
                      setConfirmDisablePlatform("android");
                    } else {
                      setAndroidForm((prev) => ({ ...prev, downloadEnabled: true }));
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    androidForm.downloadEnabled ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      androidForm.downloadEnabled ? (isAr ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Release Notes AR */}
              <div>
                <label
                  htmlFor="and-notes-ar"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  {dict.notesArLabel}
                </label>
                <textarea
                  id="and-notes-ar"
                  rows={2}
                  dir="rtl"
                  value={androidForm.releaseNotesAr || ""}
                  onChange={(e) =>
                    setAndroidForm((prev) => ({ ...prev, releaseNotesAr: e.target.value }))
                  }
                  placeholder={dict.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Release Notes FR */}
              <div>
                <label
                  htmlFor="and-notes-fr"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  {dict.notesFrLabel}
                </label>
                <textarea
                  id="and-notes-fr"
                  rows={2}
                  dir="ltr"
                  value={androidForm.releaseNotesFr || ""}
                  onChange={(e) =>
                    setAndroidForm((prev) => ({ ...prev, releaseNotesFr: e.target.value }))
                  }
                  placeholder={dict.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Metadata & Actions Bar */}
              <div className="border-t border-slate-800/80 pt-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {dict.lastUpdated}:{" "}
                    <span className="text-slate-300">
                      {new Date(androidRelease.updatedAt).toLocaleDateString(
                        locale === "ar" ? "ar-DZ" : "fr-FR",
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    {dict.totalDownloads}:{" "}
                    <span className="font-bold text-white">
                      {androidRelease.downloadCount}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Test download button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (androidRelease.downloadUrl) {
                          window.open(androidRelease.downloadUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{dict.testDownload}</span>
                    </button>

                    {/* Publish new version button */}
                    <button
                      type="button"
                      onClick={() => openPublishModal("android")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-600/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{dict.publishNewVersion}</span>
                    </button>
                  </div>

                  {/* Save changes button */}
                  <button
                    type="submit"
                    disabled={!isAndroidDirty || androidSaving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {androidSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>{androidSaving ? dict.saving : dict.saveChanges}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Android Empty State */
            <div className="my-auto flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-500">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-white">{dict.emptyTitle}</h3>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                {dict.emptyDesc.replace("{platform}", "Android")}
              </p>
              <button
                type="button"
                onClick={() => openPublishModal("android")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                <span>{dict.createFirstButton.replace("{platform}", "Android")}</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* =================================================================== */}
      {/* MODAL: PUBLISH NEW VERSION / CREATE FIRST RELEASE */}
      {/* =================================================================== */}
      {publishModalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {publishModalPlatform === "windows" ? (
                  <Monitor className="h-5 w-5 text-blue-400" />
                ) : (
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                )}
                <h3 id="modal-title" className="text-sm font-bold text-white">
                  {dict.modalPublishTitle.replace(
                    "{platform}",
                    publishModalPlatform === "windows" ? "Windows" : "Android",
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalPlatform(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs text-slate-400 leading-relaxed">
              {dict.modalPublishDesc}
            </p>

            {publishError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                {publishError}
              </div>
            )}

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    {dict.versionLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={publishForm.version}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, version: e.target.value }))
                    }
                    placeholder="1.1.0"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    {dict.releaseDateLabel} *
                  </label>
                  <input
                    type="date"
                    required
                    value={publishForm.releaseDate}
                    onChange={(e) =>
                      setPublishForm((p) => ({ ...p, releaseDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  {dict.downloadUrlLabel} *
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={publishForm.downloadUrl}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, downloadUrl: e.target.value }))
                  }
                  placeholder="https://github.com/.../Setup.exe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  {dict.fileSizeLabel}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={publishForm.fileSize || ""}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, fileSize: e.target.value }))
                  }
                  placeholder="95 MB"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  {dict.notesArLabel}
                </label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={publishForm.releaseNotesAr || ""}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, releaseNotesAr: e.target.value }))
                  }
                  placeholder={dict.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  {dict.notesFrLabel}
                </label>
                <textarea
                  rows={2}
                  dir="ltr"
                  value={publishForm.releaseNotesFr || ""}
                  onChange={(e) =>
                    setPublishForm((p) => ({ ...p, releaseNotesFr: e.target.value }))
                  }
                  placeholder={dict.notesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setPublishModalPlatform(null)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  {dict.modalCancel}
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{dict.modalPublishButton}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CONFIRM DISABLE DOWNLOADS */}
      {/* =================================================================== */}
      {confirmDisablePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-disable-title"
            className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 id="confirm-disable-title" className="text-sm font-bold">{dict.confirmDisableTitle}</h3>
            </div>
            <p className="mb-5 text-xs text-slate-300 leading-relaxed">
              {dict.confirmDisableMsg.replace(
                "{platform}",
                confirmDisablePlatform === "windows" ? "Windows" : "Android",
              )}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDisablePlatform(null)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                {dict.modalCancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDisablePlatform === "windows") {
                    setWindowsForm((p) => ({ ...p, downloadEnabled: false }));
                  } else {
                    setAndroidForm((p) => ({ ...p, downloadEnabled: false }));
                  }
                  setConfirmDisablePlatform(null);
                }}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500"
              >
                {isAr ? "تأكيد الإيقاف" : "Désactiver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TOAST FEEDBACK */}
      {/* =================================================================== */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 ${
            isAr ? "left-6" : "right-6"
          } z-50 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
              : "border-rose-500/40 bg-rose-950/90 text-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

