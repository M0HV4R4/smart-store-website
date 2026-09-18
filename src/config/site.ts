/**
 * ==========================================================================
 * SMART STORE — إعدادات الموقع المركزية / Configuration centrale du site
 * ==========================================================================
 * كل القيم القابلة للتغيير موجودة هنا. لا تكتب أي رابط أو معلومة داخل المكوّنات.
 * Toutes les valeurs modifiables sont ici. N'écrivez aucune URL dans les composants.
 */

export const siteConfig = {
  name: "Smart Store",
  url: "https://smartstore.app",

  /**
   * معلومات التواصل — اتركها null إن لم تكن مؤكدة، الواجهة تخفيها تلقائياً.
   * Contact — laisser null si non confirmé, l'UI les masque automatiquement.
   */
  contact: {
    email: null as string | null, // TODO: "contact@example.com"
    phone: null as string | null, // TODO: "+213 ..."
    address: null as string | null, // TODO
  },

  /**
   * حسابات التواصل الاجتماعي — لا نخترع حسابات. أضفها عند توفرها.
   * Réseaux sociaux — aucun compte inventé. À ajouter quand disponible.
   */
  social: [] as { label: string; href: string }[],

  /** المنصات المدعومة المؤكدة / Plateformes confirmées */
  platforms: ["Windows", "Android"] as const,
} as const;

export type SiteConfig = typeof siteConfig;
