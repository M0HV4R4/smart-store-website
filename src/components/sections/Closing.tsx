import { Download, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, Accordion, Button } from "@/components/ui";
import { Reveal } from "@/components/motion/Motion";
import { Phone } from "@/components/devices";
import { PhoneScreen } from "@/components/product/PhoneScreens";

export function Faq() {
  const { t } = useI18n();
  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              align="start"
              eyebrow={t.faq.eyebrow}
              title={t.faq.title}
              subtitle={t.faq.subtitle}
            />
            <div className="mt-7">
              <Button href="#download" variant="glass" icon={<Download className="size-4" aria-hidden />}>
                {t.nav.download}
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion items={t.faq.items.map((i) => ({ q: i.q, a: i.a }))} />
        </Reveal>
      </div>
    </Section>
  );
}

export function FinalCta() {
  const { t } = useI18n();

  return (
    <Section tone="tight">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] border border-line-strong bg-[linear-gradient(150deg,rgba(24,32,74,0.9),rgba(9,12,26,0.94))] px-5 py-14 shadow-[0_60px_120px_-50px_rgba(0,0,0,1)] sm:px-10 sm:py-16">
          {/* توهج مضبوط */}
          <div className="pointer-events-none absolute -top-36 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(47,107,255,0.42),transparent_65%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 -start-20 size-80 rounded-full bg-[radial-gradient(circle,rgba(122,90,248,0.3),transparent_65%)] blur-2xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
              maskImage: "radial-gradient(ellipse 65% 70% at 50% 40%, black, transparent 72%)",
              WebkitMaskImage: "radial-gradient(ellipse 65% 70% at 50% 40%, black, transparent 72%)",
            }}
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="text-center lg:text-start">
              <h2 className="font-display text-h2 font-extrabold text-balance text-white">
                {t.finalCta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lead text-muted text-pretty lg:mx-0">
                {t.finalCta.subtitle}
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  href="#download"
                  size="lg"
                  className="w-full sm:w-auto"
                  icon={<Download className="size-[18px]" aria-hidden />}
                >
                  {t.finalCta.primary}
                </Button>
                <Button
                  href="#faq"
                  size="lg"
                  variant="glass"
                  className="w-full sm:w-auto"
                  icon={<MessageCircle className="size-[18px]" aria-hidden />}
                >
                  {t.finalCta.secondary}
                </Button>
              </div>

              <p className="mt-6 text-[13px] font-medium text-faint">{t.hero.trust}</p>
            </div>

            <div className="mx-auto w-[45%] max-w-[190px] lg:w-full">
              <Phone>
                <PhoneScreen view="scan" />
              </Phone>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
