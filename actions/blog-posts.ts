"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { BlogPostSchema } from "@/lib/schemas/blog-post";

export type BlogPostFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function autoReadTime(html: string): number {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("coverImageUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createBlogPost(
  _prev: BlogPostFormState,
  formData: FormData,
): Promise<BlogPostFormState> {
  await requireAdmin();
  const parsed = BlogPostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  if (data.readTimeMinutes === 0) {
    data.readTimeMinutes = autoReadTime(data.content);
  }
  const publishedAt = data.published ? new Date() : null;
  await prisma.blogPost.create({
    data: { ...data, publishedAt },
  });
  revalidatePath("/admin/blog-posts");
  redirect("/admin/blog-posts");
}

export async function updateBlogPost(
  id: string,
  _prev: BlogPostFormState,
  formData: FormData,
): Promise<BlogPostFormState> {
  await requireAdmin();
  const parsed = BlogPostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;
  if (data.readTimeMinutes === 0) {
    data.readTimeMinutes = autoReadTime(data.content);
  }

  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== data.coverPublicId) {
    await deleteImage(oldPublicId);
  }

  // Auto-set publishedAt on first publish; preserve across unpublish/republish.
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  let publishedAt = existing?.publishedAt ?? null;
  if (data.published && !publishedAt) {
    publishedAt = new Date();
  }

  await prisma.blogPost.update({
    where: { id },
    data: { ...data, publishedAt },
  });
  revalidatePath("/admin/blog-posts");
  redirect("/admin/blog-posts");
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  const p = await prisma.blogPost.findUnique({ where: { id } });
  if (p?.coverPublicId) await deleteImage(p.coverPublicId);
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog-posts");
  redirect("/admin/blog-posts");
}

export async function togglePublishedBlogPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const published = formData.get("published") === "true";
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  let publishedAt = existing?.publishedAt ?? null;
  if (published && !publishedAt) publishedAt = new Date();
  await prisma.blogPost.update({ where: { id }, data: { published, publishedAt } });
  revalidatePath("/admin/blog-posts");
}

export async function toggleFeaturedBlogPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const featured = formData.get("featured") === "true";
  await prisma.blogPost.update({ where: { id }, data: { featured } });
  revalidatePath("/admin/blog-posts");
}
