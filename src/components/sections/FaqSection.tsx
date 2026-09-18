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
      className="relative overflow-hidden py-16 sm:py-24 border-t border-slate-200/70"
    >
      {/* شبكة خلفية ناعمة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-30 -z-10"
      />

      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.45fr] lg:gap-16 items-start">
          {/* العمود الأيسر: عنوان رئيسي مع خط منحني + نص وصفي */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30, filter: "blur(3px)" }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start lg:sticky lg:top-28"
          >
            <h2 className="font-display text-h2 font-extrabold text-slate-950 text-balance leading-tight tracking-tight">
              <span>{t.faq.title}</span>
              <span className="block mt-1 relative w-fit text-blue-600">
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
            </h2>

            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-[16px] max-w-md font-normal">
              {t.faq.subtitle}
            </p>
          </motion.div>

          {/* العمود الأيمن: الأكورديون مع بطاقات أنيقة وأيقونات دائرية زرقاء */}
          <div className="flex flex-col gap-4">
            {t.faq.items.map((item, idx) => {
              const isOpen = openIdx === idx;

              return (
                <motion.div
                  key={item.q}
                  initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(3px)" }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "group rounded-2xl border bg-white/95 shadow-xs transition-all duration-300 overflow-hidden",
                    isOpen
                      ? "border-blue-400/90 ring-4 ring-blue-500/10 shadow-md shadow-blue-500/5"
                      : "border-slate-200/90 hover:border-blue-300 hover:shadow-sm",
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
                    <span className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {item.q}
                    </span>

                    {/* أيقونة دائرية زرقاء متجاوبة */}
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300",
                        isOpen
                          ? "bg-blue-600 text-white shadow-xs rotate-180"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                      )}
                    >
                      {isOpen ? (
                        <Minus className="size-4" strokeWidth={2.4} />
                      ) : (
                        <Plus className="size-4" strokeWidth={2.4} />
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
                      <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-[14.5px] leading-relaxed text-slate-600 border-t border-slate-100 pt-3.5 font-normal">
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
