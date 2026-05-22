# Portfolio Admin UI — Phase 2C Design Spec

**Date:** 2026-05-23
**Status:** Draft — awaiting user review
**Scope:** Phase 2C of the 4-phase backend buildout. Builds on Phase 2A (admin foundation) and [Phase 2B primitives](./2026-05-22-portfolio-admin-ui-2b-design.md) (RichTextEditor + SortableList + ImageUploader). Phase 3 (public-site rewire) is a separate spec.
**Predecessor:** Phase 2B (TipTap + drag-reorder + BlogPost CRUD)
**Successor:** Phase 3 (public site reads from DB instead of `lib/data.ts`)

---

## Goal

Ship the Project admin — the most complex entity in the schema. A Project has many fields (title, slug, year, client, services, cover/card images, intro rich-text, SEO meta) plus three nested collections: `ProjectSection[]` (heading + rich-text body, ordered), `ProjectImage[]` (gallery, ordered with alt/caption), `RelatedProject[]` (N–N join to other projects, ordered). All four pieces edit through a tabbed interface (`Basics · Content · Gallery · Related · SEO`). Every primitive needed already exists in `components/admin/` from Phases 2A–2B; this spec only describes how those primitives compose into the project editor.

**Public site continues reading from `lib/data.ts` after Phase 2C.** Phase 3 wires the public site to the DB.

## Non-goals (deferred)

- **Phase 3:** Public-site rewire — read all entities (including Project) from DB. Replace `lib/data.ts` exports with cached query functions.
- **Phase 4:** Contact form submission, Resend, sitemap, robots.txt.
- **Never (or much later):** Multi-file batch gallery upload UI (one image per slot only), image cropping/editing in admin, project duplication / templating, auto-slug from title, related-projects circular-reference detection, SEO preview cards inside admin.

---

## Constraints

- **Next.js 16.2.6 + React 19** — Server Action + zod pattern; one server action per tab.
- **No new deps.** Phase 2C composes existing primitives only.
- **No public-site file modified.** Project page changes wait for Phase 3.
- **Cost: still $0/month.** No new paid services. Cloudinary `projects/` folder used.
- **Tabs do not share form state.** Each tab is its own form with its own save action. Switching tabs is a page navigation; unsaved changes in a tab are lost.
- **Two flows for Project lifecycle:**
  - **Create:** `/admin/projects/new` — Basics-only form. On save, redirect to `/admin/projects/[id]?tab=basics`.
  - **Edit:** `/admin/projects/[id]` — all 5 tabs accessible.
  - Reasoning: sections, gallery, and related rows all FK to `projectId`. Forcing all five tabs at creation time complicates client-side state and validation. Create-then-enrich keeps the flow linear.

---

## Architecture

### File map (Phase 2C deliverables)

```
portfolio/
├── lib/schemas/
│   └── project.ts                      # 5 zod schemas — one per tab
│
├── lib/db/
│   └── projects.ts                     # listProjects, getProject (with sections/images/related),
│                                       # getProjectBySlug, getAvailableRelatedProjects(excludeId)
│
├── actions/
│   ├── projects.ts                     # createProject, updateBasics, updateContent, updateGallery,
│                                       # updateRelated, updateSeo, deleteProject,
│                                       # togglePublishedProject, toggleFeaturedProject
│   └── reorder.ts                      # MODIFIED — add reorderProjects(ids)
│
├── app/(admin)/admin/projects/
│   ├── page.tsx                        # sortable list (mirror Blog pattern)
│   ├── new/page.tsx                    # Basics-only create form
│   ├── [id]/
│   │   ├── page.tsx                    # tab shell — reads ?tab=, fetches project, renders one panel
│   │   ├── tabs-nav.tsx                # 'use client' — 5 tab links with active state from ?tab=
│   │   ├── basics-panel.tsx            # 'use client' — Basics form
│   │   ├── content-panel.tsx           # 'use client' — sections sortable list editor
│   │   ├── gallery-panel.tsx           # 'use client' — gallery sortable grid editor
│   │   ├── related-panel.tsx           # 'use client' — selected sortable + search picker
│   │   └── seo-panel.tsx               # 'use client' — SEO + publish state
│   └── project-shared.ts               # shared TypeScript types: ProjectWithChildren etc.
│
├── components/admin/
│   ├── sidebar.tsx                     # MODIFIED — add "Projects" link to CONTENT group
│   │
│   ▷ (no other component changes — Phases 2A/2B primitives reused as-is)
│
└── app/(admin)/admin/page.tsx          # MODIFIED — Projects card moves from Deferred → Content,
                                        # Deferred section renamed to "Deferred (Phase 3)"
```

