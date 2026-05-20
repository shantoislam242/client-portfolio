# Portfolio Backend — Design Spec

> **⚠️ SUPERSEDED on 2026-05-20** by [2026-05-20-portfolio-backend-foundation-design.md](2026-05-20-portfolio-backend-foundation-design.md).
> The newer spec (and the phase plan it leads to) replaces this one. Key differences: normalized schema (no JSON columns), separate `ProjectSection`/`ProjectImage`/`RelatedProject` tables, TipTap rich-text instead of `ContentBlock[]`, full admin UI scope, Resend email. Auth approach (jose + env credential) and hidden-admin policy are unchanged.
> This document is kept for historical reference. Do not implement from it.

---

**Date:** 2026-05-11
**Status:** Superseded
**Goal:** Make the existing static portfolio fully dynamic with a hidden admin panel, without changing a single pixel of the frontend.

---

## Constraints

- **Frontend layout, animations, and visual design must remain unchanged.** No restyling, no component re-architecture beyond swapping data sources.
- **Cost: $0/month.** Every chosen service must fit comfortably inside its free tier.
- **No "Login" link anywhere on the public site.** The admin route exists at `/admin` but is unadvertised.
- **Production-ready, scalable, clean code.** Reusable architecture, strict separation of read/write layers.

---

## Stack

| Concern | Choice | Free-tier ceiling | Notes |
|---|---|---|---|
| Hosting | Vercel Hobby | 100 GB bandwidth/mo | Native Next.js platform |
| Database | Neon Postgres | 0.5 GB storage | Serverless, branchable |
| ORM | Prisma | open source | Type-safe, migrations |
| Auth | Env-based credential + JWT cookie | — | Single admin, no users table |
| Image storage | Cloudinary | 25 GB storage + 25 GB bandwidth/mo | Built-in optimization & CDN |
| Email | (none) | — | Out of scope per requirements |
| Mutations | Server Actions | — | No separate REST surface to secure |
| Reads | Server Components + `unstable_cache` (tag-based) | — | ISR + on-demand revalidation |

---

## Architecture Overview

```
Visitor → Server Component → lib/db/* (cached) → Neon Postgres   (CDN-fast, ISR)
Admin   → /admin form     → actions/* → Prisma → revalidateTag()
Upload  → Browser → Cloudinary direct (server-signed) → URL → DB
Contact → Public form → actions/contact → Prisma (rate-limited by IP)
```

**Why this shape:**
- Server Actions mean no separate API surface to secure — auth is enforced at the action boundary.
- `revalidateTag('projects')` after an admin update instantly invalidates every cached page that depends on projects.
- Cloudinary direct upload keeps Vercel function payloads small (no 4.5 MB body limit issue) and never sends the API secret to the browser.
- Single admin via env vars = zero user-management surface area.

---

## Database Schema

The shape of the existing `lib/data.ts` exports is preserved 1:1 so frontend components do not need any prop/type changes. Singleton-type content (hero, profile, footer, etc.) lives in one `SiteSettings` row with JSON columns — no migration needed for content tweaks.

```prisma
// CRUD entities (list-style)

model Project {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  subtitle  String
  image     String           // Cloudinary URL
  excerpt   String
  year      String
  client    String
  services  String[]
  content   Json             // ContentBlock[] — { kind: "p"|"h2", text }
  gallery   String[]         // Cloudinary URLs
  order     Int      @default(0)   // admin-controlled display order
  published Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BlogPost {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  date      String           // display string, e.g. "Apr 8, 2024"
  image     String
  excerpt   String
  content   Json             // ContentBlock[]
  order     Int      @default(0)
  published Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Testimonial {
  id        String   @id @default(cuid())
  name      String
  role      String
  avatar    String
  quote     String
  order     Int      @default(0)
  createdAt DateTime @default(now())
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String
  read      Boolean  @default(false)
  ip        String?          // for spam pattern detection only
  createdAt DateTime @default(now())
  @@index([createdAt])
}

// Singleton — exactly one row, JSON columns

model SiteSettings {
  id             Int      @id @default(1)         // always 1
  profile        Json   // { name, role, location, portrait, socials[] }
  hero           Json   // { headingPrefix, headingAccent, description, primaryCta, secondaryCta }
  stats          Json   // [{ value, prefix, label }, ...]
  companies      Json   // { caption, logos[] }
  aboutIntro     Json
  experience     Json   // ExperienceEntry[]
  education      Json   // EducationEntry[]
  tools          Json   // Tool[]
  faqs           Json   // FAQ[]
  collaborateCta Json
  contactPage    Json
  footer         Json
  updatedAt      DateTime @updatedAt
}
```

