import { z } from "zod";
import { checkbox, optionalText, optionalUrl } from "./_helpers";

const servicesField = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t, i, a) => a.indexOf(t) === i),
  )
  .pipe(z.array(z.string().max(50)));

export const ProjectBasicsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  shortLabel: optionalText,
  year: optionalText,
  client: optionalText,
  role: optionalText,
  services: servicesField,
  liveUrl: optionalUrl,
  coverImageUrl: z.string().trim().url("Must be a valid URL").max(2000),
  coverPublicId: z.string().default(""),
  cardImageUrl: optionalUrl,
  cardPublicId: optionalText,
  excerpt: z.string().trim().min(1, "Excerpt is required").max(2000),
  introContent: z.string().max(50000).default(""),
});

export type ProjectBasicsInput = z.infer<typeof ProjectBasicsSchema>;

const SectionSchema = z.object({
  heading: z.string().trim().min(1, "Section heading is required").max(200),
  content: z.string().min(0).max(50000),
});

export const ProjectContentSchema = z.object({
  sections: z.array(SectionSchema),
});

export type ProjectContentInput = z.infer<typeof ProjectContentSchema>;

const GalleryImageSchema = z.object({
  url: z.string().trim().url().max(2000),
  publicId: z.string().default(""),
  alt: optionalText,
  caption: optionalText,
});

export const ProjectGallerySchema = z.object({
  galleryHeading: z.string().trim().min(1).max(200).default("Selected Visuals"),
  images: z.array(GalleryImageSchema),
});

export type ProjectGalleryInput = z.infer<typeof ProjectGallerySchema>;

export const ProjectRelatedSchema = z.object({
  relatedHeading: z.string().trim().min(1).max(200).default("More Projects"),
  relatedIds: z.array(z.string().min(1)),
});

export type ProjectRelatedInput = z.infer<typeof ProjectRelatedSchema>;

export const ProjectSeoSchema = z.object({
  metaTitle: optionalText,
  metaDescription: optionalText,
  featured: checkbox.default(false),
  published: checkbox.default(false),
});

export type ProjectSeoInput = z.infer<typeof ProjectSeoSchema>;
