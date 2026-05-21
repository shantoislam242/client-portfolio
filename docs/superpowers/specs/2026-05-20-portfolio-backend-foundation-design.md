# Portfolio Backend — Foundation (Phase 1) Design Spec

**Date:** 2026-05-20
**Status:** Implemented (2026-05-21)
**Supersedes:** [2026-05-11-portfolio-backend-design.md](2026-05-11-portfolio-backend-design.md) and its companion plan
**Scope:** Phase 1 of a 4-phase backend buildout. Phases 2–4 will get their own spec/plan cycles.

---

## Goal

Land the foundation so later phases can plug in cleanly: complete Prisma schema (covering every model needed across all 4 phases), Neon Postgres connection, hidden-admin auth primitives, Cloudinary integration with signed direct upload, and a seed script that ports every string and structure currently in [lib/data.ts](../../../lib/data.ts) into the database.

**The public site behavior does not change in Phase 1.** It continues reading from `lib/data.ts`. The DB is populated and the foundation is verified, but no Server Component is rewired until Phase 3.

## Non-goals (deferred to later phases)

- Admin UI (Phase 2)
- Public-site refactor to read from DB (Phase 3)
- Contact form + email send (Phase 4)
- TipTap rich-text editor (Phase 2)
- Drag-to-reorder UI (Phase 2)
- Form libraries beyond minimal seed validation (Phase 2)

---

## Constraints

- **Next.js 16.2.6 + React 19.** Per [AGENTS.md](../../../AGENTS.md), this Next version has breaking changes from training data — caching/middleware/auth APIs may differ. Implementation tasks must consult `node_modules/next/dist/docs/` before writing affected code.
- **Cost: $0/month.** All chosen services fit free tier (Vercel Hobby, Neon free, Cloudinary 25 GB free).
- **No public surface for admin.** No "Login" link anywhere; `/admin` is unadvertised. Robots disallow added in Phase 4.
- **Strict separation of read/write layers.** `lib/db/*` for cached reads, `actions/*` for mutations (those folders are scaffolded in Phase 1 but populated in later phases).
- **Existing public-site visual design is preserved.** Phase 3 will rewire data sources without changing layout, animations, or typography.

---

## Tech stack additions (Phase 1 only)

| Package | Purpose | Notes |
|---|---|---|
| `prisma`, `@prisma/client` | ORM + migrations | Generator + client; use `directUrl` for Neon's pooled/direct split |
| `bcryptjs` | Password hashing | Pure-JS, works on Vercel serverless |
| `jose` | JWT sign/verify | Edge-runtime safe (Prisma is not — keep Prisma out of middleware) |
| `cloudinary` | Server SDK for signed-upload signatures | Used only by Server Actions, never by client |
| `tsx` (dev) | Run seed + hash-password scripts | TypeScript runner |
| `@types/bcryptjs` (dev) | Types for bcryptjs | |

**Postponed packages (not installed in Phase 1):**
- `resend` → Phase 4
- `@tiptap/*` → Phase 2
- `@dnd-kit/*` → Phase 2
- `react-hook-form`, `@hookform/resolvers` → Phase 2
- `zod` → Phase 2 (a minimal subset may appear in seed for validation; this is fine)
- `@auth/prisma-adapter`, `next-auth@beta` → not used (auth approach changed, see below)
- `sonner`, `lucide-react`, `date-fns` → already installed
- `react-icons` → already installed

---

## Architecture (Phase 1 deliverables)

