import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * بيئة الخلفية: تدرّجات شعاعية + شبكة + حبيبات خفيفة + بقعة ضوء تتبع المؤشر.
 * كل الحركة عبر transform فقط، وتتوقف تماماً مع prefers-reduced-motion
 * أو على الأجهزة اللمسية الضعيفة.
 */
export function Background() {
  const spotRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (spotRef.current) {
        spotRef.current.style.transform = `translate3d(${cx - 320}px, ${cy - 320}px, 0)`;
      }
      raf = Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-bg" />

      {/* أورب علوي أساسي */}
      <div className="absolute -top-[30rem] left-1/2 h-[56rem] w-[86rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(47,107,255,0.42),rgba(47,107,255,0.08)_45%,transparent_70%)] blur-[30px]" />
      <div className="absolute -top-24 -left-40 size-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(122,90,248,0.32),transparent_66%)] blur-[26px] animate-orb" />
      <div className="absolute top-[14rem] -right-48 size-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_66%)] blur-[30px] animate-orb [animation-delay:-7s]" />
      <div className="absolute -bottom-72 left-[4%] size-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(47,107,255,0.22),transparent_66%)] blur-[30px]" />
      <div className="absolute -right-40 -bottom-80 size-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(122,90,248,0.22),transparent_66%)] blur-[30px] animate-orb [animation-delay:-11s]" />

      {/* الشبكة */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "62px 62px",
          maskImage: "radial-gradient(ellipse 92% 70% at 50% 6%, black 8%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 92% 70% at 50% 6%, black 8%, transparent 70%)",
        }}
      />

      {/* بقعة ضوء تتبع المؤشر (سطح المكتب فقط) */}
      <div
        ref={spotRef}
        className="absolute top-0 left-0 hidden size-[640px] rounded-full bg-[radial-gradient(circle,rgba(95,139,255,0.12),transparent_62%)] will-change-transform lg:block"
      />

      {/* تظليل + حبيبات */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_45%,rgba(7,8,13,0.7)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
