import { z } from "zod";
import { checkbox, intField } from "./_helpers";

export const SocialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(50),
  url: z.string().trim().url("Must be a valid URL").max(2000),
  iconKey: z.string().trim().min(1).max(50),
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type SocialLinkInput = z.infer<typeof SocialLinkSchema>;
