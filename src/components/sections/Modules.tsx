import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Boxes, ChartColumnBig, Check, Handshake, Wrench } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, IconTile, Pill } from "@/components/ui";
import { EASE, Reveal } from "@/components/motion/Motion";
import { Laptop } from "@/components/devices";
import { DesktopScreen } from "@/components/product/DesktopScreens";
import { BRAND } from "@/components/product/parts";

/** صف متناوب: نص + جهاز */
function Row({
  eyebrow,
  title,
  subtitle,
  points,
  visual,
  reverse = false,
  icon,
  color,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  points?: string[];
  visual: ReactNode;
  reverse?: boolean;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <Reveal className={cn(reverse && "lg:order-2")}>
        <div>
          <span className="inline-flex items-center gap-2.5">
            <IconTile color={color}>{icon}</IconTile>
            <Pill tone="brand">{eyebrow}</Pill>
          </span>
          <h3 className="font-display mt-5 text-h2 font-extrabold text-balance text-white">{title}</h3>
          <p className="mt-4 max-w-xl text-[15px] leading-loose text-muted">{subtitle}</p>

          {points && (
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[14px] text-slate-300">
                  <span
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"
                    style={{ background: `${color}22`, color }}
                  >
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.12} className={cn(reverse && "lg:order-1")}>
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[50%] blur-2xl"
            style={{ background: `radial-gradient(ellipse at center, ${color}2e, transparent 65%)` }}
          />
          {visual}
        </div>
      </Reveal>
    </div>
  );
}

export function Modules() {
  const { t } = useI18n();

  return (
    <Section id="modules" className="flex flex-col gap-20 sm:gap-24">
      {/* المخزون */}
      <Row
        color={BRAND.cyan}
        icon={<Boxes className="size-[21px]" strokeWidth={1.7} aria-hidden />}
        eyebrow={t.inventory.eyebrow}
        title={t.inventory.title}
        subtitle={t.inventory.subtitle}
        points={t.inventory.points}
        visual={
          <Laptop>
            <DesktopScreen screen="inventory" />
          </Laptop>
        }
      />

      {/* التقارير */}
      <Row
        reverse
        color={BRAND.violet}
        icon={<ChartColumnBig className="size-[21px]" strokeWidth={1.7} aria-hidden />}
        eyebrow={t.reports.eyebrow}
        title={t.reports.title}
        subtitle={t.reports.subtitle}
        points={t.reports.points}
        visual={
          <Laptop>
            <DesktopScreen screen="reports" />
          </Laptop>
        }
      />

      {/* الديون والعملاء */}
      <div>
        <Reveal>
          <SectionHeading eyebrow={t.debts.eyebrow} title={t.debts.title} subtitle={t.debts.subtitle} />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <Reveal>
            <Laptop>
              <DesktopScreen screen="customers" />
            </Laptop>
          </Reveal>

          <Reveal delay={0.12}>
            {/* مسار الدين */}
            <ol className="relative flex flex-col gap-2.5">
              {t.debts.flow.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                  className="surface-card flex items-center gap-4 rounded-2xl px-4 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#2f6bff,#7a5af8)] text-[13px] font-bold text-white tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-bold text-white">{s.title}</span>
                    <span className="block text-[13px] text-muted">{s.desc}</span>
                  </span>
                  {i < t.debts.flow.length - 1 && (
                    <ArrowLeft className="size-4 shrink-0 rotate-90 text-faint ltr:-scale-x-100" aria-hidden />
                  )}
                </motion.li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>

      {/* الخدمات */}
      <Row
        reverse
        color="#a78bfa"
        icon={<Wrench className="size-[21px]" strokeWidth={1.7} aria-hidden />}
        eyebrow={t.services.eyebrow}
        title={t.services.title}
        subtitle={t.services.subtitle}
        visual={
          <Laptop>
            <DesktopScreen screen="services" />
          </Laptop>
        }
      />

      <Reveal>
        <div className="-mt-16 flex flex-col gap-5">
          <div className="flex flex-wrap justify-center gap-2.5">
            {t.services.examples.map((ex) => (
              <span
                key={ex}
                className="surface-glass rounded-full px-4 py-2 text-[13.5px] font-semibold text-slate-200"
              >
                {ex}
              </span>
            ))}
          </div>

          {/* مسار الخدمة */}
          <div className="surface-card flex flex-wrap items-center justify-center gap-2 rounded-card px-4 py-4 sm:gap-3">
            {t.services.flow.map((f, i) => (
              <span key={f} className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 py-1.5 text-[13px] font-semibold text-slate-200">
                  <Handshake className="size-3.5 text-primary-soft" aria-hidden />
                  {f}
                </span>
                {i < t.services.flow.length - 1 && (
                  <ArrowLeft className="size-4 text-faint ltr:-scale-x-100" aria-hidden />
                )}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
