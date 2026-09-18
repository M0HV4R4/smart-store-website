import { motion } from "framer-motion";
import { ArrowLeft, Check, FileQuestion, Layers, LineChart, Notebook, PackageX, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, Card, Pill } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";

const ICONS = [Notebook, LineChart, PackageX, Timer, FileQuestion, Layers];

export function Story() {
  const { t } = useI18n();

  return (
    <Section id="problem">
      <Reveal>
        <SectionHeading eyebrow={t.problem.eyebrow} title={t.problem.title} subtitle={t.problem.subtitle} />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
        {/* قبل — الفوضى */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Pill tone="danger">{t.problem.before}</Pill>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(248,113,113,0.35),transparent)]" />
          </div>

          <Stagger className="grid gap-3 sm:grid-cols-2">
            {t.problem.items.map((item, i) => {
              const Icon = ICONS[i];
              return (
                <StaggerItem key={item.title}>
                  <Card className="group h-full p-5">
                    {/* خط علوي أحمر خافت */}
                    <span className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(248,113,113,0.5),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="flex items-start gap-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger ring-1 ring-danger/20">
                        <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden />
                      </span>
                      <span>
                        <span className="block text-[15px] font-bold text-white">{item.title}</span>
                        <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">{item.desc}</span>
                      </span>
                    </span>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        {/* بعد — الحل */}
        <Reveal delay={0.15}>
          <div className="sticky top-28">
            <div className="mb-4 flex items-center gap-3">
              <Pill tone="brand">{t.problem.after}</Pill>
              <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(95,139,255,0.45),transparent)]" />
            </div>

            <Card interactive={false} className="relative overflow-hidden p-6 sm:p-7">
              <div className="pointer-events-none absolute -top-24 -end-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(47,107,255,0.3),transparent_65%)] blur-2xl" />

              <h3 className="font-display relative text-h3 font-extrabold text-white">
                {t.problem.solution.title}
              </h3>
              <p className="relative mt-3 text-[14.5px] leading-loose text-muted">{t.problem.solution.desc}</p>

              <ul className="relative mt-6 flex flex-col gap-3">
                {t.problem.solution.points.map((p, i) => (
                  <motion.li
                    key={p}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] px-4 py-3"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2f6bff,#7a5af8)]">
                      <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="text-[14px] font-semibold text-slate-200">{p}</span>
                  </motion.li>
                ))}
              </ul>

              <a
                href="#features"
                className="relative mt-6 inline-flex items-center gap-2 text-[13.5px] font-bold text-primary-soft transition hover:text-white"
              >
                {t.solution.title}
                <ArrowLeft className="size-4 ltr:-scale-x-100" aria-hidden />
              </a>
            </Card>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
