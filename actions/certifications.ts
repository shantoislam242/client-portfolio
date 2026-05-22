"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { CertificationSchema } from "@/lib/schemas/certification";

export type CertificationFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("logoUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createCertification(
  _prev: CertificationFormState,
  formData: FormData,
): Promise<CertificationFormState> {
  await requireAdmin();
  const parsed = CertificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  await prisma.certification.create({ data });
  revalidatePath("/admin/certifications");
  redirect("/admin/certifications");
}

export async function updateCertification(
  id: string,
  _prev: CertificationFormState,
  formData: FormData,
): Promise<CertificationFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = CertificationSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== data.logoPublicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.certification.update({ where: { id }, data });
  revalidatePath("/admin/certifications");
  redirect("/admin/certifications");
}

export async function deleteCertification(id: string) {
  await requireAdmin();
  const e = await prisma.certification.findUnique({ where: { id } });
  if (e?.logoPublicId) await deleteImage(e.logoPublicId);
  await prisma.certification.delete({ where: { id } });
  revalidatePath("/admin/certifications");
  redirect("/admin/certifications");
}

export async function toggleVisibleCertification(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.certification.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/certifications");
}
