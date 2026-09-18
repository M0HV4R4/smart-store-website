import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { WindowsGlyph, AndroidGlyph } from "./glyphs";
import smartstoreImg from "../../../smartstore.png";

export function Hero() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Subtle restrained parallax on scroll (desktop only)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -32]);

  // Subtle 3D tilt (Desktop only: rotateX ±1deg, rotateY ±1.5deg)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 20, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], ["1deg", "-1deg"]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], ["-1.5deg", "1.5deg"]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || isTouch || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
    const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xNorm);
    mouseY.set(yNorm);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const altText =
    locale === "ar"
      ? "واجهة برنامج Smart Store على الكمبيوتر والهاتف"
      : "Interface Smart Store sur ordinateur et smartphone";

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative overflow-hidden pt-6 pb-14 sm:pt-10 sm:pb-20 lg:pt-14 lg:pb-24 border-b border-slate-200/70"
    >
      {/* 1. شبكة دقيقة بتدرج ناعم يمنح إحساس SaaS راقياً */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-50 -z-10"
      />

      {/* 2. إضاءة محيطية علوية وسفلية متدرجة (Ambient Atmospheric Lighting) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
      >
        <div className="h-[520px] w-[880px] rounded-full bg-gradient-to-tr from-blue-500/12 via-cyan-400/8 to-transparent blur-3xl" />
        <div className="absolute top-0 h-[360px] w-full bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.09),transparent_72%)]" />
      </div>

      {/* 3. دوائر مدارية خفيفة جداً تعطي عمقاً فلكياً هندسياً */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10 opacity-30"
      >
        <div className="size-[640px] rounded-full border border-blue-200/50" />
        <div className="absolute size-[960px] rounded-full border border-blue-200/35" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* ------------------------------- العناوين والنصوص ------------------------------- */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* شارة التعريف بالنظام */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-white/95 px-4 py-1.5 text-[12.5px] font-bold text-blue-700 shadow-2xs backdrop-blur-md mb-4 animate-hero-fade">
            <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{t.hero.badge || (locale === "ar" ? "نظام إدارة المتاجر والخدمات المتكامل" : "Système de gestion commerciale tout-en-un")}</span>
          </div>

          <h1 className="font-display flex flex-col items-center text-hero font-extrabold text-balance text-slate-950 tracking-tight leading-[1.12] animate-hero-fade">
            <span>{t.hero.titleLine1}</span>
            <span className="relative mt-1 inline-block text-blue-600">
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
          </h1>

          <p className="mt-4 max-w-2xl text-lead text-slate-600 text-pretty font-normal leading-relaxed animate-hero-fade animate-hero-delay-1">
            {t.hero.subtitle}
          </p>

          {/* زر الإجراء الرئيسي CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 animate-hero-fade animate-hero-delay-2">
            <Button
              href="#download"
              size="lg"
              className="rounded-full px-8 py-3.5 text-[15px] font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all duration-300"
              icon={<Download className="size-5" aria-hidden />}
            >
              {t.hero.ctaPrimary}
            </Button>
          </div>

          {/* توافق المنصات والشارات الداعمة */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 animate-hero-fade animate-hero-delay-2">
            <span className="text-[12.5px] font-semibold text-slate-500">{t.hero.availableOn}</span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1 text-[12.5px] font-bold text-slate-800 shadow-2xs">
              <WindowsGlyph className="size-3.5 text-blue-600" /> {t.common.windows}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1 text-[12.5px] font-bold text-slate-800 shadow-2xs">
              <AndroidGlyph className="size-3.5 text-emerald-600" /> {t.common.android}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t.hero.trust}
            </span>
          </div>
        </div>

        {/* ------------------------- مسرح عرض المنتج الحقيقي smartstore.png ------------------------- */}
        <div className="relative mx-auto mt-8 sm:mt-12 lg:mt-14 w-full max-w-[min(1380px,94vw)]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 70, scale: 0.94, filter: "blur(6px)" }}
            animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={
              reduce || isTouch
                ? undefined
                : {
                    perspective: 1200,
                    rotateX,
                    rotateY,
                    y: parallaxY,
                    transformStyle: "preserve-3d",
                  }
            }
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative flex items-center justify-center will-change-transform"
          >
            {/* إضاءة خلفية حية متدرجة الزرقة والصفاء */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 sm:-inset-14 lg:-inset-20 -z-10 flex items-center justify-center animate-glow-slow"
            >
              <div className="h-[380px] w-[640px] sm:h-[520px] sm:w-[1000px] lg:h-[620px] lg:w-[1240px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.20),rgba(6,182,212,0.09)_45%,transparent_72%)] blur-2xl sm:blur-3xl" />
            </div>

            {/* أرضية المسرح وظل الانعكاس الناعم */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-4 sm:-bottom-6 lg:-bottom-8 left-1/2 -z-10 h-8 sm:h-12 lg:h-14 w-[92%] -translate-x-1/2 rounded-[100%] bg-slate-950/20 blur-md sm:blur-2xl"
            />

            {/* إطار العرض الفاخر (SaaS Software Stage Frame) */}
            <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white/95 via-blue-50/20 to-slate-100/40 p-1.5 sm:p-2.5 shadow-2xl shadow-blue-900/10 backdrop-blur-md">
              <img
                src={smartstoreImg}
                alt={altText}
                width={2542}
                height={1419}
                className="h-auto w-full rounded-xl sm:rounded-2xl object-contain select-none pointer-events-none rtl:transform-none ltr:transform-none filter drop-shadow-sm"
                loading="eager"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
