import { ArrowUpRight, BarChart3, Boxes, Package, ShoppingCart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { Variants } from "framer-motion";

export function HowItWorks() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const icons = [Package, Boxes, ShoppingCart, BarChart3];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.13,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: reduce
      ? { opacity: 1 }
      : {
          opacity: 0,
          y: 70,
          scale: 0.92,
          rotateX: 6,
        },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section
      id="how"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-blue-50/25 to-white py-12 sm:py-18 border-t border-slate-200/60"
    >
      {/* شبكة خلفية ناعمة مع تلاشٍ دائري خفيف */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-45 -z-10"
      />

      {/* إضاءة محيطية زرقاء هادئة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
      >
        <div className="size-[580px] rounded-full bg-blue-100/30 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        {/* صف العناوين الرئيسي: شارة زرقاء + عنوان واضح + نص وصفي */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-[12.5px] font-semibold text-blue-700 border border-blue-200/80 shadow-2xs">
              <span className="size-1.5 rounded-full bg-blue-600" />
              {t.how.eyebrow}
            </span>
            <h2 className="font-display mt-3 text-h2 font-extrabold text-slate-950">
              {t.how.titleLine1}{" "}
              <span className="text-blue-600">{t.how.titleLine2}</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
              {t.how.subtitle}
            </p>
          </div>
        </motion.div>

        {/* شبكة البطاقات الأربع: حالة راحة موحدة 100% للبطاقات (مع إلغاء أي حالة نشطة دائمة لـ 03) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          style={{ perspective: 1200 }}
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.how.steps.map((step, idx) => {
            const Icon = icons[idx] || Package;

            return (
              <motion.div
                key={step.n}
                variants={cardVariants}
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -10,
                        scale: 1.02,
                        transition: { duration: 0.25, ease: "easeOut" },
                      }
                }
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/85 bg-white/90 p-6 sm:p-7 shadow-xs backdrop-blur-xs hover:border-blue-400 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/30 hover:shadow-2xl hover:shadow-blue-500/12 transition-all duration-300 will-change-transform"
              >
                {/* تأثير لمعة ضوئية علوية أنيقة تظهر عند التمرير */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div>
                  {/* الشريط العلوي: الأيقونة + مؤشر السهم */}
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md group-hover:shadow-blue-500/25">
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>

                    <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 rtl:group-hover:-translate-x-1">
                      <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                    </span>
                  </div>

                  {/* رقم الخطوة المتدرج الواضح */}
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-[32px] font-extrabold text-slate-950 tabular-nums leading-none tracking-tight">
                      {step.n}
                    </span>
                  </div>

                  {/* عنوان الخطوة */}
                  <h3 className="font-display mt-3 text-[18px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                    {step.title}
                  </h3>

                  {/* وصف الخطوة */}
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                    {step.desc}
                  </p>
                </div>

                {/* وسوم ومميزات الخطوة */}
                {step.highlights && (
                  <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-slate-100/90">
                    {step.highlights.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1 text-[11.5px] font-medium text-slate-700 transition-colors duration-200 group-hover:bg-blue-50/70 group-hover:border-blue-200 group-hover:text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