**No new primitives, no new deps, no schema changes.** Phase 1 schema already has `order Int @default(0)` on `Project` and indexes on `ProjectSection.order`, `ProjectImage.order`, `RelatedProject.order` — verified.

### Tab routing

The edit page is one Server Component at `app/(admin)/admin/projects/[id]/page.tsx`. It reads `searchParams.tab` (default `"basics"`), fetches the project with all nested relations, and renders the matching panel as a child. Each panel is a Client Component receiving its slice of data + the bound server action.

URL examples:
- `/admin/projects/clxxx?tab=basics` — Basics panel
- `/admin/projects/clxxx?tab=content` — Content (sections)
- `/admin/projects/clxxx?tab=gallery`
- `/admin/projects/clxxx?tab=related`
- `/admin/projects/clxxx?tab=seo`

`tabs-nav.tsx` (Client Component, reads `usePathname` + `useSearchParams`) renders 5 `<Link>`s. Active link gets `bg-accent-purple/10 border-b-2 border-accent-purple`.

### Save model

**One Server Action per tab.** Each is transactional within its concern:

| Action | Updates | Strategy |
|---|---|---|
| `createProject(prev, fd)` | `Project` only | INSERT with Basics fields; nested rows empty. Redirect to edit page. |
| `updateBasics(id, prev, fd)` | `Project` (basics fields) | UPDATE single row. Cleanup `coverImage__oldPublicId` + `cardImage__oldPublicId` if changed. |
| `updateContent(id, prev, fd)` | `ProjectSection[]` | Delete-all + create-all in one transaction. No partial updates — array is replaced atomically. |
| `updateGallery(id, prev, fd)` | `ProjectImage[]` | Diff current vs submitted publicIds → `deleteImage()` for removed Cloudinary assets BEFORE the DB transaction → delete-all + create-all. |
| `updateRelated(id, prev, fd)` | `RelatedProject[]` (source side) | Delete-all + create-all for `sourceId = projectId`. |
| `updateSeo(id, prev, fd)` | `Project` (SEO + publish fields) | Same `publishedAt` logic as BlogPost (auto-set on first publish, preserve on cycle). |

**Why delete-all + create-all for nested collections?** Diff-based updates are error-prone with reorder + add + remove on the same submit. Replacing the entire collection is idempotent and simple. The transactions are small (most projects have <10 sections, <20 gallery images, <6 related) so performance is fine.

### Form submission shape (nested arrays)

For tabs with arrays (Content, Gallery, Related), each row uses indexed field names that FormData serializes naturally:

```
sections.0.heading = "The brief"
sections.0.content = "<p>…</p>"
sections.1.heading = "The approach"
sections.1.content = "<p>…</p>"
…
sections.count = "5"     # hidden input tracking array length
```

Server action parses by reading `sections.count` then iterating `0..count-1`:

```ts
const count = Number(formData.get("sections.count") ?? 0);
const sections: { heading: string; content: string }[] = [];
for (let i = 0; i < count; i++) {
  sections.push({
    heading: String(formData.get(`sections.${i}.heading`) ?? ""),
    content: String(formData.get(`sections.${i}.content`) ?? ""),
  });
}
```

Client panel maintains the array in `useState`; render order is the visual order; on add/remove/reorder the state mutates and `sections.count` updates accordingly. The hidden `count` input is rendered last so it reflects the current length.

Same pattern for gallery (`images.0.url`, `images.0.publicId`, `images.0.alt`, `images.0.caption`) and related (`related.0.id`).

---

## Tab-by-tab UX

### Basics

Fields (in order):
- `title` — required, TextField
- `slug` — required, TextField, must match `/^[a-z0-9-]+$/`
- `shortLabel` — optional, TextField (one-line tagline)
- `year` — optional, TextField (free-text e.g. `"2023"`)
- `client` — optional, TextField
- `role` — optional, TextField (e.g. `"Lead designer"`)
- `services` — comma-separated text input (e.g. `"Brand identity, Typography, Packaging"`); server splits + trims + dedupes; stored as `String[]`
- `liveUrl` — optional, UrlField
- `coverImageUrl` + `coverPublicId` — ImageUploader (folder=`projects`), required, hint `1600×1000px (~16:10)`
- `cardImageUrl` + `cardPublicId` — ImageUploader (folder=`projects`), optional, hint `640×400px (~16:10); falls back to cover if blank`
- `excerpt` — TextAreaField, required, 1–3 sentences
- `introContent` — RichTextEditor, optional, free-form intro paragraph(s)

