# Portfolio Public Site Rewire — Phase 3 Design Spec

**Date:** 2026-05-23
**Status:** Draft — awaiting user review
**Scope:** Phase 3 of the 4-phase backend buildout. Rewires every public-site page and section component to read from the database instead of `lib/data.ts`. After this phase, admin edits land on the public site.
**Predecessor:** Phase 2C (Project admin)
**Successor:** Phase 4 (contact form submission + Resend + sitemap + robots)

---

## Goal

Replace every `import { ... } from "@/lib/data"` in public-site Server Components with `await get...()` from `lib/db/*`. Delete `lib/data.ts` entirely when done. Public site visuals stay identical; only the data source moves from hardcoded module exports to DB queries cached via React's `cache()` helper. After Phase 3, every field editable in `/admin/*` shows up on the corresponding public page within one revalidation cycle.

## Non-goals

- **Visual design changes.** Layouts, animations, typography, spacing — all preserved exactly. Only data sources change.
- **Contact form submission, email sending, sitemap, robots.txt.** All Phase 4.
- **Admin-side changes.** No file under `app/(admin)/`, `app/(admin-public)/`, `actions/`, `components/admin/`, `lib/schemas/` modified.
- **Schema changes.** No migration. Phase 1's schema covers everything.
- **TipTap rich-text feature additions** — Phase 2B's editor is the spec for stored HTML; this phase only consumes it.

---

## Constraints

- **Next.js 16.2.6 + React 19.** Section components become `async function`. Pages already are.
- **`cache()` per-request dedup.** All `lib/db/*` helpers already use `cache()` (Phases 2A/2B/2C). Multiple sections reading the same `SiteSettings` singleton trigger one query.
- **No new admin features.** This is a pure refactor + sanitization + URL transform layer.
- **Cost: $0/month.** No new paid services. `isomorphic-dompurify` is a tiny dep (~50kb gzipped); no runtime fees.
- **No regression on existing public visuals.** Each section verified against pre-Phase-3 localhost render before merging.

---

## Tech stack additions (Phase 3 only)

| Package | Purpose | Notes |
|---|---|---|
| `isomorphic-dompurify` | HTML sanitization on server + client | Standard XSS defense for TipTap-produced HTML; ~50kb gzipped |

No other deps added. All other primitives reuse existing Phases 1/2A/2B/2C work.

---

## Architecture

### Three new helpers

| Path | Purpose |
|---|---|
| `lib/icons/registry.tsx` | `iconForKey(key: string): React.ReactNode` — maps DB-stored icon keys to component renders. Used by Sidebar (nav icons), social links, Tool entries. Unknown keys fall back to a generic link icon. |
| `lib/cloudinary/delivery.ts` | `cldUrl(url: string \| null, opts?: { width?: number }): string` — for Cloudinary URLs (`res.cloudinary.com/.../upload/...`), inserts `f_auto,q_auto` (plus optional `w_<n>`) after `/upload/`. Idempotent — skips injection if transformations already present. Non-Cloudinary URLs pass through. |
| `lib/sanitize.ts` | `sanitizeHtml(html: string): string` — wraps `isomorphic-dompurify` with an allowlist matching TipTap's StarterKit + Link + Image extension set. Strips `<script>`, inline event handlers, `javascript:` schemes. |

### Icon registry contents (`lib/icons/registry.tsx`)

```typescript
import {
  Home, Briefcase, Folder, Wrench, SquarePen, Mail, Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { BehanceIcon } from "@/components/icons/behance";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { FacebookIcon } from "@/components/icons/facebook";
import { YoutubeIcon } from "@/components/icons/youtube";
import type { ComponentType, SVGProps } from "react";

type IconComponent = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, IconComponent> = {
  // navItems (Lucide)
  home: Home,
  about: Briefcase,
  projects: Folder,
  tools: Wrench,
  blog: SquarePen,
  contact: Mail,

  // socialLinks (custom)
  behance: BehanceIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  email: Mail,

  // fallback
  link: LinkIcon,
};

export function iconForKey(key: string): IconComponent {
  return ICONS[key.toLowerCase()] ?? LinkIcon;
}
```

