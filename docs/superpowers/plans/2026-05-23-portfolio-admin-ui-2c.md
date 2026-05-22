# Portfolio Admin UI — Phase 2C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Project admin from the [2026-05-23 design spec](../specs/2026-05-23-portfolio-admin-ui-2c-design.md): a tabbed editor (`Basics · Content · Gallery · Related · SEO`) backed by 6 server actions (one per tab + delete + create + toggles), reusing every primitive from Phases 2A/2B. Nested collections (sections, gallery, related) save atomically via delete-all+create-all transactions. Create flow is Basics-only; edit flow shows all 5 tabs. **No public-site rewiring** — that's Phase 3.

**Architecture:** Each tab is a Client Component panel rendered by a single Server Component shell at `/admin/projects/[id]?tab=<name>`. Each panel has its own form with a bound Server Action; submission carries indexed FormData field names (`sections.0.heading`, etc.) that the action parses. Image cleanup honors the `__oldPublicId` pattern from Phase 2A + a gallery diff for added/removed images. No new deps, no schema changes — Phase 1 already has all four models with `order` columns + cascading deletes.

**Tech Stack:** Next.js 16.2.6 · React 19 · Prisma · Postgres (Neon) · zod · TipTap (Phase 2B) · @dnd-kit (Phase 2B) · Cloudinary signed upload (Phase 1) · sonner.

---

## Prerequisites

- Phase 2B merged to main (verify: `git log main --oneline | grep "phase 2B"` shows commits).
- Branch `phase-2c-projects` checked out (already done).
- `.env` populated; `npm run dev` boots; `/admin/login` reachable.
- `npx prisma generate` clean (no schema changes needed).

---

## File Map (locked here; tasks reference these paths)

| Path | Status | Responsibility |
|---|---|---|
| `lib/schemas/project.ts` | create | 5 zod schemas (one per tab) + the `tagsField`-style services transformer |
| `lib/db/projects.ts` | create | `listProjects`, `getProject(id)` with all nested children, `getProjectBySlug`, `getAvailableRelatedProjects(excludeId)` |
| `actions/projects.ts` | create | `createProject`, `updateBasics`, `updateContent`, `updateGallery`, `updateRelated`, `updateSeo`, `deleteProject`, `togglePublishedProject`, `toggleFeaturedProject` |
| `actions/reorder.ts` | modify | Add `reorderProjects(ids)` |
| `app/(admin)/admin/projects/page.tsx` | create | List page (sortable, mirrors Blog) |
| `app/(admin)/admin/projects/new/page.tsx` | create | Create — Basics-only |
| `app/(admin)/admin/projects/[id]/page.tsx` | create | Edit shell — reads `?tab=`, renders one panel |
| `app/(admin)/admin/projects/[id]/tabs-nav.tsx` | create | 5 tab links |
| `app/(admin)/admin/projects/[id]/basics-panel.tsx` | create | Basics form |
| `app/(admin)/admin/projects/[id]/content-panel.tsx` | create | Sections sortable editor |
| `app/(admin)/admin/projects/[id]/gallery-panel.tsx` | create | Gallery sortable grid editor |
| `app/(admin)/admin/projects/[id]/related-panel.tsx` | create | Selected sortable + Available search picker |
| `app/(admin)/admin/projects/[id]/seo-panel.tsx` | create | SEO + publish |
| `app/(admin)/admin/projects/project-shared.ts` | create | Shared types: `ProjectWithChildren`, slot types for gallery |
| `components/admin/sidebar.tsx` | modify | Add `Projects` link as first entry in CONTENT group |
| `app/(admin)/admin/page.tsx` | modify | Projects card moves to Content; delete the Deferred section |

No public-site file touched.

---

## Task 1: Zod schemas — `lib/schemas/project.ts`

**Files:**
- Create: `lib/schemas/project.ts`

- [ ] **Step 1: Write the file**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

const servicesField = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t, i, a) => a.indexOf(t) === i),
  )
  .pipe(z.array(z.string().max(50)));

export const ProjectBasicsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  shortLabel: optionalText,
  year: optionalText,
  client: optionalText,
  role: optionalText,
  services: servicesField,
  liveUrl: optionalUrl,
  coverImageUrl: z.string().trim().url("Must be a valid URL").max(2000),
  coverPublicId: z.string().default(""),
  cardImageUrl: optionalUrl,
  cardPublicId: optionalText,
  excerpt: z.string().trim().min(1, "Excerpt is required").max(2000),
  introContent: z.string().max(50000).default(""),
});

export type ProjectBasicsInput = z.infer<typeof ProjectBasicsSchema>;

const SectionSchema = z.object({
  heading: z.string().trim().min(1, "Section heading is required").max(200),
  content: z.string().min(0).max(50000),
});

export const ProjectContentSchema = z.object({
  sections: z.array(SectionSchema),
});

export type ProjectContentInput = z.infer<typeof ProjectContentSchema>;

const GalleryImageSchema = z.object({
  url: z.string().trim().url().max(2000),
  publicId: z.string().default(""),
  alt: optionalText,
  caption: optionalText,
});

export const ProjectGallerySchema = z.object({
  galleryHeading: z.string().trim().min(1).max(200).default("Selected Visuals"),
  images: z.array(GalleryImageSchema),
});