```
portfolio/
├── prisma/
│   ├── schema.prisma            # NEW — complete schema, all phases
│   ├── seed.ts                  # NEW — ports lib/data.ts → DB
│   └── migrations/              # NEW — initial migration
│
├── lib/
│   ├── db/
│   │   └── client.ts            # NEW — Prisma singleton (cold-start safe)
│   ├── auth/
│   │   ├── session.ts           # NEW — jose JWT sign/verify, cookie helpers
│   │   ├── password.ts          # NEW — bcrypt compare
│   │   └── guard.ts             # NEW — requireAdmin() stub (throws if no valid session)
│   ├── cloudinary/
│   │   ├── client.ts            # NEW — cloudinary.config()
│   │   └── signature.ts         # NEW — signed-upload signature helper
│   ├── data.ts                  # KEEP unchanged in Phase 1; refactored Phase 3
│   ├── motion.ts                # unchanged
│   └── utils.ts                 # unchanged
│
├── scripts/
│   └── hash-password.ts         # NEW — generates ADMIN_PASSWORD_HASH
│
├── middleware.ts                # NEW — gates /admin/* (placeholder login URL still 404s until Phase 2)
├── .env.example                 # NEW — documents required vars
└── package.json                 # MODIFIED — new deps, "prisma:seed" script, "db:push"/"db:migrate"
```

**Boundary rules established now (enforced in later phases):**

- `lib/db/*` files import Prisma; never imported from `middleware.ts` or any Edge runtime.
- `lib/auth/session.ts` uses only `jose` + Web Crypto APIs → Edge-safe → can be imported in middleware.
- `lib/auth/guard.ts` may use Prisma (Node runtime only) for future audit logging; not imported from middleware.
- `lib/cloudinary/*` is server-only; the Cloudinary API secret never reaches the browser.

---

## Database schema

The full schema is laid down now (even for tables only consumed in Phase 2/3/4) because Postgres migrations are expensive to slice piecemeal. Only Phase 1 deliverables (auth, seed) actually write rows during Phase 1.

### One deviation from the original prompt

**The `User` model is removed.** Justification: jose + env-credential auth reads `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` from environment variables; it never touches a User table. An empty table costs nothing but signals an architecture choice that isn't real. If you ever switch to NextAuth or multi-admin, add it then.

### Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────
// SITE-WIDE SETTINGS (singleton)
// ─────────────────────────────────────────
model SiteSettings {
  id String @id @default("singleton")

  // Sidebar / Profile card
  fullName         String  @default("Arifujjaman")
  role             String  @default("Graphic & Motion Designer")
  location         String  @default("Tejgaon, Dhaka, Bangladesh")
  portraitUrl      String?
  portraitPublicId String?
  ctaButtonLabel   String  @default("Let's Talk")
  ctaButtonLink    String  @default("/contact")
  resumeUrl        String?
  resumePublicId   String?

  // Hero (home page top)
  heroHeadline          String @default("Crafting Visual Stories That Move People")
  heroSubtext           String @db.Text @default("")
  heroPrimaryCtaLabel   String @default("Let's Talk")
  heroPrimaryCtaLink    String @default("/contact")
  heroSecondaryCtaLabel String @default("My Work")
  heroSecondaryCtaLink  String @default("/projects")

  // Stats (3 home-page numbers)
  statYearsExperience Int     @default(0)
  statYearsLabel      String  @default("Years of Experience")
  statProjects        Int     @default(0)
  statProjectsLabel   String  @default("Projects Completed")
  statClients         Int     @default(0)
  statClientsLabel    String  @default("Happy Clients")
  statsShowPlus       Boolean @default(true)

  // "Trusted by" strip
  trustedByHeading String @default("Trusted by brands across South Asia and beyond")

  // Section headings (home page)
  recentProjectsHeading String @default("Recent Projects and Achievements")
  recentProjectsLimit   Int    @default(4)
  toolsSectionHeading   String @default("Top-Tier Tools for Exceptional Results")
  testimonialsHeading   String @default("What Clients Say About My Work")
  blogSectionHeading    String @default("Design Thoughts and Perspectives")
  blogSectionLimit      Int    @default(4)
  faqHeading            String @default("Frequently Asked Questions")

  // About page
  aboutPageTitle       String @default("A bit About Me")
  aboutIntroContent    String @db.Text @default("")  // TipTap HTML (filled Phase 2+)
  experienceHeading    String @default("My Professional Journey")
  educationHeading     String @default("Academic Background")
  certificationHeading String @default("Course and Certification")

  // Listing page headers
  projectsPageTitle    String  @default("Projects")
  projectsPageSubtitle String? @db.Text
  blogPageTitle        String  @default("Blog")
  blogPageSubtitle     String? @db.Text
  toolsPageTitle       String  @default("Tools")
  toolsPageSubtitle    String? @db.Text

  // Contact page
  contactPageTitle        String  @default("Let's Create Something Amazing")
  contactPageSubtitle     String? @db.Text
  contactEmail            String?
  contactPhone            String?
  contactLocationText     String?
  contactFormNameLabel    String  @default("Name")
  contactFormEmailLabel   String  @default("Email")
  contactFormMessageLabel String  @default("Message")
  contactFormSubmitLabel  String  @default("Send")
  contactSuccessMessage   String  @default("Thanks! I'll get back to you soon.")

  // Collaborate CTA (bottom of every page)
  ctaSectionLineOne     String @default("Let's")
  ctaSectionLineTwo     String @default("collaborate")
  ctaSectionText        String @db.Text @default("")
  ctaSectionButtonLabel String @default("Get in touch")
  ctaSectionButtonLink  String @default("/contact")

  // Footer
  footerText      String  @default("Designed & built by Arifujjaman")
  footerShowYear  Boolean @default(true)
  footerCopyright String?

  // SEO defaults
  siteName        String  @default("Arifujjaman — Graphic & Motion Designer")
  siteDescription String  @db.Text @default("")
  siteKeywords    String?
  ogImage         String?
  ogImagePublicId String?
  faviconUrl      String?
  faviconPublicId String?

  // Theme (future-facing — read by Phase 3 if used)
  primaryColor String  @default("#8b5cf6")
  accentColor  String?

  updatedAt DateTime @updatedAt
}

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
model NavItem {
  id       String  @id @default(cuid())
  label    String
  href     String
  iconKey  String  @default("link")  // resolved via lib/icons registry (Phase 3)
  order    Int     @default(0)
  external Boolean @default(false)
  visible  Boolean @default(true)

  @@index([order])
}

// ─────────────────────────────────────────
// SOCIAL LINKS
// ─────────────────────────────────────────
model SocialLink {
  id       String  @id @default(cuid())
  platform String
  label    String
  url      String
  iconKey  String  // "behance" | "linkedin" | "facebook" | "youtube" | "mail" | ...
  order    Int     @default(0)
  visible  Boolean @default(true)

  @@index([order])
}

// ─────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────
model Project {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  shortLabel      String?

  year            String?
  client          String?
  services        String[]
  role            String?
  liveUrl         String?

  coverImageUrl   String
  coverPublicId   String

  excerpt         String   @db.Text
  cardImageUrl    String?
  cardPublicId    String?

  introContent    String?  @db.Text   // TipTap HTML (Phase 2+)

  sections        ProjectSection[]
  galleryHeading  String   @default("Selected Visuals")
  galleryImages   ProjectImage[]

  relatedHeading  String   @default("More Projects")
  relatedProjects RelatedProject[] @relation("source")
  relatedTo       RelatedProject[] @relation("related")

  featured        Boolean  @default(false)
  published       Boolean  @default(false)
  order           Int      @default(0)

  metaTitle       String?
  metaDescription String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  publishedAt     DateTime?

  @@index([published, order])
  @@index([featured, order])
}

model ProjectSection {
  id        String  @id @default(cuid())
  heading   String
  content   String  @db.Text   // TipTap HTML (Phase 2+); seed writes plain text
  order     Int     @default(0)
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, order])
}

model ProjectImage {
  id        String  @id @default(cuid())
  url       String
  publicId  String
  alt       String?
  caption   String?
  order     Int     @default(0)
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, order])
}