**Key decisions:**
- **Icons in socials are not stored as components.** The DB stores an `iconKey` string (`"behance"`, `"linkedin"`, …). A small `lib/icons/registry.ts` map resolves the key → component at render time. Admin sees a dropdown of available keys.
- **`order` on every list-type entity** so admin can drag-reorder.
- **`published` flag on Project & BlogPost** so admin can draft/unpublish.
- **`ContentBlock` shape unchanged** (`{ kind: "p" | "h2", text }`) — frontend `BlogDetail`/`ProjectDetail` components require no changes.
- **`SiteSettings` JSON columns** — flexible content tweaks without schema migrations; structure validated at the Zod layer.

---

## Folder Structure

```
portfolio/
├── app/
│   ├── (site)/                    # public routes (route group, no URL impact)
│   │   ├── page.tsx               # existing — unchanged JSX, async data
│   │   ├── about/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/[slug]/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   ├── tools/page.tsx
│   │   └── contact/page.tsx
│   │
│   ├── admin/                     # hidden — no public link to it
│   │   ├── login/page.tsx         # only public admin surface
│   │   ├── layout.tsx             # protected shell + sidebar
│   │   ├── page.tsx               # dashboard
│   │   ├── projects/page.tsx
│   │   ├── projects/new/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── blog/...
│   │   ├── testimonials/...
│   │   ├── messages/page.tsx      # contact inbox
│   │   └── settings/
│   │       ├── page.tsx           # profile/hero/about
│   │       ├── experience/page.tsx
│   │       ├── education/page.tsx
│   │       ├── tools/page.tsx
│   │       ├── faqs/page.tsx
│   │       └── meta/page.tsx      # footer/CTA/contact-page
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── lib/
│   ├── db/
│   │   ├── client.ts              # Prisma singleton
│   │   ├── projects.ts            # cached read functions
│   │   ├── blog.ts
│   │   ├── testimonials.ts
│   │   ├── settings.ts
│   │   └── messages.ts
│   ├── auth/
│   │   ├── session.ts             # JWT sign/verify, cookie helpers
│   │   ├── password.ts            # bcrypt compare
│   │   └── guard.ts               # requireAdmin()
│   ├── cloudinary/
│   │   ├── client.ts              # signed-upload signature
│   │   └── upload.ts              # browser-side upload helper
│   ├── validation/
│   │   ├── project.ts             # zod schemas
│   │   ├── blog.ts
│   │   ├── testimonial.ts
│   │   ├── settings.ts
│   │   └── contact.ts
│   ├── icons/
│   │   └── registry.ts            # iconKey → component map
│   ├── revalidate.ts              # tag constants + helpers
│   ├── rate-limit.ts              # in-memory limiter
│   ├── data.ts                    # KEEP — re-exports types only
│   ├── motion.ts                  # unchanged
│   └── utils.ts                   # unchanged
│
├── actions/                       # Server Actions (mutations only)
│   ├── auth.ts                    # login, logout
│   ├── projects.ts
│   ├── blog.ts
│   ├── testimonials.ts
│   ├── settings.ts
│   ├── messages.ts                # markRead, delete
│   └── contact.ts                 # public form submit
│
├── components/
│   ├── sections/                  # EXISTING — unchanged JSX
│   ├── layout/                    # unchanged
│   ├── motion/                    # unchanged
│   ├── ui/                        # unchanged (extend with form bits)
│   ├── icons/                     # unchanged
│   └── admin/                     # NEW — admin-only UI
│       ├── shell.tsx
│       ├── data-table.tsx
│       ├── content-blocks-editor.tsx
│       ├── image-upload.tsx
│       ├── gallery-upload.tsx
│       └── icon-picker.tsx
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                    # ports lib/data.ts → DB on first run
│   └── migrations/
│
├── scripts/
│   └── hash-password.mjs          # generates ADMIN_PASSWORD_HASH
│
├── middleware.ts                  # /admin/* gate
└── .env.local                     # see Env Vars below
```

