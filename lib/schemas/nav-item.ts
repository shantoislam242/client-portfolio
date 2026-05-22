import { z } from "zod";
import { checkbox, intField } from "./_helpers";

export const NavItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(50),
  href: z.string().trim().min(1, "Href is required").max(500),
  iconKey: z.string().trim().min(1).max(50).default("link"),
  order: intField.nonnegative().default(0),
  external: checkbox.default(false),
  visible: checkbox.default(true),
});

export type NavItemInput = z.infer<typeof NavItemSchema>;
