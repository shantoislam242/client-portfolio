"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { EducationSchema } from "@/lib/schemas/education";

export type EducationFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("logoUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createEducation(
  _prev: EducationFormState,
  formData: FormData,
): Promise<EducationFormState> {
  await requireAdmin();
  const parsed = EducationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  if (data.current) data.endDate = null;
  await prisma.education.create({ data });
  revalidatePath("/admin/education");
  redirect("/admin/education");
}

export async function updateEducation(
  id: string,
  _prev: EducationFormState,
  formData: FormData,
): Promise<EducationFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = EducationSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  if (data.current) data.endDate = null;
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== data.logoPublicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.education.update({ where: { id }, data });
  revalidatePath("/admin/education");
  redirect("/admin/education");
}

export async function deleteEducation(id: string) {
  await requireAdmin();
  const e = await prisma.education.findUnique({ where: { id } });
  if (e?.logoPublicId) await deleteImage(e.logoPublicId);
  await prisma.education.delete({ where: { id } });
  revalidatePath("/admin/education");
  redirect("/admin/education");
}

export async function toggleVisibleEducation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.education.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/education");
}
