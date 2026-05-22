# Portfolio Admin UI — Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 2A admin UI from the [2026-05-21 design spec](../specs/2026-05-21-portfolio-admin-ui-2a-design.md): login + sidebar dashboard + CRUD for 10 simple entities (SiteSettings sub-pages, NavItem, SocialLink, Tool, Testimonial, FAQ, Experience, Education, Certification, ClientLogo) + a reusable Cloudinary image uploader. **No Project/Blog CRUD, no TipTap, no drag-reorder** — those are Phase 2B.

**Architecture:** Next 16 Server Actions + zod (no react-hook-form). Two route groups: `(admin)` is gated by `requireAdmin()` in its layout; `(admin-public)` holds only the login page. Every page is a Server Component except 4 small client islands: `<ImageUploader>`, `<DeleteButton>`, `<VisibleToggle>`, and `<LoginForm>`. Database access is via Phase 1's Prisma singleton; reads are wrapped in cached helpers in `lib/db/<entity>.ts`; writes live in `actions/<entity>.ts`.

**Tech Stack:** Next.js 16.2.6 · React 19 · Prisma · Postgres (Neon) · zod · Cloudinary signed direct upload (Phase 1 helper) · jose-based auth cookie (Phase 1 helper) · sonner toasts · Tailwind · radix-ui.

---

## Prerequisites

These are already in place from Phase 1 — verify before starting:

- `.env` populated with `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `CLOUDINARY_*`.
- `npx prisma generate` runs without error.
- `npm run db:seed` succeeds.
- Branch `phase-2-admin-ui` (already checked out from `main`).

If any of the above fails, stop and resolve before starting Task 1.

---

## Pre-flight: read the Next 16 Server Actions docs

This is not a task but a hard reminder. [AGENTS.md](../../../AGENTS.md) warns that Next 16 has breaking changes. Before writing any Server Action or `useActionState` code, read:

- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-action-state.mdx` (or `.md`)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidate-path.mdx`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.mdx`
- `node_modules/next/dist/docs/01-app/02-guides/server-actions-and-mutations.mdx` (or whatever the closest file is)

If APIs differ from this plan (e.g. `useActionState` returns different tuple shape), adapt and note in commit messages.

---

## File Map (locked here; tasks reference these paths)

| Path | Status | Responsibility |
|---|---|---|
| `package.json` | modify | Add `zod` dep |
| `lib/schemas/<entity>.ts` × 10 | create | Per-entity zod schemas (10 files) |
| `lib/db/<entity>.ts` × 10 | create | Per-entity cached read helpers (10 files) |
| `actions/auth.ts` | create | `loginAction`, `logoutAction` |
| `actions/upload.ts` | create | `signCloudinaryUpload(folder)` |
| `actions/<entity>.ts` × 10 | create | `create`/`update`/`delete`/`toggleVisible` per entity |
| `components/admin/field/*.tsx` × 6 | create | TextField, TextAreaField, NumberField, BooleanField, UrlField, SelectField |
| `components/admin/sidebar.tsx` | create | Sidebar nav + logout button |
| `components/admin/form-section.tsx` | create | `<form>` wrapper with error rendering |
| `components/admin/data-table.tsx` | create | Generic list table |
| `components/admin/delete-button.tsx` | create | Client confirm modal |
| `components/admin/visible-toggle.tsx` | create | Per-row visible checkbox |
| `components/admin/image-uploader.tsx` | create | Client component: file picker + Cloudinary direct upload |
| `app/(admin-public)/admin/login/page.tsx` | create | Login page (Server Component) |
| `app/(admin-public)/admin/login/login-form.tsx` | create | Login client form (`'use client'`) |
| `app/(admin)/admin/layout.tsx` | create | Sidebar + content layout, calls `requireAdmin()` |
| `app/(admin)/admin/page.tsx` | create | Dashboard home (row count cards) |
| `app/(admin)/admin/site-settings/page.tsx` | create | Sub-page index |
| `app/(admin)/admin/site-settings/<group>/page.tsx` × 10 | create | profile, hero, stats, about, sections, contact, collaborate, footer, seo, theme |
| `app/(admin)/admin/<entity>/page.tsx` × 9 | create | List page per entity |
| `app/(admin)/admin/<entity>/new/page.tsx` × 9 | create | Create page per entity |
| `app/(admin)/admin/<entity>/[id]/page.tsx` × 9 | create | Edit page per entity |

**No file in `app/page.tsx`, `app/about/`, `app/blog/`, `app/contact/`, `app/projects/`, `app/tools/`, `components/sections/`, or `lib/data.ts` is touched.**

---

## Task 1: Install `zod` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add zod to dependencies**

Edit `package.json`. Add to `dependencies` (keep alphabetical):

```json
"zod": "^3.23.8"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes without errors; one new package added.

- [ ] **Step 3: Verify zod is importable**

Run:
```bash
npx tsx -e 'import("zod").then(m => console.log("zod version:", typeof m.z, "OK"))'
```
Expected: `zod version: object OK`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(admin): add zod for server-action validation"
```

---

## Task 2: Create per-entity zod schemas

**Files:**
- Create: `lib/schemas/nav-item.ts`
- Create: `lib/schemas/social-link.ts`
- Create: `lib/schemas/tool.ts`
- Create: `lib/schemas/testimonial.ts`
- Create: `lib/schemas/faq.ts`
- Create: `lib/schemas/experience.ts`
- Create: `lib/schemas/education.ts`
- Create: `lib/schemas/certification.ts`
- Create: `lib/schemas/client-logo.ts`
- Create: `lib/schemas/site-settings.ts`

The schemas use shared FormData-friendly helpers (optional URL fields can be empty strings, checkboxes coerce from `"on"|undefined`, numbers from strings). Each schema is the source of truth for both validation and TypeScript types.

- [ ] **Step 1: Create `lib/schemas/_helpers.ts`**

```typescript
import { z } from "zod";

/** Optional URL field: empty string -> null. Accepts full URLs only. */
export const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .pipe(z.union([z.string().url(), z.null()]));

/** Optional text field: empty string -> null. */
export const optionalText = z
  .string()
  .transform((v) => (v.trim() === "" ? null : v))
  .pipe(z.union([z.string(), z.null()]));

/** Checkbox: "on" | undefined -> boolean. */
export const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

/** Integer from FormData string. */
export const intField = z.coerce.number().int();
```

- [ ] **Step 2: Create `lib/schemas/nav-item.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField } from "./_helpers";

export const NavItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(50),
  href: z.string().trim().min(1, "Href is required").max(500),
  iconKey: z.string().trim().min(1).max(50).default("link"),
  order: intField.nonnegative().default(0),
  external: checkbox.default(false),
  visible: checkbox.default(true),
});

export type NavItemInput = z.infer<typeof NavItemSchema>;
```

- [ ] **Step 3: Create `lib/schemas/social-link.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField } from "./_helpers";

export const SocialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(50),
  url: z.string().trim().url("Must be a valid URL").max(2000),
  iconKey: z.string().trim().min(1).max(50),
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type SocialLinkInput = z.infer<typeof SocialLinkSchema>;
```

- [ ] **Step 4: Create `lib/schemas/tool.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ToolSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText,
  category: optionalText,
  iconUrl: optionalUrl,
  iconPublicId: optionalText,
  iconExternalUrl: optionalUrl,
  proficiency: intField.min(0).max(100).default(80),
  order: intField.nonnegative().default(0),
  showOnHome: checkbox.default(true),
  visible: checkbox.default(true),
});

export type ToolInput = z.infer<typeof ToolSchema>;
```

- [ ] **Step 5: Create `lib/schemas/testimonial.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const TestimonialSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: optionalText,
  company: optionalText,
  content: z.string().trim().min(1, "Quote is required").max(2000),
  avatarUrl: optionalUrl,
  avatarPublicId: optionalText,
  rating: intField.min(1).max(5).default(5),
  featured: checkbox.default(false),
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type TestimonialInput = z.infer<typeof TestimonialSchema>;
```

- [ ] **Step 6: Create `lib/schemas/faq.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText } from "./_helpers";

export const FaqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
  category: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type FaqInput = z.infer<typeof FaqSchema>;
```

- [ ] **Step 7: Create `lib/schemas/experience.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ExperienceSchema = z.object({
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  startDate: z.string().trim().min(1).max(50),  // "Jan 2026"
  endDate: optionalText,  // null when current=true
  current: checkbox.default(false),
  companyUrl: optionalUrl,
  logoUrl: optionalUrl,
  logoPublicId: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type ExperienceInput = z.infer<typeof ExperienceSchema>;
```

- [ ] **Step 8: Create `lib/schemas/education.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const EducationSchema = z.object({
  institution: z.string().trim().min(1).max(150),
  degree: z.string().trim().min(1).max(200),
  description: optionalText,
  startDate: z.string().trim().min(1).max(50),
  endDate: optionalText,
  current: checkbox.default(false),
  institutionUrl: optionalUrl,
  logoUrl: optionalUrl,
  logoPublicId: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type EducationInput = z.infer<typeof EducationSchema>;
```

- [ ] **Step 9: Create `lib/schemas/certification.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const CertificationSchema = z.object({
  institution: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(200),
  description: optionalText,
  startDate: z.string().trim().min(1).max(50),
  endDate: optionalText,
  credentialUrl: optionalUrl,
  logoUrl: optionalUrl,
  logoPublicId: optionalText,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type CertificationInput = z.infer<typeof CertificationSchema>;
```

- [ ] **Step 10: Create `lib/schemas/client-logo.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ClientLogoSchema = z.object({
  name: z.string().trim().min(1).max(100),
  logoUrl: z.string().trim().url("Must be a valid URL").max(2000),
  publicId: z.string().default(""),  // empty string when uploaded externally
  websiteUrl: optionalUrl,
  order: intField.nonnegative().default(0),
  visible: checkbox.default(true),
});

export type ClientLogoInput = z.infer<typeof ClientLogoSchema>;
```

- [ ] **Step 11: Create `lib/schemas/site-settings.ts`**

