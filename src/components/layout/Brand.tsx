import { Store } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { brandAssets } from "@/config/screenshots";
import { siteConfig } from "@/config/site";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useI18n();

  return (
    <a href="#top" className={cn("group flex items-center gap-2.5", className)} aria-label={siteConfig.name}>
      {brandAssets.logo ? (
        <img src={brandAssets.logo} alt={siteConfig.name} className="size-10 rounded-xl" width={40} height={40} />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Store className="size-5 text-white" strokeWidth={2.2} aria-hidden />
        </span>
      )}
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-extrabold text-slate-900">{siteConfig.name}</span>
          <span className="mt-1 text-[11px] font-medium text-slate-500">{t.app.brandSub}</span>
        </span>
      )}
    </a>
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn(
        "flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1",
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
              "rounded-md px-3 py-1 text-[12px] font-bold",
              isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {l === "ar" ? "AR" : "FR"}
          </button>
        );
      })}
    </div>
  );
}
