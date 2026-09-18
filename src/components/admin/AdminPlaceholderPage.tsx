import { Link } from "react-router-dom";
import {
  Download,
  Package,
  BarChart3,
  Globe,
  Settings,
  Shield,
  Activity,
  ArrowRight,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AdminPlaceholderPageProps {
  sectionKey:
    | "downloads"
    | "releases"
    | "analytics"
    | "website"
    | "settings"
    | "security"
    | "activity";
}

const SECTION_ICONS = {
  downloads: Download,
  releases: Package,
  analytics: BarChart3,
  website: Globe,
  settings: Settings,
  security: Shield,
  activity: Activity,
};

export default function AdminPlaceholderPage({ sectionKey }: AdminPlaceholderPageProps) {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";

  const nav = t.admin.nav;
  const sectionTitle = nav[sectionKey];
  const Icon = SECTION_ICONS[sectionKey] || Clock;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-cyan-400">
          <Icon className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
            {t.admin.placeholder.title}
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight">{sectionTitle}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.admin.placeholder.message}
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            {isAr ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
            <span>{nav.dashboard}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