Save → `updateBasics(id, prev, fd)` → toast "Saved" on success.

### Content (sections)

Heading: `Content sections (N)` + a subtitle: `Drag to reorder. Each section is a heading + rich-text body that renders on the public project page.`

The form renders:

```
+--------------------------------------------------+
| [⋮⋮]  Section 1                          [Delete]|
| Heading [The brief                          ]   |
| Body    [RichTextEditor (240px tall)]            |
+--------------------------------------------------+
+--------------------------------------------------+
| [⋮⋮]  Section 2                          [Delete]|
| ...                                              |
+--------------------------------------------------+
[ + Add section ]
[Save changes]
```

Behavior:
- Drag handle on each card; click + drag reorders within the local state
- Delete button removes the section from local state (no confirm — undo by leaving without saving)
- "Add section" appends an empty card with focus on its heading input
- RichTextEditor inside each card uses `name="sections.{i}.content"` and `initialHtml={section.content}`
- Saving sends all sections; server replaces the set atomically

Empty state (zero sections): renders the "Add section" button alone.

### Gallery (images)

Heading: `Gallery (N images)` + a TextField for `galleryHeading` (public-page section heading; default `"Selected Visuals"`).

Each image is a "slot" arranged in a 2-column grid on desktop:

```
+-----------------------------+ +-----------------------------+
| [⋮⋮]                [Remove]| | [⋮⋮]                [Remove]|
| [ImageUploader 200×130]     | | [ImageUploader 200×130]     |
| Alt:     [logo close-up   ] | | Alt:     [packaging        ]|
| Caption: [The wordmark... ] | | Caption: [Aubergine box... ]|
+-----------------------------+ +-----------------------------+
[ + Add image ]
```

Behavior:
- Sortable grid (uses `SortableList` from Phase 2B; works for vertical grids too via `verticalListSortingStrategy` with CSS grid layout)
- Each slot is a `useState` entry with `{ url, publicId, alt, caption, oldPublicId }`
- ImageUploader inside emits `images.{i}.url` and `images.{i}.publicId`
- Remove button: marks the slot for deletion (slot is removed from state; the publicId is recorded so the save action can clean up Cloudinary)
- "Add image" appends an empty slot

Server action `updateGallery`:
1. Read submitted images array from FormData
2. Fetch current `ProjectImage` rows for this project from DB
3. Compute `removedPublicIds = current.publicIds \ submitted.publicIds`
4. For each removed publicId, call `deleteImage(publicId)` (best-effort, swallows errors)
5. In one transaction: `deleteMany({ projectId })` then `createMany` with the submitted array (mapping `order = index`)

### Related projects

Heading: `Related projects` + TextField for `relatedHeading` (default `"More Projects"`).

Layout (two columns on desktop):

```
+-- Selected (drag to reorder) ----+  +-- Available --------------+
| [⋮⋮] Aronno          [Remove]    |  | Search: [___________]    |
| [⋮⋮] Padma           [Remove]    |  | □ Dhaka Metro            |
|                                   |  | □ Shoroth                |
|                                   |  | □ Boithok                |
+-----------------------------------+  +---------------------------+
[Save changes]
```

Behavior:
- "Selected" is a sortable list of related-project chips with drag handle + remove. State holds an array of related project IDs in order.
- "Available" is a fetched list of all other projects (excludes self + already-selected). Search input filters by title (client-side simple `.includes()`).
- Clicking an available project pushes its id to "Selected" state.
- Removing from Selected pops it; it reappears in Available.

Server action `updateRelated`:
- Replace all `RelatedProject` rows for `sourceId = projectId` with the submitted ids (preserving order via `order = index`).

`getAvailableRelatedProjects(excludeId)` returns `{ id, title, slug, coverImageUrl }` for all published+visible projects except `excludeId`. Used by the panel's data-fetching parent.

### SEO + publish

