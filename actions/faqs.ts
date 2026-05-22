"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { FaqSchema } from "@/lib/schemas/faq";

export type FaqFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

export async function createFaq(_prev: FaqFormState, formData: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const parsed = FaqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.fAQ.create({ data: parsed.data });
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function updateFaq(id: string, _prev: FaqFormState, formData: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const parsed = FaqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.fAQ.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  await prisma.fAQ.delete({ where: { id } });
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function toggleVisibleFaq(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.fAQ.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/faqs");
}
