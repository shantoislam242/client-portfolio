"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { ExperienceSchema } from "@/lib/schemas/experience";

export type ExperienceFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("logoUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createExperience(
  _prev: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  await requireAdmin();
  const parsed = ExperienceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  if (data.current) data.endDate = null;
  await prisma.experience.create({ data });
  revalidatePath("/admin/experience");
  redirect("/admin/experience");
}

export async function updateExperience(
  id: string,
  _prev: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = ExperienceSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  if (data.current) data.endDate = null;
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== data.logoPublicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.experience.update({ where: { id }, data });
  revalidatePath("/admin/experience");
  redirect("/admin/experience");
}

export async function deleteExperience(id: string) {
  await requireAdmin();
  const e = await prisma.experience.findUnique({ where: { id } });
  if (e?.logoPublicId) await deleteImage(e.logoPublicId);
  await prisma.experience.delete({ where: { id } });
  revalidatePath("/admin/experience");
  redirect("/admin/experience");
}

export async function toggleVisibleExperience(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.experience.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/experience");
}
