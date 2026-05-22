import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ClientLogoSchema = z.object({
  name: z.string().trim().min(1).max(100),
  logoUrl: z.string().trim().url("Must be a valid URL").max(2000),
  publicId: z.string().default(""),
  websiteUrl: optionalUrl,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type ClientLogoInput = z.infer<typeof ClientLogoSchema>;
