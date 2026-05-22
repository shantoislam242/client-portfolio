import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const TestimonialSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: optionalText,
  company: optionalText,
  content: z.string().trim().min(1, "Quote is required").max(2000),
  avatarUrl: optionalUrl,
  avatarPublicId: optionalText,
  rating: intField.min(1).max(5).default(5),
  featured: checkbox.default(false),
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type TestimonialInput = z.infer<typeof TestimonialSchema>;
