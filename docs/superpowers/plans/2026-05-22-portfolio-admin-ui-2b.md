# Portfolio Admin UI — Phase 2B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 2B admin features from the [2026-05-22 design spec](../specs/2026-05-22-portfolio-admin-ui-2b-design.md): a reusable TipTap `<RichTextEditor>` primitive (with inline Cloudinary image upload), a reusable `<SortableList>` drag-reorder primitive (applied to all 10 list pages, replacing the numeric order input), and full BlogPost CRUD using both primitives. Retroactively apply the RichTextEditor to SiteSettings `aboutIntroContent`. **No public-site rewiring** — that's Phase 3.

**Architecture:** TipTap (`@tiptap/core` + `react` + `starter-kit` + `link`/`image`/`placeholder`) and @dnd-kit (`core` + `sortable` + `utilities`) drive two new client primitives in `components/admin/`. BlogPost follows Phase 2A's entity-CRUD pattern (server actions + zod + client form). Reorder actions for all 10 entities live in `actions/reorder.ts` and update `order` columns transactionally; entity forms keep a hidden `order` input to preserve position on non-order edits. Public site continues reading from `lib/data.ts`.

**Tech Stack:** Next.js 16.2.6 · React 19 · Prisma · Postgres (Neon) · zod · sonner · Tailwind + `@tailwindcss/typography` (new) · TipTap 2.x · @dnd-kit 6.x · Cloudinary signed direct upload (Phase 1) · jose auth (Phase 1).

---

## Prerequisites

- Phase 2A merged to main (it is — `git log main` shows commits through `108e627`).
- Branch `phase-2b-projects-blog` already checked out from main.
- `.env` populated (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, CLOUDINARY_*). The `ADMIN_PASSWORD_HASH` must use the `\$2a\$12\$...` escaped form per the Phase 2A note in `.env.example`.
- `npx prisma generate` runs clean.
- `npm run dev` boots and `/admin/login` is reachable.

---

## Pre-flight: read the docs you'll need

Before writing any code:

