import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const EducationSchema = z.object({
  institution: z.string().trim().min(1).max(150),
  degree: z.string().trim().min(1).max(200),
  description: optionalText,
  startDate: z.string().trim().min(1).max(50),
  endDate: optionalText,
  current: checkbox.default(false),
  institutionUrl: optionalUrl,
  logoUrl: optionalUrl,
  logoPublicId: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type EducationInput = z.infer<typeof EducationSchema>;
