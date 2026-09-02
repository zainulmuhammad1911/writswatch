import { z } from "zod";

/**
 * Zod schemas for every write endpoint.
 *
 * Create schemas require what the database requires. Update schemas are the
 * same fields made optional, with a check that at least one was sent, so a
 * PUT with an empty body is rejected rather than silently touching nothing.
 */

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may contain lowercase letters, numbers and single hyphens"
  );

const shortText = z.string().trim().min(1).max(300);
const longText = z.string().trim().max(50_000);
const year = z.number().int().min(1800).max(2100);

/* -------------------------------------------------------------------------- */
/*  Timepieces                                                                */
/* -------------------------------------------------------------------------- */

export const timepieceImageInput = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(300).optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const createTimepieceSchema = z.object({
  slug,
  brand: shortText,
  model: shortText,
  referenceNumber: z.string().trim().max(120).optional(),
  year: year.optional(),
  yearEnd: year.optional(),
  movement: z.string().trim().max(300).optional(),
  caseSize: z.string().trim().max(120).optional(),
  caseMaterial: z.string().trim().max(200).optional(),
  dialColor: z.string().trim().max(200).optional(),
  description: longText.optional(),
  story: longText.optional(),
  category: z.string().trim().max(80).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  images: z.array(timepieceImageInput).max(24).optional(),
});

export const updateTimepieceSchema = createTimepieceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one field to update",
  });

/** Read-side query parameters for /api/collection. */
export const timepieceQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  brand: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  era: z
    .string()
    .trim()
    .regex(/^\d{4}s$/, "Era looks like \"1960s\"")
    .optional(),
  featured: z.enum(["true", "false"]).optional(),
  published: z.enum(["true", "false", "all"]).optional(),
});

/* -------------------------------------------------------------------------- */
/*  Articles                                                                  */
/* -------------------------------------------------------------------------- */

export const articleCategory = z.enum(["STORY", "ARCHIVE", "ESSAY", "NEWS"]);

export const createArticleSchema = z.object({
  slug,
  title: shortText,
  subtitle: z.string().trim().max(300).optional(),
  excerpt: longText.optional(),
  content: z.string().trim().min(1, "Content is required").max(200_000),
  coverImage: z.string().trim().max(500).optional(),
  coverImageAlt: z.string().trim().max(300).optional(),
  category: articleCategory.optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
  authorId: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
});

export const updateArticleSchema = createArticleSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one field to update",
  });

export const articleQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: articleCategory.optional(),
  featured: z.enum(["true", "false"]).optional(),
  published: z.enum(["true", "false", "all"]).optional(),
});

/* -------------------------------------------------------------------------- */
/*  Media                                                                     */
/* -------------------------------------------------------------------------- */

/** Only formats the site actually serves. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const mediaQuerySchema = z.object({
  folder: z.string().trim().max(120).optional(),
  mimeType: z.string().trim().max(120).optional(),
});

export const mediaMetaSchema = z.object({
  alt: z.string().trim().max(300).optional(),
  folder: z
    .string()
    .trim()
    .max(120)
    // Anything that could climb out of the uploads directory is rejected here
    // rather than sanitised, so a bad value is visible instead of silently
    // rewritten.
    .regex(/^[a-z0-9][a-z0-9/_-]*$/, "Folder may contain lowercase letters, numbers, / _ -")
    .refine((v) => !v.includes(".."), "Folder may not contain \"..\"")
    .optional(),
});

/* -------------------------------------------------------------------------- */
/*  Page content                                                              */
/* -------------------------------------------------------------------------- */

export const contentType = z.enum([
  "TEXT",
  "RICHTEXT",
  "IMAGE",
  "NUMBER",
  "URL",
]);

export const pageQuerySchema = z.object({
  page: z.string().trim().min(1).max(80),
  section: z.string().trim().max(80).optional(),
});

export const upsertPageContentSchema = z.object({
  page: z.string().trim().min(1).max(80),
  section: z.string().trim().min(1).max(80),
  key: z.string().trim().min(1).max(80),
  value: z.string().max(50_000),
  type: contentType.optional(),
});

/** PUT /api/pages accepts one entry or a batch. */
export const updatePageContentSchema = z.union([
  upsertPageContentSchema,
  z.object({
    entries: z.array(upsertPageContentSchema).min(1).max(200),
  }),
]);

/* -------------------------------------------------------------------------- */
/*  Site settings                                                             */
/* -------------------------------------------------------------------------- */

export const settingSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.string().max(50_000),
  type: z.enum(["string", "number", "boolean", "json"]).optional(),
});

export const updateSettingsSchema = z.union([
  settingSchema,
  z.object({ settings: z.array(settingSchema).min(1).max(200) }),
]);

export type CreateTimepieceInput = z.infer<typeof createTimepieceSchema>;
export type UpdateTimepieceInput = z.infer<typeof updateTimepieceSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