Fields:
- `metaTitle` — optional, TextField (override; defaults at render-time to `title`)
- `metaDescription` — optional, TextAreaField, 2 rows (override; defaults at render-time to `excerpt`)
- `featured` — BooleanField
- `published` — BooleanField (auto-sets `publishedAt = now()` on first publish; preserves across cycles)

Save → `updateSeo`.

---

## List page (`/admin/projects`)

Mirror BlogPost list pattern:

```
+-------------------------------------------------+
| Projects (6)                  [+ New project]   |
+-------------------------------------------------+
| [⋮⋮] [cover 96x64] Nokshi                       |
|       Fashion Brand Identity · 2023 · Published |
|       [Edit] [Delete]                            |
+-------------------------------------------------+
| [⋮⋮] [cover 96x64] Aronno                       |
|       Eco Packaging Design · 2023 · Draft        |
|       [Edit] [Delete]                            |
+-------------------------------------------------+
…
```

Drag-reorder → `reorderProjects(ids)` server action (added to `actions/reorder.ts`).

Empty state: `"No projects yet."` (won't fire since the DB has 6 seeded).

### Sidebar + dashboard

`components/admin/sidebar.tsx`:
- Add `{ href: "/admin/projects", label: "Projects" }` as the FIRST entry in the CONTENT group (above Tools).

`app/(admin)/admin/page.tsx`:
- Add `<Card label="Projects" count={projects} href="/admin/projects" />` to the Content section (the `projects` count is already in the Promise.all destructuring).
- Remove the Projects placeholder from the "Deferred (Phase 2C)" section.
- Rename that section to `"Deferred (Phase 3)"` and leave only any future placeholders (likely none — the only thing left in Deferred is Phase 3 public-site work, which doesn't show as a count card).
- Actually: with both Project and Blog now in Content, the Deferred section can be deleted entirely.

---

## Schema (no changes)

Phase 1 schema already has the four required models (`Project`, `ProjectSection`, `ProjectImage`, `RelatedProject`) and the `order` columns / cascade-delete relationships needed. No migration in Phase 2C.

Verification: `prisma/schema.prisma` already contains:
- `Project.order Int @default(0)` ✓
- `ProjectSection { order, projectId, onDelete: Cascade }` ✓
- `ProjectImage { order, projectId, onDelete: Cascade }` ✓
- `RelatedProject { sourceId, relatedId, order, onDelete: Cascade for both sides }` ✓

Deleting a Project cascades to its sections, images, and related-rows automatically. Cover/card Cloudinary cleanup happens in `deleteProject` server action.

---

## Image cleanup invariant

Every server action that modifies image-bearing fields:

1. **`updateBasics`**: reads `coverImageUrl__oldPublicId` and `cardImageUrl__oldPublicId` from FormData; calls `deleteImage` for each if changed.
2. **`updateGallery`**: diffs current vs submitted publicIds (described above).
3. **`deleteProject`**: collects all publicIds (cover + card + all gallery images), calls `deleteImage` on each before DB delete.

`deleteImage` from Phase 1 is best-effort — logs errors but doesn't throw — so a transient Cloudinary failure doesn't block the save.

---

## Phase 2C acceptance criteria

1. `npm run build`, `npm run lint`, `npx tsc --noEmit` all clean.
2. **Sidebar + dashboard**: "Projects" link appears under Content group in sidebar. Dashboard Content section has a Projects card with count 6.
3. **List page**: `/admin/projects` renders 6 seeded projects as sortable cards. Drag handle reorders; DB `order` persists after reload.
4. **Create flow**: `/admin/projects/new` shows Basics-only form. Submitting with required fields creates a project and redirects to `/admin/projects/[id]?tab=basics`. Sections/gallery/related tabs are now accessible.
5. **Edit Basics (canonical entity: Nokshi)**: change title to "Nokshi Studio". Save. Toast appears. Reload — title persists.
6. **Edit Content**: Nokshi has 3 seeded sections. Reorder them via drag. Add a new section "Press" with rich-text body. Delete the first section. Save. Prisma Studio confirms the project's `ProjectSection` set matches: 3 sections in new order (Approach, Outcome, Press).
7. **Edit Gallery**: Nokshi has 4 seeded gallery rows. Upload a new image (drop a PNG); add alt + caption. Reorder. Remove one existing image. Save. Cloudinary dashboard confirms the removed image's asset is gone. Prisma Studio shows the new 4-row set with correct order.
8. **Edit Related**: open Nokshi, Related tab. Selected is empty. Search "aron" in Available → Aronno appears → click to add. Add Padma. Reorder Selected so Padma is first. Save. Prisma Studio shows 2 `RelatedProject` rows with `sourceId = nokshi.id` and order 0/1.
9. **Edit SEO + publish**: toggle `featured` on a draft project, save → DB `featured: true`. Toggle `published` true → DB `published: true` and `publishedAt` is set to ~now. Toggle off, save → `published: false` but `publishedAt` unchanged. Toggle on again, save → `publishedAt` still unchanged from first publish.
10. **Delete project**: delete Nokshi from list → list shows 5 rows. Prisma Studio: nokshi gone, no orphan rows in `ProjectSection`/`ProjectImage`/`RelatedProject` referencing nokshi.id. Cloudinary: nokshi's cover, card (if any), all gallery assets gone.
11. **No public-site file modified**: `git diff --name-only main..HEAD -- 'app/(site)/' 'components/sections/' lib/data.ts` returns empty.
12. **No new deps**: `git diff main..HEAD -- package.json` shows no `+ "..."` lines except possibly version bumps (none expected).

---

## Out of scope (defer to Phase 3 / 4 / never)

- Multi-file batch upload to gallery (one slot per file in 2C; "Add image" + ImageUploader). A batch picker that uploads N files at once and creates N slots can be added later.
- Image cropping / focal-point editing.
- Project duplication or template flows.
- Tag autocomplete for `services` (still comma-separated free-form).
- Auto-slug-from-title with conflict detection.
- Bulk publish / unpublish from the list page.
- View public preview link from the editor (Phase 3 enables `app/projects/[slug]` to read DB; a "View live" link can be added then).

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Many TipTap editors mounted on one Content tab → memory cost | Each editor is ~100 KB initialized. With 6+ sections, ~600 KB on the admin Content tab. Admin-only, acceptable. If becomes painful, lazy-mount editors below the fold. |
| FormData with indexed field names on a complex form has bugs | The pattern is tested in many React form libraries (react-hook-form, formik) but we're rolling our own. The server-side parser is small (3 lines per array) and the panel state is straightforward `useState`. Risk is real but bounded; per-tab acceptance test catches issues. |
| Tab navigation loses unsaved state silently | Each tab is independent. Users may lose work. Acceptable for admin (single user, low frequency). A "Save before leaving" badge can be added later if it becomes an issue. |
| Diff-based Cloudinary cleanup on gallery may delete an asset still referenced by another project | Asset publicIds are project-folder-scoped (`projects/<random-id>`), unique per upload. No sharing across projects in practice. |
| Search picker performance on large project counts | Phase 2C admin has 6–25 projects expected. Client-side `.includes()` filter is fine. If the project count grows past 100, switch to server-side search. |
| `updateContent` / `updateGallery` delete-all-create-all churn breaks Prisma's `createdAt` on existing children | Acceptable — these are admin-edited content with no consumer of `createdAt` on `ProjectSection` / `ProjectImage`. The Phase 1 schema has `createdAt` on the parent `Project` (preserved) but not on these children, so nothing breaks. |
| User saves an edit while the introContent or section content is mid-keystroke | TipTap's onUpdate syncs the hidden input on every transaction; FormData picks up the latest value at submit time. No race. |

---

## Open questions

None. All decisions captured:

- **Q1:** Form layout = tabs (Basics · Content · Gallery · Related · SEO). Settled.
- **Q2:** Create flow = Basics-only at `/new`, redirect to edit. Settled.
- **Q3:** Sections editor = linear list of cards with drag handle, RichTextEditor body, delete button, "Add section" appender. Settled.
- **Q4:** Gallery editor = sortable 2-column grid of slots (ImageUploader + alt + caption per slot), "Add image" appender. Single-file per slot (batch deferred). Settled.
- **Q5:** Related projects = chip list of Selected (sortable) + filtered Available (click to add). Settled.
- **Q6:** Save model = one Server Action per tab. Nested collections replaced atomically (delete-all + create-all). Settled.
- **Q7:** Tabs as `?tab=` query param on a single page route. Settled.
- **Q8:** Services input = comma-separated (BlogPost.tags pattern). Settled.
- **Q9:** Card image (optional) — kept in Basics with hint that it falls back to cover. Settled.
- **Q10:** Public-site changes — none in Phase 2C. Settled.
