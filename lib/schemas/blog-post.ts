import { z } from "zod";
import { checkbox, intField, optionalText } from "./_helpers";

const tagsField = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t, i, a) => a.indexOf(t) === i),
  )
  .pipe(z.array(z.string().max(50)));

export const BlogPostSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: optionalText,
  excerpt: z.string().trim().min(1, "Excerpt is required").max(500),
  content: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().trim().url("Must be a valid URL").max(2000),
  coverPublicId: z.string().default(""),
  category: optionalText,
  tags: tagsField,
  readTimeMinutes: intField.min(0).max(120).default(0),
  author: optionalText,
  published: checkbox.default(false),
  featured: checkbox.default(false),
  metaTitle: optionalText,
  metaDescription: optionalText,
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;