model RelatedProject {
  id        String  @id @default(cuid())
  sourceId  String
  relatedId String
  order     Int     @default(0)
  source    Project @relation("source",  fields: [sourceId],  references: [id], onDelete: Cascade)
  related   Project @relation("related", fields: [relatedId], references: [id], onDelete: Cascade)

  @@unique([sourceId, relatedId])
}

// ─────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────
model BlogPost {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  subtitle        String?
  excerpt         String   @db.Text
  content         String   @db.Text     // TipTap HTML (Phase 2+); seed writes plain text

  coverImageUrl   String
  coverPublicId   String

  category        String?
  tags            String[]
  readTimeMinutes Int      @default(5)
  author          String?

  published       Boolean  @default(false)
  featured        Boolean  @default(false)

  metaTitle       String?
  metaDescription String?

  views           Int      @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  publishedAt     DateTime?

  @@index([published, publishedAt])
}

// ─────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────
model Tool {
  id              String  @id @default(cuid())
  name            String
  description     String?
  category        String?

  iconUrl         String?
  iconPublicId    String?
  iconExternalUrl String?   // e.g. https://skillicons.dev/icons?i=ps

  proficiency     Int     @default(80)
  order           Int     @default(0)
  showOnHome      Boolean @default(true)
  visible         Boolean @default(true)

  createdAt       DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────
model Testimonial {
  id             String  @id @default(cuid())
  name           String
  role           String?
  company        String?
  content        String  @db.Text
  avatarUrl      String?
  avatarPublicId String?
  rating         Int     @default(5)
  featured       Boolean @default(false)
  order          Int     @default(0)
  visible        Boolean @default(true)
  createdAt      DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// CLIENT LOGOS
// ─────────────────────────────────────────
model ClientLogo {
  id         String   @id @default(cuid())
  name       String
  logoUrl    String
  publicId   String
  websiteUrl String?
  order      Int      @default(0)
  visible    Boolean  @default(true)
  createdAt  DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// EXPERIENCE
// ─────────────────────────────────────────
model Experience {
  id           String   @id @default(cuid())
  company      String
  role         String
  description  String   @db.Text
  startDate    String   // "Jan 2026"
  endDate      String?  // "Present" or "Dec 2025"
  current      Boolean  @default(false)
  companyUrl   String?
  logoUrl      String?
  logoPublicId String?
  order        Int      @default(0)
  visible      Boolean  @default(true)
  createdAt    DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// EDUCATION
// ─────────────────────────────────────────
model Education {
  id             String   @id @default(cuid())
  institution    String
  degree         String
  description    String?  @db.Text
  startDate      String
  endDate        String?
  current        Boolean  @default(false)
  institutionUrl String?
  logoUrl        String?
  logoPublicId   String?
  order          Int      @default(0)
  visible        Boolean  @default(true)
  createdAt      DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────
model Certification {
  id            String   @id @default(cuid())
  institution   String
  title         String
  description   String?  @db.Text
  startDate     String
  endDate       String?
  credentialUrl String?
  logoUrl       String?
  logoPublicId  String?
  order         Int      @default(0)
  visible       Boolean  @default(true)
  createdAt     DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────
model FAQ {
  id        String   @id @default(cuid())
  question  String
  answer    String   @db.Text
  category  String?  // optional filter (e.g. "home", "about")
  order     Int      @default(0)
  visible   Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// CONTACT SUBMISSIONS  (write path lands in Phase 4)
// ─────────────────────────────────────────
model ContactSubmission {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String   @db.Text
  read      Boolean  @default(false)
  replied   Boolean  @default(false)
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([read, createdAt])
}
```

### Schema design notes

- **Image lifecycle invariant.** Every image column comes paired with its `publicId` (`coverImageUrl` + `coverPublicId`, `portraitUrl` + `portraitPublicId`, etc.) so that on delete/replace the Cloudinary asset can be cleaned up. Phase 2 admin actions enforce this; Phase 1 just defines the columns and respects the pairing in seed.
- **Rich text columns hold strings.** `content`, `aboutIntroContent`, `introContent` are typed `String @db.Text`. Phase 2 stores TipTap HTML; Phase 1 seed writes either plain paragraphs or simple `<p>…</p>` wrappers from the existing `ContentBlock[]` data.
- **Sort order is an `Int`.** For Phase 1 N is small (<25 per table). If drag-reorder churn becomes a perf issue later, switch to fractional/lexorank — not now.
- **`Project.services` is a Postgres `String[]`.** Native arrays beat a separate `Tag` table for this scale.
- **`RelatedProject` is a join table** with explicit `order` so the "More Projects" carousel order is admin-controllable.
- **`SiteSettings` uses singleton id `"singleton"`** (string), seeded as one row via upsert. Defaults on every column let us add new fields without filling them manually.
- **No JSON columns.** The previous spec stored hero/profile/etc. as JSON; this spec normalizes everything. The trade-off: schema migrations on every new field, but typed reads and admin forms become trivial.

---

## Auth (Phase 1: primitives only)

Login UI ships in Phase 2; Phase 1 establishes the primitives and the gate.

### What ships in Phase 1

1. **`scripts/hash-password.ts`** — usage: `npx tsx scripts/hash-password.ts "your-password"` → prints bcrypt hash to paste into `ADMIN_PASSWORD_HASH`.
2. **`lib/auth/password.ts`** — `verifyPassword(input: string, hash: string): Promise<boolean>` wrapping `bcryptjs.compare`.
3. **`lib/auth/session.ts`** — using `jose`:
   - `signSession(payload): Promise<string>` → JWS with HS256, 7-day expiry, secret = `NEXTAUTH_SECRET` (kept name for env compatibility but value is generic JWT secret).
   - `verifySession(token): Promise<Payload | null>`.
   - `setSessionCookie(token)`, `clearSessionCookie()` — use `cookies()` from `next/headers`; httpOnly, Secure (prod), SameSite=Lax, 7-day maxAge, path=`/`, name=`admin_session`.
4. **`lib/auth/guard.ts`** — `requireAdmin(): Promise<void>` reads cookie via `next/headers`, verifies, throws `Response.redirect("/admin/login")` (or analogous) on failure. Server Actions in later phases call this first.
5. **`middleware.ts`** — `export const config = { matcher: ["/admin/:path*"] }`. Reads `admin_session` cookie, verifies via `verifySession`, redirects to `/admin/login` if invalid. **Allowlists** `/admin/login` so the login page itself is reachable.
6. **Login UI page** — **not shipped in Phase 1.** It's the first thing Phase 2 builds. Until then, hitting `/admin/login` returns Next's 404 (acceptable; admin is unadvertised and Phase 1 is a foundation-only milestone).

### Why jose + env credential (not NextAuth)

- Single admin; no signup/reset/multi-user surface area is ever needed.
- `jose` is the only JWT library that runs in Next 16's Edge middleware. NextAuth v5 (beta) layered on top of Next 16 + Prisma is a known compatibility risk.
- Credentials live where secrets belong — Vercel env vars.
- ~80 LOC total vs. NextAuth's substantial surface area.

### Rotation procedure (documented for the README later)

```bash
npx tsx scripts/hash-password.ts "new-password"
# copy output → ADMIN_PASSWORD_HASH in Vercel env → redeploy
```

---

## Cloudinary integration (signed direct upload)

### What ships in Phase 1

1. **`lib/cloudinary/client.ts`** — calls `cloudinary.config({...})` from env. Server-only file (top-level import of `cloudinary` package would warn in client bundles; safe in Server Actions).
2. **`lib/cloudinary/signature.ts`** — exports `signUpload(folder: Folder, options?): { timestamp, signature, apiKey, cloudName, folder, eager }`:
   - `folder` constrained to known set: `"projects" | "blog" | "tools" | "testimonials" | "logos" | "experience" | "education" | "certifications" | "site"`.
   - Builds canonical param string per Cloudinary signed-upload docs.
   - HMACs with API secret.
   - Returns everything the browser needs to upload directly to `https://api.cloudinary.com/v1_1/<cloudName>/auto/upload`.
   - Eager transformation: `f_avif,q_auto` (async eager, so the upload response returns immediately while AVIF is generated in the background).
3. **`lib/cloudinary/delete.ts`** — `deleteImage(publicId: string | null | undefined): Promise<void>`. Server-only. Errors logged, not thrown (orphan asset is recoverable; failed admin save is not).

**No upload UI in Phase 1.** The signature function exists and unit-tests fine, but the form that consumes it lands in Phase 2.

### Upload format policy

- Every uploaded image gets `f_webp, q_auto` as the primary delivery format.
- AVIF is generated eagerly (async) and served via `f_auto` browser negotiation.
- Folder prefix per asset type (`projects/`, `blog/`, etc.) for organization and bulk cleanup.

---

## Seed strategy

`prisma/seed.ts` runs via `prisma db seed` and ports every row from [lib/data.ts](../../../lib/data.ts) into the database. It is idempotent — uses `upsert` keyed on slug / id / singleton.

### What gets seeded

| Source export | Target model / columns | Count |
|---|---|---|
| `profile` (name/role/location/portrait) | `SiteSettings` columns | — |
| `profile.socials` | `SocialLink` rows | 5 |
| `navItems` | `NavItem` | 6 |
| `hero` | `SiteSettings.hero*` columns | — |
| `stats` | `SiteSettings.stat*` columns | — |
| `companies.caption` | `SiteSettings.trustedByHeading` | — |
| `companies.logos` placeholder names | `ClientLogo` (with placehold.co URLs) | 3 |
| `aboutIntro` | `SiteSettings.aboutPageTitle` + `aboutIntroContent` | — |
| `experienceHeading` / `educationHeading` / `certificationHeading` | matching `SiteSettings` heading columns | — |
| `projects` | `Project` + `ProjectSection` + `ProjectImage` | 6 / ~12 / ~24 |
| `tools` | `Tool` | 8 |
| `experience` | `Experience` | 5 |
| `education` | `Education` | 3 |
| `certifications` | `Certification` | 1 |
| `faqs` | `FAQ` | 5 |
| `testimonials` | `Testimonial` | 1 |
| `blogPosts` | `BlogPost` | 5 |
| `collaborateCta` | `SiteSettings.ctaSection*` columns | — |
| `contactPage` | `SiteSettings.contactPage*` + `contactForm*` columns | — |
| `footer` | `SiteSettings.footer*` columns | — |
| (none) | `ContactSubmission` | empty in Phase 1 |

### Image handling during seed

External URLs in current `data.ts` (`placehold.co`, `skillicons.dev`) are stored **verbatim** in the corresponding URL column. Their paired `*PublicId` columns are left `null` or set to an empty string, signaling "no Cloudinary asset to clean up." Phase 2 admin uploads will replace these with real Cloudinary assets.

### Project content seed

`lib/data.ts` exports `content: ContentBlock[]` with `{ kind: "p" | "h2", text }`. The seed converts this to:
- Each `h2` block becomes one `ProjectSection` (heading = the h2 text).
- Each contiguous run of `p` blocks following an h2 becomes that section's `content` as concatenated `<p>…</p>` HTML.
- Any `p` blocks before the first `h2` become the project's `introContent`.

This preserves the existing structure within the new schema cleanly.

---

## Environment variables

`.env.example` (NEW, committed) documents:

```env
# Neon Postgres (free tier)
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=<32+ random bytes, base64>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=<output of scripts/hash-password.ts>

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Phase 4 (not required until Phase 4 ships; documented now for completeness)
# RESEND_API_KEY=
# NOTIFICATION_EMAIL=
```

`.env.local` is in `.gitignore` (already). `NEXTAUTH_SECRET` is kept as the env name even though we use jose — it's a generic JWT secret and matches Vercel's NextAuth integration if ever swapped.

---

## Phase 1 acceptance criteria

A reviewer should be able to verify all of these:

1. `npx prisma generate` runs cleanly with no warnings.
2. `npx prisma migrate dev --name init` applies cleanly against a fresh Neon database.
3. `npx prisma db seed` populates rows matching the table above; rerunning is idempotent (no duplicate-key errors).
4. `npx tsx scripts/hash-password.ts "test"` prints a bcrypt-shaped string starting with `$2`.
5. `verifyPassword("test", "<that hash>")` returns `true` in a quick smoke test (e.g., `npx tsx -e`).
6. `signSession({sub:"admin"})` and `verifySession(token)` round-trip in a smoke test.
7. `signUpload("projects")` returns a non-empty `signature` and the expected fields.
8. Visiting `/admin/dashboard` (which does not exist yet) is **redirected to `/admin/login`** by middleware. (The login page 404s — acceptable in Phase 1.)
9. `npm run build` succeeds. (No new public routes added, so build output should be near-identical to current main.)
10. No new dependency outside the Phase 1 list above. No frontend file under `app/` or `components/` is modified.

---

## Forward references (what later phases build on this)

- **Phase 2** consumes: schema (writes admin CRUD), `lib/auth/*` (login page + Server Actions guarded by `requireAdmin`), `lib/cloudinary/*` (image upload forms), `lib/db/client.ts` (Prisma read/write).
- **Phase 3** consumes: schema reads via new `lib/db/<entity>.ts` cached functions; refactors `app/**/page.tsx` and `components/sections/*` to consume them.
- **Phase 4** consumes: `ContactSubmission` model (write path), adds Resend, adds `app/api/contact/route.ts`, adds robots/sitemap.

---

## Out of scope

- Any admin UI (login page, dashboard, CRUD forms, drag-reorder, TipTap, image upload widget).
- Any change to public-site rendering (`app/**/page.tsx`, `components/sections/*`).
- Contact form, email send, Resend integration.
- Analytics, view-count incrementing logic (column exists; increment ships with Phase 3).
- README updates (Phase 4).
- `robots.txt`, sitemap.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Next 16 caching/middleware/auth APIs differ from training data | Implementation tasks must read `node_modules/next/dist/docs/` before touching middleware, cookies, or `next/headers` calls. Spec deliberately uses only `jose` + `next/headers` cookies — no `unstable_cache` or revalidation in Phase 1. |
| Prisma in Edge middleware crashes | Schema-enforced separation: `lib/auth/session.ts` (Edge-safe) imports zero Prisma; `lib/auth/guard.ts` (Node-only) is the Prisma-aware variant for Server Actions. |
| Neon pooled vs direct connection mishandled | Schema includes both `url` (pooled, for app) and `directUrl` (for migrations). `.env.example` documents both. |
| Cloudinary signature mis-built | Sign-string format covered by a smoke test in acceptance criteria #7. |
| Seed re-run duplicates content | All inserts use `upsert` keyed on slug/id/singleton. |
| Eventually want NextAuth back | `User` model intentionally not in schema; re-adding it later is one migration. The auth contract (`requireAdmin`, session cookie name, secret env var) is stable so swap is local. |

---

## Open questions

None remaining for Phase 1. All earlier branching decisions captured in the body above:

- Existing spec superseded (Q1)
- Spec scope = Phase 1 only (Q2)
- Auth = jose + env credential, User model dropped (Q3)
- Cloudinary uploads = signed direct upload from browser (Q4)
