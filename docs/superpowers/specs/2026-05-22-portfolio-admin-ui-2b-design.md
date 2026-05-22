# Portfolio Admin UI — Phase 2B Design Spec

**Date:** 2026-05-22
**Status:** Implemented (2026-05-22)
**Scope:** Phase 2B of the 4-phase backend buildout. Builds on [Phase 2A admin foundation](./2026-05-21-portfolio-admin-ui-2a-design.md). Phase 2C (Project CRUD) is a separate spec; Phase 3 (public-site rewire) happens after 2C.
**Predecessor:** Phase 2A (login + dashboard + 10 simple CRUDs + ContactSubmissions inbox)
**Successor:** Phase 2C (Project CRUD with nested sections + gallery + related projects)

---

## Goal

Ship the two reusable client primitives that all "advanced" admin features depend on — a TipTap rich-text editor and a drag-to-reorder list — and use them to deliver full BlogPost CRUD. Apply both primitives retroactively to existing Phase 2A surfaces: replace the `aboutIntroContent` textarea with the rich editor, and replace the numeric `order` input on all 9 entity list pages with drag-reorder.

**The public site still reads from `lib/data.ts` after Phase 2B.** Public-site rewiring is deferred to Phase 3.

## Non-goals (deferred)

- **Phase 2C:** Project CRUD (sections + gallery + related projects + multi-image upload)
- **Phase 3:** Public-site refactor to read from DB
- **Phase 4:** Contact form submission + Resend + sitemap + robots
- **Never (or much later):** TipTap collaboration / autosave / version history (single admin); tag autocomplete; table editor; text color picker; multi-file batch upload UI

---

## Constraints

- **Next.js 16.2.6 + React 19.** Continue the Server Action + zod pattern from Phase 2A. TipTap is a heavy client dependency — keep it in `'use client'` files only; do not let it leak into Server Components.
- **No new design system.** Reuse Tailwind tokens and existing admin styling. TipTap UI styled with our existing color tokens.
- **Sanitization:** TipTap produces HTML. Phase 2B stores it raw. The Phase 3 public renderer will sanitize via DOMPurify (or equivalent) before injecting — that work belongs in Phase 3. For Phase 2B, the only consumer of stored HTML is the admin editor itself, which round-trips it safely.
- **Cost: still $0/month.** No new paid services.
- **No public-site file modified.** All Phase 2B work is inside admin routes and shared `components/admin/*`. The public site continues rendering hardcoded data from `lib/data.ts`.

---

## Tech stack additions (Phase 2B only)

| Package | Purpose | Notes |
|---|---|---|
| `@tiptap/core` | Editor kernel | |
| `@tiptap/react` | React bindings | |
| `@tiptap/starter-kit` | Bundled default extensions (paragraph, heading, bold, italic, strike, code, lists, blockquote, hr, history) | Saves declaring 10+ extensions individually |
| `@tiptap/extension-link` | Link insert/edit UI | |
| `@tiptap/extension-image` | Inline `<img>` node | Cloudinary URL inserted here |
| `@tiptap/extension-placeholder` | "Start writing…" empty-state hint | |
| `@dnd-kit/core` | Drag-and-drop primitives | |
| `@dnd-kit/sortable` | Sortable list helpers | |
| `@dnd-kit/utilities` | CSS transform helpers | |

Already installed and reused: everything from Phase 2A. No removals.

Postponed (still not installed; remain on the Phase-4 list): `resend`, anything else.

---

## Architecture

### File map (Phase 2B deliverables)

