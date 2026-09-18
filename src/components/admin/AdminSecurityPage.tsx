import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  KeyRound,
  Laptop,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  getSecurityOverview,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  changeAdminPassword,
  type SecurityOverviewData,
  type AdminSessionRecord,
  SecurityApiError,
} from "@/services/securityService";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function AdminSecurityPage() {
  const { checkSession } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.security;

  // Data state
  const [overview, setOverview] = useState<SecurityOverviewData | null>(null);
  const [sessions, setSessions] = useState<AdminSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modals for session revocation
  const [sessionToRevoke, setSessionToRevoke] = useState<AdminSessionRecord | null>(null);
  const [isRevokingAllOthers, setIsRevokingAllOthers] = useState(false);
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch security overview & sessions
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [overviewData, sessionsData] = await Promise.all([
        getSecurityOverview(),
        getActiveSessions(),
      ]);
      setOverview(overviewData);
      setSessions(sessionsData);
    } catch (err) {
      if (err instanceof SecurityApiError && err.statusCode === 401) {
        checkSession();
        return;
      }
      setLoadError(err instanceof Error ? err.message : dict.errorLoading);
    } finally {
      setIsLoading(false);
    }
  }, [checkSession, dict.errorLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sessionToRevoke) setSessionToRevoke(null);
        if (isRevokingAllOthers) setIsRevokingAllOthers(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionToRevoke, isRevokingAllOthers]);

  // Handle password change submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // Basic client checks
    if (!currentPassword) {
      setPasswordError(dict.currentPassword);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(dict.passwordRequirements);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(isAr ? "كلمة المرور وتأكيدها غير متطابقين" : "Les mots de passe ne correspondent pas");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(isAr ? "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية" : "Le nouveau mot de passe doit être différent de l'actuel");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(dict.toastPasswordSuccess, "success");

      // Refresh sessions to reflect the revocation of other sessions
      const freshSessions = await getActiveSessions();
      setSessions(freshSessions);
    } catch (err) {
      if (err instanceof SecurityApiError) {
        if (err.statusCode === 401) {
          checkSession();
          return;
        }
        setPasswordError(err.message || dict.toastPasswordError);
      } else {
        setPasswordError(err instanceof Error ? err.message : dict.toastPasswordError);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle revoking a single other session
  const handleConfirmRevokeSession = async () => {
    if (!sessionToRevoke) return;
    setIsSubmittingRevoke(true);
    try {
      await revokeSession(sessionToRevoke.id);
      showToast(dict.toastSessionRevoked, "success");
      setSessionToRevoke(null);
      // Reload sessions list
      const freshSessions = await getActiveSessions();
      setSessions(freshSessions);
    } catch (err) {
      showToast(err instanceof Error ? err.message : dict.errorLoading, "error");
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  // Handle revoking all other sessions
  const handleConfirmRevokeAllOthers = async () => {
    setIsSubmittingRevoke(true);
    try {
      await revokeAllOtherSessions();
      showToast(dict.toastAllOthersRevoked, "success");
      setIsRevokingAllOthers(false);
      // Reload sessions list
      const freshSessions = await getActiveSessions();
      setSessions(freshSessions);
    } catch (err) {
      showToast(err instanceof Error ? err.message : dict.errorLoading, "error");
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  // Format date helper (Africa/Algiers UTC+1)
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return dict.never;
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-FR", {
        timeZone: "Africa/Algiers",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">{dict.updatingPassword}</p>
      </div>
    );
  }

  if (loadError || !overview) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto size-10 text-rose-500" />
        <h3 className="mt-3 text-base font-bold text-rose-900">{dict.errorLoading}</h3>
        <p className="mt-1 text-sm text-rose-700">{loadError}</p>
        <button
          onClick={loadData}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          {dict.retry}
        </button>
      </div>
    );
  }

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 end-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Shield className="size-5" />
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
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className="size-3.5" />
          <span>{isAr ? "تحديث البيانات" : "Actualiser"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Account Overview & Change Password */}
        <div className="space-y-8 lg:col-span-7">
          {/* Section 1: Account Information Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <UserCheck className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {dict.accountTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  {dict.accountDesc}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {dict.username}
                </span>
                <span className="mt-1 block text-sm font-bold text-slate-900">
                  {overview.account.username}
                </span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {dict.email}
                </span>
                <span className="mt-1 block text-sm font-bold text-slate-900 truncate">
                  {overview.account.email}
                </span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {dict.status}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">
                    {dict.statusActive}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {dict.lastLogin}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-800" dir="ltr">
                  {formatDate(overview.account.lastLoginAt)}
                </span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 sm:col-span-2">
                <span className="block text-[11px] font-semibold text-slate-500">
                  {dict.createdAt}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-800" dir="ltr">
                  {formatDate(overview.account.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Change Password Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <KeyRound className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {dict.passwordTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  {dict.passwordDesc}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current password */}
              <div>
                <label htmlFor="current-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.currentPassword}
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    dir="ltr"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 pe-10 ps-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600"
                    aria-label={showCurrent ? dict.hidePassword : dict.showPassword}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.newPassword}
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-300 pe-10 ps-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600"
                    aria-label={showNew ? dict.hidePassword : dict.showPassword}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {dict.passwordRequirements}
                </p>
              </div>

              {/* Confirm new password */}
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.confirmPassword}
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-300 pe-10 ps-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirm ? dict.hidePassword : dict.showPassword}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  <span>{isChangingPassword ? dict.updatingPassword : dict.savePassword}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Active Sessions & Security Principles */}
        <div className="space-y-8 lg:col-span-5">
          {/* Section 3: Active Sessions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Laptop className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {dict.sessionsTitle}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {sessions.length} {isAr ? "جلسة نشطة حالياً" : "session(s) active(s)"}
                  </p>
                </div>
              </div>

              {otherSessionsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsRevokingAllOthers(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <LogOut className="size-3" />
                  <span>{dict.revokeAllOthers}</span>
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 transition-all ${
                    session.isCurrent
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200 bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          session.isCurrent ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {session.isCurrent ? dict.currentSession : isAr ? "جلسة أخرى" : "Autre session"}
                      </span>
                    </div>

                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => setSessionToRevoke(session)}
                        className="rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        {dict.revokeSession}
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-slate-500" dir="ltr">
                    <div>
                      <span className="block text-slate-400">{dict.sessionCreated}:</span>
                      <span className="font-medium text-slate-700">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400">{dict.sessionExpires}:</span>
                      <span className="font-medium text-slate-700">
                        {formatDate(session.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Security Principles Informational Box */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 text-blue-800">
              <Info className="size-4.5 text-blue-600" />
              <h3 className="text-sm font-bold">{dict.infoTitle}</h3>
            </div>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{dict.infoBcrypt}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{dict.infoSessions}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{dict.infoCookies}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{dict.infoExpiry}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Confirm Revoke Single Session */}
      {sessionToRevoke && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="size-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                {dict.confirmRevokeTitle}
              </h3>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {dict.confirmRevokeMsg}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSessionToRevoke(null)}
                disabled={isSubmittingRevoke}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeSession}
                disabled={isSubmittingRevoke}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                {isSubmittingRevoke && <Loader2 className="size-3.5 animate-spin" />}
                <span>{isSubmittingRevoke ? dict.revoking : dict.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Revoke All Other Sessions */}
      {isRevokingAllOthers && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="size-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                {dict.confirmRevokeAllTitle}
              </h3>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {dict.confirmRevokeAllMsg}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRevokingAllOthers(false)}
                disabled={isSubmittingRevoke}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeAllOthers}
                disabled={isSubmittingRevoke}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                {isSubmittingRevoke && <Loader2 className="size-3.5 animate-spin" />}
                <span>{isSubmittingRevoke ? dict.revoking : dict.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
