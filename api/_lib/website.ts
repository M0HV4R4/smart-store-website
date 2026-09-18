import { inArray } from "drizzle-orm";
import { schema } from "./db";
import { logAudit } from "./audit";
import type { AuthContext } from "./types";
import { z } from "zod";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ContactContent {
  titleAr: string;
  titleFr: string;
  descriptionAr: string;
  descriptionFr: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  normalizedNumber: string;
  messageAr: string;
  messageFr: string;
}

export interface SocialChannelConfig {
  enabled: boolean;
  url: string;
}

export interface WebsiteConfigData {
  contact: ContactContent;
  whatsapp: WhatsAppConfig;
  facebook: SocialChannelConfig;
  instagram: SocialChannelConfig;
}

export interface PublicContactData {
  title: {
    ar: string;
    fr: string;
  };
  description: {
    ar: string;
    fr: string;
  };
  whatsapp: {
    enabled: boolean;
    number: string;
    urlAr: string;
    urlFr: string;
  };
  facebook: {
    enabled: boolean;
    url: string;
  };
  instagram: {
    enabled: boolean;
    url: string;
  };
}

// =============================================================================
// VALIDATION & NORMALIZATION UTILITIES
// =============================================================================

/**
 * Normalizes an international phone number for WhatsApp wa.me link generation.
 * Accepts human-friendly formatting like "+213 555 12 34 56", "00213555123456", "+1 (555) 234-5678".
 * Strips all spaces, dashes, dots, and parentheses.
 * Rejects numbers with leading local zero (e.g. 0555...) without country code.
 * Ensures number length is 8 to 15 digits (E.164 compliant).
 */
export function normalizeWhatsAppNumber(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!raw || typeof raw !== "string") {
    return { valid: false, normalized: "", error: "Phone number is required" };
  }

  let cleaned = raw.trim();

  // Strip leading '+' or '00'
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1).trim();
  } else if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2).trim();
  }

  // Remove whitespace, dashes, parentheses, dots
  cleaned = cleaned.replace(/[\s\-().]/g, "");

  // Must only contain digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      normalized: "",
      error: "Phone number contains invalid characters (digits only allowed with country code)",
    };
  }

  // Reject local numbers starting with 0
  if (cleaned.startsWith("0")) {
    return {
      valid: false,
      normalized: "",
      error: "Local phone number starting with 0 requires international country code (e.g. +213)",
    };
  }

  // Check standard E.164 length (8 to 15 digits)
  if (cleaned.length < 8) {
    return {
      valid: false,
      normalized: "",
      error: "Phone number too short (minimum 8 digits with country code)",
    };
  }

  if (cleaned.length > 15) {
    return {
      valid: false,
      normalized: "",
      error: "Phone number too long (maximum 15 digits including country code)",
    };
  }

  return { valid: true, normalized: cleaned };
}

/**
 * Validates social URLs strictly requiring official HTTPS domains.
 * Rejects javascript:, data:, http:, and untrusted domains.
 */
export function validateSocialUrl(
  url: string,
  platform: "facebook" | "instagram",
): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }

  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) {
    return { valid: false, error: "HTTPS protocol is strictly required (URL must start with https://)" };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "HTTPS protocol is strictly required" };
    }

    const host = parsed.hostname.toLowerCase();
    if (platform === "facebook") {
      const isFb =
        host === "facebook.com" ||
        host.endsWith(".facebook.com") ||
        host === "fb.me" ||
        host.endsWith(".fb.me");
      if (!isFb) {
        return { valid: false, error: "URL must be an official Facebook domain (facebook.com or fb.me)" };
      }
    } else if (platform === "instagram") {
      const isIg =
        host === "instagram.com" ||
        host.endsWith(".instagram.com") ||
        host === "instagr.am" ||
        host.endsWith(".instagr.am");
      if (!isIg) {
        return { valid: false, error: "URL must be an official Instagram domain (instagram.com)" };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL structure" };
  }
}

/**
 * Safely builds a wa.me URL with properly encoded message.
 */
