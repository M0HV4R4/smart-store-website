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
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -30]);

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
      className="relative overflow-hidden bg-white pt-5 pb-10 sm:pt-7 sm:pb-14 lg:pt-9 lg:pb-16"
    >
      {/* دوائر خلفية أنيقة متحدة المركز */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0" aria-hidden="true">
        <div className="size-[520px] rounded-full border border-slate-200/50" />
        <div className="absolute size-[760px] rounded-full border border-slate-200/40" />
        <div className="absolute size-[1020px] rounded-full border border-slate-200/30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        {/* ------------------------------- النص ------------------------------- */}
        <div className="flex flex-col items-center text-center">
          <h1 className="font-display flex flex-col items-center max-w-[22ch] text-hero font-extrabold text-balance text-slate-950 animate-hero-fade">
            <span>{t.hero.titleLine1}</span>
            <span className="relative mt-1 inline-block text-blue-600">
              <span>{t.hero.titleLine2}</span>
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
          </h1>

          <p className="mt-3 max-w-2xl text-lead text-slate-600 text-pretty animate-hero-fade animate-hero-delay-1">
            {t.hero.subtitle}
          </p>

          <div className="mt-4 flex justify-center animate-hero-fade animate-hero-delay-2">
            <Button href="#download" size="md" className="px-7 shadow-sm" icon={<Download className="size-[17px]" aria-hidden />}>
              {t.hero.ctaPrimary}
            </Button>
          </div>

          {/* توافق المنصات */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 animate-hero-fade animate-hero-delay-2">
            <span className="text-[12.5px] font-medium text-slate-500">{t.hero.availableOn}</span>
            <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12.5px] font-semibold text-slate-800">
              <WindowsGlyph className="size-3.5 text-blue-600" /> {t.common.windows}
            </span>
            <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12.5px] font-semibold text-slate-800">
              <AndroidGlyph className="size-3.5 text-green-600" /> {t.common.android}
            </span>
          </div>

          <p className="mt-2 text-[12px] font-medium text-slate-500 animate-hero-fade animate-hero-delay-2">
            {t.hero.trust}
          </p>
        </div>

        {/* ------------------------- عرض المنتج الحقيقي smartstore.png ------------------------- */}
        {/* المساحة مقلصة والواجهة أكبر بكثير لتركز العين على المنتج كبطل للتصميم */}
        <div className="relative mx-auto mt-5 sm:mt-7 lg:mt-8 w-full max-w-[1220px]">
          {/* Framer Motion entrance animation & depth wrapper */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 65, scale: 0.95 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
            {/* إضاءة محيطية هادئة خلف المنتج (Radial Blue/Cyan ambient light) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 sm:-inset-16 -z-10 flex items-center justify-center"
            >
              <div className="h-[320px] w-[560px] sm:h-[500px] sm:w-[980px] lg:h-[560px] lg:w-[1120px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.18),rgba(6,182,212,0.08)_45%,transparent_75%)] blur-2xl sm:blur-3xl" />
            </div>

            {/* ظل ناعم أسفل الأجهزة (Soft shadow beneath devices) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 sm:-bottom-4 left-1/2 -z-10 h-7 sm:h-11 w-[90%] -translate-x-1/2 rounded-[100%] bg-slate-950/20 blur-md sm:blur-xl"
            />

            {/* الصورة الحقيقية للبرنامج مع الحفاظ التام على أبعادها الأصلية ودون اقتصاص */}
            <img
              src={smartstoreImg}
              alt={altText}
              width={2542}
              height={1419}
              className="h-auto w-full max-w-full object-contain select-none pointer-events-none rtl:transform-none ltr:transform-none filter drop-shadow-sm"
              loading="eager"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
