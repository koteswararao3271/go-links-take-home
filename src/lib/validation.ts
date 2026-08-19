import { z } from "zod";

// Slugs become part of a URL path (go/<slug>), so keep them
// lowercase/URL-safe and disallow leading/trailing/double hyphens to avoid
// confusable duplicates like "on-call" vs "-on-call-".
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Reserved so shortcuts can never shadow app routes (the API, static
// assets, Next internals, etc).
export const RESERVED_SLUGS = new Set([
  "api",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export const createLinkSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(64, "Slug must be 64 characters or fewer")
    .regex(
      SLUG_PATTERN,
      "Slug must be lowercase letters, numbers, and single hyphens (e.g. design-system)"
    )
    .refine((slug) => !RESERVED_SLUGS.has(slug), {
      message: "This slug is reserved",
    }),
  url: z
    .string()
    .trim()
    .min(1, "Destination URL is required")
    .url("Must be a valid absolute URL, e.g. https://example.com")
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "URL must start with http:// or https://",
    }),
  description: z
    .string()
    .trim()
    .max(280, "Description must be 280 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateLinkParsed = z.infer<typeof createLinkSchema>;

/** Flattens a ZodError into a flat field -> message map for API responses / form UI. */
export function flattenZodError(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}