**Boundaries (strict):**
- `lib/db/*` = read layer. Server Components only call this.
- `actions/*` = write layer. Forms only call this.
- Auth check lives in `actions/*` (and middleware) — never in `lib/db/*`.
- `components/admin/*` is never imported from `(site)` routes.

**`lib/data.ts` stays as a type-only shim** so existing imports like `import type { Project } from '@/lib/data'` keep working without touching every section file.

---

## Auth & Admin Protection

### Login flow

1. Visitor goes to `/admin/anything` → middleware detects no valid JWT cookie → 307 redirect to `/admin/login`.
2. `/admin/login` renders the email + password form (the only public admin surface).
3. Form posts to `loginAction` (Server Action):
   - reads `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` from env
   - `bcrypt.compare(input, hash)` (via `bcryptjs` — pure-JS, works on serverless)
   - if match: sign JWT `{ sub: "admin", iat }` with `JWT_SECRET` using `jose` (`SignJWT`), 7-day expiry
   - set httpOnly + Secure + SameSite=Lax cookie `admin_session`
   - redirect to `/admin`
4. `logoutAction` → `cookies().delete("admin_session")` → redirect `/admin/login`.

### Middleware (`middleware.ts`)

```ts
export const config = { matcher: ["/admin/:path*"] };
// allowlist /admin/login + static assets
// for everything else: read cookie → verify JWT → if invalid, redirect /admin/login
```

Middleware = the gate. Server Actions still re-check via `requireAdmin()` — defense in depth.

### Why env-based credential (not DB users table)

Single admin = no signup, no password reset UI, no users table. Credentials live where secrets belong (Vercel env vars). To rotate: regenerate hash, update env var, redeploy.

```bash
node scripts/hash-password.mjs "your-password"
# → outputs $2b$12$...
# paste into ADMIN_PASSWORD_HASH in Vercel env
```

### Frontend reveals nothing

- No "Login" link in nav, footer, or anywhere
- `/admin` and children are not in the sitemap
- `robots.txt` blocks `/admin`
- Floating nav data (`navItems`) does not include admin
- The route exists; it's just unadvertised. Protection is the password.

### Contact form security

Public Server Action `submitContact`:

1. **Zod validation** — name (1–100), email (format), message (1–2000)
2. **Honeypot** — hidden `<input name="website">` in the form. If filled → silently return success without writing. Bots fill every field; humans don't see it. Zero UX friction.
3. **Rate limit** — in-memory `Map<ip, { count, resetAt }>`, max 3 per IP per 10 minutes. IP from `x-forwarded-for`. (Comment: swap for Upstash Redis free tier if scaling to multi-region.)
4. **Length cap & trim** before insert.
5. Insert into `ContactMessage`.

### Cloudinary security

- Upload **signature** generated by an admin-guarded Server Action.
- Browser uses signature + timestamp to upload directly to Cloudinary.
- API secret never reaches the browser.
- Folder-prefixed uploads (`portfolio/projects/`, `portfolio/blog/`, `portfolio/avatars/`) for organization & cleanup.

---

## Data Fetching, Caching & Revalidation

### Read pattern

Each Server Component calls a cached data-layer function. JSX stays the same — only the data source changes.

```ts
// lib/db/projects.ts
import { unstable_cache } from "next/cache";
import { prisma } from "./client";
import { CACHE_TAGS } from "@/lib/revalidate";

export const getProjects = unstable_cache(
  async (limit?: number) =>
    prisma.project.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: limit,
    }),
  ["projects-list"],
  { tags: [CACHE_TAGS.projects] }
);

export const getProjectBySlug = unstable_cache(
  async (slug: string) =>
    prisma.project.findUnique({ where: { slug, published: true } }),
  ["project-by-slug"],
  { tags: [CACHE_TAGS.projects] }
);
```

