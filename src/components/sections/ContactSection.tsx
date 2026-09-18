import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Headphones,
  Mail,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { getPublicContact, type PublicContactData } from "@/services/siteService";
import { siteConfig } from "@/config/site";
import { WhatsAppLogo, FacebookLogo, InstagramLogo } from "@/components/icons/BrandIcons";

export function ContactSection() {
  const { locale } = useI18n();
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
        // Fail safely if API unreachable
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isAr = locale === "ar";

  const customTitle = isAr ? contactData?.title?.ar : contactData?.title?.fr;
  const customDesc = isAr ? contactData?.description?.ar : contactData?.description?.fr;

  const title =
    customTitle?.trim() ||
    (isAr ? "نحن هنا لمساعدتك" : "Nous sommes là pour vous aider");

  const description =
    customDesc?.trim() ||
    (isAr
      ? "هل لديك أي استفسار أو ترغب في معرفة المزيد عن نظام Smart Store؟ تواصل معنا مباشرة عبر قنواتنا المعتمدة وسنكون سعداء بخدمتك."
      : "Vous avez une question ou souhaitez en savoir plus sur Smart Store ? Contactez-nous directement via nos canaux officiels.");

  const whatsappUrl = isAr ? contactData?.whatsapp?.urlAr : contactData?.whatsapp?.urlFr;
  const isWhatsappEnabled = Boolean(contactData?.whatsapp?.enabled && whatsappUrl);
  const isFacebookEnabled = Boolean(contactData?.facebook?.enabled && contactData?.facebook?.url);
  const isInstagramEnabled = Boolean(contactData?.instagram?.enabled && contactData?.instagram?.url);

  const hasAnySocial = isWhatsappEnabled || isFacebookEnabled || isInstagramEnabled;

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-16 sm:py-24 border-t border-blue-200/60"
    >
      {/* شبكة خلفية ناعمة مع هالات زرقاء مضيئة تعطي قسماً ختامياً فخماً ومميزاً */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial-fade opacity-40 -z-10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
      >
        <div className="h-[520px] w-[860px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.16),rgba(14,165,233,0.10)_50%,transparent_75%)] blur-3xl animate-glow-slow" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* الحاوية الزجاجية الفاخرة للقسم */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-blue-200/90 bg-white/95 p-8 sm:p-12 lg:p-14 shadow-2xl shadow-blue-500/8 backdrop-blur-md"
        >
          {/* إضاءات محيطية زاوية أنيقة */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -end-24 size-80 rounded-full bg-blue-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -start-24 size-80 rounded-full bg-cyan-500/10 blur-3xl"
          />

          {/* العناوين والشارات */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-blue-50/90 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-2xs">
              <ShieldCheck className="size-3.5 text-blue-600" />
              <span>{isAr ? "الدعم والتواصل المباشر" : "Support & Contact Direct"}</span>
            </div>

            <h2 className="font-display mt-3.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-snug">
              {title}
            </h2>

            <p className="mt-3 text-[15px] sm:text-base leading-relaxed text-slate-600 text-pretty font-normal">
              {description}
            </p>

            {/* شارات الطمأنينة والتواجد */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 font-semibold shadow-2xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? "متواجدون للإجابة على استفساراتكم" : "Disponibles pour répondre à vos questions"}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 font-semibold shadow-2xs">
                <Sparkles className="size-3.5 text-blue-600" />
                <span>{isAr ? "مرافقة وإرشاد في الاستخدام" : "Accompagnement et conseils d'utilisation"}</span>
              </span>
            </div>
          </div>

          {/* بطاقات قنوات التواصل (Cards Convergent Animation) */}
          {hasAnySocial ? (
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {/* 1. بطاقة WhatsApp الرئيسية الفاخرة */}
              {isWhatsappEnabled && (
                <motion.a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={reduce ? false : { opacity: 0, x: isAr ? 30 : -30, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ type: "spring", stiffness: 90, damping: 15, delay: 0.05 }}
                  whileHover={reduce ? undefined : { y: -6, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-7 text-white shadow-xl shadow-emerald-600/20 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                >
                  {/* لمعة ضوئية علوية */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-xs border border-white/20 transition-all duration-300 group-hover:bg-white group-hover:text-emerald-700 group-hover:scale-110">
                        <WhatsAppLogo size={24} />
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-lg text-emerald-200 transition-all duration-300 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 rtl:group-hover:-translate-x-1">
                        <ArrowUpRight className="size-5 rtl:-scale-x-100" />
                      </span>
                    </div>

                    <h3 className="font-display mt-5 text-[20px] font-bold">
                      WhatsApp
                    </h3>
                    <p className="mt-1.5 text-xs text-emerald-100">
                      {isAr ? "تواصل فوري مع فريق المبيعات والدعم" : "Contact direct avec l'équipe"}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-emerald-500/40 pt-4 text-xs font-semibold text-emerald-50 group-hover:text-white">
                    <span>{isAr ? "تواصل معنا عبر واتساب" : "Discuter sur WhatsApp"}</span>
                  </div>
                </motion.a>
              )}

              {/* 2. بطاقة Facebook التفاعلية */}
              {isFacebookEnabled && contactData?.facebook?.url && (
                <motion.a
                  href={contactData.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ type: "spring", stiffness: 90, damping: 15, delay: 0.1 }}
                  whileHover={reduce ? undefined : { y: -6, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs hover:border-[#1877F2]/60 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/40 hover:shadow-xl hover:shadow-blue-500/12 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#1877F2] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1877F2] border border-blue-100 transition-all duration-300 group-hover:bg-[#1877F2] group-hover:text-white group-hover:scale-110">
                        <FacebookLogo size={22} />
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 group-hover:text-[#1877F2] group-hover:translate-x-1 group-hover:-translate-y-1 rtl:group-hover:-translate-x-1">
                        <ArrowUpRight className="size-5 rtl:-scale-x-100" />
                      </span>
                    </div>

                    <h3 className="font-display mt-5 text-[20px] font-bold text-slate-900 group-hover:text-[#1877F2] transition-colors">
                      Facebook
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {isAr ? "تابع جديد المنشورات والتحديثات" : "Dernières publications et nouveautés"}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-700 group-hover:text-[#1877F2] transition-colors">
                    <span>{isAr ? "تابع صفحتنا على فيسبوك" : "Suivez-nous sur Facebook"}</span>
                  </div>
                </motion.a>
              )}

              {/* 3. بطاقة Instagram التفاعلية */}
              {isInstagramEnabled && contactData?.instagram?.url && (
                <motion.a
                  href={contactData.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={reduce ? false : { opacity: 0, x: isAr ? -30 : 30, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ type: "spring", stiffness: 90, damping: 15, delay: 0.15 }}
                  whileHover={reduce ? undefined : { y: -6, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs hover:border-rose-300 hover:bg-gradient-to-b hover:from-white hover:to-rose-50/30 hover:shadow-xl hover:shadow-rose-500/12 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 transition-all duration-300 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:via-rose-600 group-hover:to-purple-600 group-hover:text-white group-hover:scale-110">
                        <InstagramLogo size={22} />
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 group-hover:text-rose-600 group-hover:translate-x-1 group-hover:-translate-y-1 rtl:group-hover:-translate-x-1">
                        <ArrowUpRight className="size-5 rtl:-scale-x-100" />
                      </span>
                    </div>

                    <h3 className="font-display mt-5 text-[20px] font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      Instagram
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {isAr ? "فيديوهات توضيحية وتغطيات حية" : "Tutoriels vidéos et présentations"}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-700 group-hover:text-rose-600 transition-colors">
                    <span>{isAr ? "تابع حسابنا على إنستغرام" : "Suivez-nous sur Instagram"}</span>
                  </div>
                </motion.a>
              )}
            </div>
          ) : (
            /* حالة عدم تفعيل القنوات في قاعدة البيانات: بطاقة دعم أنيقة راقية تحفظ المظهر الفخم للواجهة */
            <div className="mt-8 mx-auto max-w-lg">
              <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/20 p-6 sm:p-7 text-center shadow-sm">
                <div className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Headphones className="size-6" />
                </div>
                <h3 className="font-display mt-4 text-[18px] font-bold text-slate-900">
                  {isAr ? "فريق دعم Smart Store في خدمتك دائماً" : "L'équipe support Smart Store à votre service"}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {isAr
                    ? "نسعد بتلقي كافة استفساراتكم واقتراحاتكم لتطوير النظام وخدمة متجركم على أكمل وجه."
                    : "Nous sommes à votre disposition pour toute question ou suggestion pour faire grandir votre commerce."}
                </p>

                {siteConfig.contact.email && (
                  <div className="mt-4 flex justify-center">
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      <Mail className="size-4" />
                      <span>{siteConfig.contact.email}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
