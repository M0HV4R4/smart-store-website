import { useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mainNav } from "@/config/navigation";
import { Button } from "@/components/ui";
import { LanguageSwitcher, Logo } from "./Brand";

export function Navbar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // We keep the relevant nav links: top (hero), how it works, and FAQ
  const filteredNav = mainNav.filter(
    (item) => item.href === "#top" || item.href === "#how" || item.href === "#faq",
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Logo />

            <nav aria-label={t.nav.menu} className="hidden items-center gap-1 sm:flex">
              {filteredNav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-4 py-2 text-[14px] font-semibold text-slate-700 hover:text-blue-600"
                >
                  {t.nav[item.key]}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher className="hidden sm:flex" />
              <Button
                href="#download"
                size="sm"
                className="hidden sm:inline-flex"
                icon={<Download className="size-4" aria-hidden />}
              >
                {t.nav.download}
              </Button>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={t.nav.menu}
                aria-expanded={open}
                aria-controls="mobile-nav"
                className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-900 sm:hidden"
              >
                {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {open && (
        <div id="mobile-nav" className="border-b border-slate-200 bg-white p-4 sm:hidden">
          <nav className="flex flex-col gap-2">
            {filteredNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-[15px] font-semibold text-slate-800 hover:bg-slate-50"
              >
                {t.nav[item.key]}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Button href="#download" fullWidth onClick={() => setOpen(false)} icon={<Download className="size-4" aria-hidden />}>
              {t.nav.download}
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </>
  );
}
