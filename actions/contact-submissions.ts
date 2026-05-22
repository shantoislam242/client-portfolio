"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";

export async function toggleReadContactSubmission(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const read = formData.get("read") === "true";
  await prisma.contactSubmission.update({ where: { id }, data: { read } });
  revalidatePath("/admin/contact-submissions");
  revalidatePath(`/admin/contact-submissions/${id}`);
}

export async function toggleRepliedContactSubmission(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const replied = formData.get("replied") === "true";
  await prisma.contactSubmission.update({ where: { id }, data: { replied } });
  revalidatePath("/admin/contact-submissions");
  revalidatePath(`/admin/contact-submissions/${id}`);
}

export async function deleteContactSubmission(id: string) {
  await requireAdmin();
  await prisma.contactSubmission.delete({ where: { id } });
  revalidatePath("/admin/contact-submissions");
  redirect("/admin/contact-submissions");
}

export async function markRead(id: string) {
  await requireAdmin();
  await prisma.contactSubmission.update({ where: { id }, data: { read: true } });
  revalidatePath("/admin/contact-submissions");
  revalidatePath(`/admin/contact-submissions/${id}`);
}
