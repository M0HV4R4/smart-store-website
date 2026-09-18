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
      className="relative overflow-hidden py-14 sm:py-20 lg:py-24"
    >
      {/* شبكة خلفية ناعمة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-40 -z-10"
      />

      {/* إضاءة جانبية ناعمة تمنع انطفاء عمق القسم */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-20 top-1/4 -z-10 h-[500px] w-[680px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.10),rgba(14,165,233,0.05)_50%,transparent_70%)] blur-3xl"
      />

      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.45fr] lg:gap-16 items-start">
          {/* العمود الأيسر: عنوان رئيسي مع خط منحني + نص وصفي */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
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

            <p className="mt-3.5 text-[15px] leading-relaxed text-slate-600 sm:text-[16px] max-w-md font-normal">
              {t.faq.subtitle}
            </p>
          </motion.div>

          {/* العمود الأيمن: الأكورديون مع بطاقات أنيقة وأيقونات دائرية زرقاء */}
          <div className="flex flex-col gap-3.5 sm:gap-4">
            {t.faq.items.map((item, idx) => {
              const isOpen = openIdx === idx;

              return (
                <motion.div
                  key={item.q}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "group rounded-2xl border bg-white/95 backdrop-blur-sm ring-1 ring-slate-900/[0.03] transition-all duration-300 overflow-hidden",
                    isOpen
                      ? "border-blue-400/90 ring-4 ring-blue-500/10 shadow-saas-card-hover"
                      : "border-slate-200/80 shadow-saas-card hover:border-blue-300 hover:shadow-md active:border-blue-400",
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
