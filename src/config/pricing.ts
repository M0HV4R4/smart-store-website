/**
 * ==========================================================================
 * التسعير / Tarification
 * ==========================================================================
 * غيّر السعر أو العملة أو الخطط من هنا فقط.
 * لا تضف ميزة غير موجودة فعلياً في Smart Store.
 */

export type PlanId = "trial" | "standard";

export type Plan = {
  id: PlanId;
  /** null = بدون سعر معروض (مثل التجربة) */
  price: number | null;
  currency: "DZD";
  featured: boolean;
  /** مفاتيح الميزات — النصوص في locales/*.ts (plans.features) */
  features: string[];
  ctaHref: string;
};

export const pricingConfig = {
  currency: "DZD" as const,
  /** إظهار/إخفاء بطاقة التجربة بالكامل */
  trialEnabled: true,
  plans: [
    {
      id: "trial",
      price: null,
      currency: "DZD",
      featured: false,
      features: ["pos", "products", "invoices", "reportsBasic"],
      ctaHref: "#download",
    },
    {
      id: "standard",
      price: 6000,
      currency: "DZD",
      featured: true,
      features: [
        "pos",
        "barcode",
        "inventory",
        "purchases",
        "customers",
        "debts",
        "invoices",
        "reports",
        "employees",
        "services",
        "multiStore",
        "windowsAndroid",
      ],
      ctaHref: "#download",
    },
  ] satisfies Plan[],
} as const;
