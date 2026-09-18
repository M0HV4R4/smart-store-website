import { useEffect, useState } from "react";
import { ArrowDownToLine, CheckCircle2, Laptop, Shield, Smartphone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/cn";
import {
  getPublicDownloadsMeta,
  type PublicDownloadsMeta,
} from "@/services/downloadService";
import { WindowsGlyph, AndroidGlyph } from "./glyphs";

export function DownloadCtaSection() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();

  // Dynamic public download metadata state
  const [meta, setMeta] = useState<PublicDownloadsMeta | null>(null);

  useEffect(() => {
    let mounted = true;
    getPublicDownloadsMeta()
      .then((data) => {
        if (mounted) {
          setMeta(data);
        }
      })
      .catch(() => {
        // Fail safely: leave meta as null so unavailable state is cleanly handled
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="download"
      className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/25 to-slate-50/70 py-12 sm:py-18 border-t border-slate-200/70"
    >
      {/* شبكة خلفية ناعمة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-40 -z-10"
      />

      {/* هالة ضوئية زرقاء واسعة خلف بطاقات التحميل */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10" aria-hidden="true">
        <div className="size-[680px] rounded-full bg-blue-100/35 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        {/* العناوين التمهيدية */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
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

          <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            {t.download.subtitle}
          </p>
        </motion.div>

        {/* بطاقتي التحميل: بطاقة Windows وبطاقة Android APK */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-9 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {/* بطاقة Windows */}
          <motion.div
            whileHover={
              reduce
                ? undefined
                : {
                    y: -6,
                    scale: 1.015,
                    transition: { duration: 0.25, ease: "easeOut" },
                  }
            }
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-xs backdrop-blur-xs hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 will-change-transform"
          >
            <div>
              {/* أيقونة المنصة واسمها */}
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-500/20">
                  <WindowsGlyph className="size-6" />
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
                  <Laptop className="size-3.5 text-slate-400" />
                  <span>
                    {meta?.windows?.version ? `v${meta.windows.version}` : "Windows 10 / 11"}
                  </span>
                </span>
              </div>

              <h3 className="font-display mt-5 text-[20px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {t.download.windows.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                {t.download.windows.desc}
              </p>

              {/* تفاصيل الإصدار إن وجدت */}
              {meta?.windows?.fileSize && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-500" dir="ltr">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-semibold">
                    {meta.windows.fileSize}
                  </span>
                  {meta.windows.releaseDate && (
                    <span className="text-[11.5px] text-slate-400">
                      • {meta.windows.releaseDate}
                    </span>
                  )}
                </div>
              )}

              {/* قائمة المميزات */}
              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {t.download.windows.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                    <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* زر التحميل الفعلي */}
            <div className="mt-6 pt-2">
              <a
                href="/api/download/windows"
                className={cn(
                  "relative flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-[15px] font-bold transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                  meta?.windows?.available ?? true
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30"
                    : "pointer-events-none bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed",
                )}
                aria-disabled={!(meta?.windows?.available ?? true)}
              >
                <ArrowDownToLine className="size-5" />
                <span>
                  {(meta?.windows?.available ?? true)
                    ? t.download.windows.cta
                    : (locale === "ar" ? "الإصدار غير متوفر حالياً" : "Version non disponible")}
                </span>
              </a>
            </div>
          </motion.div>

          {/* بطاقة Android APK */}
          <motion.div
            whileHover={
              reduce
                ? undefined
                : {
                    y: -6,
                    scale: 1.015,
                    transition: { duration: 0.25, ease: "easeOut" },
                  }
            }
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-xs backdrop-blur-xs hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 will-change-transform"
          >
            <div>
              {/* أيقونة المنصة واسمها */}
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-500/20">
                  <AndroidGlyph className="size-6" />
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
                  <Smartphone className="size-3.5 text-slate-400" />
                  <span>
                    {meta?.android?.version ? `v${meta.android.version}` : "Android 7.0+"}
                  </span>
                </span>
              </div>

              <h3 className="font-display mt-5 text-[20px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {t.download.android.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                {t.download.android.desc}
              </p>

              {/* تفاصيل الإصدار إن وجدت */}
              {meta?.android?.fileSize && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-500" dir="ltr">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-semibold">
                    {meta.android.fileSize}
                  </span>
                  {meta.android.releaseDate && (
                    <span className="text-[11.5px] text-slate-400">
                      • {meta.android.releaseDate}
                    </span>
                  )}
                </div>
              )}

              {/* قائمة المميزات */}
              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {t.download.android.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* زر التحميل الفعلي أو زر الإشعار عند عدم التوفر */}
            <div className="mt-6 pt-2">
              {meta?.android?.available ? (
                <a
                  href="/api/download/android"
                  className="relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3.5 text-[15px] font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <ArrowDownToLine className="size-5" />
                  <span>{t.download.android.cta}</span>
                </a>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3.5 text-[14px] font-semibold text-slate-500 border border-slate-200/80">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span>{locale === "ar" ? "قريباً على أجهزة Android" : "Bientôt disponible sur Android"}</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* شارة الأمان والخصوصية في الأسفل */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          <Shield className="size-4 text-emerald-600 shrink-0" />
          <span>{locale === "ar" ? "تنزيل آمن ومباشر خالي من أي برمجيات ضارة" : "Téléchargement sécurisé et direct, sans aucun logiciel indésirable"}</span>
        </div>
      </div>
    </section>
  );
}