```typescript
import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(200),
  portraitUrl: optionalUrl,
  portraitPublicId: optionalText,
  ctaButtonLabel: z.string().trim().min(1).max(50),
  ctaButtonLink: z.string().trim().min(1).max(500),
  resumeUrl: optionalUrl,
  resumePublicId: optionalText,
});

export const HeroSchema = z.object({
  heroHeadline: z.string().trim().min(1).max(200),
  heroSubtext: z.string().trim().max(2000).default(""),
  heroPrimaryCtaLabel: z.string().trim().min(1).max(50),
  heroPrimaryCtaLink: z.string().trim().min(1).max(500),
  heroSecondaryCtaLabel: z.string().trim().min(1).max(50),
  heroSecondaryCtaLink: z.string().trim().min(1).max(500),
});

export const StatsSchema = z.object({
  statYearsExperience: intField.nonnegative().default(0),
  statYearsLabel: z.string().trim().min(1).max(50),
  statProjects: intField.nonnegative().default(0),
  statProjectsLabel: z.string().trim().min(1).max(50),
  statClients: intField.nonnegative().default(0),
  statClientsLabel: z.string().trim().min(1).max(50),
  statsShowPlus: checkbox.default(true),
});

export const AboutSchema = z.object({
  aboutPageTitle: z.string().trim().min(1).max(200),
  aboutIntroContent: z.string().max(20000).default(""),
  experienceHeading: z.string().trim().min(1).max(200),
  educationHeading: z.string().trim().min(1).max(200),
  certificationHeading: z.string().trim().min(1).max(200),
});

export const SectionsSchema = z.object({
  trustedByHeading: z.string().trim().min(1).max(200),
  recentProjectsHeading: z.string().trim().min(1).max(200),
  recentProjectsLimit: intField.min(1).max(50).default(4),
  toolsSectionHeading: z.string().trim().min(1).max(200),
  testimonialsHeading: z.string().trim().min(1).max(200),
  blogSectionHeading: z.string().trim().min(1).max(200),
  blogSectionLimit: intField.min(1).max(50).default(4),
  faqHeading: z.string().trim().min(1).max(200),
  projectsPageTitle: z.string().trim().min(1).max(200),
  projectsPageSubtitle: optionalText,
  blogPageTitle: z.string().trim().min(1).max(200),
  blogPageSubtitle: optionalText,
  toolsPageTitle: z.string().trim().min(1).max(200),
  toolsPageSubtitle: optionalText,
});

export const ContactSchema = z.object({
  contactPageTitle: z.string().trim().min(1).max(200),
  contactPageSubtitle: optionalText,
  contactEmail: optionalText,
  contactPhone: optionalText,
  contactLocationText: optionalText,
  contactFormNameLabel: z.string().trim().min(1).max(50),
  contactFormEmailLabel: z.string().trim().min(1).max(50),
  contactFormMessageLabel: z.string().trim().min(1).max(50),
  contactFormSubmitLabel: z.string().trim().min(1).max(50),
  contactSuccessMessage: z.string().trim().min(1).max(500),
});

export const CollaborateSchema = z.object({
  ctaSectionLineOne: z.string().trim().min(1).max(100),
  ctaSectionLineTwo: z.string().trim().min(1).max(100),
  ctaSectionText: z.string().trim().max(2000).default(""),
  ctaSectionButtonLabel: z.string().trim().min(1).max(50),
  ctaSectionButtonLink: z.string().trim().min(1).max(500),
});

export const FooterSchema = z.object({
  footerText: z.string().trim().min(1).max(500),
  footerShowYear: checkbox.default(true),
  footerCopyright: optionalText,
});

export const SeoSchema = z.object({
  siteName: z.string().trim().min(1).max(200),
  siteDescription: z.string().trim().max(2000).default(""),
  siteKeywords: optionalText,
  ogImage: optionalUrl,
  ogImagePublicId: optionalText,
  faviconUrl: optionalUrl,
  faviconPublicId: optionalText,
});

export const ThemeSchema = z.object({
  primaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, "Must be a hex color"),
  accentColor: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/), z.null()])),
});
```

- [ ] **Step 12: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add lib/schemas/
git commit -m "feat(admin): zod schemas for 10 admin entities + sub-section site settings"
```

---

## Task 3: Create per-entity cached read helpers

**Files:**
- Create: `lib/db/site-settings.ts`
- Create: `lib/db/nav-items.ts`
- Create: `lib/db/social-links.ts`
- Create: `lib/db/tools.ts`
- Create: `lib/db/testimonials.ts`
- Create: `lib/db/faqs.ts`
- Create: `lib/db/experience.ts`
- Create: `lib/db/education.ts`
- Create: `lib/db/certifications.ts`
- Create: `lib/db/client-logos.ts`

These use React's `cache()` to dedupe per-request reads. They return Prisma row types; admin pages consume them directly.

- [ ] **Step 1: Create `lib/db/site-settings.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const getSiteSettings = cache(async () => {
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
});
```

- [ ] **Step 2: Create `lib/db/nav-items.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listNavItems = cache(() =>
  prisma.navItem.findMany({ orderBy: { order: "asc" } }),
);

export const getNavItem = cache((id: string) =>
  prisma.navItem.findUnique({ where: { id } }),
);
```

- [ ] **Step 3: Create `lib/db/social-links.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listSocialLinks = cache(() =>
  prisma.socialLink.findMany({ orderBy: { order: "asc" } }),
);

export const getSocialLink = cache((id: string) =>
  prisma.socialLink.findUnique({ where: { id } }),
);
```

- [ ] **Step 4: Create `lib/db/tools.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listTools = cache(() =>
  prisma.tool.findMany({ orderBy: { order: "asc" } }),
);

export const getTool = cache((id: string) =>
  prisma.tool.findUnique({ where: { id } }),
);
```

- [ ] **Step 5: Create `lib/db/testimonials.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listTestimonials = cache(() =>
  prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
);

export const getTestimonial = cache((id: string) =>
  prisma.testimonial.findUnique({ where: { id } }),
);
```

- [ ] **Step 6: Create `lib/db/faqs.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listFaqs = cache(() =>
  prisma.fAQ.findMany({ orderBy: { order: "asc" } }),
);

export const getFaq = cache((id: string) =>
  prisma.fAQ.findUnique({ where: { id } }),
);
```

- [ ] **Step 7: Create `lib/db/experience.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listExperience = cache(() =>
  prisma.experience.findMany({ orderBy: { order: "asc" } }),
);

export const getExperience = cache((id: string) =>
  prisma.experience.findUnique({ where: { id } }),
);
```

- [ ] **Step 8: Create `lib/db/education.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listEducation = cache(() =>
  prisma.education.findMany({ orderBy: { order: "asc" } }),
);

export const getEducation = cache((id: string) =>
  prisma.education.findUnique({ where: { id } }),
);
```

- [ ] **Step 9: Create `lib/db/certifications.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listCertifications = cache(() =>
  prisma.certification.findMany({ orderBy: { order: "asc" } }),
);

export const getCertification = cache((id: string) =>
  prisma.certification.findUnique({ where: { id } }),
);
```

- [ ] **Step 10: Create `lib/db/client-logos.ts`**

```typescript
import { cache } from "react";
import { prisma } from "./client";

export const listClientLogos = cache(() =>
  prisma.clientLogo.findMany({ orderBy: { order: "asc" } }),
);

export const getClientLogo = cache((id: string) =>
  prisma.clientLogo.findUnique({ where: { id } }),
);
```

- [ ] **Step 11: Type-check + commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add lib/db/
git commit -m "feat(admin): cached per-entity read helpers"
```

---

## Task 4: Field primitive components

**Files:**
- Create: `components/admin/field/text-field.tsx`
- Create: `components/admin/field/text-area-field.tsx`
- Create: `components/admin/field/number-field.tsx`
- Create: `components/admin/field/boolean-field.tsx`
- Create: `components/admin/field/url-field.tsx`
- Create: `components/admin/field/select-field.tsx`
- Create: `components/admin/field/field-error.tsx`

These are Server Components. They take a `name`, optional `label`, `defaultValue`, `required`, and a render-prop-style `error` string. Centralizing them means error styling, label markup, and accessibility live in one place.

- [ ] **Step 1: Create `components/admin/field/field-error.tsx`**

```typescript
type FieldErrorProps = { error?: string | null };

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-red-400 mt-1">
      {error}
    </p>
  );
}
```

- [ ] **Step 2: Create `components/admin/field/text-field.tsx`**

```typescript
import { FieldError } from "./field-error";

type TextFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  type?: "text" | "email" | "password";
};

export function TextField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  error,
  type = "text",
}: TextFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      <FieldError error={error} />
    </label>
  );
}
```

- [ ] **Step 3: Create `components/admin/field/text-area-field.tsx`**

```typescript
import { FieldError } from "./field-error";

type TextAreaFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
  error?: string | null;
  help?: string;
};

export function TextAreaField({
  name,
  label,
  defaultValue,
  required,
  rows = 4,
  error,
  help,
}: TextAreaFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        rows={rows}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
      <FieldError error={error} />
    </label>
  );
}
```

- [ ] **Step 4: Create `components/admin/field/number-field.tsx`**

```typescript
import { FieldError } from "./field-error";

type NumberFieldProps = {
  name: string;
  label: string;
  defaultValue?: number | null;
  required?: boolean;
  min?: number;
  max?: number;
  error?: string | null;
};

export function NumberField({
  name,
  label,
  defaultValue,
  required,
  min,
  max,
  error,
}: NumberFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <input
        name={name}
        type="number"
        defaultValue={defaultValue ?? 0}
        required={required}
        min={min}
        max={max}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      <FieldError error={error} />
    </label>
  );
}
```

- [ ] **Step 5: Create `components/admin/field/boolean-field.tsx`**

```typescript
import { FieldError } from "./field-error";

type BooleanFieldProps = {
  name: string;
  label: string;
  defaultValue?: boolean;
  error?: string | null;
};

export function BooleanField({
  name,
  label,
  defaultValue,
  error,
}: BooleanFieldProps) {
  return (
    <label className="flex items-center gap-2 mb-4 cursor-pointer">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultValue ?? false}
        className="h-4 w-4 rounded border-border bg-card text-accent-purple focus:ring-accent-purple"
      />
      <span className="text-sm">{label}</span>
      <FieldError error={error} />
    </label>
  );
}
```

- [ ] **Step 6: Create `components/admin/field/url-field.tsx`**

```typescript
import { FieldError } from "./field-error";

type UrlFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
};

export function UrlField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  error,
}: UrlFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <input
        name={name}
        type="url"
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder ?? "https://"}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      <FieldError error={error} />
    </label>
  );
}
```