```
portfolio/
├── components/admin/
│   ├── rich-text-editor/
│   │   ├── editor.tsx                # 'use client' — main TipTap editor
│   │   ├── toolbar.tsx               # 'use client' — formatting buttons
│   │   ├── image-button.tsx          # 'use client' — upload + insert image
│   │   ├── link-popover.tsx          # 'use client' — link insert/edit popover
│   │   └── extensions.ts             # configured TipTap extensions list
│   ├── sortable-list.tsx             # 'use client' — generic @dnd-kit wrapper
│   └── drag-handle.tsx               # 'use client' — small grip icon
│
├── actions/
│   ├── blog-posts.ts                 # createBlogPost, updateBlogPost, deleteBlogPost,
│   │                                 #   togglePublished, toggleFeatured, reorderBlogPosts
│   └── reorder.ts                    # NEW — exports reorderTools, reorderTestimonials, …
│                                     #   (one reorder action per of the 9 existing entities)
│
├── lib/
│   ├── schemas/
│   │   └── blog-post.ts              # zod schema for BlogPost
│   └── db/
│       └── blog-posts.ts             # listBlogPosts, getBlogPost, getBlogPostBySlug
│
├── app/(admin)/admin/
│   ├── blog-posts/
│   │   ├── page.tsx                  # list page (sortable)
│   │   ├── new/page.tsx              # create
│   │   ├── [id]/page.tsx             # edit
│   │   └── blog-post-form.tsx        # client form (uses RichTextEditor + ImageUploader)
│   │
│   ├── site-settings/about/
│   │   └── about-form.tsx            # MODIFIED — TextAreaField → RichTextEditor for aboutIntroContent
│   │
│   ├── tools/page.tsx                # MODIFIED — DataTable → SortableList wrapper
│   ├── testimonials/page.tsx         # MODIFIED — same
│   ├── faqs/page.tsx                 # MODIFIED — same
│   ├── client-logos/page.tsx         # MODIFIED — same
│   ├── nav-items/page.tsx            # MODIFIED — same
│   ├── social-links/page.tsx         # MODIFIED — same
│   ├── experience/page.tsx           # MODIFIED — same
│   ├── education/page.tsx            # MODIFIED — same
│   └── certifications/page.tsx       # MODIFIED — same
│
└── (all entity forms in app/(admin)/admin/<entity>/<entity>-form.tsx)
    └── MODIFIED — remove the `<NumberField name="order">` line; the form still submits an `order`
        value, but it's a hidden input carrying the current row's order (so updates don't clobber
        sort position when a non-order field changes). Drag-reorder is the only way to change order.
```

### Components count change

- **New files:** 12 (5 in rich-text-editor/, 2 root admin helpers, 4 blog-posts/, 1 reorder.ts)
- **Modified files:** 11 (about-form, 9 list pages, all 9 entity-forms for the hidden-input swap — actually 10 if we count testimonials etc.)

---

## RichTextEditor primitive

### API

```tsx
<RichTextEditor
  name="content"                       // hidden <input name> carrying serialized HTML
  initialHtml={initial?.content ?? ""} // editor's initial state
  placeholder="Start writing…"
  minHeight={240}                      // px, optional
/>
```

The component renders:
1. A `<Toolbar>` (Server-rendered structure with client-component buttons inside)
2. The TipTap `<EditorContent>` area
3. A hidden `<input>` synced with serialized HTML on every editor transaction

On every TipTap transaction (`onUpdate`), the editor calls `editor.getHTML()` and writes it into the hidden input via `useEffect` + ref. Form submit picks it up like any other field.

### Extension set

Configured in `components/admin/rich-text-editor/extensions.ts`:

```typescript
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

export const extensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    bulletList: {},
    orderedList: {},
    codeBlock: {},
    blockquote: {},
    horizontalRule: {},
    code: {},
    bold: {},
    italic: {},
    strike: {},
    history: {},
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
  Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
];
```

### Toolbar

Buttons (left to right):
- **Format:** Bold · Italic · Underline (via Underline mark from StarterKit if available, else skip) · Strikethrough · Inline code
- **Blocks:** Paragraph · H2 · H3 · H4 · Bullet list · Ordered list · Blockquote · Code block · Horizontal rule
- **Insert:** Link (popover for href + label) · Image (file picker → Cloudinary upload → insert node)
- **History:** Undo · Redo

Active state highlighted (e.g. when cursor inside bold span, the Bold button is filled). Implemented via `editor.isActive('bold')` reads.

### Image insert flow

`image-button.tsx`:
1. Click → opens hidden `<input type="file" accept="image/*">`
2. On file pick: calls `signCloudinaryUpload("blog")` (existing Phase 2A action — folder always `"blog"` for content images regardless of which form the editor is in, since blog is the most permissive bucket; or extend `CloudinaryFolder` later if Project sections need their own folder)
3. POSTs the file to `https://api.cloudinary.com/v1_1/<cloud>/auto/upload` (same as ImageUploader does)
4. On success: `editor.chain().focus().setImage({ src: secure_url, alt: file.name }).run()`
5. While uploading: button shows spinner, toolbar otherwise unblocked

