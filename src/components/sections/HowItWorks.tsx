import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Package,
  RotateCw,
  ShoppingCart,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/cn";
import type { Variants } from "framer-motion";

interface CardDetail {
  title: { ar: string; fr: string };
  desc: { ar: string; fr: string };
  features: { ar: string[]; fr: string[] };
}

const cardDetails: CardDetail[] = [
  {
    title: {
      ar: "إدارة المنتجات",
      fr: "Gestion des Produits",
    },
    desc: {
      ar: "تنظيم كامل للمنتجات مع دعم الباركود، التصنيفات، الصور، ووحدات البيع.",
      fr: "Organisation complète des articles avec code-barres, catégories, photos et unités de vente.",
    },
    features: {
      ar: [
        "إنشاء المنتجات بسهولة",
        "إدارة الباركود",
        "تنظيم التصنيفات",
        "متابعة الأسعار",
      ],
      fr: [
        "Création simple des articles",
        "Gestion des codes-barres",
        "Organisation des catégories",
        "Suivi des prix de vente",
      ],
    },
  },
  {
    title: {
      ar: "إدارة المخزون",
      fr: "Gestion des Stocks",
    },
    desc: {
      ar: "مراقبة حركة السلع والكميات بدقة وتفادي نفاد المنتجات أو تلفها.",
      fr: "Contrôle précis des mouvements de stocks et alertes d'épuisement en temps réel.",
    },
    features: {
      ar: [
        "مراقبة حركة السلع",
        "متابعة الكميات",
        "تنبيهات المخزون",
        "تقليل نفاد المنتجات",
      ],
      fr: [
        "Mouvements des marchandises",
        "Suivi des quantités en stock",
        "Alertes de stock critique",
        "Réduction des ruptures",
      ],
    },
  },
  {
    title: {
      ar: "المبيعات والفواتير",
      fr: "Ventes et Facturation",
    },
    desc: {
      ar: "نقطة بيع سريعة، إصدار فوري للفواتير، ومتابعة دقيقة لديون وعملاء المتجر.",
      fr: "Point de vente rapide, édition instantanée des factures et suivi des créances.",
    },
    features: {
      ar: [
        "نقطة البيع",
        "إصدار الفواتير",
        "إدارة العملاء",
        "متابعة الديون",
      ],
      fr: [
        "Point de vente (POS) rapide",
        "Émission des factures",
        "Gestion des clients",
        "Suivi des dettes et créances",
      ],
    },
  },
  {
    title: {
      ar: "التقارير والتحليل",
      fr: "Rapports et Analyse",
    },
    desc: {
      ar: "تحليلات مالية وتجارية ذكية لاتخاذ قرارات دقيقة ترفع من أرباح متجرك.",
      fr: "Analyses financières intelligentes pour prendre des décisions rentables.",
    },
    features: {
      ar: [
        "تحليل الأرباح",
        "أداء المنتجات",
        "تقارير المبيعات",
        "قرارات تجارية أفضل",
      ],
      fr: [
        "Analyse des bénéfices",
        "Performance des produits",
        "Rapports des ventes",
        "Meilleures décisions",
      ],
    },
  },
];

