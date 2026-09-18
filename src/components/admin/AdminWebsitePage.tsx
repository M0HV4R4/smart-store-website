import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe,
  Save,
  RotateCcw,
  Phone,
  Share2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  getAdminWebsiteConfig,
  updateAdminWebsiteConfig,
  type WebsiteConfigData,
  SiteApiError,
} from "@/services/siteService";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";
import { WhatsAppLogo, FacebookLogo, InstagramLogo } from "@/components/icons/BrandIcons";

const INITIAL_CONFIG: WebsiteConfigData = {
  contact: {
    titleAr: "",
    titleFr: "",
    descriptionAr: "",
    descriptionFr: "",
  },
  whatsapp: {
    enabled: false,
    number: "",
    normalizedNumber: "",
    messageAr: "",
    messageFr: "",
  },
  facebook: {
    enabled: false,
    url: "",
  },
  instagram: {
    enabled: false,
    url: "",
  },
};

export default function AdminWebsitePage() {
  const { checkSession } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.website;

  // Server state
  const [savedConfig, setSavedConfig] = useState<WebsiteConfigData>(INITIAL_CONFIG);
  // Form working state
  const [form, setForm] = useState<WebsiteConfigData>(INITIAL_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Field validation issues from server
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Toast feedback
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Live preview language toggle (ar / fr)
  const [previewLang, setPreviewLang] = useState<"ar" | "fr">(isAr ? "ar" : "fr");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch initial config
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setFieldErrors({});
    try {
      const data = await getAdminWebsiteConfig();
      setSavedConfig(data);
      setForm(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      if (err instanceof SiteApiError && err.statusCode === 401) {
        checkSession();
        return;
      }
      const msg = err instanceof Error ? err.message : dict.errorLoading;
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [checkSession, dict.errorLoading]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Dirty state tracking
  const isDirty = useMemo(() => {
    return JSON.stringify(savedConfig) !== JSON.stringify(form);
  }, [savedConfig, form]);

  // Discard changes
  const handleDiscard = () => {
    setForm(JSON.parse(JSON.stringify(savedConfig)));
    setFieldErrors({});
  };

  // Handle submit / save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    setFieldErrors({});

    try {
      const updated = await updateAdminWebsiteConfig(form);
      setSavedConfig(updated);
      setForm(JSON.parse(JSON.stringify(updated)));
      showToast(dict.toastSaved, "success");
    } catch (err) {
      if (err instanceof SiteApiError) {
        if (err.statusCode === 401) {
          checkSession();
          return;
        }
        if (err.issues && err.issues.length > 0) {
          const map: Record<string, string> = {};
          for (const issue of err.issues) {
            if (issue.path && issue.path.length > 0) {
              const pathKey = issue.path.join(".");
              map[pathKey] = issue.message;
            }
          }
          setFieldErrors(map);
        }
        showToast(err.message || dict.toastError, "error");
      } else {
        showToast(err instanceof Error ? err.message : dict.toastError, "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">{dict.saving}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto size-10 text-rose-500" />
        <h3 className="mt-3 text-base font-bold text-rose-900">{dict.errorLoading}</h3>
        <p className="mt-1 text-sm text-rose-700">{loadError}</p>
        <button
          onClick={fetchConfig}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          {dict.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 end-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Bar with Action Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Globe className="size-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              {dict.title}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {dict.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                {dict.dirtyNotice}
              </span>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" />
                <span>{dict.discardChanges}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>{isSaving ? dict.saving : dict.saveChanges}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left / Main Configuration Column */}
        <div className="space-y-8 lg:col-span-7">
          {/* Section 1: Contact & Support Section Texts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <MessageSquare className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {dict.sectionContact}
                </h2>
                <p className="text-xs text-slate-500">
                  {dict.sectionContactDesc}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="field-contact-title-ar" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldContactTitleAr}
                </label>
                <input
                  id="field-contact-title-ar"
                  type="text"
                  dir="rtl"
                  value={form.contact.titleAr}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, titleAr: e.target.value },
                    })
                  }
                  maxLength={200}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors["contact.titleAr"]
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="مثال: هل تحتاج إلى استفسار أو مساعدة قبل التنزيل؟"
                />
                {fieldErrors["contact.titleAr"] && (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors["contact.titleAr"]}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="field-contact-title-fr" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldContactTitleFr}
                </label>
                <input
                  id="field-contact-title-fr"
                  type="text"
                  dir="ltr"
                  value={form.contact.titleFr}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, titleFr: e.target.value },
                    })
                  }
                  maxLength={200}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors["contact.titleFr"]
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Ex: Besoin d'aide ou d'un renseignement avant de télécharger ?"
                />
                {fieldErrors["contact.titleFr"] && (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors["contact.titleFr"]}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="field-contact-desc-ar" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldContactDescAr}
                </label>
                <textarea
                  id="field-contact-desc-ar"
                  dir="rtl"
                  rows={3}
                  value={form.contact.descriptionAr}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, descriptionAr: e.target.value },
                    })
                  }
                  maxLength={1000}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors["contact.descriptionAr"]
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="الوصف التوضيحي الذي يظهر للزوار بالعربية..."
                />
                {fieldErrors["contact.descriptionAr"] && (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors["contact.descriptionAr"]}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="field-contact-desc-fr" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldContactDescFr}
                </label>
                <textarea
                  id="field-contact-desc-fr"
                  dir="ltr"
                  rows={3}
                  value={form.contact.descriptionFr}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, descriptionFr: e.target.value },
                    })
                  }
                  maxLength={1000}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors["contact.descriptionFr"]
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Description affichée aux visiteurs en français..."
                />
                {fieldErrors["contact.descriptionFr"] && (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors["contact.descriptionFr"]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: WhatsApp Channel */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <WhatsAppLogo size={20} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {dict.sectionWhatsapp}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {dict.sectionWhatsappDesc}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  aria-label={dict.sectionWhatsapp}
                  checked={form.whatsapp.enabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsapp: { ...form.whatsapp, enabled: e.target.checked },
                    })
                  }
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-600 after:absolute after:start-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30" />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="field-whatsapp-number" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldWhatsappNumber}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
                    <Phone className="size-4" />
                  </span>
                  <input
                    id="field-whatsapp-number"
                    type="text"
                    dir="ltr"
                    value={form.whatsapp.number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        whatsapp: { ...form.whatsapp, number: e.target.value },
                      })
                    }
                    maxLength={50}
                    className={`w-full rounded-lg border ps-9 pe-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      fieldErrors["whatsapp.number"]
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                    placeholder="+213 555 12 34 56"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {dict.whatsappNumberHint}
                </p>
                {fieldErrors["whatsapp.number"] && (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors["whatsapp.number"]}
                  </p>
                )}
                {form.whatsapp.normalizedNumber && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-600 border border-slate-200">
                    <span className="text-slate-400 font-sans">
                      {dict.whatsappNormalizedLabel}:
                    </span>
                    <span className="font-semibold text-emerald-700">
                      +{form.whatsapp.normalizedNumber}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="field-whatsapp-msg-ar" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldWhatsappMessageAr}
                </label>
                <textarea
                  id="field-whatsapp-msg-ar"
                  dir="rtl"
                  rows={2}
                  value={form.whatsapp.messageAr}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsapp: { ...form.whatsapp, messageAr: e.target.value },
                    })
                  }
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="مرحبًا، أود الاستفسار حول برنامج Smart Store v10..."
                />
              </div>

              <div>
                <label htmlFor="field-whatsapp-msg-fr" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {dict.fieldWhatsappMessageFr}
                </label>
                <textarea
                  id="field-whatsapp-msg-fr"
                  dir="ltr"
                  rows={2}
                  value={form.whatsapp.messageFr}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsapp: { ...form.whatsapp, messageFr: e.target.value },
                    })
                  }
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Bonjour, je souhaite avoir des informations sur Smart Store v10..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social Channels (Facebook & Instagram) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <Share2 className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {dict.sectionSocial}
                </h2>
                <p className="text-xs text-slate-500">
                  {dict.sectionSocialDesc}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* Facebook */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded bg-blue-600 text-white">
                      <FacebookLogo size={16} />
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      Facebook
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      aria-label="Facebook"
                      checked={form.facebook.enabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          facebook: {
                            ...form.facebook,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-blue-600 after:absolute after:start-[2px] after:top-[2px] after:size-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-focus:outline-none" />
                  </label>
                </div>

                <div>
                  <label htmlFor="field-facebook-url" className="block text-xs font-semibold text-slate-700 mb-1">
                    {dict.fieldFacebookUrl}
                  </label>
                  <input
                    id="field-facebook-url"
                    type="url"
                    dir="ltr"
                    value={form.facebook.url}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        facebook: { ...form.facebook, url: e.target.value },
                      })
                    }
                    maxLength={2048}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      fieldErrors["facebook.url"]
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="https://facebook.com/smartstore.algerie"
                  />
                  {fieldErrors["facebook.url"] && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors["facebook.url"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                      <InstagramLogo size={16} />
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      Instagram
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      aria-label="Instagram"
                      checked={form.instagram.enabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          instagram: {
                            ...form.instagram,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-rose-600 after:absolute after:start-[2px] after:top-[2px] after:size-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-focus:outline-none" />
                  </label>
                </div>

                <div>
                  <label htmlFor="field-instagram-url" className="block text-xs font-semibold text-slate-700 mb-1">
                    {dict.fieldInstagramUrl}
                  </label>
                  <input
                    id="field-instagram-url"
                    type="url"
                    dir="ltr"
                    value={form.instagram.url}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        instagram: { ...form.instagram, url: e.target.value },
                      })
                    }
                    maxLength={2048}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      fieldErrors["instagram.url"]
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-300 focus:border-rose-500 focus:ring-rose-500/20"
                    }`}
                    placeholder="https://instagram.com/smartstore.dz"
                  />
                  {fieldErrors["instagram.url"] && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors["instagram.url"]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Public Live Preview Column */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
                  <Eye className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {dict.sectionPreview}
                  </h3>
                  <p className="text-[11.5px] text-slate-500">
                    {dict.sectionPreviewDesc}
                  </p>
                </div>
              </div>

              {/* Language switcher for preview */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewLang("ar")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    previewLang === "ar"
                      ? "bg-white text-blue-700 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang("fr")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    previewLang === "fr"
                      ? "bg-white text-blue-700 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Français
                </button>
              </div>
            </div>

            {/* Preview Box Frame */}
            <div
              className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all"
              dir={previewLang === "ar" ? "rtl" : "ltr"}
            >
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                    <ShieldCheck className="size-3" />
                    <span>
                      {previewLang === "ar" ? "الدعم والاستفسار" : "Support & Contact"}
                    </span>
                  </span>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900">
                  {previewLang === "ar"
                    ? form.contact.titleAr || "هل تحتاج إلى استفسار أو مساعدة قبل التنزيل؟"
                    : form.contact.titleFr || "Besoin d'aide ou d'un renseignement avant de télécharger ?"}
                </h4>

                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {previewLang === "ar"
                    ? form.contact.descriptionAr || "فريقنا متواجد للإجابة على استفساراتكم ومساعدتكم في اختيار النسخة المناسبة أو تفعيل النظام."
                    : form.contact.descriptionFr || "Notre équipe est à votre écoute pour répondre à vos questions et vous guider dans l'installation."}
                </p>

                {/* Buttons / Actions */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {form.whatsapp.enabled && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700">
                      <WhatsAppLogo size={16} />
                      <span>
                        {previewLang === "ar" ? "تواصل عبر واتساب" : "Discuter sur WhatsApp"}
                      </span>
                    </div>
                  )}

                  {form.facebook.enabled && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                      <FacebookLogo size={14} className="text-blue-600" />
                      <span>Facebook</span>
                    </div>
                  )}

                  {form.instagram.enabled && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                      <InstagramLogo size={14} className="text-rose-600" />
                      <span>Instagram</span>
                    </div>
                  )}

                  {!form.whatsapp.enabled &&
                    !form.facebook.enabled &&
                    !form.instagram.enabled && (
                      <span className="text-xs italic text-slate-400">
                        {previewLang === "ar"
                          ? "جميع قنوات التواصل معطلة حالياً (لن يظهر هذا القسم للزوار)"
                          : "Tous les canaux sont désactivés (le bloc restera masqué pour les visiteurs)"}
                      </span>
                    )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50/50 p-3 text-[11.5px] text-blue-800 border border-blue-100">
              <p className="leading-relaxed">
                {previewLang === "ar"
                  ? "تظهر هذه الإعدادات مباشرة للزوار في أسفل قسم التحميل، وتُحدث قاعدة البيانات في الوقت الفعلي دون الحاجة لإعادة نشر الموقع."
                  : "Ces paramètres sont appliqués immédiatement en bas de la section Téléchargement sans nécessiter de redéploiement."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
