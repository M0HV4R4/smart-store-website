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
      className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/25 to-slate-50/60 pt-4 pb-10 sm:pt-6 sm:pb-14 lg:pt-8 lg:pb-16 border-b border-slate-200/60"
    >
      {/* 1. طبقة الشبكة الدقيقة بتقنية التلاشي الشعاعي (Subtle SaaS Grid with Radial Fade) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-60 -z-10"
      />

      {/* 2. طبقة إضاءة بيئية متدرجة وشبه شفافة (Ambient Atmospheric Glows) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
      >
        <div className="h-[460px] w-[780px] rounded-full bg-gradient-to-tr from-blue-400/10 via-cyan-400/8 to-transparent blur-3xl" />
        <div className="absolute top-0 h-[300px] w-full bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08),transparent_70%)]" />
      </div>

      {/* 3. حلقات مدارية هندسية دقيقة (Concentric Subtle Orbital Rings) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10 opacity-40"
      >
        <div className="size-[580px] rounded-full border border-blue-200/40" />
        <div className="absolute size-[860px] rounded-full border border-blue-200/30" />
        <div className="absolute size-[1160px] rounded-full border border-slate-200/40" />
      </div>

      {/* حاوية المحتوى: تم توسيعها لتصل إلى 1480px لتستوعب صورة العرض الكبيرة وتمنح الصفحة وزناً بصرياً قوياً */}
      <div className="relative z-10 mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {/* ------------------------------- النص الرئيسي والعناوين ------------------------------- */}
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

          <p className="mt-2.5 max-w-2xl text-lead text-slate-600 text-pretty animate-hero-fade animate-hero-delay-1">
            {t.hero.subtitle}
          </p>

          <div className="mt-3.5 flex justify-center animate-hero-fade animate-hero-delay-2">
            <Button href="#download" size="md" className="px-7 shadow-sm shadow-blue-600/20" icon={<Download className="size-[17px]" aria-hidden />}>
              {t.hero.ctaPrimary}
            </Button>
          </div>

          {/* توافق المنصات */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 animate-hero-fade animate-hero-delay-2">
            <span className="text-[12.5px] font-medium text-slate-500">{t.hero.availableOn}</span>
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-1 text-[12.5px] font-semibold text-slate-800 shadow-2xs">
              <WindowsGlyph className="size-3.5 text-blue-600" /> {t.common.windows}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-1 text-[12.5px] font-semibold text-slate-800 shadow-2xs">
              <AndroidGlyph className="size-3.5 text-green-600" /> {t.common.android}
            </span>
          </div>

          <p className="mt-1.5 text-[12px] font-medium text-slate-500 animate-hero-fade animate-hero-delay-2">
            {t.hero.trust}
          </p>
        </div>

        {/* ------------------------- مسرح عرض المنتج الحقيقي smartstore.png ------------------------- */}
        {/* العرض أصبح هائلاً min(1400px, 92vw) مع إزالة كافة قيود التحجيم الاصطناعية وتصفير الفراغ الزائد */}
        <div className="relative mx-auto mt-4 sm:mt-6 lg:mt-7 w-full max-w-[min(1400px,92vw)]">
          {/* Framer Motion entrance animation: سينمائي ملحوظ (opacity 0->1, y 90->0, scale 0.88->1, blur 8px->0) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 90, scale: 0.88, filter: "blur(8px)" }}
            animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.15, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
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
            {/* إضاءة محيطية زرقاء حية متحركة ببطء خلف المنتج (Slow animated breathing ambient glow) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 sm:-inset-16 lg:-inset-24 -z-10 flex items-center justify-center animate-glow-slow"
            >
              <div className="h-[360px] w-[620px] sm:h-[540px] sm:w-[1050px] lg:h-[640px] lg:w-[1280px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.22),rgba(6,182,212,0.10)_45%,transparent_72%)] blur-2xl sm:blur-3xl" />
            </div>

            {/* أرضية المسرح: ظل بيضاوي عميق وناعم يعطي شعور الاستقرار والواقعية للشاشات */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 sm:-bottom-5 lg:-bottom-7 left-1/2 -z-10 h-8 sm:h-12 lg:h-14 w-[92%] -translate-x-1/2 rounded-[100%] bg-slate-950/22 blur-md sm:blur-2xl"
            />

            {/* الصورة الحقيقية للبرنامج بأبعادها الكاملة غير المنقوصة مع استغلال المساحة كاملة */}
            <img
              src={smartstoreImg}
              alt={altText}
              width={2542}
              height={1419}
              className="h-auto w-full max-w-full object-contain select-none pointer-events-none rtl:transform-none ltr:transform-none filter drop-shadow-md"
              loading="eager"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
