# Portfolio Public Site Rewire — Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 3 from the [2026-05-23 spec](../specs/2026-05-23-portfolio-public-rewire-design.md): swap every public-site Server Component to read from `lib/db/*` instead of `lib/data.ts`, then delete `lib/data.ts`. After this phase, admin edits show on the public site within one revalidation cycle.

**Architecture:** Three new helpers (`lib/sanitize.ts`, `lib/cloudinary/delivery.ts`, `lib/icons/registry.tsx`) plus rewiring 20 existing files (3 layout + 12 sections + 5 pages). Section components become `async` and fetch their own data; React `cache()` dedupes `getSiteSettings()` and other shared reads per request. Sanitization wraps every `dangerouslySetInnerHTML`; `cldUrl()` wraps every Cloudinary image URL. No schema changes, no admin file modified.

**Tech Stack:** Next.js 16.2.6 · React 19 · Prisma · `isomorphic-dompurify` (new dep) · existing Tailwind typography + Cloudinary helpers.

---

## Prerequisites

- Phase 2C merged to main (verify: `git log main --oneline | head -10` shows commits through `ccd69be` or similar Phase 2C SHAs).
- Branch `phase-3-public-wiring` checked out (already done at session start).
- `.env` populated; admin login at `/admin/login` works.
- `npx prisma generate` clean.

---

## Implementer guidance — read this before EVERY rewire task

Each rewire task follows the SAME shape:

1. **Read the current file**. Use the Read tool on the target. Understand:
   - What it imports from `lib/data.ts`
   - What JSX structure it renders
   - What classNames + animations + layout choices exist
2. **Look up the matching DB read helper** in `lib/db/`. The helpers exist already (Phases 2A/2B/2C added them):
   - `getSiteSettings()` — singleton row with every site-wide field
   - `listNavItems()`, `listSocialLinks()`, `listTools()`, `listTestimonials()`, `listFaqs()`, `listClientLogos()`, `listExperience()`, `listEducation()`, `listCertifications()`, `listProjects()`, `listBlogPosts()`
   - `getProject(id)`, `getProjectBySlug(slug)`, `getBlogPost(id)`, `getBlogPostBySlug(slug)`
3. **Rewrite the file** preserving every visible aspect:
   - JSX structure unchanged
   - All className strings unchanged
   - Animations / framer-motion props unchanged
   - Only data source changes
4. **Apply the three invariants** wherever applicable:
   - Cloudinary URLs → wrap with `cldUrl()` from `@/lib/cloudinary/delivery`
   - TipTap-stored HTML (any field that holds HTML from the rich editor) → wrap with `sanitizeHtml()` from `@/lib/sanitize` before `dangerouslySetInnerHTML`
   - Icon string keys → resolve via `iconForKey()` from `@/lib/icons/registry`
5. **Filter visibility + ordering at the DB layer.** Public components show only `visible: true` (and `published: true` for blog/projects). The `lib/db/*` helpers already order by `order asc`; visibility filtering happens in the component (a `.filter()` after fetch) since the helpers don't filter by `visible` themselves.

**Type adapter rule:** when an old prop shape (from data.ts) and the Prisma row shape diverge, change the component's parameter type to the Prisma shape. Do NOT create adapter functions.

---

## File map

| Path | Status | Responsibility |
|---|---|---|
| `package.json` | modify | Add `isomorphic-dompurify` |
| `lib/sanitize.ts` | create | `sanitizeHtml(html)` |
| `lib/cloudinary/delivery.ts` | create | `cldUrl(url, opts?)` |
| `lib/icons/registry.tsx` | create | `iconForKey(key)` |
| `components/layout/sidebar.tsx` | rewire | profile card + socials from DB |
| `components/layout/footer.tsx` | rewire | footer text + show year from DB |
| `components/layout/floating-nav.tsx` | rewire | nav items + icons from DB |
| `components/sections/hero.tsx` | rewire | hero headline/stats/CTAs from SiteSettings |
| `components/sections/companies-strip.tsx` | rewire | ClientLogo[] from DB |
| `components/sections/tools-grid.tsx` | rewire | Tool[] from DB (home mode + tools page mode) |
| `components/sections/testimonials.tsx` | rewire | Testimonial[] from DB |
| `components/sections/faq.tsx` | rewire | FAQ[] from DB |
| `components/sections/collaborate-cta.tsx` | rewire | SiteSettings.ctaSection* fields |
| `components/sections/blog-card.tsx` | rewire | accept Prisma BlogPost row |
| `components/sections/blog-grid.tsx` | rewire | list of BlogPost[] (home + list modes) |
| `components/sections/blog-detail.tsx` | rewire | single BlogPost with sanitized HTML |
| `components/sections/project-card.tsx` | rewire | accept Prisma Project row |
| `components/sections/projects-grid.tsx` | rewire | Project[] (home + list modes) |
| `components/sections/project-detail.tsx` | rewire | full Project incl. sections+gallery+related |
| `components/sections/about-intro.tsx` | rewire | SiteSettings.aboutPageTitle + aboutIntroContent (sanitized) |
| `components/sections/experience-list.tsx` | rewire | Experience[] + heading from SiteSettings |
| `components/sections/education-list.tsx` | rewire | Education[] + heading from SiteSettings |
| `components/sections/certification-list.tsx` | rewire | Certification[] + heading from SiteSettings |
| `components/sections/contact-form.tsx` | rewire | labels from SiteSettings (no submission yet) |
| `app/(site)/page.tsx` | rewire | compose async sections; remove data.ts imports |
| `app/(site)/about/page.tsx` | rewire | compose async sections |
| `app/(site)/contact/page.tsx` | rewire | use SiteSettings for page title/subtitle |
| `app/(site)/blog/page.tsx` | rewire | list of all BlogPosts |
| `app/(site)/blog/[slug]/page.tsx` | rewire | fetch by slug, render detail |
| `app/(site)/projects/page.tsx` | rewire | list of all Projects |
| `app/(site)/projects/[slug]/page.tsx` | rewire | fetch by slug, render detail |
| `app/(site)/tools/page.tsx` | rewire | full Tool list |
| `lib/data.ts` | DELETE | After verification — no public-site file imports from it |