- [ ] **Step 7: Create `components/admin/field/select-field.tsx`**

```typescript
import { FieldError } from "./field-error";

type SelectFieldProps = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  error?: string | null;
};

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  required,
  error,
}: SelectFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError error={error} />
    </label>
  );
}
```

- [ ] **Step 8: Type-check + commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add components/admin/field/
git commit -m "feat(admin): form field primitives (text, textarea, number, boolean, url, select)"
```

---

## Task 5: Form, table, delete, and toggle helpers

**Files:**
- Create: `components/admin/form-section.tsx`
- Create: `components/admin/data-table.tsx`
- Create: `components/admin/delete-button.tsx`
- Create: `components/admin/visible-toggle.tsx`

- [ ] **Step 1: Create `components/admin/form-section.tsx`**

This is a layout wrapper for entity forms — renders title, optional subtitle, the children form fields, action buttons (Save/Cancel), and a top-level error banner when the action returns one.

```typescript
import Link from "next/link";

type FormSectionProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  topLevelError?: string | null;
  submitLabel?: string;
  children: React.ReactNode;
};

export function FormSection({
  title,
  subtitle,
  backHref,
  topLevelError,
  submitLabel = "Save",
  children,
}: FormSectionProps) {
  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        {backHref && (
          <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        )}
        <h1 className="text-2xl font-semibold mt-2">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </header>

      {topLevelError && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {topLevelError}
        </div>
      )}

      <div className="space-y-4">{children}</div>

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" className="rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90">
          {submitLabel}
        </button>
        {backHref && (
          <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/admin/data-table.tsx`**

```typescript
import Link from "next/link";
import { DeleteButton } from "./delete-button";
import { VisibleToggle } from "./visible-toggle";

type Column<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id: string; visible?: boolean }> = {
  rows: T[];
  columns: Column<T>[];
  editHref: (row: T) => string;
  /** Server Action bound (id) -> Promise<void>; renders inside <form action={...}> */
  deleteAction: (id: string) => Promise<unknown>;
  /** Server Action that takes FormData with id + visible */
  toggleVisibleAction?: (formData: FormData) => Promise<unknown>;
  emptyMessage?: string;
};

export function DataTable<T extends { id: string; visible?: boolean }>({
  rows,
  columns,
  editHref,
  deleteAction,
  toggleVisibleAction,
  emptyMessage = "No rows yet.",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-card/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left px-3 py-2 font-medium">
                {c.label}
              </th>
            ))}
            {toggleVisibleAction && <th className="px-3 py-2 font-medium">Visible</th>}
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
              {toggleVisibleAction && (
                <td className="px-3 py-2">
                  <VisibleToggle
                    id={row.id}
                    visible={row.visible ?? true}
                    action={toggleVisibleAction}
                  />
                </td>
              )}
              <td className="px-3 py-2 text-right">
                <Link
                  href={editHref(row)}
                  className="text-accent-purple hover:underline mr-3"
                >
                  Edit
                </Link>
                <DeleteButton id={row.id} action={deleteAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/admin/delete-button.tsx`**

```typescript
"use client";
import { useState, useTransition } from "react";

type DeleteButtonProps = {
  id: string;
  action: (id: string) => Promise<unknown>;
  label?: string;
};

export function DeleteButton({ id, action, label = "Delete" }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-red-300">Confirm?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => action(id).then(() => setConfirming(false)))}
          className="text-red-400 hover:underline text-sm"
        >
          {pending ? "Deleting…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-muted-foreground hover:underline text-sm"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-red-400 hover:underline"
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 4: Create `components/admin/visible-toggle.tsx`**

```typescript
"use client";
import { useTransition } from "react";

type VisibleToggleProps = {
  id: string;
  visible: boolean;
  action: (formData: FormData) => Promise<unknown>;
};

export function VisibleToggle({ id, visible, action }: VisibleToggleProps) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) =>
        startTransition(() => {
          fd.set("id", id);
          fd.set("visible", visible ? "false" : "true");
          return action(fd) as Promise<void>;
        })
      }
    >
      <button
        type="submit"
        disabled={pending}
        aria-label={visible ? "Hide" : "Show"}
        className={
          "h-5 w-9 rounded-full transition " +
          (visible ? "bg-accent-purple" : "bg-muted")
        }
      >
        <span
          className={
            "block h-4 w-4 rounded-full bg-white transition transform " +
            (visible ? "translate-x-4" : "translate-x-0.5")
          }
        />
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Type-check + commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add components/admin/
git commit -m "feat(admin): form-section + data-table + delete-button + visible-toggle helpers"
```

---

## Task 6: Sidebar nav

**Files:**
- Create: `components/admin/sidebar.tsx`
- Create: `actions/auth.ts` (logoutAction only — login comes in Task 8)

Sidebar is a Server Component. The logout button is a tiny `<form>` whose action is `logoutAction`.

- [ ] **Step 1: Create `actions/auth.ts` (logoutAction)**

```typescript
"use server";
import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth/session";

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
```

(The `loginAction` is added in Task 8.)

- [ ] **Step 2: Create `components/admin/sidebar.tsx`**

```typescript
import Link from "next/link";
import { logoutAction } from "@/actions/auth";

type NavLink = { href: string; label: string };

const SETTINGS: NavLink[] = [
  { href: "/admin/site-settings/profile", label: "Profile" },
  { href: "/admin/site-settings/hero", label: "Hero" },
  { href: "/admin/site-settings/stats", label: "Stats" },
  { href: "/admin/site-settings/about", label: "About" },
  { href: "/admin/site-settings/sections", label: "Sections" },
  { href: "/admin/site-settings/contact", label: "Contact" },
  { href: "/admin/site-settings/collaborate", label: "Collaborate" },
  { href: "/admin/site-settings/footer", label: "Footer" },
  { href: "/admin/site-settings/seo", label: "SEO" },
  { href: "/admin/site-settings/theme", label: "Theme" },
];

const CONTENT: NavLink[] = [
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
];

const ABOUT: NavLink[] = [
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/certifications", label: "Certifications" },
];

const NAVIGATION: NavLink[] = [
  { href: "/admin/nav-items", label: "Nav items" },
  { href: "/admin/social-links", label: "Social links" },
];

function Group({ heading, links }: { heading: string; links: NavLink[] }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-2">
        {heading}
      </h3>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block px-3 py-1.5 text-sm rounded-md hover:bg-card transition"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-border">
        <div className="text-sm font-semibold">Portfolio Admin</div>
        <div className="text-xs text-muted-foreground truncate">
          {process.env.ADMIN_EMAIL ?? ""}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <Link
          href="/admin"
          className="block px-3 py-1.5 text-sm font-medium rounded-md hover:bg-card mb-4"
        >
          Dashboard
        </Link>
        <Group heading="Settings" links={SETTINGS} />
        <Group heading="Content" links={CONTENT} />
        <Group heading="About" links={ABOUT} />
        <Group heading="Navigation" links={NAVIGATION} />
      </nav>

      <form action={logoutAction} className="p-4 border-t border-border">
        <button
          type="submit"
          className="w-full text-sm text-left px-3 py-2 rounded-md hover:bg-card text-muted-foreground"
        >
          Log out
        </button>
      </form>
    </aside>
  );
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add actions/auth.ts components/admin/sidebar.tsx
git commit -m "feat(admin): sidebar nav + logoutAction"
```

---

## Task 7: Cloudinary upload Server Action + ImageUploader client component

**Files:**
- Create: `actions/upload.ts`
- Create: `components/admin/image-uploader.tsx`

- [ ] **Step 1: Create `actions/upload.ts`**

```typescript
"use server";
import { requireAdmin } from "@/lib/auth/guard";
import { signUpload, type CloudinaryFolder } from "@/lib/cloudinary/signature";

export async function signCloudinaryUpload(folder: CloudinaryFolder) {
  await requireAdmin();
  return signUpload(folder);
}
```

- [ ] **Step 2: Create `components/admin/image-uploader.tsx`**

```typescript
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { signCloudinaryUpload } from "@/actions/upload";

type CloudinaryFolder =
  | "projects"
  | "blog"
  | "tools"
  | "testimonials"
  | "logos"
  | "experience"
  | "education"
  | "certifications"
  | "site";

type ImageUploaderProps = {
  folder: CloudinaryFolder;
  name: string;
  publicIdName: string;
  initialUrl?: string | null;
  initialPublicId?: string | null;
  label: string;
  required?: boolean;
};

type State = {
  status: "idle" | "signing" | "uploading" | "done" | "error";
  url: string;
  publicId: string;
  oldPublicId: string;
  error?: string;
};

export function ImageUploader({
  folder,
  name,
  publicIdName,
  initialUrl,
  initialPublicId,
  label,
  required,
}: ImageUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({
    status: initialUrl ? "done" : "idle",
    url: initialUrl ?? "",
    publicId: initialPublicId ?? "",
    oldPublicId: initialPublicId ?? "",
  });

  async function handleFile(file: File) {
    setState((s) => ({ ...s, status: "signing", error: undefined }));
    let signed;
    try {
      signed = await signCloudinaryUpload(folder);
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: "Could not get upload signature" }));
      return;
    }

    setState((s) => ({ ...s, status: "uploading" }));
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
    if (!res.ok) {
      setState((s) => ({ ...s, status: "error", error: "Cloudinary upload failed" }));
      return;
    }
    const data = (await res.json()) as { secure_url: string; public_id: string };
    setState((s) => ({
      status: "done",
      url: data.secure_url,
      publicId: data.public_id,
      oldPublicId: s.oldPublicId,
    }));
  }

  return (
    <div className="mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>

      <input type="hidden" name={name} value={state.url} />
      <input type="hidden" name={publicIdName} value={state.publicId} />
      {state.oldPublicId && state.oldPublicId !== state.publicId && (
        <input type="hidden" name={`${name}__oldPublicId`} value={state.oldPublicId} />
      )}

      {state.status === "done" && state.url && (
        <div className="flex items-center gap-4 mb-2">
          <div className="relative h-24 w-24 rounded-md overflow-hidden bg-card border border-border">
            <Image src={state.url} alt={label} fill sizes="96px" />
          </div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="text-sm text-accent-purple hover:underline"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => setState({ status: "idle", url: "", publicId: "", oldPublicId: state.oldPublicId })}
            className="text-sm text-muted-foreground hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {state.status !== "done" && (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="border-2 border-dashed border-border rounded-md px-4 py-6 text-sm text-muted-foreground hover:border-accent-purple hover:text-foreground transition w-full"
          disabled={state.status === "signing" || state.status === "uploading"}
        >
          {state.status === "signing" && "Preparing…"}
          {state.status === "uploading" && "Uploading…"}
          {(state.status === "idle" || state.status === "error") && "Click to choose an image"}
        </button>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {state.error && <p className="text-sm text-red-400 mt-1">{state.error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Configure Next image domains for Cloudinary**

Find `next.config.ts` (or `next.config.js`). Add `images.remotePatterns` for `res.cloudinary.com` if not already present:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "skillicons.dev" },
    ],
  },
};
export default nextConfig;
```

(Keep any existing config; only add the missing remotePatterns entries.)

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add actions/upload.ts components/admin/image-uploader.tsx next.config.ts
git commit -m "feat(admin): signCloudinaryUpload action + ImageUploader client component"
```

---

## Task 8: Login page + loginAction

**Files:**
- Modify: `actions/auth.ts` (add `loginAction`)
- Create: `app/(admin-public)/admin/login/page.tsx`
- Create: `app/(admin-public)/admin/login/login-form.tsx`
- Create: `app/(admin-public)/admin/layout.tsx`

The `(admin-public)` route group has its own minimal layout (no sidebar, no `requireAdmin()`). The login form lives in a thin `'use client'` component so it can use `useActionState`.

- [ ] **Step 1: Add `loginAction` to `actions/auth.ts`**

Replace the file with:

```typescript
"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid credentials" };

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) return { error: "Server misconfigured" };

  const emailOk =
    parsed.data.email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passwordOk = emailOk
    ? await verifyPassword(parsed.data.password, adminHash)
    : false;

  if (!emailOk || !passwordOk) return { error: "Invalid credentials" };

  const token = await signSession({ sub: "admin" });
  await setSessionCookie(token);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
```

- [ ] **Step 2: Create `app/(admin-public)/admin/layout.tsx`**

```typescript
export default function AdminPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
```

- [ ] **Step 3: Create `app/(admin-public)/admin/login/login-form.tsx`**

```typescript
"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium mb-1">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create `app/(admin-public)/admin/login/page.tsx`**

```typescript
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Admin login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify build + runtime login**

Run: `npm run build`
Expected: clean. `/admin/login` appears in the route output.

Start dev server (`npm run dev`) in one terminal. In another:
```bash
curl -s http://localhost:3000/admin/login | grep -o "Admin login" | head -1
```
Expected: `Admin login`.

Test the redirect-when-logged-in path: open the login page in a browser, submit wrong credentials → expect "Invalid credentials". Submit correct creds (your `.env` values) → expect redirect to `/admin`. Since `/admin` isn't built yet (Task 9), you'll get a 404 redirect target — that's fine for now. Confirm the `admin_session` cookie is set in DevTools.

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add actions/auth.ts app/\(admin-public\)
git commit -m "feat(admin): login page + loginAction (validates env credentials, sets jose cookie)"
```

(On Windows shells the parentheses may not need escaping — use the shell's native syntax.)

---

## Task 9: Admin layout + dashboard home

**Files:**
- Create: `app/(admin)/admin/layout.tsx`
- Create: `app/(admin)/admin/page.tsx`

- [ ] **Step 1: Create `app/(admin)/admin/layout.tsx`**

```typescript
import { requireAdmin } from "@/lib/auth/guard";
import { Sidebar } from "@/components/admin/sidebar";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(admin)/admin/page.tsx`**

```typescript
import Link from "next/link";
import { prisma } from "@/lib/db/client";

export const metadata = { title: "Admin dashboard" };

type CardProps = {
  label: string;
  count: number;
  href: string;
};

function Card({ label, count, href }: CardProps) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-border bg-card p-4 hover:border-accent-purple transition"
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{count}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [
    navItems,
    socials,
    tools,
    testimonials,
    faqs,
    experience,
    education,
    certifications,
    clientLogos,
    projects,
    blogPosts,
  ] = await Promise.all([
    prisma.navItem.count(),
    prisma.socialLink.count(),
    prisma.tool.count(),
    prisma.testimonial.count(),
    prisma.fAQ.count(),
    prisma.experience.count(),
    prisma.education.count(),
    prisma.certification.count(),
    prisma.clientLogo.count(),
    prisma.project.count(),
    prisma.blogPost.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Site settings
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Site settings" count={1} href="/admin/site-settings" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Content
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Tools" count={tools} href="/admin/tools" />
          <Card label="Testimonials" count={testimonials} href="/admin/testimonials" />
          <Card label="FAQs" count={faqs} href="/admin/faqs" />
          <Card label="Client logos" count={clientLogos} href="/admin/client-logos" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          About
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Experience" count={experience} href="/admin/experience" />
          <Card label="Education" count={education} href="/admin/education" />
          <Card label="Certifications" count={certifications} href="/admin/certifications" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Navigation
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Nav items" count={navItems} href="/admin/nav-items" />
          <Card label="Social links" count={socials} href="/admin/social-links" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Deferred (Phase 2B)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 opacity-60">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Projects
            </div>
            <div className="text-2xl font-semibold mt-1">{projects}</div>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Blog posts
            </div>
            <div className="text-2xl font-semibold mt-1">{blogPosts}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Build + dev runtime test**

Run: `npm run build`
Expected: clean.

Start dev server. Visit `http://localhost:3000/admin/dashboard` (not yet a real route, but the proxy gate should kick in) — actually visit `http://localhost:3000/admin`. Behavior:
- Without cookie: 307 redirect to `/admin/login`.
- After login: `/admin` renders the dashboard with all the count cards.
- Logout button in sidebar clears the cookie; revisiting `/admin` redirects to login.

```bash
# verify proxy still works
curl -sI http://localhost:3000/admin | head -3
# Expected: HTTP/1.1 307 Temporary Redirect; location: /admin/login
```

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/\(admin\)/admin/layout.tsx app/\(admin\)/admin/page.tsx
git commit -m "feat(admin): admin layout (requireAdmin + sidebar) + dashboard home"
```

---

## Task 10: Tools CRUD (canonical pattern — repeat for other entities)

**Files:**
- Create: `actions/tools.ts`
- Create: `app/(admin)/admin/tools/page.tsx`
- Create: `app/(admin)/admin/tools/new/page.tsx`
- Create: `app/(admin)/admin/tools/[id]/page.tsx`
- Create: `app/(admin)/admin/tools/tool-form.tsx`  (shared form between new + edit)

Tools is the first entity. Its image field uses `ImageUploader`. The same pattern repeats for the next 9 entities — Tasks 11-17 copy this structure with entity-specific schema and field set.

- [ ] **Step 1: Create `actions/tools.ts`**

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import { ToolSchema } from "@/lib/schemas/tool";

export type ToolFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function extractOldPublicId(formData: FormData): string | null {
  const v = formData.get("iconUrl__oldPublicId");
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function createTool(
  _prev: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdmin();
  const parsed = ToolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  await prisma.tool.create({ data: parsed.data });
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function updateTool(
  id: string,
  _prev: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  await requireAdmin();
  const obj = Object.fromEntries(formData);
  const parsed = ToolSchema.safeParse(obj);
  if (!parsed.success) {
    return { error: "Invalid input", issues: parsed.error.format() };
  }
  const oldPublicId = extractOldPublicId(formData);
  if (oldPublicId && oldPublicId !== parsed.data.iconPublicId) {
    await deleteImage(oldPublicId);
  }
  await prisma.tool.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function deleteTool(id: string) {
  await requireAdmin();
  const t = await prisma.tool.findUnique({ where: { id } });
  if (t?.iconPublicId) await deleteImage(t.iconPublicId);
  await prisma.tool.delete({ where: { id } });
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function toggleVisibleTool(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.tool.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/tools");
}
```

- [ ] **Step 2: Create `app/(admin)/admin/tools/tool-form.tsx`**

```typescript
"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { ToolFormState } from "@/actions/tools";

type ToolFormProps = {
  initial?: {
    id?: string;
    name?: string;
    description?: string | null;
    category?: string | null;
    iconUrl?: string | null;
    iconPublicId?: string | null;
    iconExternalUrl?: string | null;
    proficiency?: number;
    order?: number;
    showOnHome?: boolean;
    visible?: boolean;
  };
  action: (prev: ToolFormState, fd: FormData) => Promise<ToolFormState>;
  submitLabel: string;
};

export function ToolForm({ initial, action, submitLabel }: ToolFormProps) {
  const [state, formAction] = useActionState<ToolFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit tool" : "New tool"}
        backHref="/admin/tools"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField
          name="name"
          label="Name"
          required
          defaultValue={initial?.name}
          error={err("name")}
        />
        <TextAreaField
          name="description"
          label="Description"
          defaultValue={initial?.description}
          rows={3}
          error={err("description")}
        />
        <TextField
          name="category"
          label="Category"
          defaultValue={initial?.category}
          error={err("category")}
        />
        <ImageUploader
          folder="tools"
          name="iconUrl"
          publicIdName="iconPublicId"
          initialUrl={initial?.iconUrl}
          initialPublicId={initial?.iconPublicId}
          label="Icon (uploaded)"
        />
        <UrlField
          name="iconExternalUrl"
          label="External icon URL (e.g. skillicons.dev)"
          defaultValue={initial?.iconExternalUrl}
          error={err("iconExternalUrl")}
        />
        <NumberField
          name="proficiency"
          label="Proficiency (0–100)"
          defaultValue={initial?.proficiency ?? 80}
          min={0}
          max={100}
          error={err("proficiency")}
        />
        <NumberField
          name="order"
          label="Order"
          defaultValue={initial?.order ?? 0}
          min={0}
          error={err("order")}
        />
        <BooleanField
          name="showOnHome"
          label="Show on home page"
          defaultValue={initial?.showOnHome ?? true}
        />
        <BooleanField
          name="visible"
          label="Visible"
          defaultValue={initial?.visible ?? true}
        />
      </FormSection>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/(admin)/admin/tools/new/page.tsx`**

```typescript
import { createTool } from "@/actions/tools";
import { ToolForm } from "../tool-form";

export const metadata = { title: "New tool" };

export default function NewToolPage() {
  return <ToolForm action={createTool} submitLabel="Create tool" />;
}
```

- [ ] **Step 4: Create `app/(admin)/admin/tools/[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { getTool } from "@/lib/db/tools";
import { updateTool } from "@/actions/tools";
import { ToolForm } from "../tool-form";

export const metadata = { title: "Edit tool" };

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await getTool(id);
  if (!tool) notFound();

  const boundAction = updateTool.bind(null, tool.id);
  return (
    <ToolForm
      initial={{
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        iconUrl: tool.iconUrl,
        iconPublicId: tool.iconPublicId,
        iconExternalUrl: tool.iconExternalUrl,
        proficiency: tool.proficiency,
        order: tool.order,
        showOnHome: tool.showOnHome,
        visible: tool.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
```

- [ ] **Step 5: Create `app/(admin)/admin/tools/page.tsx`**

```typescript
import Link from "next/link";
import { listTools } from "@/lib/db/tools";
import { deleteTool, toggleVisibleTool } from "@/actions/tools";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Tools — admin" };

export default async function ToolsListPage() {
  const tools = await listTools();
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
      <DataTable
        rows={tools}
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "order", label: "Order" },
        ]}
        editHref={(t) => `/admin/tools/${t.id}`}
        deleteAction={deleteTool}
        toggleVisibleAction={toggleVisibleTool}
      />
    </div>
  );
}
```

- [ ] **Step 6: Build + manual runtime test**

Run: `npm run build`
Expected: clean.

Start dev server. Log in. Visit `/admin/tools`:
- 8 rows visible.
- Click "+ New tool". Submit with name "Test tool", proficiency 50, no image. After save: redirected to `/admin/tools`, 9 rows visible.
- Click "Edit" on the new row. Change name to "Test tool (renamed)". Save. Verify rename.
- Upload an icon image (any PNG/JPG). After upload: preview appears. Save. Verify the Cloudinary asset exists in the dashboard and `prisma.tool.findFirst({ where: { name: "Test tool (renamed)" } })` returns the new URL.
- Click "Delete" on the test row. Confirm. Verify removed, Cloudinary asset deleted.
- Toggle visibility on an existing row. Verify the DB column flipped via Prisma Studio or a quick `npx tsx -e` query.

Stop dev server.

- [ ] **Step 7: Commit**

```bash
git add actions/tools.ts app/\(admin\)/admin/tools
git commit -m "feat(admin): tools CRUD (canonical pattern: list + new + edit + delete + toggle)"
```

---

## Task 11: Testimonials CRUD

**Files mirror Task 10.** Replace "tool" with "testimonial", `prisma.tool` with `prisma.testimonial`, `ToolSchema` with `TestimonialSchema`, `iconUrl/iconPublicId` with `avatarUrl/avatarPublicId`, and the field set with the testimonial fields.

- [ ] **Step 1: Create `actions/testimonials.ts`** — copy `actions/tools.ts`, then substitute:
  - `tool` / `Tool` / `tools` → `testimonial` / `Testimonial` / `testimonials`
  - `ToolSchema` → `TestimonialSchema`
  - Replace `iconUrl__oldPublicId` references with `avatarUrl__oldPublicId`
  - In `deleteTestimonial`: `if (t?.avatarPublicId) await deleteImage(t.avatarPublicId)`
  - In `updateTestimonial`: use `avatarPublicId` field on the parsed data
  - Cloudinary folder for testimonials is `"testimonials"` (already in CloudinaryFolder type)
  - Path for revalidate/redirect: `/admin/testimonials`

- [ ] **Step 2: Create `app/(admin)/admin/testimonials/testimonial-form.tsx`** — copy `tool-form.tsx`, then replace fields with:

```typescript
<TextField name="name" label="Name" required defaultValue={initial?.name} error={err("name")} />
<TextField name="role" label="Role" defaultValue={initial?.role} error={err("role")} />
<TextField name="company" label="Company" defaultValue={initial?.company} error={err("company")} />
<TextAreaField name="content" label="Quote" required rows={5} defaultValue={initial?.content} error={err("content")} />
<ImageUploader folder="testimonials" name="avatarUrl" publicIdName="avatarPublicId" initialUrl={initial?.avatarUrl} initialPublicId={initial?.avatarPublicId} label="Avatar" />
<NumberField name="rating" label="Rating (1–5)" min={1} max={5} defaultValue={initial?.rating ?? 5} error={err("rating")} />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="featured" label="Featured" defaultValue={initial?.featured ?? false} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

The `initial` type accepts `{ id?, name, role?, company?, content, avatarUrl?, avatarPublicId?, rating, order, featured, visible }`.

- [ ] **Step 3: Create `app/(admin)/admin/testimonials/new/page.tsx`** — mirror tools/new with `createTestimonial`.

- [ ] **Step 4: Create `app/(admin)/admin/testimonials/[id]/page.tsx`** — mirror tools/[id] with `getTestimonial` and `updateTestimonial.bind(null, t.id)`.

- [ ] **Step 5: Create `app/(admin)/admin/testimonials/page.tsx`** — mirror tools/page.tsx. Table columns:

```typescript
columns={[
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "rating", label: "Rating" },
  { key: "order", label: "Order" },
]}
```

- [ ] **Step 6: Runtime test**

Run dev server. `/admin/testimonials` shows 1 row (seeded). Create a new testimonial with an avatar upload, edit it, toggle visibility, delete it. Verify each via Prisma Studio / Cloudinary dashboard.

- [ ] **Step 7: Commit**

```bash
git add actions/testimonials.ts app/\(admin\)/admin/testimonials
git commit -m "feat(admin): testimonials CRUD"
```

---

## Task 12: FAQs CRUD

Simplest entity — no image field. Mirror Task 10 with these substitutions.

- [ ] **Step 1: Create `actions/faqs.ts`** — copy `actions/tools.ts`, then substitute:
  - `tool` → `faq` (and `Tool` → `Faq` for the type name; **Prisma client property is `prisma.fAQ`**)
  - `ToolSchema` → `FaqSchema`
  - Remove all image-handling code (`extractOldPublicId`, `deleteImage` calls). FAQ has no image.
  - In delete: just `await prisma.fAQ.delete({ where: { id } })`.
  - `toggleVisibleFaq` updates `prisma.fAQ`.

Final shape:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { FaqSchema } from "@/lib/schemas/faq";

export type FaqFormState = {
  error: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

export async function createFaq(_prev: FaqFormState, formData: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const parsed = FaqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.fAQ.create({ data: parsed.data });
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function updateFaq(id: string, _prev: FaqFormState, formData: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const parsed = FaqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };
  await prisma.fAQ.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  await prisma.fAQ.delete({ where: { id } });
  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

export async function toggleVisibleFaq(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const visible = formData.get("visible") === "true";
  await prisma.fAQ.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/faqs");
}
```

- [ ] **Step 2: Create `app/(admin)/admin/faqs/faq-form.tsx`** — mirror Task 10's form. Fields:

```typescript
<TextField name="question" label="Question" required defaultValue={initial?.question} error={err("question")} />
<TextAreaField name="answer" label="Answer" required rows={4} defaultValue={initial?.answer} error={err("answer")} />
<TextField name="category" label="Category" defaultValue={initial?.category} error={err("category")} />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

- [ ] **Step 3: Create `new/page.tsx`, `[id]/page.tsx`, `page.tsx`** — mirror Task 10.

List columns:
```typescript
columns={[
  { key: "question", label: "Question", render: (r) => r.question.length > 60 ? r.question.slice(0, 60) + "…" : r.question },
  { key: "category", label: "Category" },
  { key: "order", label: "Order" },
]}
```

- [ ] **Step 4: Runtime test + commit**

`/admin/faqs` shows 5 rows. Create + edit + delete + toggle, verify each.

```bash
git add actions/faqs.ts app/\(admin\)/admin/faqs
git commit -m "feat(admin): faqs CRUD"
```

---

## Task 13: Client logos CRUD

Has a required image (`logoUrl` + `publicId`). Note: schema field `publicId` is named `publicId` not `logoPublicId` — be careful.

- [ ] **Step 1: Create `actions/client-logos.ts`** — mirror Task 10, with:
  - `prisma.clientLogo`, `ClientLogoSchema`
  - Image field names: `logoUrl` + `publicId`
  - Image cleanup uses `publicId` (not `logoPublicId`)
  - Cloudinary folder: `"logos"`
  - `extractOldPublicId` looks for `logoUrl__oldPublicId`

- [ ] **Step 2: Create `app/(admin)/admin/client-logos/client-logo-form.tsx`** — fields:

```typescript
<TextField name="name" label="Name" required defaultValue={initial?.name} error={err("name")} />
<ImageUploader folder="logos" name="logoUrl" publicIdName="publicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.publicId} label="Logo" required />
<UrlField name="websiteUrl" label="Website URL" defaultValue={initial?.websiteUrl} error={err("websiteUrl")} />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

- [ ] **Step 3: Mirror `new/page.tsx`, `[id]/page.tsx`, `page.tsx`.** List columns:

```typescript
columns={[
  { key: "name", label: "Name" },
  { key: "order", label: "Order" },
]}
```

- [ ] **Step 4: Runtime test + commit**

`/admin/client-logos` shows 3 rows. Create + upload + edit + delete + toggle.

```bash
git add actions/client-logos.ts app/\(admin\)/admin/client-logos
git commit -m "feat(admin): client logos CRUD"
```

---

## Task 14: Nav items CRUD

No image. Mirror Task 12 (FAQs) pattern with `prisma.navItem` and `NavItemSchema`.

- [ ] **Step 1: Create `actions/nav-items.ts`** (mirror Task 12 without image code; use `NavItemSchema`).

- [ ] **Step 2: Create `app/(admin)/admin/nav-items/nav-item-form.tsx`** — fields:

```typescript
<TextField name="label" label="Label" required defaultValue={initial?.label} error={err("label")} />
<TextField name="href" label="Href" required defaultValue={initial?.href} error={err("href")} />
<TextField name="iconKey" label="Icon key" defaultValue={initial?.iconKey ?? "link"} error={err("iconKey")} />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="external" label="External link" defaultValue={initial?.external ?? false} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

- [ ] **Step 3: Mirror new/edit/list pages.** List columns:

```typescript
columns={[
  { key: "label", label: "Label" },
  { key: "href", label: "Href" },
  { key: "order", label: "Order" },
]}
```

- [ ] **Step 4: Runtime test + commit**

`/admin/nav-items` shows 6 rows. CRUD + toggle.

```bash
git add actions/nav-items.ts app/\(admin\)/admin/nav-items
git commit -m "feat(admin): nav items CRUD"
```

---

## Task 15: Social links CRUD

No image. Mirror Task 14.

- [ ] **Step 1: `actions/social-links.ts`** — `prisma.socialLink`, `SocialLinkSchema`. No image cleanup needed.

- [ ] **Step 2: Form fields**

```typescript
<TextField name="platform" label="Platform" required defaultValue={initial?.platform} error={err("platform")} />
<TextField name="label" label="Label" required defaultValue={initial?.label} error={err("label")} />
<UrlField name="url" label="URL" required defaultValue={initial?.url} error={err("url")} />
<TextField name="iconKey" label="Icon key" required defaultValue={initial?.iconKey} error={err("iconKey")} />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

- [ ] **Step 3: Pages + list columns**

```typescript
columns={[
  { key: "platform", label: "Platform" },
  { key: "label", label: "Label" },
  { key: "url", label: "URL" },
  { key: "order", label: "Order" },
]}
```

- [ ] **Step 4: Runtime test + commit**

`/admin/social-links` shows 5 rows. CRUD + toggle.

```bash
git add actions/social-links.ts app/\(admin\)/admin/social-links
git commit -m "feat(admin): social links CRUD"
```

---

## Task 16: Experience CRUD

Has logo image. Mirror Task 11's image pattern. The schema's `endDate` is null when `current` is true.

- [ ] **Step 1: `actions/experience.ts`** — `prisma.experience`, `ExperienceSchema`. Image folder: `"experience"`. Image field names: `logoUrl` + `logoPublicId`. `extractOldPublicId` looks for `logoUrl__oldPublicId`.

In the action, after `parsed.success`, normalize: if `parsed.data.current === true`, set `parsed.data.endDate = null`. This guarantees the DB has the invariant from the schema doc (`endDate` null when current).

- [ ] **Step 2: Form fields**

```typescript
<TextField name="company" label="Company" required defaultValue={initial?.company} error={err("company")} />
<TextField name="role" label="Role" required defaultValue={initial?.role} error={err("role")} />
<TextAreaField name="description" label="Description" required rows={4} defaultValue={initial?.description} error={err("description")} />
<TextField name="startDate" label="Start date" required placeholder="Jan 2026" defaultValue={initial?.startDate} error={err("startDate")} />
<TextField name="endDate" label="End date (leave blank if current)" placeholder="Dec 2025" defaultValue={initial?.endDate} error={err("endDate")} />
<BooleanField name="current" label="Currently here" defaultValue={initial?.current ?? false} />
<UrlField name="companyUrl" label="Company URL" defaultValue={initial?.companyUrl} error={err("companyUrl")} />
<ImageUploader folder="experience" name="logoUrl" publicIdName="logoPublicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.logoPublicId} label="Logo" />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

- [ ] **Step 3: Pages + list columns**

```typescript
columns={[
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End", render: (r) => r.current ? "Present" : (r.endDate ?? "—") },
  { key: "order", label: "Order" },
]}
```

- [ ] **Step 4: Runtime test + commit**

`/admin/experience` shows 5 rows. Test: edit Databrandix → toggle `current` off, set `endDate` to "May 2026" → save → verify. Then toggle back on, blank end date, save → verify endDate becomes null. Then upload a logo.

```bash
git add actions/experience.ts app/\(admin\)/admin/experience
git commit -m "feat(admin): experience CRUD with current/end-date invariant"
```

---

## Task 17: Education CRUD

Mirror Task 16 with `prisma.education`, `EducationSchema`, image folder `"education"`. Field set:

```typescript
<TextField name="institution" label="Institution" required defaultValue={initial?.institution} error={err("institution")} />
<TextField name="degree" label="Degree" required defaultValue={initial?.degree} error={err("degree")} />
<TextAreaField name="description" label="Description" rows={4} defaultValue={initial?.description} error={err("description")} />
<TextField name="startDate" label="Start date" required defaultValue={initial?.startDate} error={err("startDate")} />
<TextField name="endDate" label="End date" defaultValue={initial?.endDate} error={err("endDate")} />
<BooleanField name="current" label="Currently here" defaultValue={initial?.current ?? false} />
<UrlField name="institutionUrl" label="Institution URL" defaultValue={initial?.institutionUrl} error={err("institutionUrl")} />
<ImageUploader folder="education" name="logoUrl" publicIdName="logoPublicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.logoPublicId} label="Logo" />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

List columns:

```typescript
columns={[
  { key: "institution", label: "Institution" },
  { key: "degree", label: "Degree" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End", render: (r) => r.current ? "Present" : (r.endDate ?? "—") },
]}
```

- [ ] **Steps + commit**

Same shape as Task 16. Verify against the 3 seeded rows.

```bash
git add actions/education.ts app/\(admin\)/admin/education
git commit -m "feat(admin): education CRUD"
```

---

## Task 18: Certifications CRUD

Mirror Task 17 with `prisma.certification`, `CertificationSchema`, image folder `"certifications"`. No `current` field (certifications have explicit end dates). Field set:

```typescript
<TextField name="institution" label="Institution" required defaultValue={initial?.institution} error={err("institution")} />
<TextField name="title" label="Title" required defaultValue={initial?.title} error={err("title")} />
<TextAreaField name="description" label="Description" rows={4} defaultValue={initial?.description} error={err("description")} />
<TextField name="startDate" label="Start date" required defaultValue={initial?.startDate} error={err("startDate")} />
<TextField name="endDate" label="End date" defaultValue={initial?.endDate} error={err("endDate")} />
<UrlField name="credentialUrl" label="Credential URL" defaultValue={initial?.credentialUrl} error={err("credentialUrl")} />
<ImageUploader folder="certifications" name="logoUrl" publicIdName="logoPublicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.logoPublicId} label="Logo" />
<NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
<BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
```

List columns:

```typescript
columns={[
  { key: "institution", label: "Institution" },
  { key: "title", label: "Title" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
]}
```

- [ ] **Steps + commit**

Same shape as Task 16/17 minus the `current` toggling.

```bash
git add actions/certifications.ts app/\(admin\)/admin/certifications
git commit -m "feat(admin): certifications CRUD"
```

---

## Task 19: SiteSettings — actions + index + profile sub-page (canonical)

**Files:**
- Create: `actions/site-settings.ts`
- Create: `app/(admin)/admin/site-settings/page.tsx`
- Create: `app/(admin)/admin/site-settings/profile/page.tsx`

SiteSettings is a **singleton** keyed on `id: "singleton"`. Each sub-page edits one slice. Actions return `null` on success and re-render the page with a `sonner` toast (no redirect); errors return `{ error, issues? }`. This task establishes the action pattern + index page + the canonical profile sub-page (which has two image fields). Tasks 20 handles the rest.

- [ ] **Step 1: Create `actions/site-settings.ts`** with the full set of 10 update actions

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { deleteImage } from "@/lib/cloudinary/delete";
import {
  ProfileSchema,
  HeroSchema,
  StatsSchema,
  AboutSchema,
  SectionsSchema,
  ContactSchema,
  CollaborateSchema,
  FooterSchema,
  SeoSchema,
  ThemeSchema,
} from "@/lib/schemas/site-settings";

export type SettingsState = {
  ok?: true;
  error?: string;
  issues?: z.ZodFormattedError<unknown>;
} | null;

function oldId(formData: FormData, name: string): string | null {
  const v = formData.get(`${name}__oldPublicId`);
  return typeof v === "string" && v.length > 0 ? v : null;
}

async function applyUpdate<T extends object>(
  schema: z.ZodType<T>,
  formData: FormData,
  imagePairs: Array<{ urlField: keyof T; publicIdField: keyof T }>,
  revalidate: string,
): Promise<SettingsState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input", issues: parsed.error.format() };

  // Clean up replaced Cloudinary assets
  for (const { urlField, publicIdField } of imagePairs) {
    const old = oldId(formData, String(urlField));
    const newId = parsed.data[publicIdField] as unknown as string | null;
    if (old && old !== newId) await deleteImage(old);
  }

  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: parsed.data,
  });
  revalidatePath(revalidate);
  return { ok: true };
}

