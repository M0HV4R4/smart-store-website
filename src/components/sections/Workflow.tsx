import { motion } from "framer-motion";
import { Check, Gauge, LayoutList, ShieldCheck, Sparkles, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, Card, IconTile } from "@/components/ui";
import { EASE, Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";

/* ------------------------- الموظفون والصلاحيات ------------------------- */

export function Employees() {
  const { t } = useI18n();
  const rows = [
    { name: t.app.employeesList[0], role: t.employees.roles.cashier, perms: [true, false, false, false] },
    { name: t.app.employeesList[1], role: t.employees.roles.stock, perms: [true, true, false, false] },
    { name: t.app.employeesList[2], role: t.employees.roles.manager, perms: [true, true, true, true] },
  ];
  const cols = [
    t.employees.perms.sales,
    t.employees.perms.inventory,
    t.employees.perms.reports,
    t.employees.perms.settings,
  ];

  return (
    <Section id="employees">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center lg:gap-14">
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-2.5">
              <IconTile color="#34d399">
                <ShieldCheck className="size-[21px]" strokeWidth={1.7} aria-hidden />
              </IconTile>
              <span className="surface-glass rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-primary-soft">
                {t.employees.eyebrow}
              </span>
            </span>
            <h2 className="font-display mt-5 text-h2 font-extrabold text-balance text-white">
              {t.employees.title}
            </h2>
            <p className="mt-4 text-[15px] leading-loose text-muted">{t.employees.subtitle}</p>
            <p className="mt-5 rounded-2xl border border-line bg-white/[0.03] px-4 py-3 text-[13.5px] text-slate-300">
              {t.employees.note}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Card interactive={false} className="overflow-hidden p-0">
            {/* رأس الجدول */}
            <div className="grid grid-cols-[1.5fr_repeat(4,1fr)] gap-2 border-b border-line bg-white/[0.03] px-4 py-3 text-[11.5px] font-bold text-muted sm:text-[12.5px]">
              <span>{t.employees.tableEmployee}</span>
              {cols.map((c) => (
                <span key={c} className="text-center leading-tight">
                  {c}
                </span>
              ))}
            </div>

            {rows.map((row, ri) => (
              <motion.div
                key={row.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: ri * 0.1, ease: EASE }}
                className={cn(
                  "grid grid-cols-[1.5fr_repeat(4,1fr)] items-center gap-2 px-4 py-3.5",
                  ri % 2 === 1 && "bg-white/[0.015]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2f6bff,#7a5af8)] text-[12.5px] font-bold text-white">
                    {row.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-bold text-white">{row.name}</span>
                    <span className="block truncate text-[11.5px] text-faint">{row.role}</span>
                  </span>
                </span>
                {row.perms.map((ok, pi) => (
                  <span key={pi} className="flex justify-center">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full",
                        ok ? "bg-success/15 text-success" : "bg-white/[0.05] text-faint",
                      )}
                      title={ok ? t.employees.allowed : t.employees.denied}
                    >
                      {ok ? (
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      ) : (
                        <X className="size-3.5" strokeWidth={3} aria-hidden />
                      )}
                      <span className="sr-only">{ok ? t.employees.allowed : t.employees.denied}</span>
                    </span>
                  </span>
                ))}
              </motion.div>
            ))}
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------- كيف يعمل ------------------------------- */

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <Section id="how">
      <Reveal>
        <SectionHeading eyebrow={t.how.eyebrow} title={t.how.title} subtitle={t.how.subtitle} />
      </Reveal>

      <div className="relative mt-14">
        {/* الخط الرابط: أفقي على سطح المكتب، عمودي على الجوال */}
        <span className="absolute inset-y-0 start-[27px] w-px bg-[linear-gradient(180deg,transparent,rgba(95,139,255,0.45),transparent)] lg:inset-x-[12%] lg:inset-y-auto lg:top-[38px] lg:h-px lg:w-auto lg:bg-[linear-gradient(90deg,transparent,rgba(95,139,255,0.45),transparent)]" />

        <Stagger className="grid gap-6 lg:grid-cols-3" gap={0.14}>
          {t.how.steps.map((s) => (
            <StaggerItem key={s.n}>
              <div className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center">
                <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(140deg,#111730,#0a0d1a)] text-[15px] font-extrabold text-white ring-1 ring-line-strong">
                  <span className="absolute inset-0 rounded-2xl bg-[linear-gradient(140deg,rgba(47,107,255,0.25),transparent)]" />
                  <span dir="ltr" className="relative tabular-nums">
                    {s.n}
                  </span>
                </span>
                <span className="pt-1">
                  <span className="block text-[17px] font-bold text-white">{s.title}</span>
                  <span className="mt-1.5 block max-w-xs text-[14px] leading-relaxed text-muted lg:mx-auto">
                    {s.desc}
                  </span>
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}

/* ------------------------------- المميزات ------------------------------- */

const HIGHLIGHT_ICONS = [Gauge, Sparkles, LayoutList, ShieldCheck];

export function Highlights() {
  const { t } = useI18n();

  return (
    <Section tone="tight">
      <Reveal>
        <h2 className="font-display text-center text-h3 font-extrabold text-white">{t.highlights.title}</h2>
      </Reveal>
      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.highlights.items.map((item, i) => {
          const Icon = HIGHLIGHT_ICONS[i];
          return (
            <StaggerItem key={item.title}>
              <Card className="h-full p-5 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-white/[0.05] text-primary-soft ring-1 ring-line">
                  <Icon className="size-5" strokeWidth={1.7} aria-hidden />
                </span>
                <span className="mt-4 block text-[16px] font-bold text-white">{item.title}</span>
                <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted">{item.desc}</span>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
