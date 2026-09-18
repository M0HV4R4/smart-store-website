import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/config/site";
import { Logo } from "./Brand";

export function Footer() {
  const { t } = useI18n();
  const { contact } = siteConfig;
  const hasContact = Boolean(contact.email || contact.phone || contact.address);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Logo />
            <p className="text-[13.5px] text-slate-600">{t.footer.tagline}</p>
          </div>

          {hasContact && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13.5px] text-slate-700">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-blue-600">
                  <Mail className="size-4 text-blue-600" aria-hidden /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 hover:text-blue-600">
                  <Phone className="size-4 text-blue-600" aria-hidden /> {contact.phone}
                </a>
              )}
              {contact.address && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 text-blue-600" aria-hidden /> {contact.address}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[12.5px] text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {t.footer.rights}
          </p>
          <p>{siteConfig.platforms.join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