export type ProjectGalleryInput = z.infer<typeof ProjectGallerySchema>;

export const ProjectRelatedSchema = z.object({
  relatedHeading: z.string().trim().min(1).max(200).default("More Projects"),
  relatedIds: z.array(z.string().min(1)),
});

export type ProjectRelatedInput = z.infer<typeof ProjectRelatedSchema>;

export const ProjectSeoSchema = z.object({
  metaTitle: optionalText,
  metaDescription: optionalText,
  featured: checkbox.default(false),
  published: checkbox.default(false),
});

export type ProjectSeoInput = z.infer<typeof ProjectSeoSchema>;
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add lib/schemas/project.ts
git commit -m "feat(projects): 5 zod schemas (basics/content/gallery/related/seo)"
```

---

## Task 2: DB query helpers — `lib/db/projects.ts`

**Files:**
- Create: `lib/db/projects.ts`

- [ ] **Step 1: Write the file**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listProjects = cache(() =>
  prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
);

export const getProject = cache((id: string) =>
  prisma.project.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
      relatedProjects: {
        orderBy: { order: "asc" },
        include: {
          related: { select: { id: true, title: true, slug: true, coverImageUrl: true } },
        },
      },
    },
  }),
);

export const getProjectBySlug = cache((slug: string) =>
  prisma.project.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
    },
  }),
);

export const getAvailableRelatedProjects = cache((excludeId: string) =>
  prisma.project.findMany({
    where: { id: { not: excludeId } },
    select: { id: true, title: true, slug: true, coverImageUrl: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
);
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add lib/db/projects.ts
git commit -m "feat(projects): cached read helpers (list, getById, getBySlug, getAvailableRelated)"
```

---

## Task 3: Server actions — `actions/projects.ts`

**Files:**
- Create: `actions/projects.ts`

- [ ] **Step 1: Write the file**

```typescript
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
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add actions/projects.ts
git commit -m "feat(projects): server actions (create + 5 tab updates + delete + toggles)"
```

---

## Task 4: Add `reorderProjects` to `actions/reorder.ts`

**Files:**
- Modify: `actions/reorder.ts`

- [ ] **Step 1: Read current file + add the action**

The existing `actions/reorder.ts` has a `TableKey` union and 10 named exports. Add `"project"` to the union and a new export at the bottom.

Open `actions/reorder.ts`. Find the `TableKey` type:

```typescript
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
  | "blogPost";
```

Add `"project"` as the last variant:

```typescript
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
```

Then at the bottom of the file (after `reorderBlogPosts`), add:

```typescript
export async function reorderProjects(ids: string[]) {
  await applyReorder("project", ids, "/admin/projects");
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add actions/reorder.ts
git commit -m "feat(projects): add reorderProjects to reorder action set"
```

---

## Task 5: Project list page

**Files:**
- Create: `app/(admin)/admin/projects/page.tsx`

- [ ] **Step 1: Write the file**

```typescript
import Link from "next/link";
import Image from "next/image";
import { listProjects } from "@/lib/db/projects";
import { deleteProject } from "@/actions/projects";
import { reorderProjects } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Projects — admin" };

export default async function ProjectsListPage() {
  const projects = await listProjects();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects ({projects.length})</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New project
        </Link>
      </header>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderProjects}
          items={projects.map((p) => ({
            id: p.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="relative h-12 w-20 flex-shrink-0 rounded overflow-hidden bg-background">
                  <Image
                    src={p.coverImageUrl}
                    alt={p.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.shortLabel ?? "—"}
                    {p.year && ` · ${p.year}`}
                    {p.client && ` · ${p.client}`}
                    {` · ${p.published ? "Published" : "Draft"}`}
                    {p.featured && " · Featured"}
                  </div>
                </div>
                <Link
                  href={`/admin/projects/${p.id}?tab=basics`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={p.id} action={deleteProject} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: tsc + build + commit**

```bash
npx tsc --noEmit
npm run build
git add "app/(admin)/admin/projects/page.tsx"
git commit -m "feat(projects): sortable list page with cover thumbnail + delete"
```

---

## Task 6: Shared types + tabs-nav + edit shell

**Files:**
- Create: `app/(admin)/admin/projects/project-shared.ts`
- Create: `app/(admin)/admin/projects/[id]/tabs-nav.tsx`
- Create: `app/(admin)/admin/projects/[id]/page.tsx`

- [ ] **Step 1: Create `app/(admin)/admin/projects/project-shared.ts`**

```typescript
import type { Prisma } from "@prisma/client";

export type ProjectWithChildren = Prisma.ProjectGetPayload<{
  include: {
    sections: true;
    galleryImages: true;
    relatedProjects: {
      include: {
        related: { select: { id: true; title: true; slug: true; coverImageUrl: true } };
      };
    };
  };
}>;

export type GallerySlot = {
  url: string;
  publicId: string;
  alt: string;
  caption: string;
  oldPublicId: string; // tracks initial publicId to detect changes
};

export type AvailableProject = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
};
```

- [ ] **Step 2: Create `app/(admin)/admin/projects/[id]/tabs-nav.tsx`**

```typescript
"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = { key: string; label: string };

const TABS: Tab[] = [
  { key: "basics", label: "Basics" },
  { key: "content", label: "Content" },
  { key: "gallery", label: "Gallery" },
  { key: "related", label: "Related" },
  { key: "seo", label: "SEO" },
];

