import { Store } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { brandAssets } from "@/config/screenshots";
import { siteConfig } from "@/config/site";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useI18n();

  return (
    <a href="#top" className={cn("group flex items-center gap-3 select-none", className)} aria-label={siteConfig.name}>
      {brandAssets.logo ? (
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400 group-hover:shadow-md group-hover:shadow-blue-500/10">
          <img
            src={brandAssets.logo}
            alt={siteConfig.name}
            className="size-full object-contain"
            width={40}
            height={40}
            loading="eager"
            decoding="async"
          />
        </div>
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
          <Store className="size-5 text-white" strokeWidth={2.2} aria-hidden />
        </span>
      )}
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="font-display text-[17px] font-extrabold tracking-tight text-slate-950 transition-colors duration-200 group-hover:text-blue-600">
            {siteConfig.name}
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-slate-500">
            {t.app.brandSub}
          </span>
        </span>
      )}
    </a>
  );
}

export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200/90 bg-white/95 p-1 shadow-2xs backdrop-blur-md transition-all hover:border-slate-300",
        className,
      )}
    >
      {(["ar", "fr"] as const).map((l) => {
        const isActive = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={isActive}
            className={cn(
              "relative rounded-full px-2.5 py-1 text-[11.5px] font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1",
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80",
            )}
          >
            {compact ? (l === "ar" ? "AR" : "FR") : (l === "ar" ? "العربية" : "Français")}
          </button>
        );
      })}
    </div>
  );
}
