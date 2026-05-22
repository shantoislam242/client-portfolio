import { z } from "zod";
import { checkbox, intField, optionalText } from "./_helpers";

export const FaqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
  category: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type FaqInput = z.infer<typeof FaqSchema>;
