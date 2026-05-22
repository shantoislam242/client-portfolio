import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ToolSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText,
  category: optionalText,
  iconUrl: optionalUrl,
  iconPublicId: optionalText,
  iconExternalUrl: optionalUrl,
  proficiency: intField.min(0).max(100).default(80),
  order: intField.nonnegative().default(0),
  showOnHome: checkbox.default(true),
  visible: checkbox.default(true),
});

export type ToolInput = z.infer<typeof ToolSchema>;
