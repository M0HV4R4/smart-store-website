import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ar, type Dict } from "@/locales/ar";
import { fr } from "@/locales/fr";

export type Locale = "ar" | "fr";

const DICTS: Record<Locale, Dict> = { ar, fr };
const STORAGE_KEY = "smart-store:locale";

type I18nValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dict;
  setLocale: (l: Locale) => void;
  toggle: () => void;
};

const I18nContext = createContext<I18nValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "fr") return stored;
  return window.navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const dir: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  // Real document-level direction switch (not a fake text-align)
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    root.style.colorScheme = "light";
    // Synchronize document title with locale
    if (typeof window !== "undefined") {
      const isAdm = window.location.pathname.startsWith("/admin");
      if (!isAdm) {
        document.title =
          locale === "ar"
            ? "Smart Store | برنامج إدارة نقاط البيع والمخزون في الجزائر"
            : "Smart Store | Logiciel de gestion de point de vente et stock en Algérie";
      }
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage blocked — ignore */
    }
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggle = useCallback(() => setLocaleState((l) => (l === "ar" ? "fr" : "ar")), []);

  const value = useMemo<I18nValue>(
    () => ({ locale, dir, t: DICTS[locale], setLocale, toggle }),
    [locale, dir, setLocale, toggle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** تنسيق الأرقام حسب اللغة (أرقام لاتينية في اللغتين — الأكثر شيوعاً في الجزائر) */
export function formatNumber(value: number, _locale: Locale) {
  // فاصل آلاف بمسافة (الأكثر وضوحاً في الجزائر بالعربية والفرنسية معاً)
  return new Intl.NumberFormat("fr-FR").format(value).replace(/\u202f|\u00a0/g, " ");
}

/** مبلغ + عملة، مع اتجاه صحيح */
export function formatMoney(value: number, locale: Locale, currency = "DZD") {
  const n = formatNumber(value, locale);
  return locale === "ar" ? `${n} دج` : `${n} ${currency}`;
}