export async function updateProfile(_p: SettingsState, fd: FormData) {
  return applyUpdate(
    ProfileSchema,
    fd,
    [{ urlField: "portraitUrl", publicIdField: "portraitPublicId" }],
    "/admin/site-settings/profile",
  );
}

export async function updateHero(_p: SettingsState, fd: FormData) {
  return applyUpdate(HeroSchema, fd, [], "/admin/site-settings/hero");
}

export async function updateStats(_p: SettingsState, fd: FormData) {
  return applyUpdate(StatsSchema, fd, [], "/admin/site-settings/stats");
}

export async function updateAbout(_p: SettingsState, fd: FormData) {
  return applyUpdate(AboutSchema, fd, [], "/admin/site-settings/about");
}

export async function updateSections(_p: SettingsState, fd: FormData) {
  return applyUpdate(SectionsSchema, fd, [], "/admin/site-settings/sections");
}

export async function updateContact(_p: SettingsState, fd: FormData) {
  return applyUpdate(ContactSchema, fd, [], "/admin/site-settings/contact");
}

export async function updateCollaborate(_p: SettingsState, fd: FormData) {
  return applyUpdate(CollaborateSchema, fd, [], "/admin/site-settings/collaborate");
}

export async function updateFooter(_p: SettingsState, fd: FormData) {
  return applyUpdate(FooterSchema, fd, [], "/admin/site-settings/footer");
}

