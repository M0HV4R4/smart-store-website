/** روابط التنقل / Liens de navigation — المفاتيح تُترجم في locales */
export type NavKey = "home" | "features" | "how" | "faq";

export const mainNav: { key: NavKey; href: string }[] = [
  { key: "home", href: "#top" },
  { key: "features", href: "#features" },
  { key: "how", href: "#how" },
  { key: "faq", href: "#faq" },
];

export const footerNav = {
  site: [
    { key: "home", href: "#top" },
    { key: "features", href: "#features" },
    { key: "download", href: "#download" },
    { key: "faq", href: "#faq" },
  ],
  product: [
    { key: "windows", href: "#download" },
    { key: "android", href: "#download" },
  ],
  legal: [
    { key: "privacy", href: "#" }, // TODO: صفحة سياسة الخصوصية
    { key: "terms", href: "#" }, // TODO: صفحة شروط الاستخدام
  ],
} as const;
