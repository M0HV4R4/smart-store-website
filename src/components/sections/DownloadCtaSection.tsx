import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, CheckCircle2, Laptop, Shield, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/cn";
import {
  getPublicDownloadsMeta,
  type PublicDownloadsMeta,
} from "@/services/downloadService";
import { WindowsGlyph, AndroidGlyph } from "./glyphs";

export function DownloadCtaSection() {
  const { t, locale } = useI18n();
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Dynamic public download metadata state
  const [meta, setMeta] = useState<PublicDownloadsMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPublicDownloadsMeta()
      .then((data) => {
        if (mounted) {
          setMeta(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          // Fail safely: leave meta as null so unavailable state is cleanly handled
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.15 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="download"
      ref={sectionRef}
      className="relative overflow-hidden bg-white py-16 sm:py-24 border-t border-slate-200"
    >
      {/* خلفية بتدرج أزرق ناعم وأنيق */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0">
        <div className="size-[640px] rounded-full bg-blue-50/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {/* العناوين التمهيدية */}
        <div
          className={cn(
            "mx-auto max-w-2xl text-center transition-all duration-700 ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <h2 className="font-display text-h2 font-extrabold text-slate-950 text-balance">
            <span>{locale === "ar" ? "تحميل" : "Télécharger"}</span>{" "}
            <span className="relative inline-block text-blue-600">
              <span>Smart Store</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 100 12"
                className="absolute -bottom-2.5 start-0 w-full text-blue-600 overflow-visible pointer-events-none"
                fill="none"
              >
                <path
                  d="M2 9C30 3 70 3 98 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>

          <p className="mt-3.5 text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            {t.download.subtitle}
          </p>
        </div>

        {/* بطاقتي التحميل: بطاقة Windows وبطاقة Android APK */}
        <div
          className={cn(
            "mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 transition-all duration-700 delay-150 ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          )}
        >
          {/* بطاقة Windows */}
          <div className="group relative flex flex-col justify-between rounded-md border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs transition-all duration-300 hover:border-blue-300 hover:shadow-md">
            <div>
              {/* أيقونة المنصة واسمها */}
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-md bg-blue-50 text-blue-600 border border-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <WindowsGlyph className="size-6" />
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
                  <Laptop className="size-3.5 text-slate-400" />
                  <span>
                    {meta?.windows?.version ? `v${meta.windows.version}` : "Windows 10 / 11"}
                  </span>
                </span>
              </div>

              <h3 className="font-display mt-5 text-[20px] font-bold text-slate-900">
                {t.download.windows.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                {t.download.windows.desc}
              </p>

              {/* تفاصيل الإصدار إن وجدت */}
              {meta?.windows?.fileSize && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-500" dir="ltr">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 font-semibold">
                    {meta.windows.fileSize}
                  </span>
                  {meta.windows.releaseDate && (
                    <span className="text-[11px] text-slate-400">
                      • {meta.windows.releaseDate}
                    </span>
                  )}
                </div>
              )}

              {/* مزايا سريعة */}
              <ul className="mt-6 flex flex-col gap-2.5 border-t border-slate-100 pt-5 text-[13px] text-slate-700">
                {t.download.windows.features.map((feat: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* زر التحميل لـ Windows */}
            <div className="mt-8">
              {isLoading ? (
                <div className="flex h-12 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[14px] font-medium text-slate-400 animate-pulse">
                  <span>{t.download.preparing}</span>
                </div>
              ) : meta?.windows?.available ? (
                <a
                  href="/api/download/windows"
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-blue-600 text-[14.5px] font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <ArrowDownToLine className="size-4" />
                  <span>{t.download.windows.cta}</span>
                </a>
              ) : (
                <div
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md border border-slate-200 bg-slate-100 text-[14px] font-semibold text-slate-400 cursor-not-allowed"
                  aria-disabled="true"
                >
                  <ArrowDownToLine className="size-4 text-slate-300" />
                  <span>{t.download.currentlyUnavailable}</span>
                </div>
              )}
              <span className="mt-2 block text-center text-[11.5px] text-slate-400">
                {meta?.windows?.available
                  ? t.download.windows.readyHint
                  : t.download.unavailableHint}
              </span>
            </div>
          </div>

          {/* بطاقة Android APK */}
          <div className="group relative flex flex-col justify-between rounded-md border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs transition-all duration-300 hover:border-emerald-300 hover:shadow-md">
            <div>
              {/* أيقونة المنصة واسمها */}
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <AndroidGlyph className="size-6" />
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
                  <Smartphone className="size-3.5 text-slate-400" />
                  <span>
                    {meta?.android?.version ? `v${meta.android.version}` : "Android 7.0+"}
                  </span>
                </span>
              </div>

              <h3 className="font-display mt-5 text-[20px] font-bold text-slate-900">
                {t.download.android.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                {t.download.android.desc}
              </p>

              {/* تفاصيل الإصدار إن وجدت */}
              {meta?.android?.fileSize && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-500" dir="ltr">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 font-semibold">
                    {meta.android.fileSize}
                  </span>
                  {meta.android.releaseDate && (
                    <span className="text-[11px] text-slate-400">
                      • {meta.android.releaseDate}
                    </span>
                  )}
                </div>
              )}

              {/* مزايا سريعة */}
              <ul className="mt-6 flex flex-col gap-2.5 border-t border-slate-100 pt-5 text-[13px] text-slate-700">
                {t.download.android.features.map((feat: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* زر التحميل لـ Android APK */}
            <div className="mt-8">
              {isLoading ? (
                <div className="flex h-12 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[14px] font-medium text-slate-400 animate-pulse">
                  <span>{t.download.preparing}</span>
                </div>
              ) : meta?.android?.available ? (
                <a
                  href="/api/download/android"
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-emerald-600 text-[14.5px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <ArrowDownToLine className="size-4" />
                  <span>{t.download.android.cta}</span>
                </a>
              ) : (
                <div
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md border border-slate-200 bg-slate-100 text-[14px] font-semibold text-slate-400 cursor-not-allowed"
                  aria-disabled="true"
                >
                  <ArrowDownToLine className="size-4 text-slate-300" />
                  <span>{t.download.currentlyUnavailable}</span>
                </div>
              )}
              <span className="mt-2 block text-center text-[11.5px] text-slate-400">
                {meta?.android?.available
                  ? t.download.android.readyHint
                  : t.download.unavailableHint}
              </span>
            </div>
          </div>
        </div>

        {/* شريط الأمان والموثوقية */}
        <div
          className={cn(
            "mx-auto mt-10 flex max-w-4xl items-center justify-center gap-2 text-center text-[13px] text-slate-500 transition-all duration-700 delay-300 ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <Shield className="size-4 text-blue-600" />
          <span>{t.download.safeNotice}</span>
        </div>
      </div>
    </section>
  );
}