Note: This image is **not** tracked separately in DB — it's just an `<img>` tag in the HTML content. If the post is deleted, the Cloudinary asset remains orphan. Acceptable for Phase 2B; orphan cleanup is a deferred concern.

### Link popover

`link-popover.tsx`:
- Click Link button: if selection is non-empty, opens a popover with `href` input + Apply/Remove
- If selection is empty, opens popover with `href` + `text` inputs + Insert
- Apply: `editor.chain().focus().setLink({ href }).run()`
- Remove: `editor.chain().focus().unsetLink().run()`

### Styling

The editor area uses prose-like Tailwind classes. We define a small set in the editor.tsx file via Tailwind class string — no new global CSS. Approximate:

```
prose prose-invert prose-headings:font-semibold prose-h2:text-xl
prose-h3:text-lg prose-a:text-accent-purple prose-img:rounded-md
prose-blockquote:border-l-accent-purple max-w-none
```

If `@tailwindcss/typography` isn't installed (it isn't — `tw-animate-css` exists but not `typography`), we'll need to install it OR style the editor manually. **Decision: install `@tailwindcss/typography` as a new dev-dep.**

| Package | Purpose |
|---|---|
| `@tailwindcss/typography` | Prose styling for editor content + (Phase 3) public renderer | dev-dep |

Add to the Tailwind config plugins.

---

## SortableList primitive

### API

```tsx
<SortableList
  ids={tools.map((t) => t.id)}     // current ordered ids
  reorderAction={reorderTools}     // server action: (ids: string[]) => Promise<void>
>
  {tools.map((tool) => (
    <SortableRow key={tool.id} id={tool.id}>
      {(handleProps) => (
        <div className="flex items-center gap-3">
          <DragHandle {...handleProps} />
          <span>{tool.name}</span>
          <span className="ml-auto">{/* edit/delete buttons */}</span>
        </div>
      )}
    </SortableRow>
  ))}
</SortableList>
```

### Implementation

`sortable-list.tsx`:

```typescript
"use client";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTransition, useState } from "react";

type SortableListProps = {
  ids: string[];
  reorderAction: (ids: string[]) => Promise<void>;
  children: React.ReactNode;
};

export function SortableList({ ids, reorderAction, children }: SortableListProps) {
  const [order, setOrder] = useState(ids);
  const [, startTransition] = useTransition();

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = order.indexOf(String(e.active.id));
    const newIdx = order.indexOf(String(e.over.id));
    const next = arrayMove(order, oldIdx, newIdx);
    setOrder(next);
    startTransition(async () => {
      try {
        await reorderAction(next);
      } catch {
        setOrder(ids); // revert on error
      }
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
```

`SortableRow` and `DragHandle` are thin wrappers around `useSortable()` from `@dnd-kit/sortable`. The `DragHandle` is the grip icon; the row's `transform` and `transition` come from `useSortable()`.

### Per-entity reorder actions

`actions/reorder.ts` exports one action per entity:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";

async function applyReorder(
  table: "tool" | "testimonial" | "fAQ" | "clientLogo" | "navItem" |
         "socialLink" | "experience" | "education" | "certification" | "blogPost",
  ids: string[],
  path: string,
) {
  await requireAdmin();
  await prisma.$transaction(
    ids.map((id, order) =>
      // Prisma model name is the key; the client property is the camelCase version
      (prisma as any)[table].update({ where: { id }, data: { order } }),
    ),
  );
  revalidatePath(path);
}

