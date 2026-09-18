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

export class SiteApiError extends Error {
  statusCode: number;
  code?: string;
  issues?: Array<{ message: string; path?: Array<string | number> }>;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    issues?: Array<{ message: string; path?: Array<string | number> }>,
  ) {
    super(message);
    this.name = "SiteApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.issues = issues;
  }
}

/**
 * Fetches safe public contact and social settings for the marketing website.
 * Fail-safe: returns null if the endpoint is unreachable or fails.
 */
export async function getPublicContact(): Promise<PublicContactData | null> {
  try {
    const res = await fetch("/api/site/contact", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    if (!body?.ok || !body?.data) return null;

    return body.data as PublicContactData;
  } catch {
    return null;
  }
}

/**
 * Fetches complete Website CMS configuration for the Admin dashboard.
 */
export async function getAdminWebsiteConfig(): Promise<WebsiteConfigData> {
  const res = await fetch("/api/admin/website", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SiteApiError(
      body?.error || "Failed to load website settings",
      res.status,
      body?.code,
      body?.issues,
    );
  }

  return body.data as WebsiteConfigData;
}

/**
 * Updates Website CMS configuration with full validation.
 */
export async function updateAdminWebsiteConfig(
  data: WebsiteConfigData,
): Promise<WebsiteConfigData> {
  const res = await fetch("/api/admin/website", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.ok) {
    throw new SiteApiError(
      body?.error || "Failed to update website settings",
      res.status,
      body?.code,
      body?.issues,
    );
  }

  return body.data as WebsiteConfigData;
}

