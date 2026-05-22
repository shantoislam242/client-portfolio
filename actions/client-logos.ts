"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { ClientLogoSchema } from "@/lib/schemas/client-logo";

export type ClientLogoFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("logoUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createClientLogo(
  _prev: ClientLogoFormState,
  formData: FormData,
): Promise<ClientLogoFormState> {
  await requireAdmin();
  const parsed = ClientLogoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  await prisma.clientLogo.create({ data: parsed.data });
  revalidatePath("/admin/client-logos");
  redirect("/admin/client-logos");
}

export async function updateClientLogo(
  id: string,
  _prev: ClientLogoFormState,
  formData: FormData,
): Promise<ClientLogoFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = ClientLogoSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== parsed.data.publicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.clientLogo.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/client-logos");
  redirect("/admin/client-logos");
}

export async function deleteClientLogo(id: string) {
  await requireAdmin();
  const l = await prisma.clientLogo.findUnique({ where: { id } });
  if (l?.publicId) await deleteImage(l.publicId);
  await prisma.clientLogo.delete({ where: { id } });
  revalidatePath("/admin/client-logos");
  redirect("/admin/client-logos");
}

export async function toggleVisibleClientLogo(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.clientLogo.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/client-logos");
}
