import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileDrawer } from "./AdminMobileDrawer";

const SIDEBAR_COLLAPSED_KEY = "smartstore_admin_sidebar_collapsed";

export default function AdminLayout() {
  // Read collapse preference from localStorage (cosmetic only)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Sync collapse state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    } catch {
      /* ignore storage errors */
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      {/* Desktop Persistent Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile Drawer (Hidden on lg+) */}
      <AdminMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

        <main id="admin-main" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