1. TipTap basics — read the React quick-start: `node_modules/@tiptap/react/README.md` (or scan once it's installed)
2. TipTap StarterKit extension list — `node_modules/@tiptap/starter-kit/README.md` (after install)
3. @dnd-kit Sortable patterns — `node_modules/@dnd-kit/sortable/README.md` (after install)

If anything in this plan conflicts with the installed version's API, adapt and note in the commit.

---

## File Map (locked here; tasks reference these paths)

| Path | Status | Responsibility |
|---|---|---|
| `package.json` | modify | Add TipTap, @dnd-kit, @tailwindcss/typography |
| `tailwind.config.ts` or `globals.css` | modify | Wire @tailwindcss/typography (depends on the existing setup) |
| `components/admin/rich-text-editor/extensions.ts` | create | TipTap extension list |
| `components/admin/rich-text-editor/toolbar.tsx` | create | Format/blocks/insert buttons |
| `components/admin/rich-text-editor/link-popover.tsx` | create | Link insert/edit popover |
| `components/admin/rich-text-editor/image-button.tsx` | create | File picker → Cloudinary → insert image node |
| `components/admin/rich-text-editor/editor.tsx` | create | `<RichTextEditor>` main component |
| `components/admin/sortable-list.tsx` | create | `<SortableList>` + `<SortableRow>` |
| `components/admin/drag-handle.tsx` | create | Grip icon |
| `actions/reorder.ts` | create | 10 reorder actions |
| `lib/schemas/blog-post.ts` | create | Zod schema |
| `lib/db/blog-posts.ts` | create | Cached read helpers |
| `actions/blog-posts.ts` | create | Create/update/delete/toggle actions |
| `app/(admin)/admin/blog-posts/page.tsx` | create | List |
| `app/(admin)/admin/blog-posts/new/page.tsx` | create | Create |
| `app/(admin)/admin/blog-posts/[id]/page.tsx` | create | Edit |
| `app/(admin)/admin/blog-posts/blog-post-form.tsx` | create | Client form |
| `app/(admin)/admin/site-settings/about/about-form.tsx` | modify | Swap TextAreaField → RichTextEditor |
| `app/(admin)/admin/tools/page.tsx` | modify | Wrap rows in SortableList |
| `app/(admin)/admin/tools/tool-form.tsx` | modify | NumberField → hidden input for `order` |
| `app/(admin)/admin/testimonials/page.tsx` | modify | same |
| `app/(admin)/admin/testimonials/testimonial-form.tsx` | modify | same |
| `app/(admin)/admin/faqs/page.tsx` | modify | same |
| `app/(admin)/admin/faqs/faq-form.tsx` | modify | same |
| `app/(admin)/admin/client-logos/page.tsx` | modify | same |
| `app/(admin)/admin/client-logos/client-logo-form.tsx` | modify | same |
| `app/(admin)/admin/nav-items/page.tsx` | modify | same |
| `app/(admin)/admin/nav-items/nav-item-form.tsx` | modify | same |
| `app/(admin)/admin/social-links/page.tsx` | modify | same |
| `app/(admin)/admin/social-links/social-link-form.tsx` | modify | same |
| `app/(admin)/admin/experience/page.tsx` | modify | same |
| `app/(admin)/admin/experience/experience-form.tsx` | modify | same |
| `app/(admin)/admin/education/page.tsx` | modify | same |
| `app/(admin)/admin/education/education-form.tsx` | modify | same |
| `app/(admin)/admin/certifications/page.tsx` | modify | same |
| `app/(admin)/admin/certifications/certification-form.tsx` | modify | same |
| `components/admin/sidebar.tsx` | modify | Add "Blog posts" link under CONTENT |
| `app/(admin)/admin/page.tsx` | modify | Move Blog post card from Deferred → Content |

No public-site file touched (`app/(site)/**`, `components/sections/**`, `lib/data.ts`).

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add runtime + dev dependencies**

Edit `package.json`. Add to `dependencies` (keep alphabetical):

```json
"@dnd-kit/core": "^6.1.0",
"@dnd-kit/sortable": "^8.0.0",
"@dnd-kit/utilities": "^3.2.2",
"@tiptap/core": "^2.10.3",
"@tiptap/extension-image": "^2.10.3",
"@tiptap/extension-link": "^2.10.3",
"@tiptap/extension-placeholder": "^2.10.3",
"@tiptap/react": "^2.10.3",
"@tiptap/starter-kit": "^2.10.3"
```

Add to `devDependencies` (alphabetical, before `@types/*`):

```json
"@tailwindcss/typography": "^0.5.15"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes without errors. Around 30-50 new packages added (TipTap + dnd-kit pull in transitive deps).

- [ ] **Step 3: Verify each new dep is importable**

Run:
```bash
npx tsx -e 'Promise.all([import("@tiptap/core"), import("@tiptap/react"), import("@tiptap/starter-kit"), import("@tiptap/extension-link"), import("@tiptap/extension-image"), import("@tiptap/extension-placeholder"), import("@dnd-kit/core"), import("@dnd-kit/sortable"), import("@dnd-kit/utilities")]).then(() => console.log("all imports OK"))'
```
Expected: `all imports OK`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(admin): add tiptap, @dnd-kit, @tailwindcss/typography deps"
```

---

## Task 2: Configure @tailwindcss/typography plugin

**Files:**
- Inspect first: `tailwind.config.ts` (or `tailwind.config.js`) and `app/globals.css`
- Modify: whichever file holds the Tailwind config (Tailwind v4 uses CSS-only config in `globals.css` via `@plugin` directive; Tailwind v3 uses JS config)

- [ ] **Step 1: Detect the Tailwind setup**

The project uses `tailwindcss ^4` and `@tailwindcss/postcss ^4` (per Phase 1 `package.json`). Tailwind v4 prefers CSS-based config. The file `app/globals.css` likely contains `@import "tailwindcss"` and possibly `@plugin "..."` lines.

Read `app/globals.css` first. Look for:
- `@import "tailwindcss"` line
- Any existing `@plugin` directives

- [ ] **Step 2: Add the typography plugin**

If `app/globals.css` has CSS-based Tailwind v4 config (most likely), add at the top, right after `@import "tailwindcss";`:

```css
@plugin "@tailwindcss/typography";
```

If instead a `tailwind.config.ts` exists with a `plugins: []` array, add:

```typescript
import typography from "@tailwindcss/typography";
// in config:
plugins: [typography],
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: completes successfully. The typography plugin adds new prose-* utility classes; nothing should break.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts 2>/dev/null
git commit -m "chore(tailwind): enable @tailwindcss/typography plugin"
```

(The `2>/dev/null` swallows any errors about files that don't exist.)

---

## Task 3: TipTap extensions config

**Files:**
- Create: `components/admin/rich-text-editor/extensions.ts`

- [ ] **Step 1: Create `components/admin/rich-text-editor/extensions.ts`**

```typescript
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

export function buildExtensions(placeholder = "Start writing…") {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
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
    Placeholder.configure({ placeholder }),
  ];
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/rich-text-editor/extensions.ts
git commit -m "feat(admin): tiptap extension config (starter-kit + link + image + placeholder)"
```

---

## Task 4: TipTap link popover

**Files:**
- Create: `components/admin/rich-text-editor/link-popover.tsx`

- [ ] **Step 1: Create `components/admin/rich-text-editor/link-popover.tsx`**

```typescript
"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/react";

type LinkPopoverProps = {
  editor: Editor;
  open: boolean;
  onClose: () => void;
};

export function LinkPopover({ editor, open, onClose }: LinkPopoverProps) {
  const existing = editor.getAttributes("link").href as string | undefined;
  const [href, setHref] = useState(existing ?? "");

  if (!open) return null;

  function apply() {
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  }

  return (
    <div className="absolute z-10 mt-1 rounded-md border border-border bg-card p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://"
          className="rounded-md bg-background border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple w-64"
          autoFocus
        />
        <button
          type="button"
          onClick={apply}
          className="rounded-full bg-accent-purple px-3 py-1 text-xs font-medium hover:opacity-90"
        >
          Apply
        </button>
        {existing && (
          <button
            type="button"
            onClick={remove}
            className="rounded-full border border-border px-3 py-1 text-xs hover:bg-card transition"
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/rich-text-editor/link-popover.tsx
git commit -m "feat(admin): tiptap link popover (insert/edit/remove)"
```

---

## Task 5: TipTap image button

**Files:**
- Create: `components/admin/rich-text-editor/image-button.tsx`

The image button uploads via the existing `signCloudinaryUpload` server action (Phase 2A) and inserts an Image node. The upload always uses folder `"blog"` for content images.

- [ ] **Step 1: Create `components/admin/rich-text-editor/image-button.tsx`**

```typescript
"use client";
import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { signCloudinaryUpload } from "@/actions/upload";

type ImageButtonProps = {
  editor: Editor;
};

export function ImageButton({ editor }: ImageButtonProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File) {
    setPending(true);
    try {
      const signed = await signCloudinaryUpload("blog");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", signed.apiKey);
      fd.append("timestamp", String(signed.timestamp));
      fd.append("signature", signed.signature);
      fd.append("folder", signed.folder);
      fd.append("eager", signed.eager);
      fd.append("eager_async", "true");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`,
        { method: "POST", body: fd },
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { secure_url: string };
      editor
        .chain()
        .focus()
        .setImage({ src: data.secure_url, alt: file.name })
        .run();
    } catch {
      // Silent fail — user sees no image inserted
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={pending}
        className="px-2 py-1 text-sm rounded hover:bg-card transition disabled:opacity-60"
        title="Insert image"
      >
        {pending ? "⏳" : "🖼"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ""; // allow re-picking same file
        }}
      />
    </>
  );
}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/rich-text-editor/image-button.tsx
git commit -m "feat(admin): tiptap image button (cloudinary upload + insert node)"
```

---

## Task 6: TipTap toolbar

**Files:**
- Create: `components/admin/rich-text-editor/toolbar.tsx`

- [ ] **Step 1: Create `components/admin/rich-text-editor/toolbar.tsx`**

```typescript
"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { LinkPopover } from "./link-popover";
import { ImageButton } from "./image-button";

