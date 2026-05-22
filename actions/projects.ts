"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import {
  ProjectBasicsSchema,
  ProjectContentSchema,
  ProjectGallerySchema,
  ProjectRelatedSchema,
  ProjectSeoSchema,
} from "@/lib/schemas/project";

export type ProjectFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function oldPublicId(fd: FormData, fieldName: string): string | null {
  const v = fd.get(`${fieldName}__oldPublicId`);
  return typeof v === "string" && v.length > 0 ? v : null;
}

// ---- create (Basics-only) ----

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const parsed = ProjectBasicsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const project = await prisma.project.create({ data: parsed.data });
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}?tab=basics`);
}

// ---- update Basics ----

export async function updateBasics(
  id: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const parsed = ProjectBasicsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const data = parsed.data;

  const oldCover = oldPublicId(formData, "coverImageUrl");
  if (oldCover && oldCover !== data.coverPublicId) await deleteImage(oldCover);
  const oldCard = oldPublicId(formData, "cardImageUrl");
  if (oldCard && oldCard !== data.cardPublicId) await deleteImage(oldCard);

  await prisma.project.update({ where: { id }, data });
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/admin/projects");
  return null;
}

// ---- update Content (sections) ----

function parseIndexedArray<T>(
  fd: FormData,
  prefix: string,
  fields: ReadonlyArray<keyof T>,
): T[] {
  const count = Number(fd.get(`${prefix}.count`) ?? 0);
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const row = {} as T;
    for (const f of fields) {
      const v = fd.get(`${prefix}.${i}.${String(f)}`);
      (row as Record<string, unknown>)[String(f)] = typeof v === "string" ? v : "";
    }
    out.push(row);
  }
  return out;
}

export async function updateContent(
  id: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const sections = parseIndexedArray<{ heading: string; content: string }>(
    formData,
    "sections",
    ["heading", "content"] as const,
  );
  const parsed = ProjectContentSchema.safeParse({ sections });
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  await prisma.$transaction([
    prisma.projectSection.deleteMany({ where: { projectId: id } }),
    prisma.projectSection.createMany({
      data: parsed.data.sections.map((s, i) => ({
        projectId: id,
        heading: s.heading,
        content: s.content,
        order: i,
      })),
    }),
  ]);
  revalidatePath(`/admin/projects/${id}`);
  return null;
}

// ---- update Gallery ----

export async function updateGallery(
  id: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const galleryHeading = String(formData.get("galleryHeading") ?? "Selected Visuals");
  const images = parseIndexedArray<{
    url: string;
    publicId: string;
    alt: string;
    caption: string;
  }>(formData, "images", ["url", "publicId", "alt", "caption"] as const);

  const parsed = ProjectGallerySchema.safeParse({ galleryHeading, images });
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }

  // Diff for Cloudinary cleanup
  const current = await prisma.projectImage.findMany({
    where: { projectId: id },
    select: { publicId: true },
  });
  const submittedPublicIds = new Set(
    parsed.data.images.map((img) => img.publicId).filter(Boolean),
  );
  const removedPublicIds = current
    .map((c) => c.publicId)
    .filter((pid) => pid && !submittedPublicIds.has(pid));
  for (const pid of removedPublicIds) {
    await deleteImage(pid);
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id },
      data: { galleryHeading: parsed.data.galleryHeading },
    }),
    prisma.projectImage.deleteMany({ where: { projectId: id } }),
    prisma.projectImage.createMany({
      data: parsed.data.images.map((img, i) => ({
        projectId: id,
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        caption: img.caption,
        order: i,
      })),
    }),
  ]);
  revalidatePath(`/admin/projects/${id}`);
  return null;
}

// ---- update Related ----

export async function updateRelated(
  id: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const relatedHeading = String(formData.get("relatedHeading") ?? "More Projects");
  const count = Number(formData.get("related.count") ?? 0);
  const relatedIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const v = formData.get(`related.${i}.id`);
    if (typeof v === "string" && v.length > 0) relatedIds.push(v);
  }
  const parsed = ProjectRelatedSchema.safeParse({ relatedHeading, relatedIds });
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  await prisma.$transaction([
    prisma.project.update({
      where: { id },
      data: { relatedHeading: parsed.data.relatedHeading },
    }),
    prisma.relatedProject.deleteMany({ where: { sourceId: id } }),
    prisma.relatedProject.createMany({
      data: parsed.data.relatedIds.map((rid, i) => ({
        sourceId: id,
        relatedId: rid,
        order: i,
      })),
    }),
  ]);
  revalidatePath(`/admin/projects/${id}`);
  return null;
}

// ---- update SEO + publish ----

export async function updateSeo(
  id: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const parsed = ProjectSeoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const existing = await prisma.project.findUnique({ where: { id } });
  let publishedAt = existing?.publishedAt ?? null;
  if (parsed.data.published && !publishedAt) publishedAt = new Date();
  await prisma.project.update({
    where: { id },
    data: { ...parsed.data, publishedAt },
  });
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/admin/projects");
  return null;
}

// ---- delete ----

export async function deleteProject(id: string) {
  await requireAdmin();
  const project = await prisma.project.findUnique({
    where: { id },
    include: { galleryImages: { select: { publicId: true } } },
  });
  if (project) {
    if (project.coverPublicId) await deleteImage(project.coverPublicId);
    if (project.cardPublicId) await deleteImage(project.cardPublicId);
    for (const img of project.galleryImages) {
      if (img.publicId) await deleteImage(img.publicId);
    }
  }
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

// ---- toggles ----

export async function togglePublishedProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const published = formData.get("published") === "true";
  const existing = await prisma.project.findUnique({ where: { id } });
  let publishedAt = existing?.publishedAt ?? null;
  if (published && !publishedAt) publishedAt = new Date();
  await prisma.project.update({ where: { id }, data: { published, publishedAt } });
  revalidatePath("/admin/projects");
}

export async function toggleFeaturedProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const featured = formData.get("featured") === "true";
  await prisma.project.update({ where: { id }, data: { featured } });
  revalidatePath("/admin/projects");
}
