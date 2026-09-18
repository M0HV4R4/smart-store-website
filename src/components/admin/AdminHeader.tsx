import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Globe, LogOut, Loader2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ onOpenMobileMenu }: AdminHeaderProps) {
  const { admin, logout } = useAuth();
  const { t, locale, toggle } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const nav = t.admin.nav;
  const header = t.admin.header;

  // Resolve current route title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return nav.dashboard;
    if (path.startsWith("/admin/downloads")) return nav.downloads;
    if (path.startsWith("/admin/releases")) return nav.releases;
    if (path.startsWith("/admin/analytics")) return nav.analytics;
    if (path.startsWith("/admin/website")) return nav.website;
    if (path.startsWith("/admin/settings")) return nav.settings;
    if (path.startsWith("/admin/security")) return nav.security;
    if (path.startsWith("/admin/activity")) return nav.activity;
    return nav.dashboard;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get admin initials for neutral avatar badge
  const initials = (admin?.username || "Admin")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left side: Mobile menu toggle + Dynamic page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label={header.openMenu}
          className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Language toggle + User badge + Logout button */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language switch button */}
        <button
          type="button"
          onClick={toggle}
          aria-label={header.switchLanguage}
          title={header.switchLanguage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{locale === "ar" ? "Français" : "العربية"}</span>
          <span className="sm:hidden">{locale === "ar" ? "FR" : "عربي"}</span>
        </button>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-800" aria-hidden="true" />

        {/* User profile info (safe authenticated details only, no fake avatar) */}
        <div className="flex items-center gap-2.5">
          <div
            title={`${admin?.username || "Admin"} (${admin?.email || ""})`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-slate-900 text-xs font-bold text-blue-400 shadow-inner"
          >
            {initials || <User className="h-3.5 w-3.5" />}
          </div>

          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-xs font-bold text-slate-200">
              {admin?.username || "Admin"}
            </span>
            <span className="text-[10px] text-slate-400 max-w-[150px] truncate" dir="ltr">
              {admin?.email || ""}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={header.logout}
          aria-label={header.logout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs font-medium text-slate-400 transition hover:border-rose-900/50 hover:bg-rose-950/40 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 sm:px-2.5"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-rose-300" />
          )}
          <span className="hidden sm:inline">
            {isLoggingOut ? header.loggingOut : header.logout}
          </span>
        </button>
      </div>
    </header>
  );
}