type ToolbarProps = {
  editor: Editor;
};

type BtnProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
};

function Btn({ onClick, active, title, children, disabled }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        "px-2 py-1 text-sm rounded transition disabled:opacity-40 " +
        (active ? "bg-accent-purple/20 text-accent-purple" : "hover:bg-card")
      }
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-0.5 border border-border bg-background rounded-t-md px-2 py-1">
        <Btn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline code"
        >
          {"</>"}
        </Btn>

        <Sep />

        <Btn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Paragraph"
        >
          P
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive("heading", { level: 4 })}
          title="Heading 4"
        >
          H4
        </Btn>

        <Sep />

        <Btn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          •
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered list"
        >
          1.
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          “”
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          {"{}"}
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          —
        </Btn>

        <Sep />

        <Btn
          onClick={() => setLinkOpen(true)}
          active={editor.isActive("link")}
          title="Link"
        >
          🔗
        </Btn>
        <ImageButton editor={editor} />

        <Sep />

        <Btn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </Btn>
      </div>

      <LinkPopover
        editor={editor}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/rich-text-editor/toolbar.tsx
git commit -m "feat(admin): tiptap toolbar (format/blocks/insert/history buttons)"
```

---

## Task 7: TipTap editor main component

**Files:**
- Create: `components/admin/rich-text-editor/editor.tsx`

- [ ] **Step 1: Create `components/admin/rich-text-editor/editor.tsx`**

```typescript
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import { buildExtensions } from "./extensions";
import { Toolbar } from "./toolbar";

type RichTextEditorProps = {
  name: string;
  initialHtml?: string;
  placeholder?: string;
  minHeight?: number;
};

export function RichTextEditor({
  name,
  initialHtml = "",
  placeholder,
  minHeight = 240,
}: RichTextEditorProps) {
  const [html, setHtml] = useState(initialHtml);

  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content: initialHtml,
    immediatelyRender: false, // SSR-safe per TipTap docs
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-a:text-accent-purple prose-img:rounded-md prose-blockquote:border-l-accent-purple max-w-none px-4 py-3 focus:outline-none",
      },
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="rounded-md border border-border bg-background animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className="rounded-md border border-border bg-background overflow-hidden">
      <Toolbar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
```

- [ ] **Step 2: tsc + build**

```bash
npx tsc --noEmit
npm run build
```

Expected: clean. No TipTap should leak into Server Component bundles.

- [ ] **Step 3: Commit**

```bash
git add components/admin/rich-text-editor/editor.tsx
git commit -m "feat(admin): rich text editor (tiptap + toolbar + hidden input sync)"
```

---

## Task 8: Apply RichTextEditor to aboutIntroContent

**Files:**
- Modify: `app/(admin)/admin/site-settings/about/about-form.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat "app/(admin)/admin/site-settings/about/about-form.tsx"
```

Identify the `<TextAreaField name="aboutIntroContent" .../>` line and its imports.

- [ ] **Step 2: Replace TextAreaField with RichTextEditor**

In `app/(admin)/admin/site-settings/about/about-form.tsx`:

1. Replace this import line:
```typescript
import { TextAreaField } from "@/components/admin/field/text-area-field";
```
With (or add alongside if other TextAreaFields exist on this form — check first):
```typescript
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
```
(Keep `TextAreaField` import if removed entirely after the change would break unused-import lint. Verify after editing.)

2. Replace the `<TextAreaField name="aboutIntroContent" ...>` JSX with:

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

- [ ] **Step 3: Build + dev smoke test**

```bash
npm run build
```
Expected: clean.

Start `npm run dev`. Log in. Navigate `/admin/site-settings/about`. The intro field should now be a rich text editor with a toolbar. The existing seeded HTML (`<p>...</p>`) should render. Type something, save. Reload — formatting preserved.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/site-settings/about/about-form.tsx"
git commit -m "feat(admin): replace aboutIntroContent textarea with rich text editor"
```

