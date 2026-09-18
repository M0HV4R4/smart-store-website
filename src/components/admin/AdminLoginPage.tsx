import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, ArrowLeft, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { t, locale, toggle } = useI18n();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const isAr = locale === "ar";
  const dict = t.admin.login;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setErrorMessage(dict.errorGeneric);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(cleanIdentifier, password);

    if (result.success) {
      navigate("/admin", { replace: true });
    } else {
      setIsSubmitting(false);

      if (result.errorCode === "TOO_MANY_ATTEMPTS") {
        setErrorMessage(dict.errorRateLimit);
        if (result.retryAfter) {
          setRetryCountdown(result.retryAfter);
        }
      } else if (result.errorCode === "NETWORK_ERROR") {
        setErrorMessage(
          isAr
            ? "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت."
            : "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
        );
      } else if (
        result.errorCode === "SERVER_ERROR" ||
        result.errorCode === "DATABASE_UNAVAILABLE" ||
        result.errorCode === "INTERNAL_SERVER_ERROR" ||
        result.errorCode === "NOT_FOUND"
      ) {
        setErrorMessage(
          isAr
            ? "حدث خطأ في الخادم أو تعذر الوصول لخدمة الدخول. يرجى المحاولة لاحقاً."
            : "Le service d'authentification est temporairement indisponible. Veuillez réessayer plus tard.",
        );
      } else if (result.errorCode === "CSRF_ERROR" || result.errorCode === "FORBIDDEN") {
        setErrorMessage(
          isAr
            ? "فشل التحقق الأمني للجلسة. يرجى تحديث الصفحة والمحاولة مجدداً."
            : "Échec de validation de sécurité. Veuillez actualiser la page et réessayer.",
        );
      } else {
        setErrorMessage(dict.errorGeneric);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      {/* Background subtle radial ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-0 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[650px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 end-1/4 h-[350px] w-[450px] rounded-full bg-cyan-600/5 blur-[100px]" />
      </div>

      {/* Top Header Bar (Language switch & Back to site) */}
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg px-2 py-1"
        >
          {isAr ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
          <span>{dict.backToSite}</span>
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-label={t.admin.header.switchLanguage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          <span>{locale === "ar" ? "Français" : "العربية"}</span>
        </button>
      </header>

      {/* Center Login Form Container */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-md py-6">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-md"
        >
          {/* Brand Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <span className="text-xl font-black text-white">S</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">{dict.brand}</h1>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-400">
                {dict.badge}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">{dict.instruction}</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div className="flex-1">
                <p className="font-medium">{errorMessage}</p>
                {retryCountdown !== null && retryCountdown > 0 && (
                  <p className="mt-1 text-[11px] text-rose-300/80">
                    {isAr
                      ? `يرجى المحاولة بعد ${retryCountdown} ثانية`
                      : `Veuillez réessayer dans ${retryCountdown}s`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Identifier field */}
            <div>
              <label
                htmlFor="admin-identifier"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                {dict.identifierLabel}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="admin-identifier"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={isSubmitting}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={dict.identifierPlaceholder}
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pe-3 ps-9 text-xs text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                {dict.passwordLabel}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dict.passwordPlaceholder}
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pe-10 ps-9 text-xs text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? dict.hidePassword : dict.showPassword}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{dict.submitting}</span>
                </>
              ) : (
                <span>{dict.submitButton}</span>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-md text-center">
        <p className="text-[11px] text-slate-500">
          Smart Store POS &bull; {isAr ? "منظومة إدارية محمية" : "Système d'administration sécurisé"}
        </p>
      </footer>
    </div>
  );
}

