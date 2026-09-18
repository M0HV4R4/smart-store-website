import { useI18n } from "@/lib/i18n";

export function AdminLoadingScreen() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 text-slate-200"
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* Animated brand emblem */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
            <span className="text-xl font-black tracking-tight text-white">S</span>
          </div>
          <div className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-blue-500/20 opacity-75 duration-1000" />
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
        </div>

        <p className="text-xs font-medium tracking-wide text-slate-400">
          {isAr ? "جارٍ التحقق من الجلسة..." : "Vérification de la session..."}
        </p>
      </div>
    </div>
  );
}

