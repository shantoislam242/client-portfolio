import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .max(200, "Email is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(5000, "Message is too long"),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
