import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getPublicContact, type PublicContactData } from "@/services/siteService";
import { WhatsAppLogo, FacebookLogo, InstagramLogo } from "@/components/icons/BrandIcons";

export function ContactSection() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [contactData, setContactData] = useState<PublicContactData | null>(null);

  useEffect(() => {
    let mounted = true;
    getPublicContact()
      .then((data) => {
        if (mounted && data) {
          setContactData(data);
        }
      })
      .catch(() => {
        // Fail safe: fallback to local dictionary strings
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isAr = locale === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const customTitle = isAr ? contactData?.title?.ar : contactData?.title?.fr;
  const customDesc = isAr ? contactData?.description?.ar : contactData?.description?.fr;

  const title = customTitle?.trim() || (isAr ? "هل تحتاج إلى مساعدة أو استفسار؟" : "Besoin d'aide ou d'une information ?");
  const description = customDesc?.trim() || t.contactSupport.defaultDesc;

  const whatsappUrl = isAr ? contactData?.whatsapp?.urlAr : contactData?.whatsapp?.urlFr;
  const isWhatsappEnabled = Boolean(contactData?.whatsapp?.enabled && whatsappUrl);
  const isFacebookEnabled = Boolean(contactData?.facebook?.enabled && contactData?.facebook?.url);
  const isInstagramEnabled = Boolean(contactData?.instagram?.enabled && contactData?.instagram?.url);

  return (
    <section id="contact" className="relative overflow-hidden bg-white py-16 sm:py-24 border-t border-slate-200/80">
      {/* دوائر وتدرجات خلفية محيطية هادئة */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0" aria-hidden="true">
        <div className="size-[540px] rounded-full bg-blue-50/60 blur-3xl" />
        <div className="absolute size-[720px] rounded-full bg-cyan-50/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 35 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/25 p-8 sm:p-12 lg:p-14 shadow-xl shadow-blue-500/5"
        >
          {/* إضاءة محيطية زاوية أنيقة */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -end-24 size-80 rounded-full bg-blue-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -start-24 size-80 rounded-full bg-cyan-500/10 blur-3xl"
          />

          <div className="relative z-10 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            {/* جهة النصوص والعناوين */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs">
                <ShieldCheck className="size-3.5 text-blue-600" />
                <span>{t.contactSupport.badge}</span>
              </div>

              <h2 className="font-display mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-snug sm:leading-tight">
                {title}
              </h2>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 text-pretty">
                {description}
              </p>

              {/* شارات الطمأنينة والتواجد */}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 font-medium shadow-2xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.contactSupport.offlineNotice}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 font-medium shadow-2xs">
                  <Sparkles className="size-3.5 text-blue-600" />
                  <span>{isAr ? "دعم مباشر لجميع الاستفسارات" : "Assistance directe pour toutes vos questions"}</span>
                </span>
              </div>
            </div>

            {/* جهة أزرار التواصل المباشر */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col lg:items-end">
              {/* زر واتساب الرئيسي — مهيمن وأنيق */}
              {isWhatsappEnabled ? (
                <motion.a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-emerald-600/35 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <WhatsAppLogo size={22} className="shrink-0" />
                  <span>{t.contactSupport.whatsappCta}</span>
                  <ArrowIcon className="size-4 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </motion.a>
              ) : (
                <a
                  href="#download"
                  className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:shadow-blue-600/35 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <MessageCircle className="size-5 shrink-0" />
                  <span>{isAr ? "تحميل ومتابعة التحديثات" : "Télécharger et suivre les mises à jour"}</span>
                  <ArrowIcon className="size-4 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </a>
              )}

              {/* قنوات التواصل الاجتماعي الثانوية — فيسبوك وإنستغرام إن كانت مفعّلة */}
              {(isFacebookEnabled || isInstagramEnabled) && (
                <div className="flex items-center gap-2.5 sm:justify-start lg:justify-end">
                  {isFacebookEnabled && contactData?.facebook?.url && (
                    <motion.a
                      href={contactData.facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.contactSupport.facebookAria}
                      whileHover={reduce ? undefined : { y: -2, scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <FacebookLogo size={16} />
                      <span>Facebook</span>
                    </motion.a>
                  )}

                  {isInstagramEnabled && contactData?.instagram?.url && (
                    <motion.a
                      href={contactData.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.contactSupport.instagramAria}
                      whileHover={reduce ? undefined : { y: -2, scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                    >
                      <InstagramLogo size={16} />
                      <span>Instagram</span>
                    </motion.a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
