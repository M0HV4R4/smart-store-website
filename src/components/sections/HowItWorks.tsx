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
        staggerChildren: reduce ? 0 : 0.11,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 35, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section id="how" className="relative bg-white py-14 sm:py-20 border-t border-slate-100">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {/* Top Header Row: Left title with badge, Right description text */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[12.5px] font-semibold text-blue-700 border border-blue-100">
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

        {/* Cards Row: All 4 cards have consistent resting state and refined responsive hover motion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
                        scale: 1.015,
                        transition: { duration: 0.25, ease: "easeOut" },
                      }
                }
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-colors transition-shadow duration-300 will-change-transform"
              >
                <div>
                  {/* Top Bar with Icon & Arrow Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-500/20">
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>

                    <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5">
                      <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                    </span>
                  </div>

                  {/* Step Number Badge */}
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-[32px] font-extrabold text-slate-950 tabular-nums leading-none tracking-tight">
                      {step.n}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display mt-3 text-[18px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                    {step.desc}
                  </p>
                </div>

                {/* Highlights tags */}
                {step.highlights && (
                  <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-slate-100">
                    {step.highlights.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1 text-[11.5px] font-medium text-slate-700 transition-colors group-hover:bg-blue-50/50 group-hover:border-blue-200/60 group-hover:text-blue-800"
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