No admin file modified.

---

## Task 1: Install `isomorphic-dompurify` + build the 3 helpers

**Files:**
- Modify: `package.json`
- Create: `lib/sanitize.ts`
- Create: `lib/cloudinary/delivery.ts`
- Create: `lib/icons/registry.tsx`

- [ ] **Step 1: Install dep**

Edit `package.json`. Add to `dependencies` (alphabetical, after `framer-motion`):

```json
"isomorphic-dompurify": "^2.16.0"
```

Run: `npm install`
Expected: completes; one package added (plus transitive deps).

Verify import:
```bash
npx tsx -e 'import("isomorphic-dompurify").then(m => console.log("dompurify OK:", typeof m.default.sanitize))'
```
Expected: `dompurify OK: function`.

- [ ] **Step 2: Create `lib/sanitize.ts`**

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

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target"],
  });
}
```

- [ ] **Step 3: Create `lib/cloudinary/delivery.ts`**

```typescript
export function cldUrl(
  url: string | null | undefined,
  opts?: { width?: number },
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  // Skip if already transformed (e.g. URL already has /upload/f_auto,q_auto/...)
  if (/\/upload\/[^/]*[a-z]_[a-z0-9]+/i.test(url)) return url;
  const transform = ["f_auto", "q_auto"];
  if (opts?.width) transform.push(`w_${opts.width}`);
  return url.replace(/\/upload\//, `/upload/${transform.join(",")}/`);
}
```

- [ ] **Step 4: Create `lib/icons/registry.tsx`**

```typescript
import {
  Home,
  Briefcase,
  Folder,
  Wrench,
  SquarePen,
  Mail,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { BehanceIcon } from "@/components/icons/behance";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { FacebookIcon } from "@/components/icons/facebook";
import { YoutubeIcon } from "@/components/icons/youtube";
import type { ComponentType, SVGProps } from "react";

type IconComponent =
  | LucideIcon
  | ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, IconComponent> = {
  // Nav (Lucide)
  home: Home,
  about: Briefcase,
  projects: Folder,
  tools: Wrench,
  blog: SquarePen,
  contact: Mail,

  // Socials (custom)
  behance: BehanceIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  email: Mail,

  // Fallback
  link: LinkIcon,
};

export function iconForKey(key: string | null | undefined): IconComponent {
  if (!key) return LinkIcon;
  return ICONS[key.toLowerCase()] ?? LinkIcon;
}
```

- [ ] **Step 5: tsc + commit**

```bash
npx tsc --noEmit
git add package.json package-lock.json lib/sanitize.ts lib/cloudinary/delivery.ts lib/icons/registry.tsx
git commit -m "feat(public): isomorphic-dompurify + sanitize/cldUrl/icon-registry helpers"
```

---

## Task 2: Rewire layout components (sidebar + footer + floating-nav)

**Files:**
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/layout/footer.tsx`
- Modify: `components/layout/floating-nav.tsx`

These 3 files appear on every public page. They currently import `profile`, `navItems`, `footer`, etc. from `@/lib/data`.

- [ ] **Step 1: Read each current file**

Use the Read tool on `components/layout/sidebar.tsx`, `components/layout/footer.tsx`, `components/layout/floating-nav.tsx`. Note for each:
- What's imported from `@/lib/data`
- The JSX structure
- Whether the component is currently `'use client'` or a Server Component

- [ ] **Step 2: Rewire each as async Server Component**

For each file:
1. Remove imports from `@/lib/data`
2. Add imports: `getSiteSettings`, `listNavItems`, `listSocialLinks` from their respective `lib/db/*` modules
3. Change the function to `async function` (drop any `'use client'` directive that's not strictly needed)
4. At the top of the function body, await the needed data
5. Replace `profile.name` → `s.fullName`, `profile.role` → `s.role`, `profile.location` → `s.location`, `profile.portrait` → `cldUrl(s.portraitUrl)`, `profile.socials` → from `listSocialLinks()` filtered `visible`, `footer.text` → `s.footerText`, `navItems` → from `listNavItems()` filtered `visible`
6. Where the old code rendered an icon component directly (`<social.icon />`), call the registry: `const SocialIcon = iconForKey(s.iconKey); return <SocialIcon />;`

Example shape for `sidebar.tsx` (preserving any existing classNames/wrappers from the current file):

```tsx
import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listSocialLinks } from "@/lib/db/social-links";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { iconForKey } from "@/lib/icons/registry";

export async function Sidebar() {
  const [s, socials] = await Promise.all([
    getSiteSettings(),
    listSocialLinks(),
  ]);
  const visibleSocials = socials.filter((x) => x.visible);

  return (
    <aside className="/* preserve all current classes */">
      {s.portraitUrl && (
        <Image
          src={cldUrl(s.portraitUrl)}
          alt={s.fullName}
          width={480}
          height={600}
          /* preserve current classes */
        />
      )}
      <h2>{s.fullName}</h2>
      <p>{s.role}</p>
      <p>{s.location}</p>

      <Link href={s.ctaButtonLink} /* preserve classes */>
        {s.ctaButtonLabel}
      </Link>

      <ul /* preserve current classes */>
        {visibleSocials.map((social) => {
          const Icon = iconForKey(social.iconKey);
          return (
            <li key={social.id}>
              <Link href={social.url} aria-label={social.label}>
                <Icon /* preserve current classes */ />
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
```

The exact JSX MUST match the current file's structure — same wrappers, same classNames, same layout decisions. Only the data source changes.

For `footer.tsx`:
```tsx
import { getSiteSettings } from "@/lib/db/site-settings";

export async function Footer() {
  const s = await getSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer /* preserve current classes */>
      <p>
        {s.footerText}
        {s.footerShowYear && ` · ${year}`}
        {s.footerCopyright && ` · ${s.footerCopyright}`}
      </p>
    </footer>
  );
}
```

For `floating-nav.tsx`:
```tsx
import Link from "next/link";
import { listNavItems } from "@/lib/db/nav-items";
import { iconForKey } from "@/lib/icons/registry";

export async function FloatingNav() {
  const items = await listNavItems();
  const visible = items.filter((i) => i.visible);

  return (
    <nav /* preserve current classes */>
      {visible.map((item) => {
        const Icon = iconForKey(item.iconKey);
        return (
          <Link key={item.id} href={item.href} /* preserve classes */>
            <Icon /* preserve current classes */ />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Build + dev smoke**

```bash
npx tsc --noEmit
npm run build
```

If build is clean, start `npm run dev`, visit `/`, verify:
- Sidebar shows profile card with name/role/location/portrait + social icons
- Floating nav shows 6 icons (Home/About/Projects/Tools/Blog/Contact)
- Footer shows footer text with year

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/layout/
git commit -m "feat(public): sidebar + footer + floating-nav read from DB"
```

---

## Task 3: Rewire home-page sections (hero, companies-strip, tools-grid, testimonials, faq, collaborate-cta)

**Files:**
- Modify: `components/sections/hero.tsx`
- Modify: `components/sections/companies-strip.tsx`
- Modify: `components/sections/tools-grid.tsx`
- Modify: `components/sections/testimonials.tsx`
- Modify: `components/sections/faq.tsx`
- Modify: `components/sections/collaborate-cta.tsx`

These render on the home page (and `tools-grid` also on the tools page).

- [ ] **Step 1: Read each current file**

Read each of the 6 files. Note current import shape, current JSX, current animation/styling.

- [ ] **Step 2: Rewire each**

### `hero.tsx`

The current Hero component renders the headline + subtext + 2 CTAs + the 3 stat numbers. Convert to:

```tsx
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/site-settings";

export async function Hero() {
  const s = await getSiteSettings();
  const stats = [
    { value: s.statYearsExperience, label: s.statYearsLabel },
    { value: s.statProjects, label: s.statProjectsLabel },
    { value: s.statClients, label: s.statClientsLabel },
  ];

  return (
    <section /* preserve current section classes */>
      {/* Headline + subtext — preserve current JSX structure */}
      <h1>{s.heroHeadline}</h1>
      <p>{s.heroSubtext}</p>

      <div /* CTAs row, preserve classes */>
        <Link href={s.heroPrimaryCtaLink}>{s.heroPrimaryCtaLabel}</Link>
        <Link href={s.heroSecondaryCtaLink}>{s.heroSecondaryCtaLabel}</Link>
      </div>

      {/* Stats — preserve current grid/card structure */}
      <div /* stats grid classes */>
        {stats.map((stat) => (
          <div key={stat.label} /* preserve card classes */>
            <span>
              {stat.value}
              {s.statsShowPlus && "+"}
            </span>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Preserve whatever animation wrappers (motion.div, etc.) exist in the current file.

### `companies-strip.tsx`

```tsx
import Image from "next/image";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listClientLogos } from "@/lib/db/client-logos";
import { cldUrl } from "@/lib/cloudinary/delivery";

export async function CompaniesStrip() {
  const [s, logos] = await Promise.all([
    getSiteSettings(),
    listClientLogos(),
  ]);
  const visibleLogos = logos.filter((l) => l.visible);

  return (
    <section /* preserve current classes */>
      <p>{s.trustedByHeading}</p>
      <div /* logos row classes */>
        {visibleLogos.map((logo) => (
          <div key={logo.id} /* preserve logo wrapper classes */>
            <Image
              src={cldUrl(logo.logoUrl)}
              alt={logo.name}
              width={120}
              height={48}
              /* preserve image classes */
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

### `tools-grid.tsx`

This is rendered on both home and tools page. Support both via a `mode` prop:

```tsx
import { getSiteSettings } from "@/lib/db/site-settings";
import { listTools } from "@/lib/db/tools";
import { cldUrl } from "@/lib/cloudinary/delivery";

type ToolsGridProps = { mode?: "home" | "page" };

export async function ToolsGrid({ mode = "home" }: ToolsGridProps) {
  const [s, tools] = await Promise.all([
    getSiteSettings(),
    listTools(),
  ]);
  const visible = tools.filter((t) =>
    mode === "home" ? t.visible && t.showOnHome : t.visible,
  );

  const heading = mode === "home" ? s.toolsSectionHeading : s.toolsPageTitle;
  const subtitle = mode === "page" ? s.toolsPageSubtitle : null;

  return (
    <section /* preserve current classes */>
      <h2>{heading}</h2>
      {subtitle && <p>{subtitle}</p>}
      <div /* grid classes */>
        {visible.map((tool) => {
          const iconSrc = tool.iconExternalUrl ?? cldUrl(tool.iconUrl);
          return (
            <div key={tool.id} /* card classes */>
              {iconSrc && <img src={iconSrc} alt={tool.name} /* classes */ />}
              <h3>{tool.name}</h3>
              {tool.description && <p>{tool.description}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

(Note: `<img>` used here because skillicons.dev URLs aren't in next.config.ts's remotePatterns for `Image`. Check current file — if it uses `Image`, replace with `<img>` for the icon. If it already uses `<img>`, keep that.)

### `testimonials.tsx`

```tsx
import Image from "next/image";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listTestimonials } from "@/lib/db/testimonials";
import { cldUrl } from "@/lib/cloudinary/delivery";

export async function Testimonials() {
  const [s, testimonials] = await Promise.all([
    getSiteSettings(),
    listTestimonials(),
  ]);
  const visible = testimonials.filter((t) => t.visible);

  return (
    <section /* preserve classes */>
      <h2>{s.testimonialsHeading}</h2>
      <div /* grid */>
        {visible.map((t) => (
          <article key={t.id} /* preserve card */>
            {t.avatarUrl && (
              <Image
                src={cldUrl(t.avatarUrl)}
                alt={t.name}
                width={64}
                height={64}
                /* preserve avatar classes */
              />
            )}
            <blockquote>{t.content}</blockquote>
            <footer>
              <p>{t.name}</p>
              {t.role && <p>{t.role}{t.company && ` · ${t.company}`}</p>}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
```

### `faq.tsx`

```tsx
import { getSiteSettings } from "@/lib/db/site-settings";
import { listFaqs } from "@/lib/db/faqs";

type FaqProps = { mode?: "home" | "page" };

export async function Faq({ mode = "home" }: FaqProps) {
  const [s, faqs] = await Promise.all([
    getSiteSettings(),
    listFaqs(),
  ]);
  const visible = faqs.filter((f) => f.visible);

  return (
    <section /* preserve classes */>
      <h2>{s.faqHeading}</h2>
      <dl /* preserve list classes */>
        {visible.map((f) => (
          <details key={f.id} /* preserve item classes */>
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </dl>
    </section>
  );
}
```

(If the current implementation uses a different element than `<details>`, preserve it. The point is: render question/answer pairs from `f.question` / `f.answer`.)

### `collaborate-cta.tsx`

```tsx
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/site-settings";

export async function CollaborateCta() {
  const s = await getSiteSettings();

  return (
    <section /* preserve classes */>
      <h2>
        <span>{s.ctaSectionLineOne}</span>
        <span>{s.ctaSectionLineTwo}</span>
      </h2>
      {s.ctaSectionText && <p>{s.ctaSectionText}</p>}
      <Link href={s.ctaSectionButtonLink}>{s.ctaSectionButtonLabel}</Link>
    </section>
  );
}
```

- [ ] **Step 3: tsc + build**

```bash
npx tsc --noEmit
npm run build
```

If build is clean, dev-smoke the home page (`/`):
- Hero with headline + subtext + 2 CTAs + 3 stat cards (with `+` suffix)
- Companies strip with logos
- Tools section with 8 tools
- Testimonials
- FAQ
- Collaborate CTA

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/sections/hero.tsx components/sections/companies-strip.tsx components/sections/tools-grid.tsx components/sections/testimonials.tsx components/sections/faq.tsx components/sections/collaborate-cta.tsx
git commit -m "feat(public): home-page sections read from DB (hero/companies/tools/testimonials/faq/cta)"
```

---

## Task 4: Rewire about-page sections (about-intro, experience-list, education-list, certification-list)

**Files:**
- Modify: `components/sections/about-intro.tsx`
- Modify: `components/sections/experience-list.tsx`
- Modify: `components/sections/education-list.tsx`
- Modify: `components/sections/certification-list.tsx`

- [ ] **Step 1: Read each current file**

- [ ] **Step 2: Rewire**

### `about-intro.tsx`

This is the first rich-HTML render — sanitize required.

```tsx
import { getSiteSettings } from "@/lib/db/site-settings";
import { sanitizeHtml } from "@/lib/sanitize";

export async function AboutIntro() {
  const s = await getSiteSettings();

  return (
    <section /* preserve classes */>
      <h1>{s.aboutPageTitle}</h1>
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.aboutIntroContent) }}
      />
    </section>
  );
}
```

Preserve the wrapper structure from the current file. The prose className may need adjustment to match the current visual style — check the existing render and use whichever className the current component uses for the paragraph container.

### `experience-list.tsx`

```tsx
import Image from "next/image";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listExperience } from "@/lib/db/experience";
import { cldUrl } from "@/lib/cloudinary/delivery";

export async function ExperienceList() {
  const [s, experience] = await Promise.all([
    getSiteSettings(),
    listExperience(),
  ]);
  const visible = experience.filter((e) => e.visible);

  return (
    <section /* preserve classes */>
      <h2>{s.experienceHeading}</h2>
      <ul /* preserve list classes */>
        {visible.map((e) => (
          <li key={e.id} /* preserve item classes */>
            {e.logoUrl && (
              <Image
                src={cldUrl(e.logoUrl)}
                alt={e.company}
                width={48}
                height={48}
                /* preserve logo classes */
              />
            )}
            <div>
              <h3>
                {e.companyUrl ? (
                  <a href={e.companyUrl}>{e.company}</a>
                ) : (
                  e.company
                )}
              </h3>
              <p>{e.role}</p>
              <p>
                {e.startDate} – {e.current ? "Present" : (e.endDate ?? "—")}
              </p>
              <p>{e.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### `education-list.tsx`

Same shape as experience-list, swap:
- `listExperience` → `listEducation`
- `e.company` → `e.institution`
- `e.role` → `e.degree`
- `e.companyUrl` → `e.institutionUrl`
- heading: `s.educationHeading`

### `certification-list.tsx`

```tsx
import Image from "next/image";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listCertifications } from "@/lib/db/certifications";
import { cldUrl } from "@/lib/cloudinary/delivery";

export async function CertificationList() {
  const [s, certs] = await Promise.all([
    getSiteSettings(),
    listCertifications(),
  ]);
  const visible = certs.filter((c) => c.visible);

  return (
    <section /* preserve classes */>
      <h2>{s.certificationHeading}</h2>
      <ul /* preserve classes */>
        {visible.map((c) => (
          <li key={c.id} /* preserve classes */>
            {c.logoUrl && (
              <Image
                src={cldUrl(c.logoUrl)}
                alt={c.institution}
                width={48}
                height={48}
              />
            )}
            <div>
              <h3>
                {c.credentialUrl ? (
                  <a href={c.credentialUrl}>{c.title}</a>
                ) : (
                  c.title
                )}
              </h3>
              <p>{c.institution}</p>
              <p>
                {c.startDate} – {c.endDate ?? "—"}
              </p>
              {c.description && <p>{c.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Build + dev smoke**

```bash
npx tsc --noEmit
npm run build
```

Start `npm run dev`, visit `/about`:
- Page title + intro paragraph (rich-text rendered)
- Experience list with 5 items + logo placeholders
- Education list with 3 items
- Certification list with 1 item

Inspect DevTools: the intro `<div>` should have escaped HTML with allowed tags only.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/sections/about-intro.tsx components/sections/experience-list.tsx components/sections/education-list.tsx components/sections/certification-list.tsx
git commit -m "feat(public): about-page sections read from DB (intro/experience/education/certification)"
```

---

## Task 5: Rewire blog sections + pages (blog-card, blog-grid, blog-detail, list page, slug page)

**Files:**
- Modify: `components/sections/blog-card.tsx`
- Modify: `components/sections/blog-grid.tsx`
- Modify: `components/sections/blog-detail.tsx`
- Modify: `app/(site)/blog/page.tsx`
- Modify: `app/(site)/blog/[slug]/page.tsx`

- [ ] **Step 1: Read each current file**

- [ ] **Step 2: Rewire**

### `blog-card.tsx`

Probably already takes a post prop. Update the prop type to accept the Prisma `BlogPost` row:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@prisma/client";
import { cldUrl } from "@/lib/cloudinary/delivery";

type BlogCardProps = { post: BlogPost };

export function BlogCard({ post }: BlogCardProps) {
  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(post.publishedAt)
    : "";

  return (
    <article /* preserve classes */>
      <Link href={`/blog/${post.slug}`}>
        <div /* image wrapper */>
          <Image
            src={cldUrl(post.coverImageUrl)}
            alt={post.title}
            width={640}
            height={400}
            /* preserve image classes */
          />
        </div>
        <h3>{post.title}</h3>
        {dateStr && <p>{dateStr}</p>}
        <p>{post.excerpt}</p>
      </Link>
    </article>
  );
}
```

Preserve the current visual JSX structure exactly — only change the prop type and the URL fields.

### `blog-grid.tsx`

Two modes: home (recent N) + list (all). Both filter `published: true`.

```tsx
import { getSiteSettings } from "@/lib/db/site-settings";
import { listBlogPosts } from "@/lib/db/blog-posts";
import { BlogCard } from "./blog-card";

type BlogGridProps = { mode?: "home" | "page" };

export async function BlogGrid({ mode = "home" }: BlogGridProps) {
  const [s, posts] = await Promise.all([
    getSiteSettings(),
    listBlogPosts(),
  ]);
  const published = posts.filter((p) => p.published);
  const limited = mode === "home" ? published.slice(0, s.blogSectionLimit) : published;

  const heading = mode === "home" ? s.blogSectionHeading : s.blogPageTitle;
  const subtitle = mode === "page" ? s.blogPageSubtitle : null;

  return (
    <section /* preserve classes */>
      <h2>{heading}</h2>
      {subtitle && <p>{subtitle}</p>}
      <div /* grid */>
        {limited.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
```

### `blog-detail.tsx`

This is the rich-text consumer.

```tsx
import Image from "next/image";
import type { BlogPost } from "@prisma/client";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { sanitizeHtml } from "@/lib/sanitize";

type BlogDetailProps = { post: BlogPost };

export function BlogDetail({ post }: BlogDetailProps) {
  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(post.publishedAt)
    : "";

  return (
    <article /* preserve classes */>
      <header /* preserve classes */>
        <h1>{post.title}</h1>
        {post.subtitle && <p>{post.subtitle}</p>}
        <p>
          {dateStr}
          {post.readTimeMinutes > 0 && ` · ${post.readTimeMinutes} min read`}
          {post.author && ` · ${post.author}`}
        </p>
      </header>

      <Image
        src={cldUrl(post.coverImageUrl)}
        alt={post.title}
        width={1200}
        height={630}
        /* preserve cover classes */
      />

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
      />

      {post.tags.length > 0 && (
        <div /* preserve tags wrapper classes */>
          {post.tags.map((tag) => (
            <span key={tag} /* preserve tag chip classes */>{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}
```

### `app/(site)/blog/page.tsx`

```tsx
import { BlogGrid } from "@/components/sections/blog-grid";

export const metadata = { title: "Blog" };

export default function BlogListPage() {
  return <BlogGrid mode="page" />;
}
```

### `app/(site)/blog/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/db/blog-posts";
import { BlogDetail } from "@/components/sections/blog-detail";

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || !post.published) notFound();

  return <BlogDetail post={post} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
  };
}
```

- [ ] **Step 3: tsc + build + dev**

```bash
npx tsc --noEmit
npm run build
```

Dev smoke:
- `/blog` shows 5 published posts in grid
- `/blog/typography-soul-of-brand` shows full post (sanitized HTML body rendered)

Inspect DevTools on the slug page: no `<script>` in rendered HTML, prose styling applied.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/sections/blog-card.tsx components/sections/blog-grid.tsx components/sections/blog-detail.tsx "app/(site)/blog"
git commit -m "feat(public): blog cards/grid/detail + list and slug pages read from DB"
```

---

## Task 6: Rewire project sections + pages (project-card, projects-grid, project-detail, list page, slug page)

**Files:**
- Modify: `components/sections/project-card.tsx`
- Modify: `components/sections/projects-grid.tsx`
- Modify: `components/sections/project-detail.tsx`
- Modify: `app/(site)/projects/page.tsx`
- Modify: `app/(site)/projects/[slug]/page.tsx`

- [ ] **Step 1: Read each current file**

- [ ] **Step 2: Rewire**

### `project-card.tsx`

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@prisma/client";
import { cldUrl } from "@/lib/cloudinary/delivery";

type ProjectCardProps = { project: Project };

export function ProjectCard({ project }: ProjectCardProps) {
  const imageUrl = project.cardImageUrl ?? project.coverImageUrl;

  return (
    <article /* preserve classes */>
      <Link href={`/projects/${project.slug}`}>
        <div /* image wrapper */>
          <Image
            src={cldUrl(imageUrl)}
            alt={project.title}
            width={640}
            height={400}
            /* preserve classes */
          />
        </div>
        <h3>{project.title}</h3>
        {project.shortLabel && <p>{project.shortLabel}</p>}
        <p>{project.excerpt}</p>
        {project.services.length > 0 && (
          <div /* services chip wrapper */>
            {project.services.map((svc) => (
              <span key={svc} /* chip class */>{svc}</span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}
```

### `projects-grid.tsx`

Modes: home (latest N) + page (all):

```tsx
import { getSiteSettings } from "@/lib/db/site-settings";
import { listProjects } from "@/lib/db/projects";
import { ProjectCard } from "./project-card";

type ProjectsGridProps = { mode?: "home" | "page" };

export async function ProjectsGrid({ mode = "home" }: ProjectsGridProps) {
  const [s, projects] = await Promise.all([
    getSiteSettings(),
    listProjects(),
  ]);
  const published = projects.filter((p) => p.published);
  const limited = mode === "home" ? published.slice(0, s.recentProjectsLimit) : published;

  const heading = mode === "home" ? s.recentProjectsHeading : s.projectsPageTitle;
  const subtitle = mode === "page" ? s.projectsPageSubtitle : null;

  return (
    <section /* preserve classes */>
      <h2>{heading}</h2>
      {subtitle && <p>{subtitle}</p>}
      <div /* grid */>
        {limited.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}
```

### `project-detail.tsx`

Most complex — sanitized intro + sections + gallery + related.

```tsx
import Image from "next/image";
import Link from "next/link";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Prisma } from "@prisma/client";

type ProjectFull = Prisma.ProjectGetPayload<{
  include: {
    sections: true;
    galleryImages: true;
    relatedProjects: {
      include: {
        related: { select: { id: true; title: true; slug: true; coverImageUrl: true; shortLabel: true; excerpt: true } };
      };
    };
  };
}>;

type ProjectDetailProps = { project: ProjectFull };

export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <article /* preserve classes */>
      <header /* preserve classes */>
        <h1>{project.title}</h1>
        {project.shortLabel && <p>{project.shortLabel}</p>}
        <Image
          src={cldUrl(project.coverImageUrl)}
          alt={project.title}
          width={1600}
          height={1000}
          /* preserve cover classes */
        />

        <dl /* preserve meta classes */>
          {project.year && (
            <><dt>Year</dt><dd>{project.year}</dd></>
          )}
          {project.client && (
            <><dt>Client</dt><dd>{project.client}</dd></>
          )}
          {project.services.length > 0 && (
            <><dt>Services</dt><dd>{project.services.join(", ")}</dd></>
          )}
          {project.role && (
            <><dt>Role</dt><dd>{project.role}</dd></>
          )}
          {project.liveUrl && (
            <><dt>Live</dt><dd><a href={project.liveUrl}>{project.liveUrl}</a></dd></>
          )}
        </dl>
      </header>

      {project.introContent && (
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.introContent) }}
        />
      )}

      {project.sections.map((s) => (
        <section key={s.id} /* preserve classes */>
          <h2>{s.heading}</h2>
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.content) }}
          />
        </section>
      ))}

      {project.galleryImages.length > 0 && (
        <section /* preserve gallery wrapper classes */>
          <h2>{project.galleryHeading}</h2>
          <div /* gallery grid classes */>
            {project.galleryImages.map((img) => (
              <figure key={img.id} /* preserve figure classes */>
                <Image
                  src={cldUrl(img.url)}
                  alt={img.alt ?? project.title}
                  width={1600}
                  height={1200}
                  /* preserve image classes */
                />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {project.relatedProjects.length > 0 && (
        <section /* preserve related wrapper classes */>
          <h2>{project.relatedHeading}</h2>
          <div /* related grid */>
            {project.relatedProjects.map((rp) => (
              <Link key={rp.relatedId} href={`/projects/${rp.related.slug}`} /* preserve card */>
                <Image
                  src={cldUrl(rp.related.coverImageUrl)}
                  alt={rp.related.title}
                  width={640}
                  height={400}
                  /* preserve related thumb */
                />
                <h3>{rp.related.title}</h3>
                {rp.related.shortLabel && <p>{rp.related.shortLabel}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
```

### `app/(site)/projects/page.tsx`

```tsx
import { ProjectsGrid } from "@/components/sections/projects-grid";

export const metadata = { title: "Projects" };

export default function ProjectsListPage() {
  return <ProjectsGrid mode="page" />;
}
```

### `app/(site)/projects/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { ProjectDetail } from "@/components/sections/project-detail";

export default async function ProjectSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
      relatedProjects: {
        orderBy: { order: "asc" },
        include: {
          related: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              shortLabel: true,
              excerpt: true,
            },
          },
        },
      },
    },
  });

  if (!project || !project.published) notFound();
  return <ProjectDetail project={project} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return { title: "Not found" };
  return {
    title: project.metaTitle ?? project.title,
    description: project.metaDescription ?? project.excerpt,
  };
}
```

- [ ] **Step 3: tsc + build + dev**

```bash
npx tsc --noEmit
npm run build
```

Dev smoke:
- `/projects` shows 6 published projects
- `/projects/nokshi` shows full project with intro + 3 sections + 4 gallery + related links

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/sections/project-card.tsx components/sections/projects-grid.tsx components/sections/project-detail.tsx "app/(site)/projects"
git commit -m "feat(public): project cards/grid/detail + list and slug pages read from DB"
```

---

## Task 7: Rewire remaining pages + contact (home, about, contact, tools)

**Files:**
- Modify: `components/sections/contact-form.tsx`
- Modify: `app/(site)/page.tsx` (home)
- Modify: `app/(site)/about/page.tsx`
- Modify: `app/(site)/contact/page.tsx`
- Modify: `app/(site)/tools/page.tsx`

- [ ] **Step 1: Read each current file**

- [ ] **Step 2: Rewire**

### `contact-form.tsx`

This is the form on the contact page. Phase 4 wires submission. In Phase 3, just render the labels from DB. Keep it a Client Component since it has interactive state.

```tsx
"use client";
import { useState } from "react";

type ContactFormProps = {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
};

export function ContactForm({
  nameLabel,
  emailLabel,
  messageLabel,
  submitLabel,
  successMessage,
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p /* preserve success classes */>{successMessage}</p>;
  }

  return (
    <form
      /* preserve current form classes */
      onSubmit={(e) => {
        e.preventDefault();
        // Submission lands in Phase 4 — for now just show success
        setSubmitted(true);
      }}
    >
      <label>
        <span>{nameLabel}</span>
        <input type="text" name="name" required /* preserve classes */ />
      </label>
      <label>
        <span>{emailLabel}</span>
        <input type="email" name="email" required /* preserve classes */ />
      </label>
      <label>
        <span>{messageLabel}</span>
        <textarea name="message" required /* preserve classes */ />
      </label>
      <button type="submit" /* preserve button classes */>{submitLabel}</button>
    </form>
  );
}
```

### `app/(site)/page.tsx` (home)

The page composes section components. After Phase 3, each section is async and fetches its own data. Verify the page imports the renamed/refactored components and composes them. Likely:

```tsx
import { Hero } from "@/components/sections/hero";
import { CompaniesStrip } from "@/components/sections/companies-strip";
import { ProjectsGrid } from "@/components/sections/projects-grid";
import { ToolsGrid } from "@/components/sections/tools-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogGrid } from "@/components/sections/blog-grid";
import { Faq } from "@/components/sections/faq";
import { CollaborateCta } from "@/components/sections/collaborate-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CompaniesStrip />
      <ProjectsGrid mode="home" />
      <ToolsGrid mode="home" />
      <Testimonials />
      <BlogGrid mode="home" />
      <Faq mode="home" />
      <CollaborateCta />
    </>
  );
}
```

Read the current page first. If it includes wrapping divs, layout helpers, or different ordering — preserve all of that. The point is: it should import sections from `components/sections/*` and NOT import anything from `@/lib/data`.

### `app/(site)/about/page.tsx`

```tsx
import { AboutIntro } from "@/components/sections/about-intro";
import { ExperienceList } from "@/components/sections/experience-list";
import { EducationList } from "@/components/sections/education-list";
import { CertificationList } from "@/components/sections/certification-list";
import { CollaborateCta } from "@/components/sections/collaborate-cta";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <AboutIntro />
      <ExperienceList />
      <EducationList />
      <CertificationList />
      <CollaborateCta />
    </>
  );
}
```

(Preserve any wrapping JSX from the current page.)

### `app/(site)/contact/page.tsx`

```tsx
import { getSiteSettings } from "@/lib/db/site-settings";
import { ContactForm } from "@/components/sections/contact-form";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const s = await getSiteSettings();

  return (
    <section /* preserve current section classes */>
      <h1>{s.contactPageTitle}</h1>
      {s.contactPageSubtitle && <p>{s.contactPageSubtitle}</p>}

      <div /* preserve contact info wrapper */>
        {s.contactEmail && (
          <p>
            <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
          </p>
        )}
        {s.contactPhone && <p>{s.contactPhone}</p>}
        {s.contactLocationText && <p>{s.contactLocationText}</p>}
      </div>

      <ContactForm
        nameLabel={s.contactFormNameLabel}
        emailLabel={s.contactFormEmailLabel}
        messageLabel={s.contactFormMessageLabel}
        submitLabel={s.contactFormSubmitLabel}
        successMessage={s.contactSuccessMessage}
      />
    </section>
  );
}
```

### `app/(site)/tools/page.tsx`

```tsx
import { ToolsGrid } from "@/components/sections/tools-grid";

export const metadata = { title: "Tools" };

export default function ToolsPage() {
  return <ToolsGrid mode="page" />;
}
```

- [ ] **Step 3: tsc + build + dev**

```bash
npx tsc --noEmit
npm run build
```

Dev smoke each route:
- `/` home — full composition
- `/about` — intro + experience + education + certifications
- `/contact` — title + contact info + form
- `/tools` — full tool list

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add components/sections/contact-form.tsx "app/(site)/page.tsx" "app/(site)/about" "app/(site)/contact" "app/(site)/tools"
git commit -m "feat(public): home/about/contact/tools pages compose async sections; contact-form takes labels via props"
```

---

## Task 8: Delete `lib/data.ts` + final acceptance + spec flip

**Files:**
- Delete: `lib/data.ts`
- Modify: `docs/superpowers/specs/2026-05-23-portfolio-public-rewire-design.md` (status flip)

- [ ] **Step 1: Verify no file imports from `@/lib/data`**

```bash
grep -rn 'from "@/lib/data"' app/ components/ lib/ actions/ 2>/dev/null
grep -rn "from '@/lib/data'" app/ components/ lib/ actions/ 2>/dev/null
```

Expected: empty for both. If any results appear, fix them first — they're public-site files that weren't migrated. (Admin files do not import from lib/data — only public site does.)

- [ ] **Step 2: Delete `lib/data.ts`**

```bash
git rm lib/data.ts
```

- [ ] **Step 3: tsc + build + lint**

```bash
npx tsc --noEmit
npm run build
npm run lint
```

All three must exit 0. The build output should show all public routes rendering as `ƒ` (dynamic — they now fetch from DB).

- [ ] **Step 4: Dep verification**

```bash
BASE=$(git merge-base HEAD main)
git diff "$BASE" HEAD -- package.json | grep -E '^\+ +"' | grep -v scripts
```

Expected: only `isomorphic-dompurify` line. No other new deps.

- [ ] **Step 5: Admin files untouched**

```bash
BASE=$(git merge-base HEAD main)
git diff --name-only "$BASE" HEAD -- "app/(admin)/" "app/(admin-public)/" actions/ components/admin/ lib/schemas/ lib/auth/
```

Expected: empty. (Phase 3 is public-only.)

- [ ] **Step 6: Public site end-to-end smoke**

Start `npm run dev`. Without logging in (no admin cookie), verify in browser:

1. `/` — hero (headline from DB), stats with `+`, companies strip, recent projects (4), tools (8), testimonials (1), blog (4), faq (5), CTA, footer
2. `/about` — title, intro (rich text), experience (5), education (3), certifications (1)
3. `/contact` — title, contact info, form
4. `/blog` — 5 published cards
5. `/blog/typography-soul-of-brand` — full body rendered, no `<script>` in DOM (DevTools verify)
6. `/projects` — 6 published cards
7. `/projects/nokshi` — intro + 3 sections + 4 gallery + related cards
8. `/tools` — 8 tools

Now log in at `/admin/login`. Edit `SiteSettings → Footer → footerText` to something distinctive (e.g. "Phase 3 acceptance"). Save. Reload `/` — footer reflects new text. Confirms wiring works end-to-end.

DevTools Network tab: visit `/blog/typography-soul-of-brand` (or any page with a Cloudinary image). Inspect a `res.cloudinary.com` request → response `Content-Type: image/avif` (in Chrome). Confirms `cldUrl()` and Cloudinary delivery work.

Stop dev server.

- [ ] **Step 7: Mark spec as Implemented**

Edit `docs/superpowers/specs/2026-05-23-portfolio-public-rewire-design.md` header:
- Change `Status: Draft — awaiting user review` to `Status: Implemented (YYYY-MM-DD)` with today's date.

- [ ] **Step 8: Final commit**

```bash
git add lib/data.ts docs/superpowers/specs/2026-05-23-portfolio-public-rewire-design.md
git commit -m "chore(public): delete lib/data.ts (public site fully DB-driven) + mark phase 3 implemented"
```

(`git add lib/data.ts` records the deletion since `git rm` already staged it; this is a defensive re-add of the deletion + the spec edit.)

---

## What's NOT in this plan (defer to Phase 4)

- **Contact form submission**: Server Action that validates + creates `ContactSubmission` row + sends Resend email. The existing form shows a hardcoded success message; Phase 4 makes it real.
- **`app/sitemap.ts`**: dynamic sitemap from DB (all published projects + blog posts).
- **`app/robots.ts`**: production robots.txt (disallow `/admin`).
- **README**: project setup + admin login docs.
- **Removing `placehold.co` + `skillicons.dev` from `next.config.ts` remotePatterns** once all seed placeholders are replaced with real Cloudinary uploads.

---

## Risks captured during planning

1. **Section component rewrites lose visual fidelity.** Mitigation: each task's dev-smoke step requires the engineer to compare against the previous render. Preserve every className and animation prop.
2. **`dangerouslySetInnerHTML` XSS via TipTap content.** Mitigation: every consumer wraps with `sanitizeHtml()`. Grep audit in Task 8 confirms no raw `dangerouslySetInnerHTML` exists.
3. **`cldUrl()` mis-transforms an already-transformed Cloudinary URL.** Mitigation: regex guard skips injection if any transformation segment already present. Idempotent.
4. **`isomorphic-dompurify` SSR import edge case in Next 16.** Mitigation: it's specifically designed for SSR. If the build fails, fall back to a server-only import wrapper.
5. **Deleting `lib/data.ts` breaks a missed import.** Mitigation: grep step in Task 8 must return empty before the delete proceeds.
6. **Public site goes from static prerendered to dynamic server-rendered.** Mitigation: this IS the intended change. Build output should show `ƒ` for previously `○` (static) public routes. Page load time stays under 800ms on Neon free tier.
7. **`generateStaticParams` not used for blog/project slugs.** They render dynamically per request. If perf matters, can be added in Phase 4 with revalidation on admin save. Out of scope here.
8. **Icon registry missing a key referenced by DB.** Mitigation: `iconForKey()` falls back to `LinkIcon` for unknown keys. Admin can fix the bad `iconKey` value.