---

## Task 9: Drag handle component

**Files:**
- Create: `components/admin/drag-handle.tsx`

- [ ] **Step 1: Create `components/admin/drag-handle.tsx`**

```typescript
"use client";
import type { HTMLAttributes } from "react";

type DragHandleProps = HTMLAttributes<HTMLButtonElement> & {
  listeners?: Record<string, (e: unknown) => void>;
};

export function DragHandle({ listeners, ...rest }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="touch-none cursor-grab active:cursor-grabbing select-none px-1.5 py-1 text-muted-foreground hover:text-foreground rounded transition"
      {...listeners}
      {...rest}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="4" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" />
        <circle cx="10" cy="3" r="1.2" />
        <circle cx="10" cy="7" r="1.2" />
        <circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add components/admin/drag-handle.tsx
git commit -m "feat(admin): drag-handle grip icon"
```

---

## Task 10: SortableList primitive

**Files:**
- Create: `components/admin/sortable-list.tsx`

- [ ] **Step 1: Create `components/admin/sortable-list.tsx`**

```typescript
"use client";
import { useState, useTransition, useEffect } from "react";
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
import { toast } from "sonner";

type SortableListProps = {
  ids: string[];
  reorderAction: (ids: string[]) => Promise<unknown>;
  /** Each child must be a SortableRow keyed by id, rendered in the order of `ids`. */
  children: (orderedIds: string[]) => React.ReactNode;
};

export function SortableList({ ids, reorderAction, children }: SortableListProps) {
  const [order, setOrder] = useState(ids);
  const [, startTransition] = useTransition();

  // Sync when parent ids change (e.g. after a delete or after a fresh fetch).
  useEffect(() => {
    setOrder(ids);
  }, [ids]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
        setOrder(ids); // revert
        toast.error("Reorder failed");
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {children(order)}
      </SortableContext>
    </DndContext>
  );
}

type SortableRowProps = {
  id: string;
  children: (handle: {
    listeners: Record<string, (e: unknown) => void> | undefined;
    attributes: Record<string, unknown>;
  }) => React.ReactNode;
};

export function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "shadow-lg" : ""}>
      {children({
        listeners: listeners as Record<string, (e: unknown) => void> | undefined,
        attributes: attributes as Record<string, unknown>,
      })}
    </div>
  );
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add components/admin/sortable-list.tsx
git commit -m "feat(admin): SortableList + SortableRow (dnd-kit) with optimistic reorder"
```

---

## Task 11: Reorder server actions

**Files:**
- Create: `actions/reorder.ts`

- [ ] **Step 1: Create `actions/reorder.ts`**

```typescript
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
  | "blogPost";

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
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add actions/reorder.ts
git commit -m "feat(admin): reorder server actions for all 10 sortable entities"
```

---

## Task 12: Apply SortableList to all 9 existing entity list pages + hide order in forms

This task is mechanical but touches 18 files (9 list pages + 9 form components). Each list page swaps `<DataTable>` for a SortableList+SortableRow render; each form swaps the `<NumberField name="order">` for a hidden input.

**Canonical example: Tools.** The other 8 entities follow the identical pattern with different imports + columns.

- [ ] **Step 1: Rewrite `app/(admin)/admin/tools/page.tsx`**

```typescript
import Link from "next/link";
import { listTools } from "@/lib/db/tools";
import { deleteTool, toggleVisibleTool } from "@/actions/tools";
import { reorderTools } from "@/actions/reorder";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Tools — admin" };

export default async function ToolsListPage() {
  const tools = await listTools();
  const ids = tools.map((t) => t.id);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tools ({tools.length})</h1>
        <Link
          href="/admin/tools/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New tool
        </Link>
      </header>

      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tools yet.</p>
      ) : (
        <SortableList ids={ids} reorderAction={reorderTools}>
          {(orderedIds) =>
            orderedIds.map((id) => {
              const tool = tools.find((t) => t.id === id);
              if (!tool) return null;
              return (
                <SortableRow key={id} id={id}>
                  {({ listeners, attributes }) => (
                    <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                      <DragHandle listeners={listeners} {...attributes} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{tool.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {tool.category ?? "—"}
                        </div>
                      </div>
                      <VisibleToggle
                        id={tool.id}
                        visible={tool.visible}
                        action={toggleVisibleTool}
                      />
                      <Link
                        href={`/admin/tools/${tool.id}`}
                        className="text-accent-purple hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={tool.id} action={deleteTool} />
                    </div>
                  )}
                </SortableRow>
              );
            })
          }
        </SortableList>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify `app/(admin)/admin/tools/tool-form.tsx` — hide order field**

Find the line:
```tsx
<NumberField
  name="order"
  label="Order"
  defaultValue={initial?.order ?? 0}
  min={0}
  error={err("order")}
