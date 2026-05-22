"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import {
  ProfileSchema,
  HeroSchema,
  StatsSchema,
  AboutSchema,
  SectionsSchema,
  ContactSchema,
  CollaborateSchema,
  FooterSchema,
  SeoSchema,
  ThemeSchema,
} from "@/lib/schemas/site-settings";

export type SettingsState = {
  ok?: true;
  error?: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function oldId(formData: FormData, name: string): string | null {
  const v = formData.get(`${name}__oldPublicId`);
  return typeof v === "string" && v.length > 0 ? v : null;
}

async function applyUpdate(
  schema: z.ZodTypeAny,
  formData: FormData,
  imagePairs: Array<{ urlField: string; publicIdField: string }>,
  revalidate: string,
): Promise<SettingsState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };

  // Clean up replaced Cloudinary assets
  for (const { urlField, publicIdField } of imagePairs) {
    const old = oldId(formData, urlField);
    const newId = parsed.data[publicIdField] as string | null;
    if (old && old !== newId) await deleteImage(old);
  }

  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: parsed.data,
  });
  revalidatePath(revalidate);
  return { ok: true };
}

export async function updateProfile(_p: SettingsState, fd: FormData) {
  return applyUpdate(
    ProfileSchema,
    fd,
    [
      { urlField: "portraitUrl", publicIdField: "portraitPublicId" },
      { urlField: "resumeUrl", publicIdField: "resumePublicId" },
    ],
    "/admin/site-settings/profile",
  );
}

export async function updateHero(_p: SettingsState, fd: FormData) {
  return applyUpdate(HeroSchema, fd, [], "/admin/site-settings/hero");
}

export async function updateStats(_p: SettingsState, fd: FormData) {
  return applyUpdate(StatsSchema, fd, [], "/admin/site-settings/stats");
}

export async function updateAbout(_p: SettingsState, fd: FormData) {
  return applyUpdate(AboutSchema, fd, [], "/admin/site-settings/about");
}

export async function updateSections(_p: SettingsState, fd: FormData) {
  return applyUpdate(SectionsSchema, fd, [], "/admin/site-settings/sections");
}

export async function updateContact(_p: SettingsState, fd: FormData) {
  return applyUpdate(ContactSchema, fd, [], "/admin/site-settings/contact");
}

export async function updateCollaborate(_p: SettingsState, fd: FormData) {
  return applyUpdate(CollaborateSchema, fd, [], "/admin/site-settings/collaborate");
}

export async function updateFooter(_p: SettingsState, fd: FormData) {
  return applyUpdate(FooterSchema, fd, [], "/admin/site-settings/footer");
}

export async function updateSeo(_p: SettingsState, fd: FormData) {
  return applyUpdate(
    SeoSchema,
    fd,
    [
      { urlField: "ogImage", publicIdField: "ogImagePublicId" },
      { urlField: "faviconUrl", publicIdField: "faviconPublicId" },
    ],
    "/admin/site-settings/seo",
  );
}

export async function updateTheme(_p: SettingsState, fd: FormData) {
  return applyUpdate(ThemeSchema, fd, [], "/admin/site-settings/theme");
}
