"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { TestimonialSchema } from "@/lib/schemas/testimonial";

export type TestimonialFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("avatarUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createTestimonial(
  _prev: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  await requireAdmin();
  const parsed = TestimonialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  await prisma.testimonial.create({ data: parsed.data });
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function updateTestimonial(
  id: string,
  _prev: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = TestimonialSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== parsed.data.avatarPublicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.testimonial.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (t?.avatarPublicId) await deleteImage(t.avatarPublicId);
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function toggleVisibleTestimonial(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.testimonial.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/testimonials");
}