/>
```
Replace with:
```tsx
<input type="hidden" name="order" value={initial?.order ?? 0} />
```

Remove the `NumberField` import if it's no longer used in the file (check other usages first — Tools form also has `proficiency` as NumberField, so import stays).

- [ ] **Step 3: Repeat for the other 8 entities**

Apply the SAME pattern to:
- `testimonials` (columns: name, role, rating, order) — list shows name + role
- `faqs` (columns: question truncated to 60 chars, category, order) — list shows question + category
- `client-logos` (columns: name, order) — list shows name; also show logo thumbnail
- `nav-items` (columns: label, href, order) — list shows label + href
- `social-links` (columns: platform, label, url, order) — list shows label + url
- `experience` (columns: company, role, dates, order) — list shows company + role + dates (with `r.current ? "Present" : (r.endDate ?? "—")`)
- `education` (columns: institution, degree, dates) — list shows institution + degree
- `certifications` (columns: institution, title, dates) — list shows institution + title

For each:
- Rewrite `app/(admin)/admin/<entity>/page.tsx` using the Tools template above, swapping the entity name, listFn, actions, render content per the columns listed.
- Modify the form to swap `<NumberField name="order">` for `<input type="hidden" name="order" value={initial?.order ?? 0} />`.

For each entity, the list-row JSX is the SAME shape:

```tsx
<div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
  <DragHandle listeners={listeners} {...attributes} />
  <div className="flex-1 min-w-0">
    <div className="font-medium truncate">{/* primary text */}</div>
    <div className="text-xs text-muted-foreground truncate">{/* secondary text */}</div>
  </div>
  <VisibleToggle id={row.id} visible={row.visible} action={toggleVisible<Entity>} />
  <Link href={`/admin/<entity>/${row.id}`} className="text-accent-purple hover:underline text-sm">Edit</Link>
  <DeleteButton id={row.id} action={delete<Entity>} />
</div>
```

Per-entity primary/secondary text:

| Entity | Primary | Secondary |
|---|---|---|
| Testimonials | `r.name` | `r.role ?? "—"` |
| FAQs | `r.question.length > 60 ? r.question.slice(0, 60) + "…" : r.question` | `r.category ?? "—"` |
| ClientLogos | `r.name` | (omit secondary line) |
| NavItems | `r.label` | `r.href` |
| SocialLinks | `r.label` | `r.url` |
| Experience | `r.company` | `${r.role} · ${r.startDate} – ${r.current ? "Present" : (r.endDate ?? "—")}` |
| Education | `r.institution` | `${r.degree} · ${r.startDate} – ${r.current ? "Present" : (r.endDate ?? "—")}` |
| Certifications | `r.institution` | `${r.title} · ${r.startDate} – ${r.endDate ?? "—"}` |

ClientLogos additionally: render `<Image src={r.logoUrl} alt={r.name} width={48} height={32} className="rounded bg-card" />` BEFORE the text block to show a thumbnail. Import `Image` from `next/image`.

- [ ] **Step 4: Build + dev smoke test**

Run: `npm run build`
Expected: clean.

Start `npm run dev`. Log in. For each of `/admin/{tools, testimonials, faqs, client-logos, nav-items, social-links, experience, education, certifications}`:
- Page loads, rows rendered as cards with drag handle on the left.
- Hover a drag handle: cursor changes to grab. Click + drag a row to a new position. Release.
- Refresh page — order persists in new position.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add app/\(admin\)/admin/tools app/\(admin\)/admin/testimonials app/\(admin\)/admin/faqs app/\(admin\)/admin/client-logos app/\(admin\)/admin/nav-items app/\(admin\)/admin/social-links app/\(admin\)/admin/experience app/\(admin\)/admin/education app/\(admin\)/admin/certifications
git commit -m "feat(admin): drag-reorder on all 9 entity list pages + hide order input"
```

---

## Task 13: BlogPost schema + db helpers

**Files:**
- Create: `lib/schemas/blog-post.ts`
- Create: `lib/db/blog-posts.ts`

- [ ] **Step 1: Create `lib/schemas/blog-post.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText } from "./_helpers";

const tagsField = z
  .string()
  .transform((s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t, i, a) => a.indexOf(t) === i),
  )
  .pipe(z.array(z.string().max(50)));

export const BlogPostSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: optionalText,
  excerpt: z.string().trim().min(1, "Excerpt is required").max(500),
  content: z.string().min(1, "Content is required"),
  coverImageUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(2000),
  coverPublicId: z.string().default(""),
  category: optionalText,
  tags: tagsField,
  readTimeMinutes: intField.min(0).max(120).default(0),
  author: optionalText,
  published: checkbox.default(false),
  featured: checkbox.default(false),
  metaTitle: optionalText,
  metaDescription: optionalText,
});

export type BlogPostInput = z.infer<typeof BlogPostSchema>;
```

- [ ] **Step 2: Create `lib/db/blog-posts.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listBlogPosts = cache(() =>
  prisma.blogPost.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
);

export const getBlogPost = cache((id: string) =>
  prisma.blogPost.findUnique({ where: { id } }),
);

export const getBlogPostBySlug = cache((slug: string) =>
  prisma.blogPost.findUnique({ where: { slug } }),
);
```

Wait — the BlogPost model has no `order` column in the Phase 1 schema. Check the schema first:

```bash
grep -A 30 "model BlogPost" prisma/schema.prisma | head -35
```

