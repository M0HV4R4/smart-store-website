/**
 * ==========================================================================
 * لقطات الشاشة / Captures d'écran
 * ==========================================================================
 * لا توجد حالياً لقطات حقيقية داخل المشروع، لذلك يعرض الموقع "واجهة بديلة"
 * مبنية بالكامل بـ HTML/SVG (نظيفة وسريعة وقابلة للترجمة).
 *
 * لاستعمال اللقطات الحقيقية:
 *   1) ضع الصور في: public/smart-store/screenshots/
 *      (مقترح: dashboard.png, pos.png, products.png, inventory.png,
 *               invoices.png, reports.png, customers.png, services.png, settings.png)
 *   2) غيّر image: null  ->  image: "/smart-store/screenshots/dashboard.png"
 *   3) لا شيء آخر يتغيّر — المعرض والنوافذ تستعمل الصورة تلقائياً.
 */

/** الشاشات المبنية داخلياً كبديل مؤقت */
export type ReplicaScreen =
  | "dashboard"
  | "pos"
  | "products"
  | "inventory"
  | "invoice"
  | "reports"
  | "customers"
  | "services"
  | "employees";

export type ShotDevice = "desktop" | "mobile";

export type Shot = {
  id: ReplicaScreen;
  device: ShotDevice;
  /** رابط الصورة الحقيقية أو null لاستعمال الواجهة البديلة */
  image: string | null;
};

export const screenshots: Shot[] = [
  { id: "dashboard", device: "desktop", image: null },
  { id: "pos", device: "desktop", image: null },
  { id: "products", device: "desktop", image: null },
  { id: "inventory", device: "desktop", image: null },
  { id: "invoice", device: "desktop", image: null },
  { id: "reports", device: "desktop", image: null },
  { id: "customers", device: "desktop", image: null },
  { id: "services", device: "desktop", image: null },
  { id: "employees", device: "desktop", image: null },
];

import logoImg from "@/assets/brand/logo.webp";

/** شعار Smart Store — الملف الرسمي المعتمد */
export const brandAssets = {
  logo: logoImg,
  ogImage: "/smart-store/og-image.png",
};
