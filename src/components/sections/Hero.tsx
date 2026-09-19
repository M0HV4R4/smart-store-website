import { Download } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { WindowsGlyph, AndroidGlyph } from "./glyphs";
import smartstoreImg from "../../../smartstore (2).webp";

export function Hero() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();

  const altText =
    locale === "ar"
      ? "واجهة برنامج Smart Store على الكمبيوتر والهاتف"
      : "Interface Smart Store sur ordinateur et smartphone";

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-3 pb-8 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-14"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* ------------------------------- العناوين والنصوص ------------------------------- */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: reduce ? 0 : 0.08,
                delayChildren: 0.04,
              },
            },
          }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <motion.h1
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 25 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="font-display flex flex-col items-center text-hero font-extrabold text-balance text-slate-950 tracking-tight leading-[1.12]"
          >
            <span>{t.hero.titleLine1}</span>
            <span className="relative mt-1.5 inline-block text-blue-600">
              <span>{t.hero.titleLine2}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 100 12"
                className="absolute -bottom-2.5 start-0 w-full text-blue-600/80 overflow-visible pointer-events-none"
                fill="none"
              >
                <path
                  d="M2 9C30 3 70 3 98 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 25 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="mt-4 sm:mt-5 max-w-2xl text-lead text-slate-600 text-pretty font-normal leading-relaxed"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* زر الإجراء الرئيسي CTA */}
          <motion.div
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            whileTap={{ scale: 0.98 }}
            className="mt-5 sm:mt-7 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4"
          >
            <Button
              href="#download"
              size="lg"
              className="rounded-full px-7 py-3 sm:px-8 sm:py-3.5 text-[14.5px] sm:text-[15px] font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all duration-300"
              icon={<Download className="size-5" aria-hidden />}
            >
              {t.hero.ctaPrimary}
            </Button>
          </motion.div>

          {/* توافق المنصات والشارات الداعمة */}
          <motion.div
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2"
          >
            <span className="text-[12px] sm:text-[12.5px] font-semibold text-slate-500">{t.hero.availableOn}</span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-[12px] sm:text-[12.5px] font-bold text-slate-800 shadow-2xs">
              <WindowsGlyph className="size-3.5 text-blue-600" /> {t.common.windows}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-[12px] sm:text-[12.5px] font-bold text-slate-800 shadow-2xs">
              <AndroidGlyph className="size-3.5 text-emerald-600" /> {t.common.android}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-semibold text-slate-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t.hero.trust}
            </span>
          </motion.div>
        </motion.div>

        {/* ------------------------- مسرح عرض المنتج العائم الفاخر Floating SaaS Showcase ------------------------- */}
        <div className="relative mx-auto mt-4 sm:mt-6 lg:mt-7 w-full max-w-[min(1480px,96vw)]">
          <motion.div
            initial={
              reduce
                ? false
                : {
                    opacity: 0,
                    scale: 0.96,
                    y: 30,
                  }
            }
            animate={
              reduce
                ? undefined
                : {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }
            }
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative flex items-center justify-center"
          >
            {/* 1. هالة زرقاء ناعمة جداً وخفيفة خلف المنتج */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] sm:w-[82%] h-[55%] sm:h-[65%] rounded-full bg-blue-500/[0.06] blur-2xl sm:blur-3xl -z-10"
            />

            {/* 2. ظل طبيعي واقعي خفيف أسفل المنتج يعطي إحساس الطفو الفعلي في الفضاء */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-4 sm:-bottom-8 left-1/2 -translate-x-1/2 w-[80%] sm:w-[86%] h-8 sm:h-16 rounded-full bg-slate-900/[0.07] blur-xl sm:blur-2xl -z-10"
            />

            {/* 3. حركة تنفسية خفيفة جداً (3-4px حركة بطيئة غير ملحوظة بعد الظهور) */}
            <motion.div
              animate={
                reduce
                  ? undefined
                  : {
                      y: [0, -3.5, 0],
                    }
              }
              transition={
                reduce
                  ? undefined
                  : {
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              className="relative w-full flex items-center justify-center"
            >
              <img
                src={smartstoreImg}
                alt={altText}
                width={4096}
                height={2286}
                className="h-auto w-full object-contain select-none pointer-events-none drop-shadow-[0_16px_36px_rgba(15,23,42,0.08)] sm:drop-shadow-[0_24px_54px_rgba(15,23,42,0.11)]"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
