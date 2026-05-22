import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ExperienceSchema = z.object({
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  startDate: z.string().trim().min(1).max(50),
  endDate: optionalText,
  current: checkbox.default(false),
  companyUrl: optionalUrl,
  logoUrl: optionalUrl,
  logoPublicId: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type ExperienceInput = z.infer<typeof ExperienceSchema>;