Same pattern for `getBlogPosts`, `getBlogPostBySlug`, `getTestimonials`, `getSiteSettings`. `getMessages` is admin-only and uncached.

### Cache tags (single source of truth)

```ts
// lib/revalidate.ts
export const CACHE_TAGS = {
  projects:     "projects",
  blog:         "blog",
  testimonials: "testimonials",
  settings:     "settings",
} as const;

import { revalidateTag } from "next/cache";
export function revalidateProjects()     { revalidateTag(CACHE_TAGS.projects); }
export function revalidateBlog()         { revalidateTag(CACHE_TAGS.blog); }
export function revalidateTestimonials() { revalidateTag(CACHE_TAGS.testimonials); }
export function revalidateSettings()     { revalidateTag(CACHE_TAGS.settings); }
```

### Write pattern

Every mutating Server Action follows the same five steps: **guard → validate → mutate → revalidate → redirect.**

```ts
// actions/projects.ts
"use server";
import { requireAdmin } from "@/lib/auth/guard";
import { projectSchema } from "@/lib/validation/project";
import { prisma } from "@/lib/db/client";
import { revalidateProjects } from "@/lib/revalidate";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  await requireAdmin();
  const data = projectSchema.parse(Object.fromEntries(formData));
  await prisma.project.create({ data });
  revalidateProjects();
  redirect("/admin/projects");
}
// updateProject, deleteProject, reorderProjects follow the same shape.
```

### What gets revalidated when

| Admin action | Tag invalidated | Pages refreshed |
|---|---|---|
| Create/edit/delete/reorder Project | `projects` | `/`, `/projects`, `/projects/[slug]` |
| Create/edit/delete/reorder BlogPost | `blog` | `/`, `/blog`, `/blog/[slug]` |
| Create/edit/delete Testimonial | `testimonials` | `/` |
| Update SiteSettings | `settings` | every page (header/footer come from settings) |

Visitor pages serve from CDN cache → instant load. Admin clicks "Save" → that tag invalidates → next visitor request rebuilds → re-cached. Average visitor never hits the DB.

### Prisma client (cold-start safe)

