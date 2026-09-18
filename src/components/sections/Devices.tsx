import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, Card } from "@/components/ui";
import { Reveal } from "@/components/motion/Motion";
import { Laptop, Phone } from "@/components/devices";
import { DesktopScreen } from "@/components/product/DesktopScreens";
import { PhoneScreen } from "@/components/product/PhoneScreens";
import { AndroidGlyph, WindowsGlyph } from "./glyphs";

export function Devices() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const laptopY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const phoneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, -70]);

  return (
    <Section id="platforms">
      <Reveal>
        <SectionHeading
          eyebrow={t.devices.eyebrow}
          title={
            <>
              {t.devices.titleLine1}
              <br />
              <span className="text-gradient-brand">{t.devices.titleLine2}</span>
            </>
          }
          subtitle={t.devices.subtitle}
        />
      </Reveal>

      <div ref={ref} className="relative mt-14">
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-72 bg-[radial-gradient(ellipse_at_center,rgba(47,107,255,0.22),transparent_65%)] blur-2xl" />

        {/* موبايل: تكديس أنيق — سطح المكتب: انتشار أفقي */}
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-6">
          <motion.div style={{ y: laptopY }} className="w-full lg:w-[64%]">
            <Laptop>
              <DesktopScreen screen="dashboard" />
            </Laptop>
            <div className="mt-8 text-center lg:mt-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-white">
                <WindowsGlyph className="size-4 text-primary-soft" />
                {t.devices.desktop}
              </span>
              <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
                {t.devices.desktopDesc}
              </p>
            </div>
          </motion.div>

          <motion.div style={{ y: phoneY }} className="w-[52%] max-w-[230px] sm:w-[40%] lg:w-[20%]">
            <Phone>
              <PhoneScreen view="pos" />
            </Phone>
            <div className="mt-7 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-white">
                <AndroidGlyph className="size-4 text-success" />
                {t.devices.mobile}
              </span>
              <p className="mx-auto mt-3 max-w-[15rem] text-[13.5px] leading-relaxed text-muted">
                {t.devices.mobileDesc}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ملاحظة: لا ندّعي مزامنة تلقائية لأنها غير مؤكدة في المنتج */}
      <Reveal delay={0.1}>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {[
            { Icon: WindowsGlyph, title: t.devices.desktop, desc: t.devices.desktopDesc, color: "#5f8bff" },
            { Icon: AndroidGlyph, title: t.devices.mobile, desc: t.devices.mobileDesc, color: "#34d399" },
          ].map(({ Icon, title, desc, color }) => (
            <Card key={title} className="flex items-start gap-4 p-5 sm:p-6">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-2xl"
                style={{ background: `${color}1f`, boxShadow: `inset 0 0 0 1px ${color}33`, color }}
              >
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-[16px] font-bold text-white">{title}</span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">{desc}</span>
              </span>
            </Card>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
