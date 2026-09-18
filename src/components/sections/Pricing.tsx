import { useEffect, useRef, useState } from "react";
import { Check, Zap } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n, formatNumber } from "@/lib/i18n";
import { pricingConfig } from "@/config/pricing";
import { Section } from "@/components/ui";

export function Pricing() {
  const { t, locale } = useI18n();
  const plans = pricingConfig.plans.filter((p) => p.id !== "trial" || pricingConfig.trialEnabled);
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

  // Features comparison list
  const allFeatureKeys = [
    { key: "pos", trial: true, standard: true },
    { key: "products", trial: true, standard: true },
    { key: "invoices", trial: true, standard: true },
    { key: "reportsBasic", trial: true, standard: true },
    { key: "barcode", trial: false, standard: true },
    { key: "inventory", trial: false, standard: true },
    { key: "debts", trial: false, standard: true },
    { key: "employees", trial: false, standard: true },
    { key: "services", trial: false, standard: true },
    { key: "windowsAndroid", trial: false, standard: true },
  ];

  return (
    <Section id="pricing" className="border-t border-slate-200 bg-[#fbfbfa]">
      <div ref={sectionRef}>
        {/* عنوان قسم الأسعار مع منحنى أنيق وبدون نقاط */}
        <div
          className={cn(
            "flex flex-col items-center text-center transition-all duration-700 ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <h2 className="font-display flex flex-col items-center text-h2 font-extrabold text-balance text-slate-950">
            <span>{t.pricing.titleLine1 || "سعر واضح"}</span>
            <span className="relative mt-1.5 inline-block text-blue-600">
              <span>{t.pricing.titleLine2 || "بدون مفاجآت"}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 100 12"
                className="absolute -bottom-3 start-0 w-full text-slate-950 overflow-visible pointer-events-none"
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
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            {t.pricing.subtitle}
          </p>
        </div>

        {/* بطاقات الأسعار مع أنيميشن عند التمرير */}
        <div
          className={cn(
            "mx-auto mt-14 grid max-w-4xl items-stretch gap-8 md:grid-cols-2 transition-all duration-700 delay-150 ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          )}
        >
          {plans.map((plan) => {
            const isRecommended = plan.featured;
            const copy = t.pricing.plans[plan.id];

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-md transition-all duration-500",
                  isRecommended
                    ? "wave-gradient wave-glow-shadow p-[2px]"
                    : "border border-slate-200/80 bg-[#f1eee4] p-[2px] shadow-sm",
                )}
              >
                {/* شريط أعلى البطاقة */}
                {isRecommended ? (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-white">
                    <Zap className="size-4 fill-white" />
                    <span>{t.pricing.badge}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-slate-700">
                    <Zap className="size-4 text-slate-600" />
                    <span>{t.pricing.trialBadge}</span>
                  </div>
                )}

                {/* الحاوية الداخلية (Inner Container) لكلا البطاقتين */}
                <div
                  className={cn(
                    "flex flex-1 flex-col rounded-md p-6 sm:p-7",
                    isRecommended ? "bg-white" : "bg-[#faf8f2]",
                  )}
                >
                  {/* اسم الخطة */}
                  <h3 className="text-[15px] font-semibold text-slate-800">
                    {copy.name}
                  </h3>

                  {/* عرض السعر */}
                  <div className="mt-4 flex items-baseline gap-1">
                    {plan.price === null ? (
                      <span className="font-display text-[38px] font-extrabold text-slate-950">
                        0
                      </span>
                    ) : (
                      <span dir="ltr" className="font-display text-[44px] font-extrabold text-slate-950 tabular-nums">
                        {formatNumber(plan.price, locale)}
                      </span>
                    )}
                    <span className="text-[14px] font-medium text-slate-500">
                      {locale === "ar" ? "دج / متجر" : `${plan.currency} / store`}
                    </span>
                  </div>

                  {/* الوصف */}
                  <p className="mt-2 min-h-[44px] text-[13.5px] leading-relaxed text-slate-600">
                    {copy.tagline}
                  </p>

                  {/* زر الإجراء */}
                  <a
                    href={plan.ctaHref}
                    className={cn(
                      "mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md text-[14px] font-semibold text-white shadow-sm transition hover:opacity-95",
                      isRecommended ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700",
                    )}
                  >
                    <span>{copy.cta}</span>
                    <span className="rtl:rotate-180">→</span>
                  </a>

                  {/* قائمة الميزات مع إشارات الصح والخطأ */}
                  <ul className="mt-8 flex flex-col gap-3.5 border-t border-slate-200/60 pt-6">
                    {allFeatureKeys.map(({ key, trial, standard }) => {
                      const isIncluded = plan.id === "standard" ? standard : trial;
                      const featureText = t.pricing.features[key as keyof typeof t.pricing.features] || key;

                      return (
                        <li
                          key={key}
                          className={cn(
                            "flex items-center gap-3 text-[14px]",
                            isIncluded ? "text-slate-800 font-medium" : "text-slate-400",
                          )}
                        >
                          {isIncluded ? (
                            <Check className="size-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
                          ) : (
                            <span className="size-4 grid place-items-center text-slate-400 font-bold text-[13px] shrink-0">
                              ✕
                            </span>
                          )}
                          <span>{featureText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