export const reorderTools = (ids: string[]) => applyReorder("tool", ids, "/admin/tools");
export const reorderTestimonials = (ids: string[]) => applyReorder("testimonial", ids, "/admin/testimonials");
export const reorderFaqs = (ids: string[]) => applyReorder("fAQ", ids, "/admin/faqs");
export const reorderClientLogos = (ids: string[]) => applyReorder("clientLogo", ids, "/admin/client-logos");
export const reorderNavItems = (ids: string[]) => applyReorder("navItem", ids, "/admin/nav-items");
export const reorderSocialLinks = (ids: string[]) => applyReorder("socialLink", ids, "/admin/social-links");
export const reorderExperience = (ids: string[]) => applyReorder("experience", ids, "/admin/experience");
export const reorderEducation = (ids: string[]) => applyReorder("education", ids, "/admin/education");
export const reorderCertifications = (ids: string[]) => applyReorder("certification", ids, "/admin/certifications");
export const reorderBlogPosts = (ids: string[]) => applyReorder("blogPost", ids, "/admin/blog-posts");
```

The single-cast helper avoids 10 nearly-identical files. Acceptable trade-off for terseness.

### Where applied

Every entity list page in `app/(admin)/admin/<entity>/page.tsx`:

1. Wrap row rendering in `<SortableList ids={...} reorderAction={...}>`
2. Each row is a `<SortableRow id={row.id}>` with the existing edit/delete/visible cells
3. Add a `<DragHandle>` at the start of each row

The `DataTable` component used in Phase 2A is replaced for these 10 list pages. The replacement is a slightly more verbose JSX (10 list pages × ~15 lines each = ~150 lines of changes) but each is mechanical.

### Where NOT applied

- `/admin/contact-submissions` — order is by `createdAt desc`, not user-defined
- `/admin/site-settings/*` — sub-pages, not lists

### Removing `order` from forms

Each entity form (`tool-form.tsx`, etc.) previously had:
```tsx
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
```

Change to:
```tsx
<input type="hidden" name="order" value={initial?.order ?? 0} />
```

This preserves the existing order on edit (so saving a name change doesn't reset position to 0). Drag-reorder is the only way to change order.

Server actions and schemas don't need changes — `order` is still accepted via FormData, just no longer surfaced in the form UI.

---

## BlogPost CRUD

Follows the Phase 2A entity-CRUD pattern with `RichTextEditor` for `content` and `SortableList` on the list page.

### Schema (`lib/schemas/blog-post.ts`)

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

const tagsField = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t, i, a) => a.indexOf(t) === i), // dedupe
  )
  .pipe(z.array(z.string().max(50)));

export const BlogPostSchema = z.object({
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  title: z.string().trim().min(1).max(200),
  subtitle: optionalText,
  excerpt: z.string().trim().min(1).max(500),
  content: z.string().min(1, "Content is required"),  // HTML from TipTap; no .url() etc.
  coverImageUrl: z.string().trim().url().max(2000),
  coverPublicId: z.string().default(""),
  category: optionalText,
  tags: tagsField,
  readTimeMinutes: intField.min(0).max(120).default(0),  // 0 = auto-compute on server
  author: optionalText,
  published: checkbox.default(false),
  featured: checkbox.default(false),
  metaTitle: optionalText,
  metaDescription: optionalText,
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;
```

### Actions (`actions/blog-posts.ts`)

Standard create/update/delete/togglePublished/toggleFeatured + the reorderBlogPosts (imported from `actions/reorder.ts`).

Server-side logic in create/update:
- If `readTimeMinutes === 0`, compute from HTML content: strip tags, count words, divide by 200, min 1.
- If `published === true` and the row's current `publishedAt === null`, set `publishedAt = new Date()`.
- If `published === false`, leave `publishedAt` as-is (preserve original publish date for un-publish-republish flow).
- Image replacement: standard `__oldPublicId` pattern from Phase 2A.

```typescript
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function autoReadTime(html: string): number {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
```

### Form fields

`blog-post-form.tsx` (client component, full useActionState pattern):

```tsx
<TextField name="title" label="Title" required defaultValue={initial?.title} error={err("title")} />
<TextField name="slug" label="Slug" required defaultValue={initial?.slug} help="Lowercase, hyphens, e.g. typography-soul-of-brand" error={err("slug")} />
<TextField name="subtitle" label="Subtitle" defaultValue={initial?.subtitle} error={err("subtitle")} />
<TextAreaField name="excerpt" label="Excerpt" required rows={3} defaultValue={initial?.excerpt} help="1–2 sentence summary shown in lists." error={err("excerpt")} />
<ImageUploader folder="blog" name="coverImageUrl" publicIdName="coverPublicId" initialUrl={initial?.coverImageUrl} initialPublicId={initial?.coverPublicId} label="Cover image" help="Recommended: 1200×630px (Open Graph standard)" required />
<RichTextEditor name="content" initialHtml={initial?.content ?? ""} placeholder="Start writing your post…" />
<TextField name="category" label="Category" defaultValue={initial?.category} error={err("category")} />
<TextField name="tags" label="Tags" defaultValue={initial?.tags?.join(", ")} help="Comma-separated, e.g. typography, branding, south-asia" error={err("tags")} />
<NumberField name="readTimeMinutes" label="Read time (minutes)" min={0} max={120} defaultValue={initial?.readTimeMinutes ?? 0} help="0 = auto-compute from content word count." error={err("readTimeMinutes")} />
<TextField name="author" label="Author" defaultValue={initial?.author} help="Defaults to site owner if left blank." error={err("author")} />
<BooleanField name="published" label="Published" defaultValue={initial?.published ?? false} />
<BooleanField name="featured" label="Featured" defaultValue={initial?.featured ?? false} />
<TextField name="metaTitle" label="SEO meta title (override)" defaultValue={initial?.metaTitle} error={err("metaTitle")} />
<TextAreaField name="metaDescription" label="SEO meta description (override)" rows={2} defaultValue={initial?.metaDescription} error={err("metaDescription")} />
```

### List page

`app/(admin)/admin/blog-posts/page.tsx`:

```tsx
import { listBlogPosts } from "@/lib/db/blog-posts";
import { reorderBlogPosts } from "@/actions/reorder";
import { deleteBlogPost, togglePublishedBlogPost } from "@/actions/blog-posts";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";

export default async function BlogPostsList() {
  const posts = await listBlogPosts();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Blog posts ({posts.length})</h1>
        <Link href="/admin/blog-posts/new" className="...">+ New blog post</Link>
      </header>
      <SortableList ids={posts.map((p) => p.id)} reorderAction={reorderBlogPosts}>
        {posts.map((p) => (
          <SortableRow key={p.id} id={p.id}>
            {(handle) => (
              <div className="...">
                <DragHandle {...handle} />
                <span>{p.title}</span>
                <span>{p.published ? "Published" : "Draft"}</span>
                <span>{p.tags.join(", ")}</span>
                {/* edit link, delete button */}
              </div>
            )}
          </SortableRow>
        ))}
      </SortableList>
    </div>
  );
}
```

The sortable rows are rendered as `<div>`s rather than `<tr>`s because @dnd-kit + table semantics is messy. The visual presentation is a "card list" style — each row is its own bordered card with the cells laid out horizontally via flex.

### Sidebar nav

Update `components/admin/sidebar.tsx` — add "Blog posts" to the CONTENT group:

```typescript
const CONTENT: NavLink[] = [
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
  { href: "/admin/blog-posts", label: "Blog posts" },        // NEW
];
```

### Dashboard card

Update `app/(admin)/admin/page.tsx` — move BlogPost count out of the "Deferred (Phase 2B)" section and into "Content":

```tsx
<Card label="Blog posts" count={blogPosts} href="/admin/blog-posts" />
```

Remove the grayed-out BlogPosts placeholder from the Deferred section. Projects stays in Deferred until Phase 2C.

---

## Retroactive: TipTap on aboutIntroContent

In `app/(admin)/admin/site-settings/about/about-form.tsx`, replace:

```tsx
<TextAreaField
  name="aboutIntroContent"
  label="About intro (HTML — TipTap in 2B)"
  rows={10}
  help="Raw HTML for now; rich editor lands in Phase 2B."
  defaultValue={initial.aboutIntroContent}
  error={err("aboutIntroContent")}