export function TabsNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("tab") ?? "basics";

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border mb-6">
      {TABS.map((t) => {
        const active = current === t.key;
        return (
          <Link
            key={t.key}
            href={`${pathname}?tab=${t.key}`}
            className={
              "px-4 py-2 text-sm rounded-t-md transition " +
              (active
                ? "bg-accent-purple/10 border-b-2 border-accent-purple text-foreground -mb-px"
                : "hover:bg-card text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create `app/(admin)/admin/projects/[id]/page.tsx` (edit shell)**

```typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getAvailableRelatedProjects } from "@/lib/db/projects";
import { TabsNav } from "./tabs-nav";
import { BasicsPanel } from "./basics-panel";
import { ContentPanel } from "./content-panel";
import { GalleryPanel } from "./gallery-panel";
import { RelatedPanel } from "./related-panel";
import { SeoPanel } from "./seo-panel";

export const metadata = { title: "Edit project — admin" };

const VALID_TABS = ["basics", "content", "gallery", "related", "seo"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = (VALID_TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as Tab)
    : "basics";

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/projects"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">{project.title}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {project.published ? "Published" : "Draft"}
        {project.featured && " · Featured"}
      </p>

      <TabsNav />

      {tab === "basics" && <BasicsPanel project={project} />}
      {tab === "content" && <ContentPanel project={project} />}
      {tab === "gallery" && <GalleryPanel project={project} />}
      {tab === "related" && (
        <RelatedPanel
          project={project}
          available={await getAvailableRelatedProjects(project.id)}
        />
      )}
      {tab === "seo" && <SeoPanel project={project} />}
    </div>
  );
}
```

- [ ] **Step 4: tsc**

This step will TS-error because the 5 panel components don't exist yet. That's expected — they're created in Tasks 7-11. Skip tsc here and commit after the shell + tabs + types only.

```bash
git add "app/(admin)/admin/projects/project-shared.ts" "app/(admin)/admin/projects/[id]/tabs-nav.tsx" "app/(admin)/admin/projects/[id]/page.tsx"
git commit -m "feat(projects): edit shell + tabs nav + shared types (panels in next tasks)"
```

(The build will be broken between Tasks 6 and 11 — that's OK during development. Each subsequent task adds one panel; after Task 11 the build is clean.)

---

## Task 7: Basics panel

**Files:**
- Create: `app/(admin)/admin/projects/[id]/basics-panel.tsx`

- [ ] **Step 1: Write the file**

```typescript
"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateBasics, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function BasicsPanel({ project }: Props) {
  const action = updateBasics.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state === null) return;
    if (state.error && !state.issues) toast.error(state.error);
  }, [state]);

  // Treat `null` returned from the action as "success" (saved with no error)
  useEffect(() => {
    if (state === null) {
      // initial mount returns null; only toast after a real submission cycle
      // We can't distinguish here, so leave to the user — rely on toast.error for failures only.
    }
  }, [state]);

  return (
    <form action={formAction}>
      {state?.error && !state?.issues && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200"
        >
          {state.error}
        </div>
      )}

      <TextField name="title" label="Title" required defaultValue={project.title} error={err("title")} />
      <TextField name="slug" label="Slug" required defaultValue={project.slug} placeholder="nokshi" error={err("slug")} />
      <TextField name="shortLabel" label="Short label" defaultValue={project.shortLabel} placeholder="Fashion Brand Identity" error={err("shortLabel")} />
      <TextField name="year" label="Year" defaultValue={project.year} placeholder="2023" error={err("year")} />
      <TextField name="client" label="Client" defaultValue={project.client} error={err("client")} />
      <TextField name="role" label="Role" defaultValue={project.role} error={err("role")} />
      <TextField name="services" label="Services" defaultValue={project.services.join(", ")} placeholder="Brand identity, Typography, Packaging" error={err("services")} />
      <UrlField name="liveUrl" label="Live URL" defaultValue={project.liveUrl} error={err("liveUrl")} />

      <ImageUploader
        folder="projects"
        name="coverImageUrl"
        publicIdName="coverPublicId"
        initialUrl={project.coverImageUrl}
        initialPublicId={project.coverPublicId}
        label="Cover image"
        help="Recommended: 1600×1000px (~16:10)"
        required
      />

      <ImageUploader
        folder="projects"
        name="cardImageUrl"
        publicIdName="cardPublicId"
        initialUrl={project.cardImageUrl}
        initialPublicId={project.cardPublicId}
        label="Card image (optional)"
        help="Recommended: 640×400px. Falls back to cover image if blank."
      />

      <TextAreaField
        name="excerpt"
        label="Excerpt"
        required
        rows={3}
        defaultValue={project.excerpt}
        help="1–3 sentences shown in listings and previews."
        error={err("excerpt")}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Intro content</label>
        <RichTextEditor
          name="introContent"
          initialHtml={project.introContent ?? ""}
          placeholder="Optional intro paragraph that appears above the sections…"
        />
      </div>

      <SubmitButton label="Save Basics" />
    </form>
  );
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/admin/projects/[id]/basics-panel.tsx"
git commit -m "feat(projects): basics panel (text fields + cover/card image + intro rich-text)"
```

(tsc still errors because other panels don't exist; the error count should decrease compared to Task 6.)

---

## Task 8: Content panel (sections sortable editor)

**Files:**
- Create: `app/(admin)/admin/projects/[id]/content-panel.tsx`

The content panel maintains an array of sections in client state. Each section is a card with drag handle + heading input + RichTextEditor + delete button. "Add section" appends. On save, a hidden `sections.count` input is submitted plus indexed `sections.{i}.heading` / `sections.{i}.content` for each entry.

- [ ] **Step 1: Write the file**

```typescript
"use client";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextField } from "@/components/admin/field/text-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { DragHandle } from "@/components/admin/drag-handle";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateContent, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type SectionItem = {
  uid: string; // local-only React key (stable across reorders)
  heading: string;
  content: string;
};

type Props = { project: ProjectWithChildren };

let nextUid = 0;
function makeUid() {
  return `s-${Date.now()}-${nextUid++}`;
}

export function ContentPanel({ project }: Props) {
  const action = updateContent.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  const [sections, setSections] = useState<SectionItem[]>(() =>
    project.sections.map((s) => ({ uid: makeUid(), heading: s.heading, content: s.content })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setSections((prev) => {
      const oldIdx = prev.findIndex((s) => s.uid === String(e.active.id));
      const newIdx = prev.findIndex((s) => s.uid === String(e.over!.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addSection() {
    setSections((prev) => [...prev, { uid: makeUid(), heading: "", content: "" }]);
  }

  function deleteSection(uid: string) {
    setSections((prev) => prev.filter((s) => s.uid !== uid));
  }

  function updateField(uid: string, field: "heading" | "content", value: string) {
    setSections((prev) => prev.map((s) => (s.uid === uid ? { ...s, [field]: value } : s)));
  }

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Content sections ({sections.length})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag to reorder. Each section is a heading + rich-text body.
        </p>
      </header>

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.uid)} strategy={verticalListSortingStrategy}>
          {sections.map((s, i) => (
            <SortableSection
              key={s.uid}
              section={s}
              index={i}
              onChange={updateField}
              onDelete={() => deleteSection(s.uid)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <input type="hidden" name="sections.count" value={sections.length} />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addSection}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card transition"
        >
          + Add section
        </button>
        <SubmitButton label="Save sections" />
      </div>
    </form>
  );
}

type SortableSectionProps = {
  section: SectionItem;
  index: number;
  onChange: (uid: string, field: "heading" | "content", value: string) => void;
  onDelete: () => void;
};

function SortableSection({ section, index, onChange, onDelete }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.uid,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-md bg-card p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="touch-none cursor-grab active:cursor-grabbing select-none px-1.5 py-1 text-muted-foreground hover:text-foreground rounded transition"
          {...listeners}
          {...(attributes as Record<string, unknown>)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <circle cx="4" cy="3" r="1.2" />
            <circle cx="4" cy="7" r="1.2" />
            <circle cx="4" cy="11" r="1.2" />
            <circle cx="10" cy="3" r="1.2" />
            <circle cx="10" cy="7" r="1.2" />
            <circle cx="10" cy="11" r="1.2" />
          </svg>
        </button>
        <span className="text-xs text-muted-foreground">Section {index + 1}</span>
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto text-xs text-red-400 hover:underline"
        >
          Delete
        </button>
      </div>

      <TextField
        name={`sections.${index}.heading`}
        label="Heading"
        required
        defaultValue={section.heading}
        // Controlled via onInput so reorder doesn't lose changes
      />
      {/* Keep state in sync without React controlled-input churn:
          re-render on parent state change handles it. The defaultValue above resets
          when the SortableSection's `key` (uid) changes — uids are stable. */}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Body</label>
        <RichTextEditor
          name={`sections.${index}.content`}
          initialHtml={section.content}
          placeholder="Write the section body…"
          minHeight={160}
        />
      </div>
    </div>
  );
}
```

**Note on state sync:** the heading TextField uses `defaultValue` not `value`, so its content lives in the DOM. The RichTextEditor's hidden input does the same. On reorder, the React component instance is preserved (because `key={uid}` doesn't change), so DOM state stays attached. Only the parent state's `heading`/`content` strings are stale — but they're only used as `defaultValue` on first mount and submission uses FormData directly. Submission reads from the DOM, so reorder + edit + save works correctly.

The `onChange`/`updateField` prop is currently unused — left in the API in case a future tab needs to sync edits to parent state for cross-tab display. For 2C MVP it's a no-op; the engineer can wire it up if a need arises, or remove the prop and the field updates. Leaving as-is keeps the component shape consistent.

Actually, simplify: remove the unused `onChange` prop entirely. Update the file: remove `onChange` from `SortableSectionProps`, remove the prop from the render call, and remove `updateField` from the parent. The form works without it.

Revised parent rendering:
```tsx
{sections.map((s, i) => (
  <SortableSection
    key={s.uid}
    section={s}
    index={i}
    onDelete={() => deleteSection(s.uid)}
  />
))}
```

And `SortableSectionProps`:
```tsx
type SortableSectionProps = {
  section: SectionItem;
  index: number;
  onDelete: () => void;
};
```

And drop the `updateField` function from the parent.

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/admin/projects/[id]/content-panel.tsx"
git commit -m "feat(projects): content panel — sortable sections editor with RichTextEditor per section"
```

---

## Task 9: Gallery panel (sortable grid + alt/caption)

**Files:**
- Create: `app/(admin)/admin/projects/[id]/gallery-panel.tsx`

- [ ] **Step 1: Write the file**

```typescript
"use client";
import { useActionState, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextField } from "@/components/admin/field/text-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateGallery, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type SlotItem = {
  uid: string;
  url: string;
  publicId: string;
  alt: string;
  caption: string;
};

let nextUid = 0;
function makeUid() {
  return `g-${Date.now()}-${nextUid++}`;
}

type Props = { project: ProjectWithChildren };

export function GalleryPanel({ project }: Props) {
  const action = updateGallery.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  const [slots, setSlots] = useState<SlotItem[]>(() =>
    project.galleryImages.map((img) => ({
      uid: makeUid(),
      url: img.url,
      publicId: img.publicId,
      alt: img.alt ?? "",
      caption: img.caption ?? "",
    })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setSlots((prev) => {
      const oldIdx = prev.findIndex((s) => s.uid === String(e.active.id));
      const newIdx = prev.findIndex((s) => s.uid === String(e.over!.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { uid: makeUid(), url: "", publicId: "", alt: "", caption: "" },
    ]);
  }

  function removeSlot(uid: string) {
    setSlots((prev) => prev.filter((s) => s.uid !== uid));
  }

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Gallery ({slots.length} {slots.length === 1 ? "image" : "images"})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag to reorder. Each slot is a Cloudinary-uploaded image with optional alt + caption.
        </p>
      </header>

      <TextField
        name="galleryHeading"
        label="Gallery section heading"
        required
        defaultValue={project.galleryHeading}
        placeholder="Selected Visuals"
      />

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slots.map((s) => s.uid)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {slots.map((s, i) => (
              <SortableSlot key={s.uid} slot={s} index={i} onRemove={() => removeSlot(s.uid)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <input type="hidden" name="images.count" value={slots.length} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSlot}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card transition"
        >
          + Add image
        </button>
        <SubmitButton label="Save gallery" />
      </div>
    </form>
  );
}

function SortableSlot({
  slot,
  index,
  onRemove,
}: {
  slot: SlotItem;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.uid,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-md bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="touch-none cursor-grab active:cursor-grabbing select-none px-1.5 py-1 text-muted-foreground hover:text-foreground rounded transition"
          {...listeners}
          {...(attributes as Record<string, unknown>)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <circle cx="4" cy="3" r="1.2" />
            <circle cx="4" cy="7" r="1.2" />
            <circle cx="4" cy="11" r="1.2" />
            <circle cx="10" cy="3" r="1.2" />
            <circle cx="10" cy="7" r="1.2" />
            <circle cx="10" cy="11" r="1.2" />
          </svg>
        </button>
        <span className="text-xs text-muted-foreground">Image {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-xs text-red-400 hover:underline"
        >
          Remove
        </button>
      </div>

      <ImageUploader
        folder="projects"
        name={`images.${index}.url`}
        publicIdName={`images.${index}.publicId`}
        initialUrl={slot.url || null}
        initialPublicId={slot.publicId || null}
        label=""
        help="Recommended: 1600×1200px"
      />

      <TextField
        name={`images.${index}.alt`}
        label="Alt text"
        defaultValue={slot.alt}
        placeholder="Describe the image for accessibility"
      />

      <TextField
        name={`images.${index}.caption`}
        label="Caption"
        defaultValue={slot.caption}
        placeholder="Optional caption shown below the image"
      />
    </div>
  );
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/admin/projects/[id]/gallery-panel.tsx"
git commit -m "feat(projects): gallery panel — sortable grid of image slots with alt/caption"
```

---

## Task 10: Related panel (selected sortable + available search picker)

**Files:**
- Create: `app/(admin)/admin/projects/[id]/related-panel.tsx`

- [ ] **Step 1: Write the file**

```typescript
"use client";
import { useActionState, useState, useMemo } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextField } from "@/components/admin/field/text-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateRelated, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren, AvailableProject } from "../project-shared";

type Props = {
  project: ProjectWithChildren;
  available: AvailableProject[];
};

export function RelatedPanel({ project, available }: Props) {
  const action = updateRelated.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  // Initial selected list, preserving order
  const initialSelectedIds = project.relatedProjects.map((r) => r.relatedId);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [search, setSearch] = useState("");

  // Build a lookup so the selected list can render rich info
  const allById = useMemo(() => {
    const map = new Map<string, AvailableProject>();
    for (const p of available) map.set(p.id, p);
    for (const r of project.relatedProjects) {
      map.set(r.relatedId, {
        id: r.related.id,
        title: r.related.title,
        slug: r.related.slug,
        coverImageUrl: r.related.coverImageUrl,
      });
    }
    return map;
  }, [available, project.relatedProjects]);

  const filteredAvailable = useMemo(() => {
    const s = search.trim().toLowerCase();
    return available
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => (s ? p.title.toLowerCase().includes(s) : true));
  }, [available, selectedIds, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setSelectedIds((prev) => {
      const oldIdx = prev.indexOf(String(e.active.id));
      const newIdx = prev.indexOf(String(e.over!.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addId(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeId(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Related projects ({selectedIds.length})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick from other projects. Drag to reorder. Shown in the "More projects" section on the project page.
        </p>
      </header>

      <TextField
        name="relatedHeading"
        label="Section heading"
        required
        defaultValue={project.relatedHeading}
        placeholder="More Projects"
      />

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <section>
          <h3 className="text-sm font-medium mb-2">Selected</h3>
          {selectedIds.length === 0 ? (
            <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md p-4">
              None yet. Click an available project to add.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                {selectedIds.map((id) => {
                  const info = allById.get(id);
                  return (
                    <SelectedRow
                      key={id}
                      id={id}
                      title={info?.title ?? id}
                      coverImageUrl={info?.coverImageUrl ?? ""}
                      onRemove={() => removeId(id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium mb-2">Available</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple mb-2"
          />
          {filteredAvailable.length === 0 ? (
            <p className="text-xs text-muted-foreground">No matches.</p>
          ) : (
            <ul>
              {filteredAvailable.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addId(p.id)}
                    className="flex items-center gap-2 w-full text-left border border-border rounded-md bg-card px-3 py-2 mb-1.5 hover:border-accent-purple transition"
                  >
                    <div className="relative h-8 w-12 flex-shrink-0 rounded overflow-hidden bg-background">
                      {p.coverImageUrl && (
                        <Image src={p.coverImageUrl} alt={p.title} fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                    <span className="text-sm truncate">{p.title}</span>
                    <span className="ml-auto text-xs text-accent-purple">+ Add</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <input type="hidden" name="related.count" value={selectedIds.length} />
      {selectedIds.map((id, i) => (
        <input key={id} type="hidden" name={`related.${i}.id`} value={id} />
      ))}

      <SubmitButton label="Save related" />
    </form>
  );
}

function SelectedRow({
  id,
  title,
  coverImageUrl,
  onRemove,
}: {
  id: string;
  title: string;
  coverImageUrl: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border border-border rounded-md bg-card px-3 py-2 mb-1.5">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="touch-none cursor-grab active:cursor-grabbing select-none px-1.5 py-1 text-muted-foreground hover:text-foreground rounded transition"
        {...listeners}
        {...(attributes as Record<string, unknown>)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </button>
      <div className="relative h-8 w-12 flex-shrink-0 rounded overflow-hidden bg-background">
        {coverImageUrl && (
          <Image src={coverImageUrl} alt={title} fill sizes="48px" className="object-cover" />
        )}
      </div>
      <span className="text-sm truncate flex-1">{title}</span>
      <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:underline">
        Remove
      </button>
    </div>
  );
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/admin/projects/[id]/related-panel.tsx"
git commit -m "feat(projects): related panel — sortable selected + search picker for available"
```

---

## Task 11: SEO panel

**Files:**
- Create: `app/(admin)/admin/projects/[id]/seo-panel.tsx`

- [ ] **Step 1: Write the file**

```typescript
"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateSeo, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function SeoPanel({ project }: Props) {
  const action = updateSeo.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">SEO & publish</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Override defaults derived from title and excerpt. Publishing sets the first-published
          date automatically.
        </p>
      </header>

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <TextField
        name="metaTitle"
        label="Meta title (override)"
        defaultValue={project.metaTitle}
        placeholder="Defaults to project title"
      />

      <TextAreaField
        name="metaDescription"
        label="Meta description (override)"
        rows={2}
        defaultValue={project.metaDescription}
        help="Defaults to excerpt if blank."
      />

      <BooleanField name="featured" label="Featured" defaultValue={project.featured} />
      <BooleanField name="published" label="Published" defaultValue={project.published} />

      <p className="text-xs text-muted-foreground mb-4">
        Currently {project.published ? "published" : "draft"}.
        {project.publishedAt && ` First published ${project.publishedAt.toISOString().slice(0, 10)}.`}
      </p>

      <SubmitButton label="Save SEO" />
    </form>
  );
}
```

- [ ] **Step 2: tsc + build**

The tsc and build should now be CLEAN — all 5 panels exist. The edit shell page from Task 6 finally type-checks.

```bash
npx tsc --noEmit
npm run build
```

Expected: both clean. Routes `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]` listed.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/projects/[id]/seo-panel.tsx"
git commit -m "feat(projects): seo panel — meta override + featured/published toggles"
```

---

## Task 12: New project page (Basics-only)

**Files:**
- Create: `app/(admin)/admin/projects/new/page.tsx`
- Create: `app/(admin)/admin/projects/new/new-form.tsx` (client)

The `BasicsPanel` from Task 7 takes a `project: ProjectWithChildren` and binds to `updateBasics(id, ...)`. For the create flow, we need a similar form that binds to `createProject(prev, fd)` with no `id`. Easiest: a dedicated `new-form.tsx`.

- [ ] **Step 1: Create `app/(admin)/admin/projects/new/new-form.tsx`**

```typescript
"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { createProject, type ProjectFormState } from "@/actions/projects";

export function NewProjectForm() {
  const [state, formAction] = useActionState<ProjectFormState, FormData>(createProject, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <TextField name="title" label="Title" required error={err("title")} />
      <TextField name="slug" label="Slug" required placeholder="nokshi" error={err("slug")} />
      <TextField name="shortLabel" label="Short label" placeholder="Fashion Brand Identity" error={err("shortLabel")} />
      <TextField name="year" label="Year" placeholder="2023" error={err("year")} />
      <TextField name="client" label="Client" error={err("client")} />
      <TextField name="role" label="Role" error={err("role")} />
      <TextField name="services" label="Services" placeholder="Brand identity, Typography, Packaging" error={err("services")} />
      <UrlField name="liveUrl" label="Live URL" error={err("liveUrl")} />

      <ImageUploader
        folder="projects"
        name="coverImageUrl"
        publicIdName="coverPublicId"
        label="Cover image"
        help="Recommended: 1600×1000px (~16:10)"
        required
      />

      <ImageUploader
        folder="projects"
        name="cardImageUrl"
        publicIdName="cardPublicId"
        label="Card image (optional)"
        help="Recommended: 640×400px. Falls back to cover image if blank."
      />

      <TextAreaField
        name="excerpt"
        label="Excerpt"
        required
        rows={3}
        help="1–3 sentences shown in listings."
        error={err("excerpt")}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Intro content</label>
        <RichTextEditor
          name="introContent"
          initialHtml=""
          placeholder="Optional intro paragraph that appears above the sections…"
        />
      </div>

      <SubmitButton label="Create project" pendingLabel="Creating…" />
    </form>
  );
}
```

- [ ] **Step 2: Create `app/(admin)/admin/projects/new/page.tsx`**

```typescript
import Link from "next/link";
import { NewProjectForm } from "./new-form";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/projects"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">New project</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fill the basics. After save, you'll go to the edit page where you can add sections,
        gallery, related projects, and SEO.
      </p>
      <NewProjectForm />
    </div>
  );
}
```

- [ ] **Step 3: tsc + build + commit**

```bash
npx tsc --noEmit
npm run build
git add "app/(admin)/admin/projects/new"
git commit -m "feat(projects): new project page (Basics-only; redirects to edit on save)"
```

---

## Task 13: Sidebar + dashboard wiring

**Files:**
- Modify: `components/admin/sidebar.tsx`
- Modify: `app/(admin)/admin/page.tsx`

- [ ] **Step 1: Add "Projects" to sidebar CONTENT group**

In `components/admin/sidebar.tsx`, find:

```typescript
const CONTENT: NavLink[] = [
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
  { href: "/admin/blog-posts", label: "Blog posts" },
];
```

Add `{ href: "/admin/projects", label: "Projects" }` as the FIRST entry:

```typescript
const CONTENT: NavLink[] = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
  { href: "/admin/blog-posts", label: "Blog posts" },
];
```

- [ ] **Step 2: Update dashboard Content section + delete Deferred section**

In `app/(admin)/admin/page.tsx`:

1. The `projects` count is already destructured from the Promise.all (it's there from Phase 2A). Add a Projects card as the FIRST card in the Content section:

```tsx
<section className="mb-8">
  <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
    Content
  </h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    <Card label="Projects" count={projects} href="/admin/projects" />
    <Card label="Tools" count={tools} href="/admin/tools" />
    <Card label="Testimonials" count={testimonials} href="/admin/testimonials" />
    <Card label="FAQs" count={faqs} href="/admin/faqs" />
    <Card label="Client logos" count={clientLogos} href="/admin/client-logos" />
    <Card label="Blog posts" count={blogPosts} href="/admin/blog-posts" />
  </div>
</section>
```

2. Delete the entire "Deferred (Phase 2C)" section. Find:

```tsx
<section className="mb-8">
  <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
    Deferred (Phase 2C)
  </h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 opacity-60">
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        Projects
      </div>
      <div className="text-2xl font-semibold mt-1">{projects}</div>
    </div>
  </div>
</section>
```

DELETE this entire section block. With Projects + Blog now in Content, nothing remains deferred at the count-card level.

- [ ] **Step 3: tsc + build + commit**

```bash
npx tsc --noEmit
npm run build
git add components/admin/sidebar.tsx "app/(admin)/admin/page.tsx"
git commit -m "feat(admin): wire projects into sidebar (top of Content) + dashboard card"
```

---

## Task 14: Final acceptance verification

**Files:** none modified. This is the verification pass.

- [ ] **Step 1: Static checks**

```bash
npm run build
npm run lint
npx tsc --noEmit
```
All three must exit 0.

- [ ] **Step 2: No public-site changes**

```bash
BASE=$(git merge-base HEAD main)
git diff --name-only "$BASE" HEAD -- 'app/(site)/' 'components/sections/' lib/data.ts
```
Expected: empty.

- [ ] **Step 3: No new deps**

```bash
BASE=$(git merge-base HEAD main)
git diff "$BASE" HEAD -- package.json | grep -E '^\+ +"' | grep -v scripts
```
Expected: no `+` lines for dependencies (no new packages added in 2C).

- [ ] **Step 4: Runtime — list page**

Start `npm run dev`. Log in. Visit `/admin/projects`. Verify:
- 6 seeded projects show as cards (cover thumbnails visible)
- Each card shows title + shortLabel + year + client + status (Published/Draft)
- "+ New project" link visible top-right
- Sidebar shows "Projects" as the first entry under CONTENT
- Dashboard at `/admin` shows Projects card with count 6 under Content; no Deferred section

- [ ] **Step 5: Runtime — drag-reorder on list**

Drag a project (e.g. Aronno) to position 1. Reload. Aronno is at position 1 in the list (and `prisma.project.findMany({ orderBy: { order: "asc" } })` confirms in Prisma Studio).

- [ ] **Step 6: Runtime — create flow**

Click "+ New project". Form shows Basics-only fields. Fill:
- Title: "Acceptance test project"
- Slug: "acceptance-test"
- Year: "2026"
- Services: "Testing, QA"
- Upload a cover image (any PNG)
- Excerpt: "Built during Phase 2C acceptance."
- (Leave intro empty)

Submit. Expected: redirect to `/admin/projects/<new-id>?tab=basics`. Page title now shows the new project name. All 5 tabs visible in TabsNav.

- [ ] **Step 7: Runtime — edit each tab on Nokshi**

Navigate `/admin/projects` → Edit on Nokshi (or whichever project is first).

**Basics tab:**
- Title pre-filled "Nokshi". Change to "Nokshi Studio". Save Basics. Header updates after revalidate. Reload — title persists. Toast appears for errors only (success is silent — that's fine; the page reload signals success).
- (Revert "Nokshi Studio" → "Nokshi" before moving on.)

**Content tab:**
- 3 sections visible: "The brief", "The approach", "The outcome".
- Drag "The outcome" to position 1.
- Add a 4th section: heading "Press", body "<p>Featured in Bangla Type Quarterly</p>" (via RichTextEditor).
- Delete "The brief" (the original one at position 2 after the reorder).
- Save sections.
- Reload. Verify in Prisma Studio that Nokshi has 3 sections in this order: "The outcome", "The approach", "Press".

**Gallery tab:**
- 4 existing seeded gallery rows visible.
- Add a 5th slot: upload an image, alt "test image", caption "added during acceptance".
- Reorder: move new slot to position 1.
- Remove slot 3 (whichever was 3rd before the reorder).
- Save gallery.
- Verify on Cloudinary dashboard that the removed slot's asset is gone (or marked as deleted).
- Verify Prisma Studio: Nokshi has 4 `ProjectImage` rows in correct order with the new slot first.

**Related tab:**
- "Selected" is empty (no related seeded).
- Type "aron" in Available search → "Aronno" filters in → click to add.
- Add "Padma" too (clear search to see it).
- Drag "Padma" above "Aronno" in Selected.
- Save related.
- Verify Prisma Studio: 2 `RelatedProject` rows with `sourceId = nokshi.id`, orders 0 (Padma) and 1 (Aronno).

**SEO tab:**
- Toggle `featured` on. Save. Reload. DB shows `featured: true`.
- Toggle `published` off (was true from seed). Save. Reload. DB: `published: false`, `publishedAt` UNCHANGED (preserved from seed).
- Toggle `published` on. Save. Reload. DB: `published: true`, `publishedAt` STILL the original seeded value (preserved across cycle).

- [ ] **Step 8: Runtime — delete project**

Delete the "Acceptance test project" from the list page. Confirm. List goes back to 6 rows. Verify Prisma Studio: no orphan rows in `ProjectSection` / `ProjectImage` / `RelatedProject` referencing that id. Cloudinary: the test cover image is deleted.

- [ ] **Step 9: Stop dev server**

- [ ] **Step 10: Mark spec as Implemented**

Edit `docs/superpowers/specs/2026-05-23-portfolio-admin-ui-2c-design.md` header:
- Change `Status: Draft — awaiting user review` to `Status: Implemented (YYYY-MM-DD)` with today's date.

```bash
git add docs/superpowers/specs/2026-05-23-portfolio-admin-ui-2c-design.md
git commit -m "docs(spec): mark phase 2C admin UI as implemented"
```

---

## What's NOT in this plan (defer to Phase 3 / 4)

- **Phase 3:** Public site `app/(site)/**` rewire to read all entities from DB. Replaces `lib/data.ts` reads with cached query functions. HTML sanitization for TipTap-produced content before injecting on public pages.
- **Phase 4:** Contact form submission action, Resend email, sitemap, robots.txt.

---

## Risks captured during planning

1. **TipTap memory cost on Content tab with many sections.** Each editor instance is ~100 KB initialized. A project with 6+ sections renders ~600 KB of editor state on one tab. Admin-only; acceptable.
2. **Indexed FormData parsing requires the hidden `*.count` input to be correct.** All client panels increment `*.count` from `state.length` directly. Adding/removing a row updates state which updates count on next render. Safe.
3. **`updateContent` and `updateGallery` delete-all+create-all loses any per-section/per-image timestamps.** The Phase 1 schema has no `createdAt` on `ProjectSection` / `ProjectImage`, so nothing breaks.
4. **Related projects cyclic references (A → B → A).** UI excludes self; doesn't prevent cycles. Acceptable — cycles are conceptually valid (two projects can reference each other).
5. **TipTap inside SortableSection might lose focus on reorder.** Each section's RichTextEditor mounts once (stable `key={uid}` on the parent). Reordering moves DOM nodes via dnd-kit's CSS transforms; the editor instance is preserved. Tested in Phase 2B reorder of other entities.
6. **Search picker filtering on 6 projects is trivial.** When project count grows past ~100, switch to server-side search. Far away from that.
7. **Cover image required on Basics, but Card image optional.** zod enforces `coverImageUrl` non-empty URL on create. New project flow blocks save until cover uploaded.



