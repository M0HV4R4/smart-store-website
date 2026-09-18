import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  bigserial,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// =============================================================================
// 1. ADMINS
// =============================================================================
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'disabled'
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 2. SESSIONS (Opaque server-side token hashes)
// =============================================================================
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // SHA-256 hash of random session token
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_sessions_token_hash").on(table.tokenHash),
    index("idx_sessions_expires_at").on(table.expiresAt),
    index("idx_sessions_admin_id").on(table.adminId),
  ],
);

// =============================================================================
// 3. RELEASES (Windows & Android, Generic HTTPS URLs)
// =============================================================================
export const releases = pgTable(
  "releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: varchar("platform", { length: 20 }).notNull(), // 'windows' | 'android'
    version: varchar("version", { length: 50 }).notNull(), // e.g. '1.0.0'
    downloadUrl: text("download_url").notNull(), // generic HTTPS destination URL
    fileSize: varchar("file_size", { length: 50 }), // e.g. '95 MB'
    releaseDate: date("release_date", { mode: "string" })
      .notNull()
      .default(sql`CURRENT_DATE`),
    releaseNotesAr: text("release_notes_ar"),
    releaseNotesFr: text("release_notes_fr"),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft' | 'active' | 'archived'
    downloadEnabled: boolean("download_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_releases_platform_status").on(table.platform, table.status),
    index("idx_releases_created_at").on(table.createdAt),
    // Enforce at database level: only ONE active release per platform at any time
    uniqueIndex("idx_releases_single_active")
      .on(table.platform)
      .where(sql`status = 'active'`),
  ],
);

// =============================================================================
// 4. DOWNLOAD EVENTS (Privacy-friendly analytics, zero PII, zero IP)
// =============================================================================
export const downloadEvents = pgTable(
  "download_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    releaseId: uuid("release_id").references(() => releases.id, {
      onDelete: "set null",
    }),
    platform: varchar("platform", { length: 20 }).notNull(), // 'windows' | 'android'
    version: varchar("version", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_download_events_created_at").on(table.createdAt),
    index("idx_download_events_platform_created_at").on(table.platform, table.createdAt),
    index("idx_download_events_release_id").on(table.releaseId),
  ],
);

// =============================================================================
// 5. SITE CONTENT (CMS for download page copy, buttons, titles)
// =============================================================================
export const siteContent = pgTable("site_content", {
  key: varchar("key", { length: 100 }).primaryKey(), // e.g. 'download_headline', 'hero_headline'
  contentAr: text("content_ar").notNull(),
  contentFr: text("content_fr").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 6. SITE SETTINGS (WhatsApp, Facebook, Instagram, support contact, SEO)
// =============================================================================
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(), // e.g. 'whatsapp_number', 'facebook_url'
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 7. AUDIT LOGS (Administrative activity log, zero secrets stored)
// =============================================================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),
    adminUsername: varchar("admin_username", { length: 100 }),
    action: varchar("action", { length: 100 }).notNull(), // e.g. 'release.created', 'release.activated'
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'release' | 'content' | 'setting' | 'admin'
    entityId: varchar("entity_id", { length: 100 }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_logs_created_at").on(table.createdAt),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_admin_id").on(table.adminId),
  ],
);

// =============================================================================
// INFERRED TYPES
// =============================================================================
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Release = typeof releases.$inferSelect;
export type NewRelease = typeof releases.$inferInsert;

export type DownloadEvent = typeof downloadEvents.$inferSelect;
export type NewDownloadEvent = typeof downloadEvents.$inferInsert;

export type SiteContent = typeof siteContent.$inferSelect;
export type NewSiteContent = typeof siteContent.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