export async function updateSeo(_p: SettingsState, fd: FormData) {
  return applyUpdate(
    SeoSchema,
    fd,
    [
      { urlField: "ogImage", publicIdField: "ogImagePublicId" },
      { urlField: "faviconUrl", publicIdField: "faviconPublicId" },
    ],
    "/admin/site-settings/seo",
  );
}

export async function updateTheme(_p: SettingsState, fd: FormData) {
  return applyUpdate(ThemeSchema, fd, [], "/admin/site-settings/theme");
}
```

- [ ] **Step 2: Create `app/(admin)/admin/site-settings/page.tsx`** (index)

```typescript
import Link from "next/link";

export const metadata = { title: "Site settings" };

const SECTIONS = [
  { href: "/admin/site-settings/profile", label: "Profile", description: "Name, role, location, portrait, resume" },
  { href: "/admin/site-settings/hero", label: "Hero", description: "Home page headline + CTAs" },
  { href: "/admin/site-settings/stats", label: "Stats", description: "3 home-page numbers" },
  { href: "/admin/site-settings/about", label: "About", description: "About page heading + intro" },
  { href: "/admin/site-settings/sections", label: "Sections", description: "All section headings + limits" },
  { href: "/admin/site-settings/contact", label: "Contact", description: "Contact page + form labels" },
  { href: "/admin/site-settings/collaborate", label: "Collaborate", description: "Bottom-of-page CTA" },
  { href: "/admin/site-settings/footer", label: "Footer", description: "Footer text + copyright" },
  { href: "/admin/site-settings/seo", label: "SEO", description: "Meta, OG image, favicon" },
  { href: "/admin/site-settings/theme", label: "Theme", description: "Primary & accent colors" },
];