export function HowItWorks() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  // Active selected card for mobile touch (persists until another card is tapped)
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);

  const isAr = locale === "ar";
  const icons = [Package, Boxes, ShoppingCart, BarChart3];

  const handleCardClick = (idx: number) => {
    setActiveCardIdx(idx);
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.08,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: reduce
      ? { opacity: 1 }
      : {
          opacity: 0,
          y: 25,
        },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section
      id="how"
      className="relative overflow-hidden py-10 sm:py-14 lg:py-16"
    >
      {/* مرسى لقسم المميزات لضمان وصول روابط #features و #how معاً */}
      <div id="features" className="absolute -top-24" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* صف العناوين الرئيسي: عنوان واضح وبارز + نص وصفي */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 25 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
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

        {/* شبكة البطاقات التفاعلية مع ميزة الدوران ثلاثي الأبعاد 3D Flip */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.how.steps.map((step, idx) => {
            const Icon = icons[idx] || Package;
            const detail = cardDetails[idx] || cardDetails[0];
            const isFlipped = Boolean(flippedCards[idx]);

            return (
              <motion.div
                key={step.n}
                variants={cardVariants}
                style={{ perspective: 1000 }}
                className="h-[370px] sm:h-[390px] w-full"
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(idx);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isFlipped}
                  className="group relative h-full w-full cursor-pointer select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  {/* -------------------- 1. FRONT SIDE (Clean White SaaS Surface with Static Luxury Gradient Stroke) -------------------- */}
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                    className={cn(
                      "absolute inset-0 overflow-hidden rounded-2xl p-[1.5px] transition-all duration-300",
                      activeCardIdx === idx
                        ? "border-gradient-saas-active shadow-saas-card-hover ring-1 ring-blue-500/20"
                        : "border-gradient-saas shadow-saas-card group-hover:border-gradient-saas-active group-hover:shadow-saas-card-hover",
                    )}
                  >
                    <div className="relative z-10 flex h-full w-full flex-col justify-between rounded-[calc(1rem-1.5px)] bg-white p-6 sm:p-7">
                      {/* لمعة ضوئية علوية تظهر عند التحويم أو التحديد */}
                      <div
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent transition-opacity duration-300",
                          activeCardIdx === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      />

                      <div>
                        {/* الشريط العلوي: الأيقونة + مؤشر القلب التفاعلي */}
                        <div className="flex items-center justify-between">
                          <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-500/25">
                            <Icon className="size-5" strokeWidth={1.9} />
                          </span>

                          <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 group-hover:text-blue-600">
                            <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                          </span>
                        </div>

                        {/* رقم الخطوة البارز */}
                        <div className="mt-5 flex items-baseline gap-1.5">
                          <span className="font-display text-[32px] font-extrabold text-slate-950 tabular-nums leading-none tracking-tight">
                            {step.n}
                          </span>
                        </div>

                        {/* عنوان الخطوة */}
                        <h3 className="font-display mt-2.5 text-[17.5px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                          {step.title}
                        </h3>

                        {/* وصف الخطوة */}
                        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 font-normal line-clamp-3">
                          {step.desc}
                        </p>
                      </div>

                      {/* وسوم الخطوة مع زر التبديل الدوار التفاعلي */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100/90 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {step.highlights?.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-blue-600 shrink-0">
                          <span>{isAr ? "تفاصيل" : "Détails"}</span>
                          <RotateCw className="size-3 transition-transform group-hover:rotate-45" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* -------------------- 2. BACK SIDE (Deep Navy / Dark SaaS Surface with Static Gradient Stroke) -------------------- */}
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                    className="absolute inset-0 overflow-hidden rounded-2xl p-[1.5px] border-gradient-saas-dark shadow-saas-card ring-1 ring-blue-500/20"
                  >
                    <div className="relative z-10 flex h-full w-full flex-col justify-between rounded-[calc(1rem-1.5px)] bg-[#090e1a] p-6 sm:p-7 text-white">
                      {/* لمعة زرقاء علوية للوجه الخلفي */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80"
                      />

                      <div>
                        {/* رأس الوجه الخلفي */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 px-3 py-1 text-[11.5px] font-bold text-blue-400">
                            <Icon className="size-3.5" />
                            <span>{step.n}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <CheckCircle2 className="size-3.5 text-blue-400" />
                          </span>
                        </div>

                        {/* عنوان الوجه الخلفي المخصص */}
                        <h4 className="font-display mt-4 text-[17px] font-bold text-white tracking-tight">
                          {detail.title[isAr ? "ar" : "fr"]}
                        </h4>

                        {/* وصف تفصيلي للوجه الخلفي */}
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300 font-normal">
                          {detail.desc[isAr ? "ar" : "fr"]}
                        </p>

                        {/* قائمة المميزات التفصيلية */}
                        <ul className="mt-3.5 space-y-1.5">
                          {detail.features[isAr ? "ar" : "fr"].map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2 text-[12px] text-slate-200">
                              <span className="size-1.5 rounded-full bg-blue-400 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* تذييل الوجه الخلفي: زر العودة */}
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11.5px] text-slate-400">
                        <span className="font-medium text-slate-400">Smart Store</span>
                        <span className="inline-flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 transition-colors">
                          <span>{isAr ? "رجوع ↺" : "Retour ↺"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
