import { useEffect, useState } from "react";
import { Download, Menu, X, ArrowUpRight, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui";
import { LanguageSwitcher, Logo } from "./Brand";

export function Navbar() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const isAr = locale === "ar";

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Primary navigation links including direct contact
  const navLinks = [
    { href: "#top", label: t.nav.home },
    { href: "#how", label: t.nav.how },
    { href: "#download", label: t.nav.download },
    { href: "#faq", label: t.nav.faq },
    { href: "#contact", label: isAr ? "التواصل" : "Contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-300 shadow-2xs">
        <div className="mx-auto flex h-17 sm:h-19 w-full max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 1. العلامة التجارية والشعار الرسمي */}
          <div className="flex items-center gap-8">
            <Logo />
          </div>

          {/* 2. روابط التنقل لسطح المكتب (Desktop Navigation Links) */}
          <nav aria-label={t.nav.menu} className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-[14px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/80 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 3. عناصر الجانب الأيمن: محوّل اللغة المستقل وزر التحميل وقائمة الهاتف */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* محول لغة مستقل لسطح المكتب */}
            <LanguageSwitcher className="hidden sm:inline-flex" />

            {/* زر التحميل السريع */}
            <Button
              href="#download"
              size="sm"
              className="hidden sm:inline-flex rounded-full px-5 font-bold shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30"
              icon={<Download className="size-4" aria-hidden />}
            >
              {t.nav.download}
            </Button>

            {/* زر فتح قائمة الهاتف الحديثة */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={t.nav.menu}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="grid size-10 place-items-center rounded-xl border border-slate-200/90 bg-white text-slate-900 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* 4. قائمة الهاتف المنزلقة العصرية (Modern Animated Mobile Drawer) */}
      <AnimatePresence>
        {open && (
          <div id="mobile-nav" className="fixed inset-0 z-50 md:hidden">
            {/* الخلفية المظللة مع تأثير التمويه */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* اللوح المنزلق الجانبي */}
            <motion.div
              initial={{ x: isAr ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-y-0 start-0 flex w-[min(340px,86vw)] flex-col justify-between border-e border-slate-200/90 bg-white/98 p-6 shadow-2xl backdrop-blur-xl"
            >
              {/* رأس القائمة المنزلقة */}
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <Logo compact />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t.common.close}
                    className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* روابط الأقسام */}
                <nav className="mt-6 flex flex-col gap-1.5">
                  {navLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-800 transition-all hover:bg-blue-50/80 hover:text-blue-700"
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="size-4 text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:text-blue-600 rtl:-scale-x-100" />
                    </a>
                  ))}
                </nav>
              </div>

              {/* أسفل القائمة: محول اللغة وزر التحميل ودعم التواصل */}
              <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">{t.nav.language}</span>
                  <LanguageSwitcher compact />
                </div>

                <Button
                  href="#download"
                  fullWidth
                  onClick={() => setOpen(false)}
                  className="rounded-xl py-3 shadow-md shadow-blue-600/20"
                  icon={<Download className="size-4" aria-hidden />}
                >
                  {t.nav.download}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-slate-400 pt-1">
                  <Headphones className="size-3.5 text-blue-500" />
                  <span>Smart Store • {siteConfig.platforms.join(" & ")}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
