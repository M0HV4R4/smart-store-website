import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, Dialog } from "@/components/ui";
import { EASE, Reveal } from "@/components/motion/Motion";
import { screenshots, type ReplicaScreen } from "@/config/screenshots";
import { Laptop, DesktopContent } from "@/components/devices";

export function Gallery() {
  const { t } = useI18n();
  const [active, setActive] = useState<ReplicaScreen>("dashboard");
  const [open, setOpen] = useState(false);

  const shot = screenshots.find((s) => s.id === active);

  return (
    <Section id="showcase">
      <Reveal>
        <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.title} subtitle={t.gallery.subtitle} />
      </Reveal>

      {/* تبويبات الواجهات */}
      <Reveal delay={0.06}>
        <div className="no-scrollbar mt-9 flex snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
          {screenshots.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                aria-pressed={isActive}
                className={cn(
                  "relative shrink-0 snap-start rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-300",
                  isActive ? "text-white" : "text-muted hover:text-white",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="gallery-tab"
                    className="absolute inset-0 rounded-xl border border-line-strong bg-[linear-gradient(100deg,rgba(47,107,255,0.3),rgba(122,90,248,0.14))]"
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
                <span className="relative">{t.gallery.tabs[s.id]}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* الجهاز */}
      <Reveal delay={0.1}>
        <div className="relative mt-10">
          <div className="pointer-events-none absolute inset-x-10 top-6 -z-10 h-64 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(47,107,255,0.25),transparent_62%)] blur-2xl" />

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`${t.gallery.dialogTitle}: ${t.gallery.tabs[active]}`}
            className="group relative mx-auto block w-full max-w-[950px] cursor-zoom-in rounded-2xl transition-transform duration-500 hover:scale-[1.008]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <Laptop>
                  <DesktopContent shot={shot} screen={active} />
                </Laptop>
              </motion.div>
            </AnimatePresence>

            <span className="surface-solid pointer-events-none absolute top-4 end-4 flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Maximize2 className="size-3.5" aria-hidden />
              {t.gallery.openHint}
            </span>
          </button>

          {!shot?.image && (
            <p className="mx-auto mt-16 max-w-xl text-center text-[12.5px] leading-relaxed text-faint">
              {t.gallery.placeholderNote}
            </p>
          )}
        </div>
      </Reveal>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${t.gallery.dialogTitle} — ${t.gallery.tabs[active]}`}
        footer={
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {screenshots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition",
                  s.id === active ? "bg-white/[0.12] text-white" : "text-muted hover:text-white",
                )}
              >
                {t.gallery.tabs[s.id]}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="aspect-16/10 w-full">
            <DesktopContent shot={shot} screen={active} />
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] text-faint">{t.common.sampleData}</p>
      </Dialog>
    </Section>
  );
}