The Phase 1 BlogPost model does NOT have an `order` column. To enable drag-reorder on BlogPost, we need to add it.

- [ ] **Step 3: Add `order` column to BlogPost via Prisma migration**

Edit `prisma/schema.prisma`. Find the `BlogPost` model. Add `order` between `published` and the `views` line:

```prisma
model BlogPost {
  // ... existing fields up to and including `featured`
  order Int @default(0)
  views Int @default(0)
  // ... rest
}
```

Add a new index after `@@index([published, publishedAt])`:

```prisma
@@index([order])
```

Run the migration:
```bash
npx prisma migrate dev --name add_blogpost_order
```

Expected: migration applied, `order` column added.

- [ ] **Step 4: Update `listBlogPosts` ordering**

Now `lib/db/blog-posts.ts` orders by `[order asc, createdAt desc]` as written in Step 2. Confirm.

- [ ] **Step 5: tsc + commit**

```bash
npx tsc --noEmit
git add lib/schemas/blog-post.ts lib/db/blog-posts.ts prisma/schema.prisma prisma/migrations/
git commit -m "feat(blog): zod schema + read helpers + add order column to BlogPost"
```

---

## Task 14: BlogPost server actions

**Files:**
- Create: `actions/blog-posts.ts`

- [ ] **Step 1: Create `actions/blog-posts.ts`**

```typescript
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

export async function toggleVisibleBlogPost(formData: FormData) {
  // BlogPost has no `visible` column — alias to `published` for SortableList compatibility.
  // SortableList rows don't need visible toggle; this is just a placeholder if VisibleToggle is reused.
  await togglePublishedBlogPost(formData);
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add actions/blog-posts.ts
git commit -m "feat(blog): server actions (create/update/delete/toggle with publishedAt logic + auto-readtime)"
```

---

## Task 15: BlogPost form component

**Files:**
- Create: `app/(admin)/admin/blog-posts/blog-post-form.tsx`

- [ ] **Step 1: Create `app/(admin)/admin/blog-posts/blog-post-form.tsx`**

```typescript
"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { FormSection } from "@/components/admin/form-section";
import type { BlogPostFormState } from "@/actions/blog-posts";

type BlogPostFormProps = {
  initial?: {
    id?: string;
    slug?: string;
    title?: string;
    subtitle?: string | null;
    excerpt?: string;
    content?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
    category?: string | null;
    tags?: string[];
    readTimeMinutes?: number;
    author?: string | null;
    published?: boolean;
    featured?: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
    order?: number;
  };
  action: (prev: BlogPostFormState, fd: FormData) => Promise<BlogPostFormState>;
  submitLabel: string;
};

export function BlogPostForm({ initial, action, submitLabel }: BlogPostFormProps) {
  const [state, formAction] = useActionState<BlogPostFormState, FormData>(action, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit blog post" : "New blog post"}
        backHref="/admin/blog-posts"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField
          name="title"
          label="Title"
          required
          defaultValue={initial?.title}
          error={err("title")}
        />
        <TextField
          name="slug"
          label="Slug"
          required
          defaultValue={initial?.slug}
          placeholder="typography-soul-of-brand"
          error={err("slug")}
        />
        <TextField
          name="subtitle"
          label="Subtitle"
          defaultValue={initial?.subtitle}
          error={err("subtitle")}
        />
        <TextAreaField
          name="excerpt"
          label="Excerpt"
          required
          rows={3}
          defaultValue={initial?.excerpt}
          help="1–2 sentence summary shown in lists."
          error={err("excerpt")}
        />
        <ImageUploader
          folder="blog"
          name="coverImageUrl"
          publicIdName="coverPublicId"
          initialUrl={initial?.coverImageUrl}
          initialPublicId={initial?.coverPublicId}
          label="Cover image"
          help="Recommended: 1200×630px (Open Graph standard)"
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Content
            <span className="text-red-400 ml-1">*</span>
          </label>
          <RichTextEditor
            name="content"
            initialHtml={initial?.content ?? ""}
            placeholder="Start writing your post…"
          />
          {err("content") && (
            <p role="alert" className="text-sm text-red-400 mt-1">
              {err("content")}
            </p>
          )}
        </div>

        <TextField
          name="category"
          label="Category"
          defaultValue={initial?.category}
          error={err("category")}
        />
        <TextField
          name="tags"
          label="Tags"
          defaultValue={initial?.tags?.join(", ")}
          placeholder="typography, branding, south-asia"
          error={err("tags")}
        />
        <NumberField
          name="readTimeMinutes"
          label="Read time (minutes)"
          min={0}
          max={120}
          defaultValue={initial?.readTimeMinutes ?? 0}
          error={err("readTimeMinutes")}
        />
        <TextField
          name="author"
          label="Author"
          defaultValue={initial?.author}
          placeholder="Leave blank to default to site owner"
          error={err("author")}
        />
        <BooleanField
          name="published"
          label="Published"
          defaultValue={initial?.published ?? false}
        />
        <BooleanField
          name="featured"
          label="Featured"
          defaultValue={initial?.featured ?? false}
        />
        <TextField
          name="metaTitle"
          label="SEO meta title (override)"
          defaultValue={initial?.metaTitle}
          error={err("metaTitle")}
        />
        <TextAreaField
          name="metaDescription"
          label="SEO meta description (override)"
          rows={2}
          defaultValue={initial?.metaDescription}
          error={err("metaDescription")}
        />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
      </FormSection>
    </form>
  );
}
```