export function buildWhatsAppUrl(normalizedNumber: string, message: string): string {
  if (!normalizedNumber) return "";
  const trimmedMsg = message.trim();
  if (!trimmedMsg) {
    return `https://wa.me/${normalizedNumber}`;
  }
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(trimmedMsg)}`;
}

// =============================================================================
// ZOD VALIDATION SCHEMA FOR UPDATES
// =============================================================================

export const websiteUpdateZodSchema = z
  .object({
    contact: z.object({
      titleAr: z
        .string()
        .max(200, "Arabic title must not exceed 200 characters")
        .refine((s) => !/<[^>]*>/i.test(s), "HTML tags are not allowed in title"),
      titleFr: z
        .string()
        .max(200, "French title must not exceed 200 characters")
        .refine((s) => !/<[^>]*>/i.test(s), "HTML tags are not allowed in title"),
      descriptionAr: z
        .string()
        .max(1000, "Arabic description must not exceed 1000 characters")
        .refine((s) => !/<[^>]*>/i.test(s), "HTML tags are not allowed in description"),
      descriptionFr: z
        .string()
        .max(1000, "French description must not exceed 1000 characters")
        .refine((s) => !/<[^>]*>/i.test(s), "HTML tags are not allowed in description"),
    }),
    whatsapp: z.object({
      enabled: z.boolean(),
      number: z.string().max(50, "Phone number too long"),
      messageAr: z.string().max(500, "WhatsApp Arabic message must not exceed 500 characters"),
      messageFr: z.string().max(500, "WhatsApp French message must not exceed 500 characters"),
    }),
    facebook: z.object({
      enabled: z.boolean(),
      url: z.string().max(2048, "URL exceeds maximum length of 2048 characters"),
    }),
    instagram: z.object({
      enabled: z.boolean(),
      url: z.string().max(2048, "URL exceeds maximum length of 2048 characters"),
    }),
  })
  .superRefine((data, ctx) => {
    // Validate WhatsApp if enabled
    if (data.whatsapp.enabled) {
      const norm = normalizeWhatsAppNumber(data.whatsapp.number);
      if (!norm.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp", "number"],
          message: norm.error || "Invalid WhatsApp phone number",
        });
      }
    }

    // Validate Facebook if enabled
    if (data.facebook.enabled) {
      const fbCheck = validateSocialUrl(data.facebook.url, "facebook");
      if (!fbCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["facebook", "url"],
          message: fbCheck.error || "Invalid Facebook URL",
        });
      }
    }

    // Validate Instagram if enabled
    if (data.instagram.enabled) {
      const igCheck = validateSocialUrl(data.instagram.url, "instagram");
      if (!igCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["instagram", "url"],
          message: igCheck.error || "Invalid Instagram URL",
        });
      }
    }
  });

export type WebsiteUpdateInput = z.infer<typeof websiteUpdateZodSchema>;

// =============================================================================
// DATABASE PERSISTENCE HELPERS
// =============================================================================

const CONTENT_KEYS = ["contact_title", "contact_description", "whatsapp_message"];
const SETTING_KEYS = [
  "whatsapp_enabled",
  "whatsapp_number",
  "whatsapp_normalized_number",
  "facebook_enabled",
  "facebook_url",
  "instagram_enabled",
  "instagram_url",
];

/**
 * Loads the current full Website configuration from site_content and site_settings.
 */
export async function getWebsiteConfig(db: any): Promise<WebsiteConfigData> {
  // Query site_content
  const contentRows = await db
    .select()
    .from(schema.siteContent)
    .where(inArray(schema.siteContent.key, CONTENT_KEYS));

  const contentMap = new Map<string, { ar: string; fr: string }>();
  for (const row of contentRows) {
    contentMap.set(row.key, { ar: row.contentAr || "", fr: row.contentFr || "" });
  }

  // Query site_settings
  const settingRows = await db
    .select()
    .from(schema.siteSettings)
    .where(inArray(schema.siteSettings.key, SETTING_KEYS));

  const settingMap = new Map<string, string>();
  for (const row of settingRows) {
    settingMap.set(row.key, row.value || "");
  }

  const title = contentMap.get("contact_title");
  const desc = contentMap.get("contact_description");
  const waMsg = contentMap.get("whatsapp_message");

  const rawNumber = settingMap.get("whatsapp_number") || "";
  const norm = normalizeWhatsAppNumber(rawNumber);

  return {
    contact: {
      titleAr: title?.ar || "",
      titleFr: title?.fr || "",
      descriptionAr: desc?.ar || "",
      descriptionFr: desc?.fr || "",
    },
    whatsapp: {
      enabled: settingMap.get("whatsapp_enabled") === "true",
      number: rawNumber,
      normalizedNumber: norm.valid ? norm.normalized : (settingMap.get("whatsapp_normalized_number") || ""),
      messageAr: waMsg?.ar || "",
      messageFr: waMsg?.fr || "",
    },
    facebook: {
      enabled: settingMap.get("facebook_enabled") === "true",
      url: settingMap.get("facebook_url") || "",
    },
    instagram: {
      enabled: settingMap.get("instagram_enabled") === "true",
      url: settingMap.get("instagram_url") || "",
    },
  };
}

/**
 * Atomically updates Website configuration in PostgreSQL and records audit logs.
 */
export async function updateWebsiteConfig(
  db: any,
  input: WebsiteConfigData | WebsiteUpdateInput,
  admin: AuthContext,
): Promise<WebsiteConfigData> {
  // Normalize WhatsApp number
  const normResult = normalizeWhatsAppNumber(input.whatsapp.number);
  const normalizedNumber = normResult.valid ? normResult.normalized : "";

  // Content updates
  const contentUpdates = [
    {
      key: "contact_title",
      contentAr: input.contact.titleAr.trim(),
      contentFr: input.contact.titleFr.trim(),
    },
    {
      key: "contact_description",
      contentAr: input.contact.descriptionAr.trim(),
      contentFr: input.contact.descriptionFr.trim(),
    },
    {
      key: "whatsapp_message",
      contentAr: input.whatsapp.messageAr.trim(),
      contentFr: input.whatsapp.messageFr.trim(),
    },
  ];

  // Settings updates
  const settingsUpdates = [
    { key: "whatsapp_enabled", value: String(input.whatsapp.enabled) },
    { key: "whatsapp_number", value: input.whatsapp.number.trim() },
    { key: "whatsapp_normalized_number", value: normalizedNumber },
    { key: "facebook_enabled", value: String(input.facebook.enabled) },
    { key: "facebook_url", value: input.facebook.url.trim() },
    { key: "instagram_enabled", value: String(input.instagram.enabled) },
    { key: "instagram_url", value: input.instagram.url.trim() },
  ];

  // Upsert content
  for (const c of contentUpdates) {
    await db
      .insert(schema.siteContent)
      .values({
        key: c.key,
        contentAr: c.contentAr,
        contentFr: c.contentFr,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.siteContent.key,
        set: {
          contentAr: c.contentAr,
          contentFr: c.contentFr,
          updatedAt: new Date(),
        },
      });
  }

  // Upsert settings
  for (const s of settingsUpdates) {
    await db
      .insert(schema.siteSettings)
      .values({
        key: s.key,
        value: s.value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.siteSettings.key,
        set: {
          value: s.value,
          updatedAt: new Date(),
        },
      });
  }

  // Record audit logs
  await logAudit({
    adminId: admin.adminId,
    adminUsername: admin.username,
    action: "website.contact.updated",
    entityType: "content",
    entityId: "contact_settings",
    metadata: {
      whatsappEnabled: input.whatsapp.enabled,
      facebookEnabled: input.facebook.enabled,
      instagramEnabled: input.instagram.enabled,
    },
  });

  // Log independent channel toggles
  if (input.whatsapp.enabled) {
    await logAudit({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: "website.whatsapp.enabled",
      entityType: "setting",
      entityId: "whatsapp",
    });
  } else {
    await logAudit({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: "website.whatsapp.disabled",
      entityType: "setting",
      entityId: "whatsapp",
    });
  }

  if (input.facebook.enabled) {
    await logAudit({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: "website.facebook.enabled",
      entityType: "setting",
      entityId: "facebook",
    });
  } else {
    await logAudit({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: "website.facebook.disabled",
      entityType: "setting",
      entityId: "facebook",
    });
  }

  if (input.instagram.enabled) {
    await logAudit({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: "website.instagram.enabled",
      entityType: "setting",
      entityId: "instagram",
    });
  } else {
    await logAudit({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: "website.instagram.disabled",
      entityType: "setting",
      entityId: "instagram",
    });
  }

  return {
    ...input,
    whatsapp: {
      ...input.whatsapp,
      normalizedNumber,
    },
  };
}

/**
 * Resolves safe, sanitized public Contact and Support data.
 * Completely strips internal database details, secrets, and disabled/invalid channels.
 */
export async function getPublicContactData(db: any): Promise<PublicContactData> {
  const config = await getWebsiteConfig(db);

  // Validate WhatsApp
  let isWhatsAppSafe = config.whatsapp.enabled;
  if (isWhatsAppSafe) {
    const norm = normalizeWhatsAppNumber(config.whatsapp.number);
    if (!norm.valid) {
      isWhatsAppSafe = false;
    }
  }

  // Validate Facebook
  let isFacebookSafe = config.facebook.enabled;
  if (isFacebookSafe) {
    const fbCheck = validateSocialUrl(config.facebook.url, "facebook");
    if (!fbCheck.valid) {
      isFacebookSafe = false;
    }
  }

  // Validate Instagram
  let isInstagramSafe = config.instagram.enabled;
  if (isInstagramSafe) {
    const igCheck = validateSocialUrl(config.instagram.url, "instagram");
    if (!igCheck.valid) {
      isInstagramSafe = false;
    }
  }

  const urlAr = isWhatsAppSafe
    ? buildWhatsAppUrl(config.whatsapp.normalizedNumber, config.whatsapp.messageAr)
    : "";
  const urlFr = isWhatsAppSafe
    ? buildWhatsAppUrl(config.whatsapp.normalizedNumber, config.whatsapp.messageFr)
    : "";

  return {
    title: {
      ar: config.contact.titleAr,
      fr: config.contact.titleFr,
    },
    description: {
      ar: config.contact.descriptionAr,
      fr: config.contact.descriptionFr,
    },
    whatsapp: {
      enabled: isWhatsAppSafe,
      number: isWhatsAppSafe ? config.whatsapp.number : "",
      urlAr,
      urlFr,
    },
    facebook: {
      enabled: isFacebookSafe,
      url: isFacebookSafe ? config.facebook.url : "",
    },
    instagram: {
      enabled: isInstagramSafe,
      url: isInstagramSafe ? config.instagram.url : "",
    },
  };
}
