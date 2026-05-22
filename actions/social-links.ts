"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { SocialLinkSchema } from "@/lib/schemas/social-link";

export type SocialLinkFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

export async function createSocialLink(_p: SocialLinkFormState, fd: FormData): Promise<SocialLinkFormState> {
  await requireAdmin();
  const parsed = SocialLinkSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.socialLink.create({ data: parsed.data });
  revalidatePath("/admin/social-links");
  redirect("/admin/social-links");
}

export async function updateSocialLink(id: string, _p: SocialLinkFormState, fd: FormData): Promise<SocialLinkFormState> {
  await requireAdmin();
  const parsed = SocialLinkSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.socialLink.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/social-links");
  redirect("/admin/social-links");
}

export async function deleteSocialLink(id: string) {
  await requireAdmin();
  await prisma.socialLink.delete({ where: { id } });
  revalidatePath("/admin/social-links");
  redirect("/admin/social-links");
}

export async function toggleVisibleSocialLink(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const visible = fd.get("visible") === "true";
  await prisma.socialLink.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/social-links");
}