/>
```

With:

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">About intro</label>
  <RichTextEditor
    name="aboutIntroContent"
    initialHtml={initial.aboutIntroContent ?? ""}
    placeholder="Write your About-page intro…"
  />
</div>
```

The server action (`updateAbout`) doesn't change — the schema still accepts `aboutIntroContent: z.string()`. Existing seeded HTML from Phase 1 (`<p>...</p>` wrappers) renders cleanly in TipTap.

---

## Phase 2B acceptance criteria

1. `npm run build`, `npm run lint`, `npx tsc --noEmit` all clean.
2. `/admin/blog-posts` is reachable; sidebar shows "Blog posts" under Content. The page lists 5 seeded blog posts in a sortable card layout.
3. Creating a new blog post via the form persists to DB. Editing an existing post pre-fills the RichTextEditor and round-trips edits.
4. Toggling `published` from false→true sets `publishedAt = now()` (verify in Prisma Studio). Toggling true→false→true preserves the original `publishedAt`.
5. Submitting with `readTimeMinutes = 0` auto-computes from content word count.
6. RichTextEditor:
   - Bold, italic, headings, lists, links, blockquote, code, hr all work
   - Image button uploads to Cloudinary `/blog/` folder and inserts an inline `<img>` referencing the secure_url
   - Saving + reloading the form preserves all formatting + images
