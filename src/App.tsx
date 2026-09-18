import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { GuestRoute } from "@/components/admin/GuestRoute";
import { AdminLoadingScreen } from "@/components/admin/AdminLoadingScreen";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FaqSection } from "@/components/sections/FaqSection";
import { DownloadCtaSection } from "@/components/sections/DownloadCtaSection";
import { ContactSection } from "@/components/sections/ContactSection";

// Route-level code-splitting: Admin bundle is strictly isolated from public homepage
const AdminLoginPage = lazy(() => import("@/components/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/components/admin/AdminDashboardPage"));
const AdminDownloadsPage = lazy(() => import("@/components/admin/AdminDownloadsPage"));
const AdminReleasesPage = lazy(() => import("@/components/admin/AdminReleasesPage"));
const AdminAnalyticsPage = lazy(() => import("@/components/admin/AdminAnalyticsPage"));
const AdminWebsitePage = lazy(() => import("@/components/admin/AdminWebsitePage"));
const AdminSecurityPage = lazy(() => import("@/components/admin/AdminSecurityPage"));
const AdminActivityPage = lazy(() => import("@/components/admin/AdminActivityPage"));
const AdminPlaceholderPage = lazy(() => import("@/components/admin/AdminPlaceholderPage"));

/**
 * The public marketing website remains 100% intact with original sections & anchor navigation.
 */
function PublicMarketingPage() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-bg"
      >
        {t.common.skipToContent}
      </a>

      <Navbar />

      <main id="main">
        <Hero />
        <HowItWorks />
        <DownloadCtaSection />
        <FaqSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* 1. Public Marketing Website */}
            <Route path="/" element={<PublicMarketingPage />} />

            {/* 2. Admin Login (Guest-only guard: redirects authenticated admins directly to /admin) */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<AdminLoadingScreen />}>
                  <GuestRoute>
                    <AdminLoginPage />
                  </GuestRoute>
                </Suspense>
              }
            />

            {/* 3. Protected Admin Application Shell */}
            <Route
              path="/admin"
              element={
                <Suspense fallback={<AdminLoadingScreen />}>
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                </Suspense>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="downloads" element={<AdminDownloadsPage />} />
              <Route path="releases" element={<AdminReleasesPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="website" element={<AdminWebsitePage />} />
              <Route
                path="settings"
                element={<AdminPlaceholderPage sectionKey="settings" />}
              />
              <Route path="security" element={<AdminSecurityPage />} />
              <Route path="activity" element={<AdminActivityPage />} />
            </Route>

            {/* 4. Global Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}
