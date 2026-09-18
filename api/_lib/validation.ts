import { z } from "zod";

// =============================================================================
// DOWNLOAD URL SECURITY SCHEMA
// =============================================================================
export const downloadUrlSchema = z
  .string()
  .trim()
  .min(10, "URL is too short")
  .max(2048, "URL exceeds maximum length of 2048 characters")
  .refine(
    (val) => !/[\r\n\0\t]/.test(val),
    "URL contains forbidden control or CRLF injection characters",
  )
  .refine((val) => {
    try {
      const parsed = new URL(val);
      // Strictly require HTTPS initially; reject dangerous schemes
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Download URL must be a valid, secure HTTPS URL (e.g. https://github.com/.../Setup.exe)");

// =============================================================================
// AUTH SCHEMAS
// =============================================================================
export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, "Email or Username must be at least 3 characters").max(255).optional(),
    emailOrUsername: z.string().trim().min(3, "Email or Username must be at least 3 characters").max(255).optional(),
    password: z
      .string()
      .min(1, "Password is required")
      .max(255, "Password too long"),
  })
  .refine((data) => Boolean(data.identifier || data.emailOrUsername), {
    message: "Email or username identifier is required",
    path: ["identifier"],
  })
  .transform((data) => ({
    identifier: (data.identifier || data.emailOrUsername)!.trim(),
    password: data.password,
  }));

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(255),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation password do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// =============================================================================
// RELEASE SCHEMAS
// =============================================================================
export const platformEnum = z.enum(["windows", "android"]);
export const releaseStatusEnum = z.enum(["draft", "active", "archived"]);

export const releaseInputSchema = z.object({
  platform: platformEnum,
  version: z
    .string()
    .trim()
    .min(1, "Version is required")
    .max(50, "Version too long (max 50 chars)")
    .regex(/^[a-zA-Z0-9._-]+$/, "Version may only contain letters, numbers, dots, dashes, and underscores"),
  downloadUrl: downloadUrlSchema,
  fileSize: z.string().trim().max(50).optional().nullable(),
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Release date must be in YYYY-MM-DD format")
    .optional(),
  releaseNotesAr: z.string().max(10000).optional().nullable(),
  releaseNotesFr: z.string().max(10000).optional().nullable(),
  status: releaseStatusEnum.default("draft"),
  downloadEnabled: z.boolean().default(true),
});

export const releaseUpdateSchema = releaseInputSchema.partial();

export const releaseQuerySchema = z.object({
  platform: z.enum(["all", "windows", "android"]).optional().default("all"),
  status: z.enum(["all", "draft", "active", "archived"]).optional().default("all"),
  search: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// =============================================================================
// SITE SETTINGS & CONTENT SCHEMAS
// =============================================================================
export const contentUpdateSchema = z.object({
  key: z.string().min(1).max(100),
  contentAr: z.string().min(1).max(10000),
  contentFr: z.string().min(1).max(10000),
});

export const settingsUpdateSchema = z.record(
  z.string().min(1).max(100),
  z.string().max(5000),
);

// =============================================================================
// RUNTIME VALIDATION HELPER
// =============================================================================
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };

export function validateData<T>(schema: z.ZodSchema<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstMessage = result.error.issues[0]?.message || "Validation failed";
  return {
    success: false,
    error: firstMessage,
    issues: result.error.issues,
  };
}