```ts
// lib/db/client.ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Connection pooling (Neon)

Use Neon's **pooled connection string** (`DATABASE_URL` ending in `-pooler.neon.tech`) for runtime, the direct `DATABASE_URL_UNPOOLED` only for migrations. No extra cost on free tier.

### SEO metadata stays dynamic

Blog/project detail pages export `generateMetadata` that pulls from the same cached `getBlogPostBySlug` / `getProjectBySlug` functions. Admin updates a title → tag invalidates → next crawl gets the new `<title>` / OG tags.

---

## Migration Plan

Each phase ends with the site fully working.

### Phase 0 — Foundation (no visible change)
1. Install: `prisma`, `@prisma/client`, `bcryptjs`, `jose`, `zod`, `cloudinary` + types.
   - **`jose` (not `jsonwebtoken`)** because middleware runs on the Edge runtime, where Node-only crypto modules are unavailable. `jose` is Edge-compatible and works in both runtimes.
2. Sign up: Neon (free), Cloudinary (free) — collect connection string + API keys.
3. Add env vars (see Env Vars below).
4. Write `prisma/schema.prisma` and run `prisma migrate dev --name init`.
5. Write `prisma/seed.ts` — imports current `lib/data.ts` and inserts everything.
6. Run seed → DB mirrors current static content.

### Phase 1 — Read layer (no visible change)
7. Build `lib/db/client.ts` (Prisma singleton).
8. Build `lib/db/{projects,blog,testimonials,settings}.ts` — all `unstable_cache`-wrapped.
9. Build `lib/icons/registry.ts` mapping `"behance" → BehanceIcon`, etc.
10. Convert `lib/data.ts` → type re-exports only.
11. Switch each Server Component, one section at a time, to `await getX()`:
    - hero / companies-strip / stats → `getSiteSettings()`
    - projects-grid / project-detail → `getProjects()` / `getProjectBySlug()`
    - blog-grid / blog-detail → `getBlogPosts()` / `getBlogPostBySlug()`
    - testimonials → `getTestimonials()`
    - tools-grid / about-intro / experience-list / education-list / faq / collaborate-cta / footer → `getSiteSettings()`
    - For socials: data layer returns `iconKey`, component uses registry to render.
12. **Visual diff check:** site looks pixel-identical to before.

### Phase 2 — Admin shell + auth
13. `middleware.ts` — `/admin/*` gate.
14. `lib/auth/{session,password,guard}.ts`.
15. `app/admin/login/page.tsx` + `actions/auth.ts`.
16. `app/admin/layout.tsx` — sidebar shell.
17. `app/admin/page.tsx` — dashboard placeholder.
18. `scripts/hash-password.mjs`.

### Phase 3 — Cloudinary upload pipeline
19. `lib/cloudinary/client.ts` — server-side signature generator.
20. `components/admin/image-upload.tsx` — single image, signed direct upload.
21. `components/admin/gallery-upload.tsx` — multi-image with reorder/remove.

### Phase 4 — Admin CRUD: Projects (template)
22. List page (`/admin/projects`) — table, search, drag-reorder, edit/delete.
23. New/edit page — form using `image-upload`, `gallery-upload`, `content-blocks-editor`.
24. `actions/projects.ts` — create/update/delete/reorder with `requireAdmin` + `revalidateProjects`.
25. `lib/validation/project.ts` — zod schema.

### Phase 5 — Apply the template to Blog and Testimonials
26. Blog admin (mirrors Project structure).
27. Testimonials admin (simpler — no content blocks, no gallery).

### Phase 6 — Settings (singletons)
28. `/admin/settings` tabbed UI — one tab per logical group.
29. Each tab: form → `updateSettings(section, data)` action → `revalidateSettings()`.
30. **Icon picker** for socials: dropdown of registered keys, no free-text icon input.

### Phase 7 — Contact form (public) + inbox (admin)
31. Replace fake `setTimeout` in `components/sections/contact-form.tsx` with Server Action call to `submitContact`.
32. Add hidden honeypot field (no UI change).
33. `actions/contact.ts` — zod + honeypot + rate-limit + DB insert.
34. `/admin/messages` — list, mark-read, delete.

### Phase 8 — Deploy & verify
35. Push to GitHub → Vercel auto-deploys.
36. Add all env vars in Vercel dashboard.
37. Run `prisma migrate deploy` on build.
38. Run seed once via Vercel CLI (or one-time admin button).
39. Visit production site — pixel-identical to today.
40. Login at `/admin/login`, edit something, confirm revalidation.
41. Add `Disallow: /admin` to `robots.txt`.

### Rollback safety
- Phase 1 is per-section — if one component breaks, revert that single import to the static value (data.ts is type-only after phase 1, so revert means re-inlining the literal).
- Phase 2+ is purely additive — anything broken can be removed without touching the public site.

---

## Env Vars

```
# Database
DATABASE_URL=postgresql://...-pooler.neon.tech/...?sslmode=require   # pooled, runtime
DATABASE_URL_UNPOOLED=postgresql://...neon.tech/...?sslmode=require  # direct, migrations

# Auth
JWT_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=$2b$12$...   # from scripts/hash-password.mjs

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...   # for browser upload widget
```

---

## Out of Scope (YAGNI)

- ❌ Email notifications (per requirements)
- ❌ reCAPTCHA / interactive CAPTCHA — honeypot + rate-limit are sufficient
- ❌ Multi-user, role system, signup, password reset
- ❌ Comments, like buttons, view counters
- ❌ Drafts/scheduling beyond `published` flag
- ❌ Audit log, edit history
- ❌ i18n / translations
- ❌ Markdown/WYSIWYG editor — content blocks editor handles `kind: "p" | "h2"` exactly as current schema. Future-proof to extend.

---

## Success Criteria

1. Public site, before and after, is **visually indistinguishable** at every breakpoint.
2. All previously static content is now editable from `/admin` and changes appear within seconds (next request after revalidation).
3. Contact form writes to DB, visible in admin inbox.
4. Image uploads work end-to-end (admin upload → Cloudinary → DB → public render).
5. Cost: $0/month at portfolio traffic levels.
6. Lighthouse Performance score on `/` does not regress vs. the static baseline.
