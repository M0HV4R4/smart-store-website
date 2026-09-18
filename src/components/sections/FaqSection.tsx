import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/cn";

export function FaqSection() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.15 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const toggleItem = (idx: number) => {
    setOpenIdx((curr) => (curr === idx ? null : idx));
  };

  return (
    <section id="faq" ref={sectionRef} className="relative bg-[#fbfbfa] py-16 sm:py-24 border-t border-slate-200">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14 items-start">
          {/* Left Column matching reference: red/blue dot, title with curved line decoration, descriptive text */}
          <div
            className={cn(
              "flex flex-col items-start transition-all duration-700 ease-out",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[13px] font-semibold text-blue-700 tracking-wide">
                {t.faq.eyebrow}
              </span>
            </div>

            <h2 className="font-display mt-4 text-h2 font-extrabold text-slate-950 text-balance leading-tight">
              <span>{t.faq.title}</span>
              <span className="block mt-1 relative w-fit text-blue-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 12"
                  className="absolute -bottom-2.5 start-0 w-full text-blue-600 overflow-visible pointer-events-none"
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
            </h2>

            <p className="mt-6 text-[15px] leading-relaxed text-slate-600 sm:text-[16px] max-w-md">
              {t.faq.subtitle}
            </p>
          </div>

          {/* Right Column: Accordion with rounded-md cards, circular blue + / - icons, smooth open/close */}
          <div className="flex flex-col gap-3.5">
            {t.faq.items.map((item, idx) => {
              const isOpen = openIdx === idx;
              const delayClass =
                idx === 0
                  ? "delay-[100ms]"
                  : idx === 1
                    ? "delay-[200ms]"
                    : idx === 2
                      ? "delay-[300ms]"
                      : idx === 3
                        ? "delay-[400ms]"
                        : idx === 4
                          ? "delay-[500ms]"
                          : "delay-[600ms]";

              return (
                <div
                  key={item.q}
                  className={cn(
                    "group rounded-md border bg-white shadow-xs transition-all duration-700 ease-out",
                    delayClass,
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                    isOpen ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200/90 hover:border-slate-300",
                  )}
                >
                  <button
                    type="button"
                    id={`faq-question-${idx}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    onClick={() => toggleItem(idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-start select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-md"
                  >
                    <span className="text-[15.5px] font-semibold text-slate-900 leading-snug">
                      {item.q}
                    </span>

                    {/* Circular Icon with blue background instead of black */}
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-300",
                        isOpen
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                      )}
                    >
                      {isOpen ? (
                        <Minus className="size-4" strokeWidth={2.2} />
                      ) : (
                        <Plus className="size-4" strokeWidth={2.2} />
                      )}
                    </span>
                  </button>

                  {/* Smooth height-expanding container */}
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-[14px] leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