- [ ] **Step 2: tsc + commit**

```bash
npx tsc --noEmit
git add "app/(admin)/admin/blog-posts/blog-post-form.tsx"
git commit -m "feat(blog): client form (rich-text + image-uploader + tags + readtime)"
```

---

## Task 16: BlogPost pages (list + new + edit)

**Files:**
- Create: `app/(admin)/admin/blog-posts/page.tsx`
- Create: `app/(admin)/admin/blog-posts/new/page.tsx`
- Create: `app/(admin)/admin/blog-posts/[id]/page.tsx`

- [ ] **Step 1: `new/page.tsx`**

```typescript
import { createBlogPost } from "@/actions/blog-posts";
import { BlogPostForm } from "../blog-post-form";

export const metadata = { title: "New blog post" };

export default function NewBlogPostPage() {
  return <BlogPostForm action={createBlogPost} submitLabel="Create blog post" />;
}
```

- [ ] **Step 2: `[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/db/blog-posts";
import { updateBlogPost } from "@/actions/blog-posts";
import { BlogPostForm } from "../blog-post-form";

export const metadata = { title: "Edit blog post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();

  const boundAction = updateBlogPost.bind(null, post.id);
  return (
    <BlogPostForm
      initial={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        subtitle: post.subtitle,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        coverPublicId: post.coverPublicId,
        category: post.category,
        tags: post.tags,
        readTimeMinutes: post.readTimeMinutes,
        author: post.author,
        published: post.published,
        featured: post.featured,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        order: post.order,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
```

- [ ] **Step 3: `page.tsx` (list with SortableList)**

```typescript
import Link from "next/link";
import Image from "next/image";
import { listBlogPosts } from "@/lib/db/blog-posts";
import { deleteBlogPost } from "@/actions/blog-posts";
import { reorderBlogPosts } from "@/actions/reorder";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Blog posts — admin" };

export default async function BlogPostsListPage() {
  const posts = await listBlogPosts();
  const ids = posts.map((p) => p.id);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Blog posts ({posts.length})</h1>
        <Link
          href="/admin/blog-posts/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New blog post
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blog posts yet.</p>
      ) : (
        <SortableList ids={ids} reorderAction={reorderBlogPosts}>
          {(orderedIds) =>
            orderedIds.map((id) => {
              const post = posts.find((p) => p.id === id);
              if (!post) return null;
              return (
                <SortableRow key={id} id={id}>
                  {({ listeners, attributes }) => (
                    <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                      <DragHandle listeners={listeners} {...attributes} />
                      <div className="relative h-12 w-20 flex-shrink-0 rounded overflow-hidden bg-background">
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {post.published ? "Published" : "Draft"}
                          {post.featured && " · Featured"}
                          {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
                        </div>
                      </div>
                      <Link
                        href={`/admin/blog-posts/${post.id}`}
                        className="text-accent-purple hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={post.id} action={deleteBlogPost} />
                    </div>
                  )}
                </SortableRow>
              );
            })
          }
        </SortableList>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build + tsc**

```bash
npx tsc --noEmit
npm run build
```
Expected: clean. Routes `/admin/blog-posts`, `/admin/blog-posts/new`, `/admin/blog-posts/[id]` listed in build output.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/blog-posts"
git commit -m "feat(blog): list + new + edit pages (sortable + rich text + image cover)"
```

---

## Task 17: Sidebar + dashboard updates

**Files:**
- Modify: `components/admin/sidebar.tsx`
- Modify: `app/(admin)/admin/page.tsx`

- [ ] **Step 1: Add "Blog posts" to sidebar**

In `components/admin/sidebar.tsx`, find the `CONTENT` const:

```typescript
const CONTENT: NavLink[] = [
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
];
```

Add `{ href: "/admin/blog-posts", label: "Blog posts" }` as the last entry:

```typescript
const CONTENT: NavLink[] = [
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
  { href: "/admin/blog-posts", label: "Blog posts" },
];
```

- [ ] **Step 2: Move Blog post count card on dashboard**

In `app/(admin)/admin/page.tsx`:

1. The `Content` section currently has cards for Tools, Testimonials, FAQs, ClientLogos. Add a fifth card:

```tsx
<Card label="Blog posts" count={blogPosts} href="/admin/blog-posts" />
```

The `blogPosts` count is already in the `Promise.all` destructuring (from Phase 2A).

2. Remove the Blog posts entry from the "Deferred (Phase 2B)" section. The grayed-out box for blog posts at the bottom should now ONLY have Projects.

Find:
```tsx
<div className="rounded-md border border-border bg-card p-4">
  <div className="text-xs uppercase tracking-wider text-muted-foreground">
    Blog posts
  </div>
  <div className="text-2xl font-semibold mt-1">{blogPosts}</div>
</div>
```

Delete this block from the "Deferred (Phase 2B)" section. Only the Projects placeholder remains there.

