import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BarChart3, Boxes, Package, ShoppingCart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/cn";

export function HowItWorks() {
  const { t } = useI18n();
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const icons = [Package, Boxes, ShoppingCart, BarChart3];

  return (
    <section id="how" ref={sectionRef} className="relative bg-white py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {/* Top Header Row matching the design: Left title with badge, Right description text */}
        <div
          className={cn(
            "flex flex-col justify-between gap-6 transition-all duration-700 ease-out md:flex-row md:items-end",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[12.5px] font-semibold text-blue-700">
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
        </div>

        {/* Cards Row matching the reference layout: 4 cards with slow staggered animation */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map((step, idx) => {
            const Icon = icons[idx] || Package;

            // Staggered delays: 0.2s, 0.45s, 0.7s, 0.95s with a slow 1.2s smooth easing
            const delays = ["delay-[200ms]", "delay-[450ms]", "delay-[700ms]", "delay-[950ms]"];

            const isTinted = idx === 1 || idx === 3;
            const isFeatured = idx === 2;

            return (
              <div
                key={step.n}
                className={cn(
                  "group relative flex flex-col justify-between rounded-md p-6 transition-all duration-1000 ease-out hover:-translate-y-1 hover:shadow-md",
                  delays[idx],
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
                  isFeatured
                    ? "border border-blue-200 bg-blue-50/60"
                    : isTinted
                      ? "border border-slate-200/80 bg-[#f8fafc]"
                      : "border border-slate-200/80 bg-white",
                )}
              >
                <div>
                  {/* Top Bar with Icon & Arrow Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-11 place-items-center rounded-md transition-colors",
                        isFeatured
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>

                    <span className="flex size-8 items-center justify-center rounded-md text-slate-400 group-hover:text-blue-600">
                      <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                    </span>
                  </div>

                  {/* Step Number Badge */}
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-[30px] font-extrabold text-slate-950 tabular-nums leading-none">
                      {step.n}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display mt-2.5 text-[17px] font-bold text-slate-900">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                    {step.desc}
                  </p>
                </div>

                {/* Highlights tags */}
                {step.highlights && (
                  <div className="mt-5 flex flex-wrap gap-1.5 pt-3.5 border-t border-slate-200/60">
                    {step.highlights.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-white/90 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
