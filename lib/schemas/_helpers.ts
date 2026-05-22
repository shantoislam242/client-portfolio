import { z } from "zod";

/** Optional URL field: empty string -> null. Accepts full URLs only. */
export const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .pipe(z.union([z.string().url(), z.null()]));

/** Optional text field: empty string -> null. */
export const optionalText = z
  .string()
  .transform((v) => (v.trim() === "" ? null : v))
  .pipe(z.union([z.string(), z.null()]));

/** Checkbox: "on" | undefined -> boolean. */
export const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

/** Integer from FormData string. */
export const intField = z.coerce.number().int();