Adding new icons later is a one-line append.

### Sanitize allowlist (`lib/sanitize.ts`)

```typescript
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "code", "pre",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote", "hr",
  "a", "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "class"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Keep target on links
    ADD_ATTR: ["target"],
  });
}
```

### Cloudinary delivery (`lib/cloudinary/delivery.ts`)

```typescript
export function cldUrl(url: string | null | undefined, opts?: { width?: number }): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  // Skip if already transformed (e.g. URL already has /upload/f_auto,q_auto/...)
  if (/\/upload\/[^/]*[a-z]_[a-z0-9]+/i.test(url)) return url;
  const transform = ["f_auto", "q_auto"];
  if (opts?.width) transform.push(`w_${opts.width}`);
  return url.replace(/\/upload\//, `/upload/${transform.join(",")}/`);
}
```

Public components wrap every Cloudinary src: `<Image src={cldUrl(post.coverImageUrl)} ... />`. Idempotent for non-Cloudinary or already-transformed URLs.

---

## Wiring map (per public surface)

### `/` (home)

`app/(site)/page.tsx` becomes an async Server Component that composes the section components:

```tsx
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";  // possibly extracted from Hero
import { CompaniesStrip } from "@/components/sections/companies-strip";
import { RecentProjects } from "@/components/sections/projects-grid";  // home variant: limit + heading from settings
import { ToolsGrid } from "@/components/sections/tools-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogSection } from "@/components/sections/blog-grid";  // home variant
import { Faq } from "@/components/sections/faq";
import { CollaborateCta } from "@/components/sections/collaborate-cta";

export default async function HomePage() {
  return (
    <>
      <Hero />
      <CompaniesStrip />
      <RecentProjects mode="home" />
      <ToolsGrid mode="home" />
      <Testimonials />
      <BlogSection mode="home" />
      <Faq mode="home" />
      <CollaborateCta />
    </>
  );
}
```

Each section component awaits its own data. The exact composition matches the current home page — the order/structure is preserved verbatim.

### `/about`

Sources:
- `SiteSettings.aboutPageTitle`, `aboutIntroContent` (sanitized HTML)
- `SiteSettings.experienceHeading`, `educationHeading`, `certificationHeading`
- `Experience[]`, `Education[]`, `Certification[]` filtered visible, ordered

Each section component (`AboutIntro`, `ExperienceList`, `EducationList`, `CertificationList`) becomes async.

### `/contact`

Sources: `SiteSettings.contact*` fields. The `<ContactForm>` is a Client Component receiving labels as props; submission still no-ops (Phase 4 wires the action).

### `/blog`

Lists all `published` BlogPosts ordered by `publishedAt desc`. Each card uses `BlogCard` (rewired to accept Prisma row shape).

### `/blog/[slug]`

`getBlogPostBySlug(slug)` → if null, `notFound()`. Render:
- Title, subtitle, meta (publishedAt, readTime, author/category)
- Cover image (via `cldUrl()`)
- Body: `<div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />`

### `/projects`

Lists `published` projects ordered by `order asc`. Each card uses `ProjectCard`.

### `/projects/[slug]`

`getProjectBySlug(slug)` (already includes sections + galleryImages). Need an additional fetch for related projects with their title/slug/cover.

Render:
- Header: cover image, title, subtitle, year, client, services, role, liveUrl
- Intro: sanitized `introContent`
- Sections: for each, `<h2>{heading}</h2>` + sanitized `content`
- Gallery: heading + grid of images (with alt/caption), `cldUrl()` wrapped
- Related: heading + cards (from `RelatedProject[]` with included `related` selects)

### `/tools`

Lists all `visible` Tools ordered by `order asc`. Each entry shows icon (`iconUrl` Cloudinary or `iconExternalUrl` skillicons.dev — whichever is set) + name + description + proficiency.

### Layout components (`components/layout/*`)

