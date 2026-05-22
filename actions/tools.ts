"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { ToolSchema } from "@/lib/schemas/tool";

export type ToolFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("iconUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createTool(
  _prev: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdmin();
  const parsed = ToolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  await prisma.tool.create({ data: parsed.data });
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function updateTool(
  id: string,
  _prev: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = ToolSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== parsed.data.iconPublicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.tool.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function deleteTool(id: string) {
  await requireAdmin();
  const t = await prisma.tool.findUnique({ where: { id } });
  if (t?.iconPublicId) await deleteImage(t.iconPublicId);
  await prisma.tool.delete({ where: { id } });
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function toggleVisibleTool(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.tool.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/tools");
}
