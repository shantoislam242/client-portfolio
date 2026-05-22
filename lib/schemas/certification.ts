import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const CertificationSchema = z.object({
  institution: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(200),
  description: optionalText,
  startDate: z.string().trim().min(1).max(50),
  endDate: optionalText,
  credentialUrl: optionalUrl,
  logoUrl: optionalUrl,
  logoPublicId: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type CertificationInput = z.infer<typeof CertificationSchema>;
