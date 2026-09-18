import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/config/site";
import { Logo } from "./Brand";

export function Footer() {
  const { t } = useI18n();
  const { contact } = siteConfig;
  const hasContact = Boolean(contact.email || contact.phone || contact.address);

  return (
    <footer className="border-t border-slate-200/80 bg-slate-50/70 py-12 sm:py-14 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex flex-col items-center gap-2.5 md:items-start">
            <Logo />
            <p className="text-[13.5px] font-normal text-slate-500 max-w-sm text-center md:text-start">{t.footer.tagline}</p>
          </div>

          {hasContact && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13.5px] font-medium text-slate-600">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-blue-600">
                  <Mail className="size-4 text-blue-600" aria-hidden /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 transition-colors hover:text-blue-600">
                  <Phone className="size-4 text-blue-600" aria-hidden /> {contact.phone}
                </a>
              )}
              {contact.address && (
                <span className="inline-flex items-center gap-2 text-slate-500">
                  <MapPin className="size-4 text-blue-600" aria-hidden /> {contact.address}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-[12.5px] font-medium text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 px-3 py-0.5 text-xs font-semibold text-slate-700">
              {siteConfig.platforms.join(" • ")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
