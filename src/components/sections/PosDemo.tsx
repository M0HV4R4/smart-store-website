import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Printer, RotateCcw, ScanBarcode, ShoppingCart } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { Button, Section, SectionHeading } from "@/components/ui";
import { EASE, Reveal } from "@/components/motion/Motion";
import { ProductIcon } from "@/components/product/parts";

/** خطوات المحاكاة: 0 مسح · 1 تعرّف · 2 سلة · 3 فاتورة */
const DURATIONS = [1700, 1600, 1800, 2600];

export function PosDemo() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % 4), DURATIONS[step]);
    return () => window.clearTimeout(id);
  }, [step, inView, reduce, cycle]);

  const items = useMemo(
    () => [
      { name: t.app.products[0].name, qty: 2, price: 320 },
      { name: t.app.products[3].name, qty: 1, price: 210 },
      { name: t.app.products[6].name, qty: 1, price: 260 },
    ],
    [t],
  );

  const visibleItems = step >= 2 ? items : step === 1 ? items.slice(0, 2) : items.slice(0, 1);
  const total = visibleItems.reduce((s, l) => s + l.qty * l.price, 0);

  return (
    <Section id="demo">
      <Reveal>
        <SectionHeading eyebrow={t.posDemo.eyebrow} title={t.posDemo.title} subtitle={t.posDemo.subtitle} />
      </Reveal>

      <div ref={ref} className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-10">
        {/* --------------------------- المحاكاة --------------------------- */}
        <Reveal>
          <div className="surface-card relative overflow-hidden rounded-card p-4 sm:p-6">
            <div className="pointer-events-none absolute -top-24 start-1/4 size-64 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2),transparent_65%)] blur-2xl" />

            {/* الماسح */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-[#070a14] p-5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-muted">
                <ScanBarcode className="size-4 text-cyan" aria-hidden />
                {t.app.pos.scan}
              </div>

              <div className="relative mx-auto mt-4 h-24 w-full max-w-xs">
                <div dir="ltr" className="absolute inset-0 flex items-center justify-center gap-[3px] px-6">
                  {[3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1].map((w, i) => (
                    <span
                      key={i}
                      className="h-14 rounded-[1px] bg-white/80"
                      style={{ width: `${w * 1.6}px`, opacity: step === 0 ? 0.85 : 0.35 }}
                    />
                  ))}
                </div>
                {!reduce && step === 0 && (
                  <motion.span
                    className="absolute inset-x-4 top-1/2 h-[3px] rounded-full bg-cyan shadow-[0_0_22px_4px_rgba(34,211,238,0.6)]"
                    animate={{ y: [-34, 34, -34] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <span dir="ltr" className="absolute inset-x-0 -bottom-1 text-center text-[11.5px] text-faint tabular-nums">
                  6 291041 500213
                </span>
              </div>

              {/* بطاقة المنتج المتعرَّف عليه */}
              <AnimatePresence mode="wait">
                {step >= 1 && (
                  <motion.div
                    key={`prod-${step >= 1}`}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-5 flex items-center gap-3 rounded-2xl border border-success/25 bg-success/[0.07] p-3"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-success/15 text-success">
                      <ProductIcon index={0} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-white">
                        {t.app.products[0].name}
                      </span>
                      <span className="block text-[12px] text-success">{t.app.pos.matched}</span>
                    </span>
                    <span dir="ltr" className="text-[15px] font-extrabold text-white tabular-nums">
                      320 {t.app.currency}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* السلة */}
            <div className="mt-4 rounded-2xl border border-line bg-[#070a14] p-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <ShoppingCart className="size-4 text-primary-soft" aria-hidden />
                <span className="text-[12.5px] font-semibold text-slate-300">{t.app.pos.cart}</span>
                <motion.span
                  key={visibleItems.length}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="grid size-5 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-primary-soft"
                >
                  {visibleItems.length}
                </motion.span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {visibleItems.map((l, i) => (
                    <motion.div
                      key={l.name}
                      initial={{ opacity: 0, x: 18, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="flex items-center gap-2.5 overflow-hidden rounded-xl bg-white/[0.035] px-3 py-2"
                    >
                      <ProductIcon index={i} className="size-4 text-faint" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{l.name}</span>
                      <span className="text-[11.5px] text-faint">×{l.qty}</span>
                      <span dir="ltr" className="text-[13px] font-bold text-white tabular-nums">
                        {l.qty * l.price}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-3 flex items-end border-t border-line pt-3">
                <span className="text-[12.5px] text-muted">{t.app.pos.total}</span>
                <motion.span
                  key={total}
                  dir="ltr"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="ms-auto text-[22px] leading-none font-extrabold text-white tabular-nums"
                >
                  {total} {t.app.currency}
                </motion.span>
              </div>

              <div
                className={cn(
                  "mt-3 rounded-xl py-2.5 text-center text-[13px] font-bold transition-all duration-500",
                  step === 3
                    ? "bg-success/20 text-success ring-1 ring-success/40"
                    : "bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] text-white",
                )}
              >
                {step === 3 ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                    {t.posDemo.steps[3].title}
                  </span>
                ) : (
                  t.app.pos.checkout
                )}
              </div>
            </div>

            {/* الفاتورة */}
            <AnimatePresence>
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 22, rotate: -1.5 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: 14 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="absolute inset-x-6 bottom-6 rounded-2xl bg-white p-4 text-[#0b1020] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)]"
                >
                  <div className="flex items-center">
                    <span className="text-[13px] font-extrabold">{t.app.invoice.title}</span>
                    <span dir="ltr" className="ms-auto text-[11.5px] text-slate-500 tabular-nums">
                      2026-0184
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-[12px]">
                    <span className="text-slate-500">{t.app.invoice.total}</span>
                    <span dir="ltr" className="font-extrabold tabular-nums">
                      {total} {t.app.currency}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[11.5px] font-semibold text-slate-600">
                    <Printer className="size-3.5" aria-hidden />
                    {t.app.invoice.print}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* --------------------------- الشرح --------------------------- */}
        <div>
          <ol className="flex flex-col gap-3">
            {t.posDemo.steps.map((s, i) => {
              const isActive = i === step;
              const isDone = i < step;
              return (
                <li key={s.title}>
                  <div
                    className={cn(
                      "relative flex items-start gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-500",
                      isActive
                        ? "border-primary/40 bg-[linear-gradient(100deg,rgba(47,107,255,0.16),rgba(122,90,248,0.06))]"
                        : "border-line bg-white/[0.02]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-[12.5px] font-bold transition-colors duration-500",
                        isActive
                          ? "bg-[linear-gradient(135deg,#2f6bff,#7a5af8)] text-white"
                          : isDone
                            ? "bg-success/15 text-success"
                            : "bg-white/[0.06] text-faint",
                      )}
                    >
                      {isDone ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-[15px] font-bold", isActive ? "text-white" : "text-slate-300")}>
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">{s.desc}</span>
                    </span>
                    {isActive && !reduce && (
                      <motion.span
                        layoutId="demo-active"
                        className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-[linear-gradient(180deg,#2f6bff,#22d3ee)]"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* الباركود */}
          <div className="surface-card mt-5 rounded-card p-5 sm:p-6">
            <h3 className="font-display flex items-center gap-2.5 text-h3 font-extrabold text-white">
              <ScanBarcode className="size-5 text-cyan" aria-hidden />
              {t.posDemo.barcodeTitle}
            </h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {t.posDemo.barcodePoints.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[13.5px] text-slate-300">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-cyan/15 text-cyan">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                setStep(0);
                setCycle((c) => c + 1);
              }}
              icon={<RotateCcw className="size-4" aria-hidden />}
            >
              {t.posDemo.replay}
            </Button>
            <p className="text-[12px] text-faint">{t.posDemo.disclaimer}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