- **`sidebar.tsx`** (the profile card on every page) — reads `SiteSettings` (portrait, name, role, location, ctaButtonLabel/Link) + `listSocialLinks()` (filtered visible). Each social icon resolved via `iconForKey(s.iconKey)`.
- **`floating-nav.tsx`** (nav icons) — reads `listNavItems()` filtered visible. Icons via registry.
- **`footer.tsx`** — reads `SiteSettings.footerText`, `footerShowYear`, `footerCopyright`. Renders `{text} {showYear && currentYear} {copyright}`.
- **`sticky-card.tsx`**, **`page-shell.tsx`** — unchanged unless they import from `lib/data`.

### Section components affected (12 files)

Each one becomes async and fetches its own slice. Rewriting beats adapters because:
- Most are <100 lines
- Shape mismatches are real (e.g. `BlogPost.content` was `ContentBlock[]` in data.ts but is `string` HTML in DB)
- Adapters would need maintaining alongside Prisma changes

**Note on `Hero` and stats:** The current `Hero` component likely renders both the headline and the 3 stat cards. Stats need the `+` suffix logic based on `SiteSettings.statsShowPlus`. Either keep stats inline in Hero or extract a `<Stats>` component — implementation can pick whichever matches the current file structure best.

---

## Data shape migrations

| Old (data.ts) | New (Prisma row) | Action |
|---|---|---|
| `socials[i].icon: IconComponent` | `socialLink.iconKey: string` | Resolve via `iconForKey()` |
| `navItems[i].icon: IconComponent` | `navItem.iconKey: string` | Resolve via `iconForKey()` |
| `stats[i].prefix: string` | `SiteSettings.statsShowPlus: boolean` | Render `"+"` if `statsShowPlus && value > 0` |
| `projects[i].content: ContentBlock[]` | `Project.introContent: string` + `ProjectSection[]` | Render intro as sanitized HTML; iterate sections; render each section's `content` sanitized |
| `blogPosts[i].content: ContentBlock[]` | `BlogPost.content: string` HTML | Render sanitized |
| `blogPosts[i].date: string` ("Apr 8, 2024") | `BlogPost.publishedAt: Date \| null` | Format with `Intl.DateTimeFormat` |
| `aboutIntro.paragraphs: string[]` | `SiteSettings.aboutIntroContent: string` HTML | Render sanitized |
| `companies.logos: string[]` (placeholder names) | `ClientLogo[]` rows | Iterate Cloudinary-stored logos (existing seed uses placehold.co URLs) |
| Other flat fields (titles, headings, labels) | `SiteSettings.*` columns | Direct read |

---

## Performance + caching

- React `cache()` on every `lib/db/*` helper. `getSiteSettings()` called 5+ times per page render → 1 query.
- Total DB queries per page render: ~6-8 max (home page: SiteSettings + navItems + socialLinks + tools + testimonials + faqs + blogPosts + clientLogos). All run in parallel via implicit React batching inside section components.
- Neon free tier: 50-150ms per query, total page TTFB ~500-800ms uncached.
- If perf becomes a problem post-Phase-3, add `unstable_cache` with tag invalidation tied to admin save actions. Not done in Phase 3 — premature.

---

## Sanitization invariant

Public renderer trusts NOTHING in DB-stored HTML strings. Every `dangerouslySetInnerHTML` consumer wraps in `sanitizeHtml()`:

```tsx
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
```

This is hard-coded in 4 places:
1. `<AboutIntro>` for `SiteSettings.aboutIntroContent`
2. `<ProjectDetail>` for `Project.introContent` and each `ProjectSection.content`
3. `<BlogDetail>` for `BlogPost.content`

Audit before merge: `grep -rn dangerouslySetInnerHTML app/ components/` must show every call site routes through `sanitizeHtml`.

---

## Cloudinary delivery invariant

Every `<Image>` (or `<img>`) src that could be Cloudinary wraps in `cldUrl()`. Affected:
- Project cover + card images
- ProjectImage gallery
- BlogPost cover image
- SiteSettings portrait + ogImage + faviconUrl
- ClientLogo logos
- Testimonial avatars
- Experience/Education/Certification logos
- Tool iconUrl (when not external skillicons URL)

Helper is idempotent: passing a non-Cloudinary URL (placehold.co, skillicons.dev) returns it unchanged.

---

## Phase 3 acceptance criteria

