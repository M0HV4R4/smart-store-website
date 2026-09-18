import { useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Download,
  Package,
  BarChart3,
  Globe,
  Settings,
  Shield,
  Activity,
  X,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({ isOpen, onClose }: AdminMobileDrawerProps) {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const drawerRef = useRef<HTMLDivElement>(null);

  const nav = t.admin.nav;
  const header = t.admin.header;

  const navItems = [
    { to: "/admin", end: true, label: nav.dashboard, icon: LayoutDashboard },
    { to: "/admin/downloads", end: false, label: nav.downloads, icon: Download },
    { to: "/admin/releases", end: false, label: nav.releases, icon: Package },
    { to: "/admin/analytics", end: false, label: nav.analytics, icon: BarChart3 },
    { to: "/admin/website", end: false, label: nav.website, icon: Globe },
    { to: "/admin/settings", end: false, label: nav.settings, icon: Settings },
    { to: "/admin/security", end: false, label: nav.security, icon: Shield },
    { to: "/admin/activity", end: false, label: nav.activity, icon: Activity },
  ];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const slideDirection = isAr ? { x: "100%" } : { x: "-100%" };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Drawer"
            initial={slideDirection}
            animate={{ x: 0 }}
            exit={slideDirection}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 start-0 flex w-72 flex-col bg-slate-950 border-e border-slate-800 shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-sm shadow-blue-500/20">
                  <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-slate-950">
                    <span className="text-sm font-black text-white">S</span>
                  </div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-white">Smart Store</span>
                  <span className="text-[10px] font-medium text-cyan-400 mt-0.5">Admin</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={onClose}
                aria-label={header.closeMenu}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-medium transition ${
                        isActive
                          ? "bg-blue-600/10 text-blue-400 border border-blue-500/30 font-semibold"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-slate-800 p-3">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{t.admin.login.backToSite}</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