3. Rename the deferred section heading:
```tsx
<h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
  Deferred (Phase 2B)
</h2>
```
Change to:
```tsx
<h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
  Deferred (Phase 2C)
</h2>
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add components/admin/sidebar.tsx "app/(admin)/admin/page.tsx"
git commit -m "feat(admin): wire blog posts into sidebar + dashboard content section"
```

---

## Task 18: Final acceptance verification

**Files:** none modified. This is a verification pass.

- [ ] **Step 1: Static checks**

```bash
npm run build
npm run lint
npx tsc --noEmit
```
All three must exit 0.

- [ ] **Step 2: Dep diff vs main**

```bash
BASE=$(git merge-base HEAD main)
git diff "$BASE" HEAD -- package.json | grep -E '^\+ +"' | grep -v scripts
```
Expected: lines for `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tailwindcss/typography`. Nothing else.

- [ ] **Step 3: No public-site changes**

```bash
BASE=$(git merge-base HEAD main)
git diff --name-only "$BASE" HEAD -- 'app/(site)/' 'components/sections/' lib/data.ts
```
Expected: empty.

- [ ] **Step 4: Runtime — admin gate intact**

```bash
npm run dev  # in another shell
curl -sI http://localhost:3000/admin/blog-posts | head -3
```
Expected: HTTP 307 redirect to `/admin/login`.

- [ ] **Step 5: Runtime — full Blog flow**

In a browser:
1. Log in.
2. Sidebar shows "Blog posts" under CONTENT. Click it.
3. List shows 5 seeded posts as draggable cards. Each shows cover thumbnail, title, status (Draft/Published), tags.
4. Drag a card to a new position. Reload. Position persists (new `order` value in DB).
5. Click `+ New blog post`. Fill: title "Acceptance Test", slug "acceptance-test", excerpt "Test post", upload a cover image, write a paragraph + an H2 + bullet list in the editor, add `tags: foo, bar`, `readTimeMinutes: 0` (auto), publish=true. Save.
6. List now shows 6 rows. The new post has "Published" status. In Prisma Studio, verify `publishedAt` is set, `readTimeMinutes` is computed (>0), `tags` is `["foo", "bar"]`.
7. Edit the post. Toggle `published` off, save. Reload — status shows "Draft", `publishedAt` in DB still set (preserved).
8. Toggle `published` back on, save. `publishedAt` unchanged from step 6 (preserved across cycle).
9. Edit the post. Insert an image inside the content via the editor's image button. Save. Reload — image renders inline in editor on edit.
10. Delete the test post. Confirm. List back to 5 rows. Both cover image AND any inline content images are deletable manually via Cloudinary (orphan cleanup is out of scope).

- [ ] **Step 6: Runtime — drag-reorder on each of the 9 retroactive entities**

For each of `/admin/{tools, testimonials, faqs, client-logos, nav-items, social-links, experience, education, certifications}`:
- Drag a row. Reload. New order persists.

- [ ] **Step 7: Runtime — aboutIntroContent rich editing**

Visit `/admin/site-settings/about`. The intro field is a RichTextEditor with toolbar. Existing seeded content renders. Make a formatting change (e.g. add an H2). Save. Toast appears. Reload — formatting persists.

- [ ] **Step 8: Stop dev server**

- [ ] **Step 9: Mark spec as Implemented**

Edit `docs/superpowers/specs/2026-05-22-portfolio-admin-ui-2b-design.md` header:
- Change `Status: Draft — awaiting user review` to `Status: Implemented (YYYY-MM-DD)` with today's date.

```bash
git add docs/superpowers/specs/2026-05-22-portfolio-admin-ui-2b-design.md
git commit -m "docs(spec): mark phase 2B admin UI as implemented"
```

---

## What's NOT in this plan (defer to Phase 2C / 3 / 4)

- **Phase 2C:** Project CRUD with nested ProjectSection editing (multiple RichTextEditors per page), ProjectImage gallery upload + reorder, RelatedProject multi-select.
- **Phase 3:** Public site `app/(site)/**` rewire to read entities from DB. HTML sanitization via DOMPurify (or equivalent) before injecting TipTap-produced content.
- **Phase 4:** Contact form submission, Resend email, sitemap, robots.txt.

---

## Risks captured during planning

1. **TipTap v2 + React 19 SSR.** Use `immediatelyRender: false` in `useEditor()` config (Task 7). If hydration errors appear, the editor mounts client-only.
2. **`prisma.fAQ` casing in reorder action.** Use exact string `"fAQ"` as the table key in `applyReorder`. Verified by Task 11 code.
3. **Tailwind v4 plugin syntax.** Task 2 detects setup before editing. If `tailwind.config.ts` doesn't exist (v4 CSS-config setup), the `@plugin` directive is added to `globals.css`.
4. **HTML XSS in TipTap content.** Phase 2B stores raw HTML. The editor round-trips it safely. Phase 3 (public rendering) MUST sanitize — that risk is noted in the design spec.
5. **Removing `order` input from forms.** Each entity form keeps a hidden `<input name="order" value={initial.order}>` so the value is preserved when other fields change. Drag-reorder is the only path that mutates `order`.
6. **BlogPost lacks `order` column in Phase 1 schema.** Task 13 Step 3 adds it via migration before any reorder logic ships.
7. **Deps install size.** TipTap + dnd-kit transitively pull ~30-50 packages. Build size impact for admin chunk only; public bundle unaffected (these are `'use client'` only).

