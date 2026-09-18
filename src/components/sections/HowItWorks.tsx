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
          y: 45,
          scale: 0.95,
          filter: "blur(4px)",
        },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section
      id="how"
      className="relative overflow-hidden py-18 sm:py-28 border-t border-slate-200/80 bg-gradient-to-b from-slate-50/50 via-transparent to-slate-50/40"
    >
      {/* مرسى لقسم المميزات لضمان وصول روابط #features و #how معاً */}
      <div id="features" className="absolute -top-24" aria-hidden="true" />

      {/* شبكة خلفية ناعمة مع تلاشٍ دائري خفيف */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-45 -z-10"
      />

      {/* مخروط إضاءة محيطية زرقاء موجه خلف بطاقات الخطوات الأربع */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
      >
        <div className="h-[480px] w-[880px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12),rgba(14,165,233,0.06)_50%,transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* صف العناوين الرئيسي: عنوان واضح وبارز + نص وصفي */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30, filter: "blur(3px)" }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-xl">
            <h2 className="font-display text-h2 font-extrabold text-slate-950 tracking-tight leading-tight">
              {t.how.titleLine1}{" "}
              <span className="text-blue-600">{t.how.titleLine2}</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-[15px] leading-relaxed text-slate-600 sm:text-[16px] font-normal">
              {t.how.subtitle}
            </p>
          </div>
        </motion.div>

        {/* شبكة البطاقات الأربع مع دعم التمرير المزدوج والارتفاع السلس */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
          style={{ perspective: 1200 }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
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
                        y: -6,
                        scale: 1.012,
                        transition: { type: "spring", stiffness: 350, damping: 25 },
                      }
                }
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-saas-card ring-1 ring-slate-900/[0.03] backdrop-blur-sm hover:border-blue-400/90 hover:shadow-saas-card-hover hover:bg-gradient-to-b hover:from-white hover:to-blue-50/20 transition-all duration-300 will-change-transform"
              >
                {/* تأثير لمعة ضوئية علوية متدرجة تظهر عند التحويم */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div>
                  {/* الشريط العلوي: الأيقونة + مؤشر السهم */}
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-500/25">
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>

                    <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 rtl:group-hover:-translate-x-1">
                      <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                    </span>
                  </div>

                  {/* رقم الخطوة الواضح والبارز */}
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-[34px] font-extrabold text-slate-950 tabular-nums leading-none tracking-tight">
                      {step.n}
                    </span>
                  </div>

                  {/* عنوان الخطوة */}
                  <h3 className="font-display mt-3 text-[18px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                    {step.title}
                  </h3>

                  {/* وصف الخطوة */}
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 font-normal">
                    {step.desc}
                  </p>
                </div>

                {/* وسوم ومميزات الخطوة */}
                {step.highlights && (
                  <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-slate-100/90">
                    {step.highlights.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-50/90 border border-slate-200/80 px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 transition-colors duration-200 group-hover:bg-blue-50/90 group-hover:border-blue-200 group-hover:text-blue-800"
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
