import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/cn";

export function FaqSection() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIdx((curr) => (curr === idx ? null : idx));
  };

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-blue-50/20 py-12 sm:py-18 border-t border-slate-200/70"
    >
      {/* شبكة خلفية ناعمة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-35 -z-10"
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14 items-start">
          {/* العمود الأيسر: شارة زرقاء + عنوان مع خط منحني + نص وصفي */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-2xs">
              <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
              <span>{t.faq.eyebrow}</span>
            </div>

            <h2 className="font-display mt-3 text-h2 font-extrabold text-slate-950 text-balance leading-tight">
              <span>{t.faq.title}</span>
              <span className="block mt-1 relative w-fit text-blue-600">
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

            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-[16px] max-w-md">
              {t.faq.subtitle}
            </p>
          </motion.div>

          {/* العمود الأيمن: الأكورديون مع بطاقات أنيقة وأيقونات دائرية زرقاء */}
          <div className="flex flex-col gap-3.5">
            {t.faq.items.map((item, idx) => {
              const isOpen = openIdx === idx;

              return (
                <motion.div
                  key={item.q}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "group rounded-2xl border bg-white shadow-xs transition-all duration-300 overflow-hidden",
                    isOpen
                      ? "border-blue-300 ring-2 ring-blue-100/60 shadow-md shadow-blue-500/5"
                      : "border-slate-200/90 hover:border-blue-200 hover:shadow-sm",
                  )}
                >
                  <button
                    type="button"
                    id={`faq-question-${idx}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    onClick={() => toggleItem(idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-start select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-2xl transition-colors"
                  >
                    <span className="text-[15.5px] font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {item.q}
                    </span>

                    {/* أيقونة دائرية زرقاء متجاوبة */}
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300",
                        isOpen
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                      )}
                    >
                      {isOpen ? (
                        <Minus className="size-4" strokeWidth={2.2} />
                      ) : (
                        <Plus className="size-4" strokeWidth={2.2} />
                      )}
                    </span>
                  </button>

                  {/* حاوية الإجابة المتمددة بسلاسة */}
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-[14px] leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
