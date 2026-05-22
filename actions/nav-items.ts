"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { NavItemSchema } from "@/lib/schemas/nav-item";

export type NavItemFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

export async function createNavItem(_p: NavItemFormState, fd: FormData): Promise<NavItemFormState> {
  await requireAdmin();
  const parsed = NavItemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.navItem.create({ data: parsed.data });
  revalidatePath("/admin/nav-items");
  redirect("/admin/nav-items");
}

export async function updateNavItem(id: string, _p: NavItemFormState, fd: FormData): Promise<NavItemFormState> {
  await requireAdmin();
  const parsed = NavItemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.navItem.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/nav-items");
  redirect("/admin/nav-items");
}

export async function deleteNavItem(id: string) {
  await requireAdmin();
  await prisma.navItem.delete({ where: { id } });
  revalidatePath("/admin/nav-items");
  redirect("/admin/nav-items");
}

export async function toggleVisibleNavItem(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const visible = fd.get("visible") === "true";
  await prisma.navItem.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/nav-items");
}