export default function SiteSettingsIndex() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Site settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-md border border-border bg-card p-4 hover:border-accent-purple transition"
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create reusable settings form helper**

Create `app/(admin)/admin/site-settings/settings-form.tsx` (client component):

```typescript
"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type SettingsState = {
  ok?: true;
  error?: string;
  issues?: Record<string, { _errors: string[] }>;
} | null;

type Props = {
  action: (prev: SettingsState, fd: FormData) => Promise<SettingsState>;
  title: string;
  children: (helpers: {
    err: (k: string) => string | undefined;
    topLevelError: string | null;
  }) => React.ReactNode;
};

export function SettingsForm({ action, title, children }: Props) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    action as never,
    null,
  );

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  const issues = state?.issues;
  const err = (k: string) => issues?.[k]?._errors?.[0];
  const topLevelError = state?.error && !state?.issues ? state.error : null;

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        {children({ err, topLevelError })}
      </div>
      <div className="mt-6 max-w-2xl">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create `app/(admin)/admin/site-settings/profile/page.tsx`**

```typescript
import { getSiteSettings } from "@/lib/db/site-settings";
import { updateProfile } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";

export const metadata = { title: "Profile — site settings" };

export default async function ProfilePage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateProfile} title="Profile">
      {({ err }) => (
        <>
          <TextField name="fullName" label="Full name" required defaultValue={s.fullName} error={err("fullName")} />
          <TextField name="role" label="Role" required defaultValue={s.role} error={err("role")} />
          <TextField name="location" label="Location" required defaultValue={s.location} error={err("location")} />
          <ImageUploader folder="site" name="portraitUrl" publicIdName="portraitPublicId" initialUrl={s.portraitUrl} initialPublicId={s.portraitPublicId} label="Portrait" />
          <TextField name="ctaButtonLabel" label="Sidebar CTA label" required defaultValue={s.ctaButtonLabel} error={err("ctaButtonLabel")} />
          <TextField name="ctaButtonLink" label="Sidebar CTA link" required defaultValue={s.ctaButtonLink} error={err("ctaButtonLink")} />
          <UrlField name="resumeUrl" label="Resume URL" defaultValue={s.resumeUrl} error={err("resumeUrl")} />
        </>
      )}
    </SettingsForm>
  );
}
```

Note: this sub-page doesn't take `portraitPublicId` as an explicit text input — it's set by `ImageUploader` via the hidden `publicIdName` input. The `applyUpdate` helper handles replacement deletion automatically.

- [ ] **Step 5: Build + runtime test**

`npm run build` should be clean. Start dev server, log in, visit `/admin/site-settings/profile`:
- Form pre-fills from DB.
- Change a field, save → toast "Saved" appears, page re-renders with new value.
- Upload a portrait image → verify the Cloudinary asset, save → verify `portraitUrl` + `portraitPublicId` in DB via Prisma Studio.
- Replace the portrait → verify the old asset is deleted from Cloudinary.

- [ ] **Step 6: Commit**

```bash
git add actions/site-settings.ts app/\(admin\)/admin/site-settings/page.tsx app/\(admin\)/admin/site-settings/settings-form.tsx app/\(admin\)/admin/site-settings/profile
git commit -m "feat(admin): site settings actions + index + profile sub-page"
```

---

## Task 20: Remaining SiteSettings sub-pages (hero, stats, about, sections, contact, collaborate, footer, seo, theme)

Each sub-page follows Task 19's profile pattern: Server Component that fetches `getSiteSettings()` and renders a `<SettingsForm action={updateXxx} title="…">` with the relevant fields. **No new actions needed — Task 19 created all 10.**

For each sub-page below, create `app/(admin)/admin/site-settings/<group>/page.tsx`.

- [ ] **Step 1: `hero/page.tsx`** — action: `updateHero`, fields:

```typescript
<TextField name="heroHeadline" label="Hero headline" required defaultValue={s.heroHeadline} error={err("heroHeadline")} />
<TextAreaField name="heroSubtext" label="Hero subtext" rows={3} defaultValue={s.heroSubtext} error={err("heroSubtext")} />
<TextField name="heroPrimaryCtaLabel" label="Primary CTA label" required defaultValue={s.heroPrimaryCtaLabel} error={err("heroPrimaryCtaLabel")} />
<TextField name="heroPrimaryCtaLink" label="Primary CTA link" required defaultValue={s.heroPrimaryCtaLink} error={err("heroPrimaryCtaLink")} />
<TextField name="heroSecondaryCtaLabel" label="Secondary CTA label" required defaultValue={s.heroSecondaryCtaLabel} error={err("heroSecondaryCtaLabel")} />
<TextField name="heroSecondaryCtaLink" label="Secondary CTA link" required defaultValue={s.heroSecondaryCtaLink} error={err("heroSecondaryCtaLink")} />
```

- [ ] **Step 2: `stats/page.tsx`** — action: `updateStats`:

```typescript
<NumberField name="statYearsExperience" label="Years of experience" min={0} defaultValue={s.statYearsExperience} error={err("statYearsExperience")} />
<TextField name="statYearsLabel" label="Years label" required defaultValue={s.statYearsLabel} error={err("statYearsLabel")} />
<NumberField name="statProjects" label="Projects completed" min={0} defaultValue={s.statProjects} error={err("statProjects")} />
<TextField name="statProjectsLabel" label="Projects label" required defaultValue={s.statProjectsLabel} error={err("statProjectsLabel")} />
<NumberField name="statClients" label="Happy clients" min={0} defaultValue={s.statClients} error={err("statClients")} />
<TextField name="statClientsLabel" label="Clients label" required defaultValue={s.statClientsLabel} error={err("statClientsLabel")} />
<BooleanField name="statsShowPlus" label="Show '+' suffix on numbers" defaultValue={s.statsShowPlus} />
```

- [ ] **Step 3: `about/page.tsx`** — action: `updateAbout`:

```typescript
<TextField name="aboutPageTitle" label="About page title" required defaultValue={s.aboutPageTitle} error={err("aboutPageTitle")} />
<TextAreaField name="aboutIntroContent" label="About intro (HTML — TipTap in 2B)" rows={10} help="Raw HTML for now; rich editor lands in Phase 2B." defaultValue={s.aboutIntroContent} error={err("aboutIntroContent")} />
<TextField name="experienceHeading" label="Experience section heading" required defaultValue={s.experienceHeading} error={err("experienceHeading")} />
<TextField name="educationHeading" label="Education section heading" required defaultValue={s.educationHeading} error={err("educationHeading")} />
<TextField name="certificationHeading" label="Certification section heading" required defaultValue={s.certificationHeading} error={err("certificationHeading")} />
```

- [ ] **Step 4: `sections/page.tsx`** — action: `updateSections`:

```typescript
<TextField name="trustedByHeading" label="'Trusted by' heading" required defaultValue={s.trustedByHeading} error={err("trustedByHeading")} />
<TextField name="recentProjectsHeading" label="Recent projects heading" required defaultValue={s.recentProjectsHeading} error={err("recentProjectsHeading")} />
<NumberField name="recentProjectsLimit" label="Recent projects limit" min={1} max={50} defaultValue={s.recentProjectsLimit} error={err("recentProjectsLimit")} />
<TextField name="toolsSectionHeading" label="Tools section heading" required defaultValue={s.toolsSectionHeading} error={err("toolsSectionHeading")} />
<TextField name="testimonialsHeading" label="Testimonials heading" required defaultValue={s.testimonialsHeading} error={err("testimonialsHeading")} />
<TextField name="blogSectionHeading" label="Blog section heading" required defaultValue={s.blogSectionHeading} error={err("blogSectionHeading")} />
<NumberField name="blogSectionLimit" label="Blog section limit" min={1} max={50} defaultValue={s.blogSectionLimit} error={err("blogSectionLimit")} />
<TextField name="faqHeading" label="FAQ heading" required defaultValue={s.faqHeading} error={err("faqHeading")} />
<TextField name="projectsPageTitle" label="Projects page title" required defaultValue={s.projectsPageTitle} error={err("projectsPageTitle")} />
<TextAreaField name="projectsPageSubtitle" label="Projects page subtitle" rows={2} defaultValue={s.projectsPageSubtitle} error={err("projectsPageSubtitle")} />
<TextField name="blogPageTitle" label="Blog page title" required defaultValue={s.blogPageTitle} error={err("blogPageTitle")} />
<TextAreaField name="blogPageSubtitle" label="Blog page subtitle" rows={2} defaultValue={s.blogPageSubtitle} error={err("blogPageSubtitle")} />
<TextField name="toolsPageTitle" label="Tools page title" required defaultValue={s.toolsPageTitle} error={err("toolsPageTitle")} />
<TextAreaField name="toolsPageSubtitle" label="Tools page subtitle" rows={2} defaultValue={s.toolsPageSubtitle} error={err("toolsPageSubtitle")} />
```

- [ ] **Step 5: `contact/page.tsx`** — action: `updateContact`:

```typescript
<TextField name="contactPageTitle" label="Contact page title" required defaultValue={s.contactPageTitle} error={err("contactPageTitle")} />
<TextAreaField name="contactPageSubtitle" label="Contact page subtitle" rows={2} defaultValue={s.contactPageSubtitle} error={err("contactPageSubtitle")} />
<TextField name="contactEmail" label="Contact email" defaultValue={s.contactEmail} error={err("contactEmail")} />
<TextField name="contactPhone" label="Contact phone" defaultValue={s.contactPhone} error={err("contactPhone")} />
<TextField name="contactLocationText" label="Contact location text" defaultValue={s.contactLocationText} error={err("contactLocationText")} />
<TextField name="contactFormNameLabel" label="Form: Name label" required defaultValue={s.contactFormNameLabel} error={err("contactFormNameLabel")} />
<TextField name="contactFormEmailLabel" label="Form: Email label" required defaultValue={s.contactFormEmailLabel} error={err("contactFormEmailLabel")} />
<TextField name="contactFormMessageLabel" label="Form: Message label" required defaultValue={s.contactFormMessageLabel} error={err("contactFormMessageLabel")} />
<TextField name="contactFormSubmitLabel" label="Form: Submit button label" required defaultValue={s.contactFormSubmitLabel} error={err("contactFormSubmitLabel")} />
<TextAreaField name="contactSuccessMessage" label="Success message" rows={2} required defaultValue={s.contactSuccessMessage} error={err("contactSuccessMessage")} />
```

- [ ] **Step 6: `collaborate/page.tsx`** — action: `updateCollaborate`:

```typescript
<TextField name="ctaSectionLineOne" label="Headline line 1" required defaultValue={s.ctaSectionLineOne} error={err("ctaSectionLineOne")} />
<TextField name="ctaSectionLineTwo" label="Headline line 2" required defaultValue={s.ctaSectionLineTwo} error={err("ctaSectionLineTwo")} />
<TextAreaField name="ctaSectionText" label="Body text" rows={3} defaultValue={s.ctaSectionText} error={err("ctaSectionText")} />
<TextField name="ctaSectionButtonLabel" label="Button label" required defaultValue={s.ctaSectionButtonLabel} error={err("ctaSectionButtonLabel")} />
<TextField name="ctaSectionButtonLink" label="Button link" required defaultValue={s.ctaSectionButtonLink} error={err("ctaSectionButtonLink")} />
```

- [ ] **Step 7: `footer/page.tsx`** — action: `updateFooter`:

```typescript
<TextField name="footerText" label="Footer text" required defaultValue={s.footerText} error={err("footerText")} />
<BooleanField name="footerShowYear" label="Show current year" defaultValue={s.footerShowYear} />
<TextField name="footerCopyright" label="Copyright line (optional)" defaultValue={s.footerCopyright} error={err("footerCopyright")} />
```

- [ ] **Step 8: `seo/page.tsx`** — action: `updateSeo`:

```typescript
<TextField name="siteName" label="Site name" required defaultValue={s.siteName} error={err("siteName")} />
<TextAreaField name="siteDescription" label="Site description (meta)" rows={3} defaultValue={s.siteDescription} error={err("siteDescription")} />
<TextField name="siteKeywords" label="Meta keywords (comma-separated)" defaultValue={s.siteKeywords} error={err("siteKeywords")} />
<ImageUploader folder="site" name="ogImage" publicIdName="ogImagePublicId" initialUrl={s.ogImage} initialPublicId={s.ogImagePublicId} label="OG image (1200×630)" />
<ImageUploader folder="site" name="faviconUrl" publicIdName="faviconPublicId" initialUrl={s.faviconUrl} initialPublicId={s.faviconPublicId} label="Favicon" />
```

- [ ] **Step 9: `theme/page.tsx`** — action: `updateTheme`:

```typescript
<TextField name="primaryColor" label="Primary color (hex)" required placeholder="#8b5cf6" defaultValue={s.primaryColor} error={err("primaryColor")} />
<TextField name="accentColor" label="Accent color (hex, optional)" placeholder="#0000EE" defaultValue={s.accentColor} error={err("accentColor")} />
```

- [ ] **Step 10: Build + runtime test all 9 sub-pages**

For each sub-page: visit, change one field, save, verify the toast appears and the field persists (Prisma Studio). Verify image uploads on `profile`, `seo` work and replace the old asset.

- [ ] **Step 11: Commit**

```bash
git add app/\(admin\)/admin/site-settings
git commit -m "feat(admin): all 9 remaining site-settings sub-pages (hero/stats/about/sections/contact/collaborate/footer/seo/theme)"
```

---

## Task 21: Final acceptance verification

**Files:** none modified. This is a verification pass — every check below must pass before declaring Phase 2A done.

- [ ] **Step 1: Build + lint + type-check**

```bash
npm run build
npm run lint
npx tsc --noEmit
```

All three must exit 0. The build output should list:
- Public routes unchanged from the Phase 1 result (`/`, `/about`, `/blog`, `/blog/[slug]`, `/contact`, `/projects`, `/projects/[slug]`, `/tools`)
- Admin routes added: `/admin`, `/admin/login`, `/admin/site-settings`, `/admin/site-settings/{profile,hero,stats,about,sections,contact,collaborate,footer,seo,theme}`, plus `/admin/{nav-items,social-links,tools,testimonials,faqs,experience,education,certifications,client-logos}` × `{,new,[id]}`
- Proxy / Middleware still listed under Edge runtime

- [ ] **Step 2: No public-site changes**

Run:
```bash
BASE=$(git merge-base HEAD main)
git diff --name-only "$BASE" HEAD -- app/page.tsx app/about app/blog app/contact app/projects app/tools components/sections lib/data.ts
```
Expected: empty.

(Note: `main` here means the local main branch; on Windows shells use `(git merge-base HEAD main)` syntax appropriate for PowerShell if not on bash.)

- [ ] **Step 3: Only zod added as a dep**

```bash
BASE=$(git merge-base HEAD main)
git diff "$BASE" HEAD -- package.json | grep -E '^\+ +"' | grep -v "scripts" | grep -v "prisma"
```
Expected: a line containing `"zod"`. Nothing else from the postponed list (`@tiptap/*`, `@dnd-kit/*`, `react-hook-form`, `@hookform/resolvers`, `resend`).

- [ ] **Step 4: Auth flow end-to-end**

Start dev server.

```bash
# 4a: gated route redirects when no cookie
curl -sI http://localhost:3000/admin | head -3
# Expected: HTTP/1.1 307; location: /admin/login
```

Open `http://localhost:3000/admin/login` in a browser. Submit wrong credentials → "Invalid credentials" appears. Submit correct credentials → redirected to `/admin`, dashboard renders, `admin_session` cookie set in DevTools.

Click "Log out" in sidebar. Redirected to login. Cookie cleared.

- [ ] **Step 5: Every list page loads**

While logged in, visit each:
- `/admin`
- `/admin/site-settings` (and click into each of the 10 sub-pages — each pre-fills and saves)
- `/admin/nav-items`, `/admin/social-links`, `/admin/tools`, `/admin/testimonials`, `/admin/faqs`, `/admin/experience`, `/admin/education`, `/admin/certifications`, `/admin/client-logos`

Each list shows the seeded count. No 500 errors.

- [ ] **Step 6: Full CRUD on one image-bearing entity**

Pick `Tools`. Create a new tool "Acceptance test tool" with proficiency 42, upload a small PNG icon. After save: list shows 9 rows. Verify in Prisma Studio that `iconUrl` is a `res.cloudinary.com` URL and `iconPublicId` is non-empty. Open Cloudinary dashboard, find the asset under `tools/`.

Edit the tool, replace the icon with another image. Save. Verify the OLD Cloudinary asset is gone from the dashboard. Verify the DB now has the new URL.

Delete the tool. Verify list shows 8 rows. Verify the second Cloudinary asset is gone.

- [ ] **Step 7: Full CRUD on a no-image entity**

Pick `FAQs`. Create, edit, toggle visibility, delete. Verify each via Prisma Studio.

- [ ] **Step 8: SiteSettings save isolation**

Edit `/admin/site-settings/footer` → change `footerText`. Save (toast appears). Visit `/admin/site-settings/hero` → change `heroHeadline`. Save. In Prisma Studio, confirm both fields updated and the rest of SiteSettings unchanged.

- [ ] **Step 9: Stop dev server**

- [ ] **Step 10: Commit any final tweaks**

```bash
git status
```
If clean, no commit needed. Otherwise:
```bash
git add -A
git commit -m "chore(admin): phase 2A acceptance verification passes"
```

- [ ] **Step 11: Mark spec as Implemented**

Edit `docs/superpowers/specs/2026-05-21-portfolio-admin-ui-2a-design.md` header — change `Status: Draft — awaiting user review` to `Status: Implemented (YYYY-MM-DD)` with today's date.

```bash
git add docs/superpowers/specs/2026-05-21-portfolio-admin-ui-2a-design.md
git commit -m "docs(spec): mark phase 2A admin UI as implemented"
```

---

## What's NOT in this plan (and where it lands)

- **Phase 2B:** Project CRUD (sections + gallery + related), BlogPost CRUD, TipTap rich text editor (replaces `aboutIntroContent` textarea + Project sections + Blog content), drag-to-reorder UI (replaces numeric `order` inputs).
- **Phase 3:** Rewire public-site Server Components to read from new `lib/db/*` query files (Phase 2A introduced 10 of them; Phase 3 adds the rest and migrates existing public pages).
- **Phase 4:** Contact form write path (uses `ContactSubmission` model), Resend, sitemap, robots, README.

---

## Risks captured during planning

1. **Next 16 `useActionState` signature drift.** Pre-flight reminder at top requires reading current docs. If signature changes, adapt the auth + form components. Pattern is isolated to a few client islands, easy to fix.
2. **Cloudinary direct upload CORS.** Cloudinary's `/v1_1/<cloud>/auto/upload` endpoint has CORS open for browsers by default on the free tier. If a custom domain is set up later, may need to revisit. Acceptance step 6 catches this end-to-end.
3. **Server Action redirect inside an action that returns state.** List-entity actions `redirect()` on success (Next throws the redirect signal — `useActionState` won't see it, the navigation happens). Settings sub-section actions `return { ok: true }` — the form re-renders, the toast fires. The two patterns must not be mixed.
4. **Image replacement race.** If a user picks a new file, the uploader runs, but they navigate away before submitting the form — the new Cloudinary asset is orphaned. Acceptable for 2A; cleanup belongs in a later admin tooling pass.
5. **Public Image domain config.** Cloudinary + placehold.co + skillicons.dev must be in `next.config.ts` `images.remotePatterns`. Task 7 Step 3 handles this; verify nothing else needs it.
6. **Prisma `fAQ` casing.** Prisma generates `prisma.fAQ` (not `prisma.faq`) because the model is `FAQ`. Plan code is consistent.




