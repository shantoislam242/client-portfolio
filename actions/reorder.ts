"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";

type TableKey =
  | "tool"
  | "testimonial"
  | "fAQ"
  | "clientLogo"
  | "navItem"
  | "socialLink"
  | "experience"
  | "education"
  | "certification"
  | "blogPost"
  | "project";

async function applyReorder(table: TableKey, ids: string[], path: string) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[table];
  if (!model || typeof model.update !== "function") {
    throw new Error(`Unknown table: ${table}`);
  }
  await prisma.$transaction(
    ids.map((id, order) => model.update({ where: { id }, data: { order } })),
  );
  revalidatePath(path);
}

export async function reorderTools(ids: string[]) {
  await applyReorder("tool", ids, "/admin/tools");
}

export async function reorderTestimonials(ids: string[]) {
  await applyReorder("testimonial", ids, "/admin/testimonials");
}

export async function reorderFaqs(ids: string[]) {
  await applyReorder("fAQ", ids, "/admin/faqs");
}

export async function reorderClientLogos(ids: string[]) {
  await applyReorder("clientLogo", ids, "/admin/client-logos");
}

export async function reorderNavItems(ids: string[]) {
  await applyReorder("navItem", ids, "/admin/nav-items");
}

export async function reorderSocialLinks(ids: string[]) {
  await applyReorder("socialLink", ids, "/admin/social-links");
}

export async function reorderExperience(ids: string[]) {
  await applyReorder("experience", ids, "/admin/experience");
}

export async function reorderEducation(ids: string[]) {
  await applyReorder("education", ids, "/admin/education");
}

export async function reorderCertifications(ids: string[]) {
  await applyReorder("certification", ids, "/admin/certifications");
}

export async function reorderBlogPosts(ids: string[]) {
  await applyReorder("blogPost", ids, "/admin/blog-posts");
}

export async function reorderProjects(ids: string[]) {
  await applyReorder("project", ids, "/admin/projects");
}