7. Drag-reorder on `/admin/tools`: drag any row to a different position → list visually reorders → reload → order persists. Same flow verified on all 10 list pages (9 retroactive + blog-posts).
8. `aboutIntroContent` on `/admin/site-settings/about` is now a RichTextEditor; previous seeded content is editable; save round-trips.
9. **No public-site file modified.** `app/(site)/**` and `components/sections/**` and `lib/data.ts` unchanged.
10. New deps match the Phase 2B allowlist; no other packages added.

---

## Out of scope (defer to Phase 2C / 3 / 4)

- **Phase 2C:** Project CRUD with nested ProjectSection editing (multiple TipTap editors per page), ProjectImage gallery upload + reorder, RelatedProject multi-select.
- **Phase 3:** Public-site `app/(site)/**` rewire — read all entities (including BlogPost + Project) from DB. Replace `lib/data.ts` exports with cached query functions.
- **Phase 4:** Contact form submission action, Resend email, sitemap, robots.txt.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| TipTap v2 React 19 compatibility | TipTap 2.10+ supports React 19. Pin to a known-good version. If issues arise, lock to the highest-stable v2 release. |
| TipTap HTML output XSS | DB-stored HTML is only consumed by the editor itself in Phase 2B (round-trips). Public renderer (Phase 3) MUST sanitize via DOMPurify before injection. This spec calls that out explicitly so Phase 3 doesn't miss it. |
| Image embedded inside TipTap leaks orphan Cloudinary assets on delete | Acceptable for Phase 2B (single admin, free tier). Cloudinary cleanup is a manual concern; an admin tool can be built later. |
| `@tailwindcss/typography` styling conflicts with existing prose elsewhere | The editor scoped class is `prose prose-invert ...` and lives inside `components/admin/rich-text-editor/editor.tsx`. No public-site impact since the public site doesn't import this. |
| @dnd-kit + drag accessibility | dnd-kit supports keyboard nav out of the box (Space pickup, Arrow keys move, Space drop). Manually verified on Tools list during acceptance. |
| Reorder transaction performance on large lists | Each list has fewer than 25 rows. Transaction with 25 updates completes in well under 100ms on Neon free tier. |
| Removing the `order` input from forms could clobber order on edit | Each entity form keeps a hidden `<input name="order" value={initial.order}>` so the existing value is preserved on save. Server action ignores changes to `order` from forms — only `reorder<Entity>(ids)` action mutates it. |
| Concurrent drag while another admin tab is open | Single admin; concurrency unlikely. Last-write-wins is acceptable. |

---

## Open questions

None — all decisions captured:

- **Q1:** Scope split — 2B = TipTap + drag-reorder + Blog; 2C = Project. Settled.
- **Q2:** TipTap extension set — standard with inline image embed via Cloudinary upload. Settled.
- **Q3 (decided in design):** Drag handle UX — small grip icon on left, cursor:grab, keyboard accessible.
- **Q4 (decided in design):** Tags input — comma-separated text input, server-side split/dedupe.
- **Q5 (decided in design):** ReadTime — manual override field; `0` triggers server-side auto-compute.
- **Q6 (decided in design):** PublishedAt — auto-set on first publish, preserved across unpublish/republish.
- **Q7 (decided in design):** Public wiring — stays in Phase 3 (after Phase 2C).
- **Q8 (decided in design):** Order input in entity forms — kept as hidden input only; drag-reorder is the only UI for changing position.
- **Q9 (decided in design):** Tailwind typography plugin — installed as dev-dep to style TipTap editor content (and Phase 3 public renderer later).