1. **Build/lint/tsc clean.** `npm run build`, `npm run lint`, `npx tsc --noEmit` all exit 0.
2. **`lib/data.ts` deleted.** `git ls-files lib/data.ts` returns empty. No file in the repo imports from `@/lib/data`.
3. **Visual parity.** Every public page renders the same visuals as before Phase 3 (verified by browsing). Layout, typography, animations preserved.
4. **Home page** loads with: hero + stats + companies strip + recent projects + tools section + testimonials + blog section + FAQ + collaborate CTA + footer — all DB-driven.
5. **About page** loads with intro (rich-text rendered), experience list, education list, certification list — all DB-driven.
6. **Blog list** shows 5 published posts with cover thumbnails (via `cldUrl()`).
7. **Blog detail** for `/blog/typography-soul-of-brand` renders the full post body. Inspect rendered HTML in DevTools: no `<script>` tags, no inline event handlers, only allowed tags.
8. **Project list** shows 6 published projects.
9. **Project detail** for `/projects/nokshi` renders intro + 3 sections + 4 gallery images + related projects section.
10. **Tools page** shows 8 tools with icons.
11. **Sidebar** (every page) shows portrait, name, role, location, sidebar CTA, social icons.
12. **Edit-publish round-trip.** Change a SiteSettings field (e.g. `footerText`) in admin → save → reload public page → footer reflects new value.
13. **Image format negotiation.** DevTools Network tab: a Cloudinary-hosted image (e.g. blog cover) is served as AVIF in Chrome (Accept: image/avif). Confirms `cldUrl()` worked.
14. **No new deps outside `isomorphic-dompurify`.** No admin file modified.

---

## Out of scope (defer to Phase 4)

- Contact form submission — Server Action that creates a `ContactSubmission` row + Resend email.
- `app/sitemap.ts` and `app/robots.ts` — dynamic sitemap from DB.
- README updates.
- 404 page polish.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Section components have subtle shape mismatches that break rendering | Each section verified visually against pre-Phase-3 localhost render. Plan includes a per-section browser check step. |
| DOMPurify SSR import failure in Next 16 | `isomorphic-dompurify` is specifically designed for this. If issues, fall back to manual server-only sanitization OR client-component the rendered region. |
| `cldUrl()` mishandles URLs with existing transformations | Regex check guards against double-injection. Test cases included in the plan: URL with `f_auto`, URL without, non-Cloudinary URL. |
| Deleting `lib/data.ts` breaks an import somewhere missed | Last task runs `grep -rn 'from "@/lib/data"'` across the repo; deletion proceeds only if zero matches. |
| Stats `+` rendering change visible | `statsShowPlus` defaults `true` in schema; current data.ts has `+` on all 3 stats → visual match preserved. |
| Icon registry missing a key referenced by DB | Fallback to `LinkIcon` ensures no crashes; admin can update `iconKey` if a mistake. |
| Slug-based `[slug]` routes break for projects/blog rows that became `published: false` after generateStaticParams baked them | `generateStaticParams` (if used) only emits published slugs. Drafts return `notFound()` from the detail page's fetch. |
| Server Action `redirect()` inside an async component (admin layout's `requireAdmin`) leaks into public routes | Admin layout is in `app/(admin)/` route group, separate from `app/(site)/`. Already isolated. |
| Public page reads explode N+1 queries | All section components run in parallel; `cache()` dedupes singletons. No N+1 risk because we don't iterate over rows that fetch more rows. |

---

## Open questions

None — all decisions captured:

- **Q1:** Scope = all-in-one (one Phase 3 plan, no 3A/3B split). Settled.
- **Q2:** Section components rewritten (no adapter shim layer). Settled.
- **Q3:** `isomorphic-dompurify` as sanitization library. Settled.
- **Q4:** `cldUrl()` helper applied wherever Cloudinary URLs render. Idempotent. Settled.
- **Q5:** Icon registry as `lib/icons/registry.tsx` with `iconForKey()`. Settled.
- **Q6:** `lib/data.ts` deleted entirely at end of Phase 3. Settled.
- **Q7:** No additional `unstable_cache` layer in Phase 3. Settled.
- **Q8:** Contact form, sitemap, robots all deferred to Phase 4. Settled.
