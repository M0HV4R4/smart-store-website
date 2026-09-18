import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Download,
  Package,
  BarChart3,
  Globe,
  Settings,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
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

  return (
    <aside
      className={`hidden lg:flex flex-col border-e border-slate-800/80 bg-slate-950 transition-all duration-200 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        <Link
          to="/admin"
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-sm shadow-blue-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-slate-950">
              <span className="text-sm font-black text-white">S</span>
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-white tracking-tight">Smart Store</span>
              <span className="text-[10px] font-medium text-cyan-400 mt-0.5">Admin</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav aria-label="Admin Navigation" className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                } ${isCollapsed ? "justify-center px-0" : ""}`
              }
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions (Collapse & Public Website Link) */}
      <div className="border-t border-slate-800/80 p-2 space-y-1">
        {/* Link to public website */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          title={isCollapsed ? t.admin.login.backToSite : undefined}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
          {!isCollapsed && <span className="truncate">{t.admin.login.backToSite}</span>}
        </Link>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? header.expandSidebar : header.collapseSidebar}
          title={isCollapsed ? header.expandSidebar : header.collapseSidebar}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          {isCollapsed ? (
            isAr ? <ChevronLeft className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              {isAr ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
              <span className="truncate">{header.collapseSidebar}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

