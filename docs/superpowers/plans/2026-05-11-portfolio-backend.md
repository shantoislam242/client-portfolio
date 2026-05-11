# Portfolio Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing static portfolio fully dynamic with a hidden `/admin` panel, without changing a single pixel of the public frontend.

**Architecture:** Next.js 16 App Router with Server Components reading from Neon Postgres via Prisma (cached with the `'use cache'` directive + `cacheTag`). All mutations go through Server Actions guarded by an env-based JWT cookie session. Image uploads go directly from the browser to Cloudinary using server-signed signatures. The public site preserves its current JSX exactly — only the data source changes.

**Tech Stack:** Next.js 16.2.6 · React 19 · TypeScript · Prisma · Neon Postgres · `jose` (Edge JWT) · `bcryptjs` · `zod` · Cloudinary · Tailwind v4 · shadcn/ui · `vitest` (for pure-function unit tests)

**Working directory:** `c:\dev work\portfolio` — all relative paths in this plan are relative to this directory unless otherwise stated.

**Source spec:** `docs/superpowers/specs/2026-05-11-portfolio-backend-design.md` — read this first if you have not.

**⚠ Next.js 16 caveat:** This is Next 16, not Next 14/15. The plan uses `'use cache'` directive (not deprecated `unstable_cache`) and async `cookies()`. Before writing any Next-specific code, skim the relevant file under `node_modules/next/dist/docs/01-app/` if uncertain.

**Cost:** $0/month — every service in this plan fits its free tier (Vercel Hobby, Neon Free, Cloudinary Free).

---

## Phase 0 — Foundation

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```powershell
cd "c:/dev work/portfolio"
npm install prisma @prisma/client bcryptjs jose zod cloudinary
```

Expected: `package.json` updated with the six new dependencies, no install errors.

- [ ] **Step 2: Install dev deps**

```powershell
npm install -D @types/bcryptjs vitest @vitest/ui
```

Expected: `devDependencies` updated.

- [ ] **Step 3: Add scripts to `package.json`**

Edit `package.json` `scripts` block to:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:seed": "node --import tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "hash-password": "node scripts/hash-password.mjs"
}
```

- [ ] **Step 4: Install `tsx` for seed script**

```powershell
npm install -D tsx
```

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore(deps): add Prisma, jose, bcryptjs, zod, cloudinary, vitest, tsx"
```

---

### Task 2: Sign up for Neon and Cloudinary, collect credentials

**No code in this task. Manual setup.**

- [ ] **Step 1: Create Neon account & project**

1. Go to https://neon.tech, sign up (GitHub login OK).
2. Create a new project named `portfolio`.
3. From the dashboard, copy two connection strings:
   - **Pooled** (`...-pooler.neon.tech`) → will be `DATABASE_URL`
   - **Direct** (without `-pooler`) → will be `DATABASE_URL_UNPOOLED`

Expected: Two strings starting with `postgresql://` ending with `?sslmode=require`.

- [ ] **Step 2: Create Cloudinary account**

1. Go to https://cloudinary.com, sign up (free).
2. From the dashboard "Programmable Media → Dashboard", copy:
   - `Cloud name`
   - `API Key`
   - `API Secret`

- [ ] **Step 3: Generate `JWT_SECRET`**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Expected: A 64-character hex string. Save it — this is `JWT_SECRET`.

- [ ] **Step 4: Save credentials somewhere safe (not the repo)**

Keep these in a password manager or temporary note. They go into `.env.local` next.

---

### Task 3: Create `.env.local` and update `.gitignore`

**Files:**
- Create: `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Verify `.env.local` is gitignored**

Open `.gitignore`. Confirm it contains `.env*.local` (Next.js scaffolds add this by default). If missing, add:

```
# env files
.env*.local
.env
```

- [ ] **Step 2: Create `.env.local`**

Create `.env.local` at the project root with:

```
# Database (Neon)
DATABASE_URL="postgresql://USER:PASS@ep-xxxx-pooler.neon.tech/dbname?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://USER:PASS@ep-xxxx.neon.tech/dbname?sslmode=require"

# Auth
JWT_SECRET="<64-hex-char string from Task 2 step 3>"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD_HASH=""
# Will be filled in Task 13. Leave empty for now.

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

Replace placeholders with the values collected in Task 2.

- [ ] **Step 3: Verify env file is ignored by git**

```powershell
git status
```

Expected: `.env.local` does NOT appear in the output. If it does, fix `.gitignore` and re-check.

---

### Task 4: Initialize Prisma

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Run Prisma init**

```powershell
npx prisma init --datasource-provider postgresql
```

Expected: Creates `prisma/schema.prisma` with a default skeleton.

- [ ] **Step 2: Replace `prisma/schema.prisma` content**

Overwrite the file with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model Project {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  subtitle  String
  image     String
  excerpt   String
  year      String
  client    String
  services  String[]
  content   Json
  gallery   String[]
  order     Int      @default(0)
  published Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([order])
  @@index([published])
}

model BlogPost {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  date      String
  image     String
  excerpt   String
  content   Json
  order     Int      @default(0)
  published Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([order])
  @@index([published])
}

model Testimonial {
  id        String   @id @default(cuid())
  name      String
  role      String
  avatar    String
  quote     String
  order     Int      @default(0)
  createdAt DateTime @default(now())

  @@index([order])
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String
  read      Boolean  @default(false)
  ip        String?
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([read])
}

model SiteSettings {
  id             Int      @id @default(1)
  profile        Json
  hero           Json
  stats          Json
  companies      Json
  aboutIntro     Json
  experience     Json
  education      Json
  tools          Json
  faqs           Json
  collaborateCta Json
  contactPage    Json
  footer         Json
  updatedAt      DateTime @updatedAt
}
```

- [ ] **Step 3: Run first migration**

```powershell
npm run db:migrate -- --name init
```

Expected: `prisma/migrations/<timestamp>_init/migration.sql` created. Schema applied to Neon. Prisma Client generated.

- [ ] **Step 4: Verify schema in Neon**

Open Neon dashboard → SQL editor → run:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Expected: Five tables — `Project`, `BlogPost`, `Testimonial`, `ContactMessage`, `SiteSettings` — plus `_prisma_migrations`.

- [ ] **Step 5: Commit**

```powershell
git add prisma/ package.json package-lock.json
git commit -m "feat(db): initial Prisma schema (projects, blog, testimonials, messages, settings)"
```

---

### Task 5: Set up `vitest`

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/.gitkeep`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Create `tests/` placeholder**

```powershell
New-Item -Type Directory tests
New-Item -Type File tests/.gitkeep
```

- [ ] **Step 3: Sanity test**

Create `tests/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run it**

```powershell
npm test
```

Expected: 1 test passed.

- [ ] **Step 5: Delete sanity test, keep placeholder**

```powershell
Remove-Item tests/sanity.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add vitest.config.ts tests/.gitkeep package.json package-lock.json
git commit -m "chore(test): add vitest with @ alias"
```

---

### Task 6: Create Prisma client singleton

**Files:**
- Create: `lib/db/client.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/db/client.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Commit**

```powershell
git add lib/db/client.ts
git commit -m "feat(db): Prisma client singleton (avoids cold-start client churn)"
```

---

### Task 7: Write seed script that ports `lib/data.ts` into the DB

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create the seed script**

This imports the current `lib/data.ts` exports and inserts them. Note: `socials` icon components are stripped to icon keys (matching the registry built in Task 9).

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import {
  profile,
  hero,
  stats,
  companies,
  aboutIntro,
  experience,
  education,
  tools,
  faqs,
  collaborateCta,
  contactPage,
  footer,
  projects,
  blogPosts,
  testimonials,
} from "../lib/data";

const prisma = new PrismaClient();

// Map icon component reference → icon key
function iconRefToKey(socials: typeof profile.socials) {
  return socials.map((s) => {
    const label = s.label.toLowerCase();
    return {
      label: s.label,
      href: s.href,
      iconKey: label === "email" ? "mail" : label,
    };
  });
}

async function main() {
  console.log("Seeding…");

  // Singleton settings
  const profileForDb = {
    name: profile.name,
    role: profile.role,
    location: profile.location,
    portrait: profile.portrait,
    socials: iconRefToKey(profile.socials),
  };

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      profile: profileForDb,
      hero,
      stats: stats as unknown as object,
      companies,
      aboutIntro,
      experience,
      education,
      tools,
      faqs,
      collaborateCta,
      contactPage,
      footer,
    },
    update: {
      profile: profileForDb,
      hero,
      stats: stats as unknown as object,
      companies,
      aboutIntro,
      experience,
      education,
      tools,
      faqs,
      collaborateCta,
      contactPage,
      footer,
    },
  });

  // Projects
  await prisma.project.deleteMany();
  for (const [i, p] of projects.entries()) {
    await prisma.project.create({
      data: {
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        image: p.image,
        excerpt: p.excerpt,
        year: p.year,
        client: p.client,
        services: p.services,
        content: p.content,
        gallery: p.gallery,
        order: i,
        published: true,
      },
    });
  }

  // Blog posts
  await prisma.blogPost.deleteMany();
  for (const [i, b] of blogPosts.entries()) {
    await prisma.blogPost.create({
      data: {
        slug: b.slug,
        title: b.title,
        date: b.date,
        image: b.image,
        excerpt: b.excerpt,
        content: b.content,
        order: i,
        published: true,
      },
    });
  }

  // Testimonials
  await prisma.testimonial.deleteMany();
  for (const [i, t] of testimonials.entries()) {
    await prisma.testimonial.create({
      data: {
        name: t.name,
        role: t.role,
        avatar: t.avatar,
        quote: t.quote,
        order: i,
      },
    });
  }

  console.log("Seeded ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

```powershell
npm run db:seed
```

Expected output: `Seeding…` then `Seeded ✓`. No errors.

- [ ] **Step 3: Verify in Prisma Studio**

```powershell
npm run db:studio
```

Open the URL it prints. Click `Project` — should see 6 rows. Click `BlogPost` — 5 rows. `Testimonial` — 1 row. `SiteSettings` — 1 row. Close Studio.

- [ ] **Step 4: Commit**

```powershell
git add prisma/seed.ts
git commit -m "feat(db): seed script — port lib/data.ts content into Postgres"
```

---

## Phase 1 — Read Layer & Per-Section Migration

### Task 8: Set up cache-tag constants and revalidation helpers

**Files:**
- Create: `lib/revalidate.ts`

- [ ] **Step 1: Enable Cache Components in Next config**

Edit `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "skillicons.dev" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
```

(`cacheComponents: true` is required to use the `'use cache'` directive and `cacheTag` in Next 16. `res.cloudinary.com` added so `next/image` can render Cloudinary URLs.)

- [ ] **Step 2: Create `lib/revalidate.ts`**

```ts
// lib/revalidate.ts
import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  projects: "projects",
  blog: "blog",
  testimonials: "testimonials",
  settings: "settings",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export function revalidateProjects() {
  revalidateTag(CACHE_TAGS.projects);
}
export function revalidateBlog() {
  revalidateTag(CACHE_TAGS.blog);
}
export function revalidateTestimonials() {
  revalidateTag(CACHE_TAGS.testimonials);
}
export function revalidateSettings() {
  revalidateTag(CACHE_TAGS.settings);
}
```

- [ ] **Step 3: Commit**

```powershell
git add next.config.ts lib/revalidate.ts
git commit -m "feat(cache): enable cacheComponents, add tag constants + revalidate helpers"
```

---

### Task 9: Build the icon registry

**Files:**
- Create: `lib/icons/registry.ts`
- Create: `tests/icons/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/icons/registry.test.ts
import { describe, it, expect } from "vitest";
import { ICON_KEYS, resolveIcon } from "@/lib/icons/registry";

describe("icon registry", () => {
  it("exposes all required icon keys", () => {
    expect(ICON_KEYS).toEqual(
      expect.arrayContaining(["behance", "linkedin", "facebook", "youtube", "mail"]),
    );
  });

  it("resolves each key to a component (function or object)", () => {
    for (const key of ICON_KEYS) {
      const Icon = resolveIcon(key);
      expect(Icon).toBeDefined();
      expect(["function", "object"]).toContain(typeof Icon);
    }
  });

  it("returns undefined for unknown keys", () => {
    expect(resolveIcon("unknown" as never)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```powershell
npm test
```

Expected: Test file fails — module `@/lib/icons/registry` does not exist.

- [ ] **Step 3: Implement `lib/icons/registry.ts`**

```ts
// lib/icons/registry.ts
import { Mail, type LucideIcon } from "lucide-react";
import { BehanceIcon } from "@/components/icons/behance";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { FacebookIcon } from "@/components/icons/facebook";
import { YoutubeIcon } from "@/components/icons/youtube";
import type { ComponentType, SVGProps } from "react";

export type IconComponent =
  | LucideIcon
  | ComponentType<SVGProps<SVGSVGElement>>;

const REGISTRY = {
  behance: BehanceIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  mail: Mail,
} as const satisfies Record<string, IconComponent>;

export type IconKey = keyof typeof REGISTRY;

export const ICON_KEYS = Object.keys(REGISTRY) as IconKey[];

export function resolveIcon(key: IconKey): IconComponent | undefined {
  return REGISTRY[key];
}
```

- [ ] **Step 4: Run the test, verify it passes**

```powershell
npm test
```

Expected: 3 tests passed.

- [ ] **Step 5: Commit**

```powershell
git add lib/icons/registry.ts tests/icons/registry.test.ts
git commit -m "feat(icons): icon-key registry for serializable social icon storage"
```

---

### Task 10: Convert `lib/data.ts` to a type-only re-export shim

**Files:**
- Modify: `lib/data.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Move type definitions into `lib/types.ts`**

```ts
// lib/types.ts
import type { Project as DbProject, BlogPost as DbBlogPost, Testimonial as DbTestimonial } from "@prisma/client";

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string };

// Re-shape DB types: Json columns get explicit shapes
export type Project = Omit<DbProject, "content"> & { content: ContentBlock[] };
export type BlogPost = Omit<DbBlogPost, "content"> & { content: ContentBlock[] };
export type Testimonial = DbTestimonial;

export type Tool = { name: string; role: string; icon: string };

export type ExperienceEntry = {
  company: string;
  role: string;
  description: string;
  period: string;
  href: string;
};

export type EducationEntry = {
  institution: string;
  degree: string;
  description: string;
  period: string;
  href: string;
};

export type FAQ = { question: string; answer: string };

export type Social = {
  label: string;
  href: string;
  iconKey: string; // resolved via @/lib/icons/registry
};

export type Profile = {
  name: string;
  role: string;
  location: string;
  portrait: string;
  socials: Social[];
};

export type Hero = {
  headingPrefix: string;
  headingAccent: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export type Stat = { value: number; prefix: string; label: string };

export type Companies = { caption: string; logos: string[] };

export type AboutIntro = {
  headingPrefix: string;
  headingAccent: string;
  paragraphs: string[];
};

export type CollaborateCta = {
  headingLine1: string;
  headingLine2: string;
  body: string;
  href: string;
};

export type ContactPage = {
  headingPrefix: string;
  headingAccent: string;
};

export type Footer = { text: string };

export type SiteSettingsData = {
  profile: Profile;
  hero: Hero;
  stats: Stat[];
  companies: Companies;
  aboutIntro: AboutIntro;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  tools: Tool[];
  faqs: FAQ[];
  collaborateCta: CollaborateCta;
  contactPage: ContactPage;
  footer: Footer;
};
```

- [ ] **Step 2: Replace `lib/data.ts` with a type-only re-export shim**

```ts
// lib/data.ts
// Backwards-compat shim. Existing components that did
//   import type { Project } from "@/lib/data"
// keep working.
//
// Runtime data lives in the database, not here. Use lib/db/* getters.
//
export type {
  ContentBlock,
  Project,
  BlogPost,
  Testimonial,
  Tool,
  ExperienceEntry,
  EducationEntry,
  FAQ,
  Social,
  Profile,
  Hero,
  Stat,
  Companies,
  AboutIntro,
  CollaborateCta,
  ContactPage,
  Footer,
  SiteSettingsData,
} from "@/lib/types";
```

⚠ **Do not commit yet.** This step intentionally breaks every page that imports runtime values from `lib/data.ts`. The next tasks (11–17) restore them via the read layer.

To keep the dev server running while you migrate, temporarily set up a fallback:

- [ ] **Step 3: Verify type check still passes (types only)**

```powershell
npx tsc --noEmit
```

Expected: Many "has no exported member 'projects'" / "'profile'" / etc. errors from components/pages that import runtime values. **This is expected.** They will be fixed one-by-one in Tasks 11–17.

- [ ] **Step 4: Stage these two files but DO NOT commit yet**

```powershell
git add lib/data.ts lib/types.ts
```

(Commit happens at end of Phase 1, once all section pages are migrated.)

---

### Task 11: Build `lib/db/settings.ts` (singleton settings reader)

**Files:**
- Create: `lib/db/settings.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/db/settings.ts
import { cacheTag } from "next/cache";
import { prisma } from "./client";
import { CACHE_TAGS } from "@/lib/revalidate";
import type { SiteSettingsData } from "@/lib/types";

export async function getSiteSettings(): Promise<SiteSettingsData> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);

  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!row) throw new Error("SiteSettings row missing — did you run `npm run db:seed`?");

  return {
    profile: row.profile as SiteSettingsData["profile"],
    hero: row.hero as SiteSettingsData["hero"],
    stats: row.stats as SiteSettingsData["stats"],
    companies: row.companies as SiteSettingsData["companies"],
    aboutIntro: row.aboutIntro as SiteSettingsData["aboutIntro"],
    experience: row.experience as SiteSettingsData["experience"],
    education: row.education as SiteSettingsData["education"],
    tools: row.tools as SiteSettingsData["tools"],
    faqs: row.faqs as SiteSettingsData["faqs"],
    collaborateCta: row.collaborateCta as SiteSettingsData["collaborateCta"],
    contactPage: row.contactPage as SiteSettingsData["contactPage"],
    footer: row.footer as SiteSettingsData["footer"],
  };
}
```

(Verified: in Next 16.2.6, `cacheTag` is exported from `next/cache`. An `unstable_cacheTag` alias also exists for backwards compat — either works.)

- [ ] **Step 2: Manual verification (no test — DB-bound)**

Add a temporary log in `app/page.tsx`:

```tsx
import { getSiteSettings } from "@/lib/db/settings";

export default async function HomePage() {
  const s = await getSiteSettings();
  console.log("[settings]", s.profile.name);
  // ...rest of existing JSX
}
```

Run `npm run dev`, load `/`, check terminal: should print `[settings] Arifujjaman`. Remove the log line.

---

### Task 12: Build `lib/db/projects.ts`

**Files:**
- Create: `lib/db/projects.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/db/projects.ts
import { cacheTag } from "next/cache";
import { prisma } from "./client";
import { CACHE_TAGS } from "@/lib/revalidate";
import type { Project, ContentBlock } from "@/lib/types";

function castContent(p: { content: unknown }): ContentBlock[] {
  return p.content as ContentBlock[];
}

export async function getProjects(limit?: number): Promise<Project[]> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);

  const rows = await prisma.project.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    take: limit,
  });
  return rows.map((r) => ({ ...r, content: castContent(r) }));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);

  const r = await prisma.project.findFirst({
    where: { slug, published: true },
  });
  if (!r) return null;
  return { ...r, content: castContent(r) };
}

export async function getAllProjectSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);

  const rows = await prisma.project.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

// Admin-only (no cache — fresh reads in admin)
export async function getAllProjectsForAdmin() {
  return prisma.project.findMany({
    orderBy: { order: "asc" },
  });
}

export async function getProjectByIdForAdmin(id: string) {
  return prisma.project.findUnique({ where: { id } });
}
```

- [ ] **Step 2: Commit later (with Phase 1 batch)**

---

### Task 13: Build `lib/db/blog.ts`

**Files:**
- Create: `lib/db/blog.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/db/blog.ts
import { cacheTag } from "next/cache";
import { prisma } from "./client";
import { CACHE_TAGS } from "@/lib/revalidate";
import type { BlogPost, ContentBlock } from "@/lib/types";

function castContent(p: { content: unknown }): ContentBlock[] {
  return p.content as ContentBlock[];
}

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    take: limit,
  });
  return rows.map((r) => ({ ...r, content: castContent(r) }));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const r = await prisma.blogPost.findFirst({
    where: { slug, published: true },
  });
  if (!r) return null;
  return { ...r, content: castContent(r) };
}

export async function getAllBlogSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);

  const rows = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

// Admin-only
export async function getAllBlogPostsForAdmin() {
  return prisma.blogPost.findMany({
    orderBy: { order: "asc" },
  });
}

export async function getBlogPostByIdForAdmin(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}
```

---

### Task 14: Build `lib/db/testimonials.ts`

**Files:**
- Create: `lib/db/testimonials.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/db/testimonials.ts
import { cacheTag } from "next/cache";
import { prisma } from "./client";
import { CACHE_TAGS } from "@/lib/revalidate";
import type { Testimonial } from "@/lib/types";

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheTag(CACHE_TAGS.testimonials);

  return prisma.testimonial.findMany({
    orderBy: { order: "asc" },
  });
}

// Admin-only
export async function getTestimonialByIdForAdmin(id: string) {
  return prisma.testimonial.findUnique({ where: { id } });
}
```

---

### Task 15: Build `lib/db/messages.ts` (admin-only, uncached)

**Files:**
- Create: `lib/db/messages.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/db/messages.ts
import { prisma } from "./client";

// All admin-only — no caching, always fresh.
export async function getAllMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadMessageCount() {
  return prisma.contactMessage.count({ where: { read: false } });
}
```

---

### Task 16: Migrate Hero, CompaniesStrip sections

**Files:**
- Modify: `components/sections/hero.tsx`
- Modify: `components/sections/companies-strip.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Read current `hero.tsx`**

Open `components/sections/hero.tsx`. Note its imports of `profile`, `hero`, `stats` from `@/lib/data`.

- [ ] **Step 2: Refactor `hero.tsx` to accept props**

Replace static imports with props:

```tsx
// components/sections/hero.tsx — top of file
import type { Profile, Hero as HeroData, Stat } from "@/lib/types";

interface HeroProps {
  profile: Profile;
  hero: HeroData;
  stats: Stat[];
}

export function Hero({ profile, hero, stats }: HeroProps) {
  // ...rest of existing JSX, replacing `profile.X`, `hero.X`, `stats` references with the prop versions (already named the same!)
}
```

For `profile.socials` rendering, the old code did `<social.icon />`. Update it to use the registry:

```tsx
import { resolveIcon, type IconKey } from "@/lib/icons/registry";

// inside the socials map:
{profile.socials.map((s) => {
  const Icon = resolveIcon(s.iconKey as IconKey);
  if (!Icon) return null;
  return (
    <a key={s.label} href={s.href} aria-label={s.label} /* ...existing className */>
      <Icon /* ...existing props */ />
    </a>
  );
})}
```

- [ ] **Step 3: Refactor `companies-strip.tsx` to accept props**

```tsx
// components/sections/companies-strip.tsx — top
import type { Companies } from "@/lib/types";

interface CompaniesStripProps {
  companies: Companies;
}

export function CompaniesStrip({ companies }: CompaniesStripProps) {
  // ...replace `companies.X` references with `companies.X` (props version)
}
```

- [ ] **Step 4: Update `app/page.tsx` to fetch settings and pass props**

```tsx
// app/page.tsx
import { Hero } from "@/components/sections/hero";
import { CompaniesStrip } from "@/components/sections/companies-strip";
import { ProjectsGrid } from "@/components/sections/projects-grid";
import { ToolsGrid } from "@/components/sections/tools-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogGrid } from "@/components/sections/blog-grid";
import { getSiteSettings } from "@/lib/db/settings";

export default async function HomePage() {
  const settings = await getSiteSettings();
  return (
    <>
      <Hero profile={settings.profile} hero={settings.hero} stats={settings.stats} />
      <CompaniesStrip companies={settings.companies} />
      <ProjectsGrid limit={4} />
      <ToolsGrid />
      <Testimonials />
      <BlogGrid limit={4} />
    </>
  );
}
```

- [ ] **Step 5: Visual verification**

Run `npm run dev`, open `/`. Hero section, socials, stats, companies strip should look pixel-identical to before. Open DevTools → Network → confirm no 500s.

---

### Task 17: Migrate ProjectsGrid (home + /projects)

**Files:**
- Modify: `components/sections/projects-grid.tsx`
- Modify: `app/projects/page.tsx`

- [ ] **Step 1: Refactor `projects-grid.tsx`**

Currently it imports `projects` from `@/lib/data` and has a `limit` prop. Convert to async server component that fetches:

```tsx
// components/sections/projects-grid.tsx
import { getProjects } from "@/lib/db/projects";
import { ProjectCard } from "./project-card";
// ...keep other existing imports

interface ProjectsGridProps {
  limit?: number;
}

export async function ProjectsGrid({ limit }: ProjectsGridProps) {
  const projects = await getProjects(limit);
  // ...keep existing JSX, just use the local `projects` variable
}
```

- [ ] **Step 2: Update `app/projects/page.tsx`**

It already calls `<ProjectsGrid />` — verify it doesn't import `projects` directly. If it does, remove the import.

- [ ] **Step 3: Visual verification**

Open `/` and `/projects`. Project cards should match before. Click into a project — Task 18 fixes the detail page.

---

### Task 18: Migrate Project detail page

**Files:**
- Modify: `app/projects/[slug]/page.tsx`
- Modify: `components/sections/project-detail.tsx` (if it imports data)

- [ ] **Step 1: Read current `app/projects/[slug]/page.tsx`**

Note: Next 16's `params` is async — verify the existing file already awaits it.

- [ ] **Step 2: Update slug page**

```tsx
// app/projects/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlug, getAllProjectSlugs } from "@/lib/db/projects";
import { ProjectDetail } from "@/components/sections/project-detail";

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — ${project.subtitle}`,
    description: project.excerpt,
    openGraph: { images: [project.image] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
```

- [ ] **Step 3: Refactor `components/sections/project-detail.tsx` if it imports `projects`**

If the current component takes a slug or imports the list — switch to receiving the full `project` object as a prop. Otherwise leave it.

- [ ] **Step 4: Visual verification**

Open `/projects/nokshi`, `/projects/aronno`, etc. Each detail page should render exactly as before. `/projects/does-not-exist` should 404.

---

### Task 19: Migrate Blog list, detail, and home grid

**Files:**
- Modify: `components/sections/blog-grid.tsx`
- Modify: `components/sections/blog-detail.tsx` (if needed)
- Modify: `app/blog/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: Refactor `blog-grid.tsx`**

```tsx
// components/sections/blog-grid.tsx
import { getBlogPosts } from "@/lib/db/blog";
// ...existing imports

interface BlogGridProps {
  limit?: number;
}

export async function BlogGrid({ limit }: BlogGridProps) {
  const posts = await getBlogPosts(limit);
  // ...existing JSX
}
```

- [ ] **Step 2: Update `app/blog/page.tsx`**

Verify it just renders `<BlogGrid />` with no static imports. Strip any `import { blogPosts }` if present.

- [ ] **Step 3: Update `app/blog/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostBySlug, getAllBlogSlugs } from "@/lib/db/blog";
import { BlogDetail } from "@/components/sections/blog-detail";

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.image] },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  return <BlogDetail post={post} />;
}
```

- [ ] **Step 4: Refactor `blog-detail.tsx` to take a `post` prop if it imported the list**

- [ ] **Step 5: Visual verification**

Open `/blog`, click a post, navigate around. All pages should look identical to before.

---

### Task 20: Migrate Testimonials section

**Files:**
- Modify: `components/sections/testimonials.tsx`

- [ ] **Step 1: Refactor**

```tsx
// components/sections/testimonials.tsx
import { getTestimonials } from "@/lib/db/testimonials";
// ...existing imports

export async function Testimonials() {
  const testimonials = await getTestimonials();
  // ...existing JSX (uses local `testimonials`)
}
```

- [ ] **Step 2: Visual verification**

`/` should still show the testimonial. If you have only one, layout unchanged.

---

### Task 21: Migrate Tools, About, Experience, Education, FAQ, CollaborateCTA, Footer

**Files:**
- Modify: `components/sections/tools-grid.tsx`
- Modify: `components/sections/about-intro.tsx`
- Modify: `components/sections/experience-list.tsx`
- Modify: `components/sections/education-list.tsx`
- Modify: `components/sections/faq.tsx`
- Modify: `components/sections/collaborate-cta.tsx`
- Modify: `components/layout/footer.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/tools/page.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `app/layout.tsx`

For each section component below, the pattern is the same: **convert to async, fetch settings, use the relevant slice.**

- [ ] **Step 1: `tools-grid.tsx`**

```tsx
import { getSiteSettings } from "@/lib/db/settings";

export async function ToolsGrid() {
  const { tools } = await getSiteSettings();
  // ...existing JSX
}
```

- [ ] **Step 2: `about-intro.tsx`** — same shape, destructure `aboutIntro`.

- [ ] **Step 3: `experience-list.tsx`** — destructure `experience` and `experienceHeading` (heading was static-only; move into the fetched data or keep its constant in the component).

If `experienceHeading` was a separate const, decide:
- Option A: hardcode it in the component (it's English UI copy, not really content)
- Option B: add it to `SiteSettings` JSON

For YAGNI, **hardcode it in the component.** No admin UI for it.

```tsx
const experienceHeading = { prefix: "My Professional", accent: "Journey" };
```

Same for `educationHeading` in `education-list.tsx`.

- [ ] **Step 4: `education-list.tsx`** — destructure `education`.

- [ ] **Step 5: `faq.tsx`** — destructure `faqs`.

- [ ] **Step 6: `collaborate-cta.tsx`** — destructure `collaborateCta`.

- [ ] **Step 7: `components/layout/footer.tsx`** — destructure `footer`.

- [ ] **Step 8: `app/about/page.tsx`** — verify it composes `AboutIntro`, `ExperienceList`, `EducationList`, etc. Strip any `import { ... }` from `@/lib/data`.

- [ ] **Step 9: `app/tools/page.tsx`** — same.

- [ ] **Step 10: `app/contact/page.tsx`** — keeps `ContactForm` (Task 47 wires its action). The heading copy (`contactPage`) used inside `ContactForm` will be passed as a prop:

```tsx
// app/contact/page.tsx
import { ContactForm } from "@/components/sections/contact-form";
import { getSiteSettings } from "@/lib/db/settings";

export default async function ContactPage() {
  const { contactPage } = await getSiteSettings();
  return <ContactForm contactPage={contactPage} />;
}
```

Update `ContactForm` signature to accept `contactPage: ContactPage` prop and use it instead of the static import.

- [ ] **Step 11: `app/layout.tsx` — sidebar / nav**

The sidebar (`components/layout/sidebar.tsx`) likely uses `profile` and `navItems`. `navItems` is purely static UI config — keep it hardcoded in `lib/nav.ts`:

```ts
// lib/nav.ts
import { Home, Folder, Wrench, Briefcase, SquarePen, Mail } from "lucide-react";

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Briefcase },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/blog", label: "Blog", icon: SquarePen },
  { href: "/contact", label: "Contact", icon: Mail },
] as const;
```

Update sidebar to import from `@/lib/nav` (not `@/lib/data`). For `profile`, fetch in `app/layout.tsx` and pass down:

```tsx
// app/layout.tsx
import { Sidebar } from "@/components/layout/sidebar";
import { getSiteSettings } from "@/lib/db/settings";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSiteSettings();
  return (
    <html lang="en" /* ...existing attrs */>
      <body /* ...existing attrs */>
        <Sidebar profile={profile} />
        {/* ...rest */}
      </body>
    </html>
  );
}
```

Update `Sidebar` to take `profile` as prop and resolve socials via `resolveIcon`.

- [ ] **Step 12: Visual verification — full site walk**

Run `npm run dev`. Visit every route:
- `/` — hero, companies, projects (4), tools, testimonials, blog (4)
- `/about` — about intro, experience, education
- `/projects` — full projects grid
- `/projects/nokshi` — detail
- `/blog` — full grid
- `/blog/typography-soul-of-brand` — detail
- `/tools` — tools grid
- `/contact` — contact form

Each page must look pixel-identical to before. Compare side-by-side with a previous deployment if needed.

- [ ] **Step 13: Type check + lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: zero errors. If `lib/data.ts` runtime imports remain anywhere, fix them.

- [ ] **Step 14: Commit Phase 1 in one atomic commit**

```powershell
git add -A
git commit -m "feat(data): replace static lib/data.ts exports with DB-backed reads (cached, tag-revalidated). Frontend layout unchanged."
```

---

## Phase 2 — Auth & Admin Shell

### Task 22: Build password helpers + hash-password CLI script

**Files:**
- Create: `lib/auth/password.ts`
- Create: `scripts/hash-password.mjs`
- Create: `tests/auth/password.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/auth/password.test.ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("hunter2");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("hunter2", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```powershell
npm test
```

Expected: module not found.

- [ ] **Step 3: Implement `lib/auth/password.ts`**

```ts
// lib/auth/password.ts
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run, verify pass**

```powershell
npm test
```

Expected: 1 test passed.

- [ ] **Step 5: Create CLI helper `scripts/hash-password.mjs`**

```js
// scripts/hash-password.mjs
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
```

- [ ] **Step 6: Generate a hash for your admin password**

```powershell
npm run hash-password -- "your-admin-password-here"
```

Copy the `$2b$12$...` output and paste it into `.env.local` as `ADMIN_PASSWORD_HASH`.

- [ ] **Step 7: Commit**

```powershell
git add lib/auth/password.ts tests/auth/password.test.ts scripts/hash-password.mjs
git commit -m "feat(auth): bcryptjs password hashing + CLI hash-password script"
```

---

### Task 23: Build session (JWT) helpers

**Files:**
- Create: `lib/auth/session.ts`
- Create: `tests/auth/session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/auth/session.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-test-secret-test-secret-test";
});

describe("session", () => {
  it("signs and verifies a JWT", async () => {
    const token = await signSession();
    expect(typeof token).toBe("string");
    const payload = await verifySession(token);
    expect(payload?.sub).toBe("admin");
  });

  it("rejects a tampered token", async () => {
    const token = await signSession();
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySession(tampered)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

```powershell
npm test
```

- [ ] **Step 3: Implement `lib/auth/session.ts`**

```ts
// lib/auth/session.ts
import { SignJWT, jwtVerify } from "jose";

const SESSION_TTL = "7d";
export const SESSION_COOKIE = "admin_session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(): Promise<string> {
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
): Promise<{ sub: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.sub !== "admin") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run, verify pass**

```powershell
npm test
```

Expected: 3 tests passed.

- [ ] **Step 5: Commit**

```powershell
git add lib/auth/session.ts tests/auth/session.test.ts
git commit -m "feat(auth): jose-based JWT session helpers (Edge-compatible)"
```

---

### Task 24: Build `requireAdmin` guard for Server Actions

**Files:**
- Create: `lib/auth/guard.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/auth/guard.ts
import "server-only";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Throws UnauthorizedError if the request is not from the admin.
 * Use at the top of every mutating Server Action and in admin Server Components.
 */
export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) throw new UnauthorizedError();
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return (await verifySession(token)) !== null;
}
```

- [ ] **Step 2: Install `server-only`**

```powershell
npm install server-only
```

- [ ] **Step 3: Commit**

```powershell
git add lib/auth/guard.ts package.json package-lock.json
git commit -m "feat(auth): requireAdmin guard for server actions and admin pages"
```

---

### Task 25: Add middleware to gate /admin/*

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Create middleware**

```ts
// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";

const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page through
  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Verify middleware runs**

Run `npm run dev`. Visit http://localhost:3000/admin → should redirect to `/admin/login`. (The login page doesn't exist yet → expect 404.) Visit http://localhost:3000/admin/login → 404 (file doesn't exist yet, Task 27).

- [ ] **Step 3: Commit**

```powershell
git add middleware.ts
git commit -m "feat(auth): edge middleware gates /admin/* via JWT cookie"
```

---

### Task 26: Build the login Server Action

**Files:**
- Create: `actions/auth.ts`

- [ ] **Step 1: Create the file**

```ts
// actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const { email, password } = parsed.data;
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedEmail || !expectedHash) {
    return { error: "Admin credentials not configured" };
  }
  if (email !== expectedEmail) {
    return { error: "Invalid email or password" };
  }
  if (!(await verifyPassword(password, expectedHash))) {
    return { error: "Invalid email or password" };
  }

  const token = await signSession();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
```

- [ ] **Step 2: Commit**

```powershell
git add actions/auth.ts
git commit -m "feat(auth): loginAction + logoutAction (env-credential, JWT cookie)"
```

---

### Task 27: Build the admin login page

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `components/admin/login-form.tsx`

- [ ] **Step 1: Create login page (Server Component)**

```tsx
// app/admin/login/page.tsx
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-card p-8 space-y-6">
        <h1 className="font-outfit font-bold text-2xl text-text-primary">Admin Login</h1>
        <LoginForm />
      </div>
    </main>
  );
}

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};
```

- [ ] **Step 2: Create the form (Client Component)**

```tsx
// components/admin/login-form.tsx
"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-text-primary mb-2">Email</label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-text-primary mb-2">Password</label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full bg-accent text-white">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Manual test**

Run `npm run dev`. Visit http://localhost:3000/admin/login. Try wrong credentials → error message. Try correct credentials → redirected to `/admin` (404 for now — will create in Task 28).

- [ ] **Step 4: Commit**

```powershell
git add app/admin/login/page.tsx components/admin/login-form.tsx
git commit -m "feat(admin): hidden /admin/login page + form"
```

---

### Task 28: Build admin layout shell

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `components/admin/shell.tsx`
- Create: `components/admin/logout-button.tsx`

- [ ] **Step 1: Create shell**

```tsx
// components/admin/shell.tsx
import Link from "next/link";
import { LogoutButton } from "./logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg-base text-text-primary">
      <aside className="w-60 shrink-0 border-r border-border-subtle bg-bg-card flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <span className="font-outfit font-bold">Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm hover:bg-bg-card-hover"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-border-subtle">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create logout button**

```tsx
// components/admin/logout-button.tsx
"use client";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
        Sign out
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create admin layout**

The admin layout is **completely separate** from the public site layout — no sidebar/floating-nav, different shell.

```tsx
// app/admin/layout.tsx
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
```

⚠ This layout wraps `/admin/login` too (since it's nested under `/admin`). Login page should NOT show the shell. Solution: route group `/admin/(auth)/login` vs `/admin/(panel)/...`. Restructure:

- Move `app/admin/login/page.tsx` to `app/admin/(auth)/login/page.tsx`
- Move admin shell pages under `app/admin/(panel)/...`
- Create `app/admin/(auth)/layout.tsx` with no shell
- Create `app/admin/(panel)/layout.tsx` with the shell

Final structure:

```
app/admin/
├── (auth)/
│   ├── layout.tsx          # plain layout
│   └── login/page.tsx      # login form
└── (panel)/
    ├── layout.tsx          # AdminShell wrapper
    ├── page.tsx            # dashboard (Task 29)
    ├── projects/...
    └── ...
```

- [ ] **Step 4: Apply restructure**

```powershell
New-Item -Type Directory app/admin/(auth)
Move-Item app/admin/login app/admin/(auth)/login
New-Item -Type Directory app/admin/(panel)
```

Create `app/admin/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

Create `app/admin/(panel)/layout.tsx` (move the AdminShell layout here):

```tsx
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";

export const metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
```

Delete the old `app/admin/layout.tsx` if it was created.

- [ ] **Step 5: Manual test**

Login flow: `/admin/login` (no shell) → submit → redirect `/admin` (404 still, panel page is Task 29). Visit `/admin/login` directly while logged in → middleware lets it through (we allowlist it).

- [ ] **Step 6: Commit**

```powershell
git add app/admin components/admin
git commit -m "feat(admin): route-grouped admin layout — (auth) plain, (panel) with shell"
```

---

### Task 29: Build the admin dashboard page

**Files:**
- Create: `app/admin/(panel)/page.tsx`

- [ ] **Step 1: Create dashboard**

```tsx
// app/admin/(panel)/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { getUnreadMessageCount } from "@/lib/db/messages";

export default async function AdminDashboardPage() {
  const [projectCount, blogCount, testimonialCount, unread] = await Promise.all([
    prisma.project.count(),
    prisma.blogPost.count(),
    prisma.testimonial.count(),
    getUnreadMessageCount(),
  ]);

  const cards = [
    { label: "Projects", value: projectCount, href: "/admin/projects" },
    { label: "Blog posts", value: blogCount, href: "/admin/blog" },
    { label: "Testimonials", value: testimonialCount, href: "/admin/testimonials" },
    { label: "Unread messages", value: unread, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border-subtle bg-bg-card p-4 hover:bg-bg-card-hover"
          >
            <div className="text-sm text-text-muted">{c.label}</div>
            <div className="font-outfit font-bold text-3xl mt-1">{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual test**

Login → `/admin` shows four cards with correct counts (6 projects, 5 blog posts, 1 testimonial, 0 unread).

- [ ] **Step 3: Commit**

```powershell
git add app/admin
git commit -m "feat(admin): dashboard with entity counts"
```

---

## Phase 3 — Cloudinary Upload Pipeline

### Task 30: Server-side signature endpoint

**Files:**
- Create: `lib/cloudinary/sign.ts`
- Create: `actions/cloudinary.ts`

- [ ] **Step 1: Create sign helper**

```ts
// lib/cloudinary/sign.ts
import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type UploadFolder = "projects" | "blog" | "avatars" | "misc";

export type UploadSignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

export function createUploadSignature(folder: UploadFolder): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = `portfolio/${folder}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: folderPath },
    process.env.CLOUDINARY_API_SECRET!,
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: folderPath,
  };
}
```

- [ ] **Step 2: Create the admin-guarded action**

```ts
// actions/cloudinary.ts
"use server";

import { requireAdmin } from "@/lib/auth/guard";
import { createUploadSignature, type UploadFolder, type UploadSignature } from "@/lib/cloudinary/sign";

export async function getUploadSignature(folder: UploadFolder): Promise<UploadSignature> {
  await requireAdmin();
  return createUploadSignature(folder);
}
```

- [ ] **Step 3: Commit**

```powershell
git add lib/cloudinary actions/cloudinary.ts
git commit -m "feat(cloudinary): admin-guarded signed upload signature generator"
```

---

### Task 31: Build the `<ImageUpload />` widget

**Files:**
- Create: `components/admin/image-upload.tsx`

- [ ] **Step 1: Create the widget**

```tsx
// components/admin/image-upload.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { getUploadSignature } from "@/actions/cloudinary";
import { Button } from "@/components/ui/button";
import type { UploadFolder } from "@/lib/cloudinary/sign";

interface Props {
  name: string;            // hidden input name → flows into FormData
  defaultValue?: string;   // existing image URL (edit mode)
  folder: UploadFolder;
  label?: string;
}

export function ImageUpload({ name, defaultValue, folder, label = "Image" }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const sig = await getUploadSignature(folder);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", sig.timestamp.toString());
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: fd },
      );
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const json = (await res.json()) as { secure_url: string };
      setUrl(json.secure_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-text-primary">{label}</label>
      <input type="hidden" name={name} value={url} />
      {url && (
        <div className="relative w-full max-w-xs aspect-[4/3] rounded-md overflow-hidden border border-border-subtle">
          <Image src={url} alt="" fill className="object-cover" sizes="320px" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : url ? "Replace image" : "Upload image"}
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
            Remove
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test (no full UI yet)**

Skip until Task 35 wires this into a real form.

- [ ] **Step 3: Commit**

```powershell
git add components/admin/image-upload.tsx
git commit -m "feat(admin): ImageUpload widget — direct browser → Cloudinary upload"
```

---

### Task 32: Build the `<GalleryUpload />` widget (multi-image with reorder)

**Files:**
- Create: `components/admin/gallery-upload.tsx`

- [ ] **Step 1: Create the widget**

```tsx
// components/admin/gallery-upload.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { getUploadSignature } from "@/actions/cloudinary";
import { Button } from "@/components/ui/button";
import type { UploadFolder } from "@/lib/cloudinary/sign";

interface Props {
  name: string;             // hidden input name (JSON-stringified array)
  defaultValue?: string[];
  folder: UploadFolder;
  label?: string;
}

export function GalleryUpload({ name, defaultValue = [], folder, label = "Gallery" }: Props) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError(null);
    try {
      const sig = await getUploadSignature(folder);
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", sig.timestamp.toString());
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: fd },
        );
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const json = (await res.json()) as { secure_url: string };
        uploaded.push(json.secure_url);
      }
      setUrls((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function move(from: number, to: number) {
    setUrls((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function remove(idx: number) {
    setUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-text-primary">{label}</label>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      {urls.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {urls.map((u, i) => (
            <li key={u} className="relative group rounded-md overflow-hidden border border-border-subtle aspect-[4/3]">
              <Image src={u} alt="" fill className="object-cover" sizes="200px" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/60 opacity-0 group-hover:opacity-100 transition">
                <button type="button" onClick={() => move(i, i - 1)} className="px-2 text-xs text-white">↑</button>
                <button type="button" onClick={() => move(i, i + 1)} className="px-2 text-xs text-white">↓</button>
                <button type="button" onClick={() => remove(i)} className="px-2 text-xs text-white">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : "Add images"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/admin/gallery-upload.tsx
git commit -m "feat(admin): GalleryUpload — multi-image with reorder & remove"
```

---

### Task 33: Build the `<ContentBlocksEditor />` widget

**Files:**
- Create: `components/admin/content-blocks-editor.tsx`

- [ ] **Step 1: Create the widget**

```tsx
// components/admin/content-blocks-editor.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ContentBlock } from "@/lib/types";

interface Props {
  name: string;
  defaultValue?: ContentBlock[];
  label?: string;
}

export function ContentBlocksEditor({ name, defaultValue = [], label = "Content" }: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(defaultValue);

  function update(idx: number, next: ContentBlock) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? next : b)));
  }
  function add(kind: ContentBlock["kind"]) {
    setBlocks((prev) => [...prev, { kind, text: "" }]);
  }
  function remove(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }
  function move(from: number, to: number) {
    setBlocks((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm text-text-primary">{label}</label>
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      <ul className="space-y-3">
        {blocks.map((b, i) => (
          <li key={i} className="rounded-md border border-border-subtle p-3 space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={b.kind}
                onChange={(e) => update(i, { kind: e.target.value as ContentBlock["kind"], text: b.text })}
                className="text-xs bg-bg-card border border-border-subtle rounded px-2 py-1"
              >
                <option value="p">Paragraph</option>
                <option value="h2">Heading 2</option>
              </select>
              <div className="ml-auto flex gap-1">
                <Button type="button" size="xs" variant="ghost" onClick={() => move(i, i - 1)}>↑</Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => move(i, i + 1)}>↓</Button>
                <Button type="button" size="xs" variant="destructive" onClick={() => remove(i)}>Delete</Button>
              </div>
            </div>
            {b.kind === "p" ? (
              <Textarea
                value={b.text}
                onChange={(e) => update(i, { kind: "p", text: e.target.value })}
                rows={4}
                className="w-full"
              />
            ) : (
              <input
                type="text"
                value={b.text}
                onChange={(e) => update(i, { kind: "h2", text: e.target.value })}
                className="w-full bg-bg-card border border-border-subtle rounded px-2 py-2 text-base font-semibold"
              />
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => add("p")}>+ Paragraph</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => add("h2")}>+ Heading</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/admin/content-blocks-editor.tsx
git commit -m "feat(admin): ContentBlocksEditor — paragraph/h2 ordered list editor"
```

---

## Phase 4 — Projects Admin CRUD (Template)

### Task 34: Project zod schema + actions

**Files:**
- Create: `lib/validation/project.ts`
- Create: `actions/projects.ts`

- [ ] **Step 1: Create validation**

```ts
// lib/validation/project.ts
import { z } from "zod";

const contentBlockSchema = z.union([
  z.object({ kind: z.literal("p"), text: z.string() }),
  z.object({ kind: z.literal("h2"), text: z.string() }),
]);

export const projectSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "lowercase, numbers, hyphens only"),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(200),
  image: z.string().url(),
  excerpt: z.string().min(1).max(1000),
  year: z.string().min(1).max(20),
  client: z.string().min(1).max(200),
  services: z.array(z.string().min(1)).default([]),
  content: z.array(contentBlockSchema).default([]),
  gallery: z.array(z.string().url()).default([]),
  published: z.boolean().default(true),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// Helper for FormData → typed object
export function parseProjectFormData(fd: FormData): ProjectInput {
  return projectSchema.parse({
    slug: fd.get("slug"),
    title: fd.get("title"),
    subtitle: fd.get("subtitle"),
    image: fd.get("image"),
    excerpt: fd.get("excerpt"),
    year: fd.get("year"),
    client: fd.get("client"),
    services: JSON.parse((fd.get("services") as string) ?? "[]"),
    content: JSON.parse((fd.get("content") as string) ?? "[]"),
    gallery: JSON.parse((fd.get("gallery") as string) ?? "[]"),
    published: fd.get("published") === "on",
  });
}
```

- [ ] **Step 2: Test the schema**

Create `tests/validation/project.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { projectSchema } from "@/lib/validation/project";

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    expect(() =>
      projectSchema.parse({
        slug: "my-project",
        title: "T",
        subtitle: "S",
        image: "https://example.com/x.jpg",
        excerpt: "ex",
        year: "2025",
        client: "C",
        services: ["a"],
        content: [{ kind: "p", text: "hi" }],
        gallery: [],
        published: true,
      }),
    ).not.toThrow();
  });

  it("rejects bad slug", () => {
    expect(() =>
      projectSchema.parse({
        slug: "Bad Slug!",
        title: "T", subtitle: "S", image: "https://x/y.jpg",
        excerpt: "e", year: "1", client: "c",
      }),
    ).toThrow();
  });
});
```

```powershell
npm test
```

Expected: 2 tests pass.

- [ ] **Step 3: Create actions**

```ts
// actions/projects.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { revalidateProjects } from "@/lib/revalidate";
import { parseProjectFormData } from "@/lib/validation/project";

export async function createProject(formData: FormData) {
  await requireAdmin();
  const data = parseProjectFormData(formData);
  await prisma.project.create({
    data: { ...data, order: await nextOrder() },
  });
  revalidateProjects();
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseProjectFormData(formData);
  await prisma.project.update({ where: { id }, data });
  revalidateProjects();
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  redirect("/admin/projects");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidateProjects();
  revalidatePath("/admin/projects");
}

export async function reorderProjects(ordered: { id: string; order: number }[]) {
  await requireAdmin();
  await prisma.$transaction(
    ordered.map((o) =>
      prisma.project.update({ where: { id: o.id }, data: { order: o.order } }),
    ),
  );
  revalidateProjects();
  revalidatePath("/admin/projects");
}

async function nextOrder(): Promise<number> {
  const top = await prisma.project.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (top?.order ?? -1) + 1;
}
```

- [ ] **Step 4: Commit**

```powershell
git add lib/validation/project.ts actions/projects.ts tests/validation/project.test.ts
git commit -m "feat(admin): project zod schema + create/update/delete/reorder actions"
```

---

### Task 35: Build project edit form (reusable for new + edit)

**Files:**
- Create: `components/admin/project-form.tsx`

- [ ] **Step 1: Create the form**

```tsx
// components/admin/project-form.tsx
"use client";

import { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import { GalleryUpload } from "./gallery-upload";
import { ContentBlocksEditor } from "./content-blocks-editor";
import type { Project } from "@/lib/types";

interface Props {
  project?: Project;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export function ProjectForm({ project, action, submitLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [services, setServices] = useState<string[]>(project?.services ?? []);
  const [serviceDraft, setServiceDraft] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("services", JSON.stringify(services));
        startTransition(() => action(fd));
      }}
      className="space-y-6 max-w-2xl"
    >
      <Field label="Slug">
        <Input name="slug" defaultValue={project?.slug ?? ""} required pattern="[a-z0-9-]+" />
      </Field>
      <Field label="Title">
        <Input name="title" defaultValue={project?.title ?? ""} required />
      </Field>
      <Field label="Subtitle">
        <Input name="subtitle" defaultValue={project?.subtitle ?? ""} required />
      </Field>
      <Field label="Year">
        <Input name="year" defaultValue={project?.year ?? ""} required />
      </Field>
      <Field label="Client">
        <Input name="client" defaultValue={project?.client ?? ""} required />
      </Field>
      <Field label="Excerpt">
        <Textarea name="excerpt" defaultValue={project?.excerpt ?? ""} required rows={3} />
      </Field>

      <div className="space-y-2">
        <label className="block text-sm">Services (tags)</label>
        <div className="flex flex-wrap gap-2">
          {services.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-bg-card-hover">
              {s}
              <button type="button" onClick={() => setServices((p) => p.filter((_, j) => j !== i))}>✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={serviceDraft}
            onChange={(e) => setServiceDraft(e.target.value)}
            placeholder="e.g. Brand identity"
          />
          <Button type="button" variant="outline" size="sm"
            onClick={() => {
              if (serviceDraft.trim()) {
                setServices((p) => [...p, serviceDraft.trim()]);
                setServiceDraft("");
              }
            }}
          >Add</Button>
        </div>
      </div>

      <ImageUpload name="image" defaultValue={project?.image} folder="projects" label="Cover image" />
      <GalleryUpload name="gallery" defaultValue={project?.gallery} folder="projects" label="Gallery" />
      <ContentBlocksEditor name="content" defaultValue={project?.content} label="Content blocks" />

      <label className="flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={project?.published ?? true} />
        <span className="text-sm">Published</span>
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/admin/project-form.tsx
git commit -m "feat(admin): reusable ProjectForm for new + edit"
```

---

### Task 36: Build project list, new, and edit pages

**Files:**
- Create: `app/admin/(panel)/projects/page.tsx`
- Create: `app/admin/(panel)/projects/new/page.tsx`
- Create: `app/admin/(panel)/projects/[id]/page.tsx`
- Create: `components/admin/delete-button.tsx`

- [ ] **Step 1: Create reusable delete button**

```tsx
// components/admin/delete-button.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}

export function DeleteButton({ action, label = "Delete", confirmText = "Delete this item?" }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) startTransition(() => action());
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}
```

- [ ] **Step 2: Create list page**

```tsx
// app/admin/(panel)/projects/page.tsx
import Link from "next/link";
import { getAllProjectsForAdmin } from "@/lib/db/projects";
import { deleteProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-outfit font-bold text-2xl">Projects</h1>
        <Link href="/admin/projects/new">
          <Button>New project</Button>
        </Link>
      </div>

      <ul className="rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-text-muted">/{p.slug} · order {p.order} · {p.published ? "published" : "draft"}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/projects/${p.id}`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
              <DeleteButton
                action={async () => {
                  "use server";
                  await deleteProject(p.id);
                }}
                confirmText={`Delete "${p.title}"?`}
              />
            </div>
          </li>
        ))}
        {projects.length === 0 && (
          <li className="p-6 text-center text-text-muted">No projects yet.</li>
        )}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create "new" page**

```tsx
// app/admin/(panel)/projects/new/page.tsx
import { ProjectForm } from "@/components/admin/project-form";
import { createProject } from "@/actions/projects";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">New project</h1>
      <ProjectForm
        action={async (fd) => {
          "use server";
          await createProject(fd);
        }}
        submitLabel="Create"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create edit page**

```tsx
// app/admin/(panel)/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { updateProject } from "@/actions/projects";
import { getProjectByIdForAdmin } from "@/lib/db/projects";
import type { Project } from "@/lib/types";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getProjectByIdForAdmin(id);
  if (!row) notFound();
  const project = { ...row, content: row.content as Project["content"] };

  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">Edit project</h1>
      <ProjectForm
        project={project}
        action={async (fd) => {
          "use server";
          await updateProject(id, fd);
        }}
        submitLabel="Save"
      />
    </div>
  );
}
```

- [ ] **Step 5: End-to-end test**

1. `npm run dev`, login at `/admin/login`.
2. Click `Projects` → see 6 seeded projects.
3. Click `New project` → fill form → upload cover image → upload gallery → save.
4. Verify it appears in the list. Visit `/projects` (public) — new project shows up (after revalidation, may need page refresh).
5. Click `Edit` on a project → change title → save → verify change reflects in list and on `/projects/<slug>`.
6. Click `Delete` → confirm → row removed.

- [ ] **Step 6: Commit**

```powershell
git add app/admin components/admin/delete-button.tsx
git commit -m "feat(admin): projects CRUD pages (list/new/edit/delete) with revalidation"
```

---

## Phase 5 — Blog & Testimonials Admin

### Task 37: Blog zod schema + actions

**Files:**
- Create: `lib/validation/blog.ts`
- Create: `actions/blog.ts`

- [ ] **Step 1: Create validation**

```ts
// lib/validation/blog.ts
import { z } from "zod";

const contentBlockSchema = z.union([
  z.object({ kind: z.literal("p"), text: z.string() }),
  z.object({ kind: z.literal("h2"), text: z.string() }),
]);

export const blogPostSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  date: z.string().min(1).max(50),
  image: z.string().url(),
  excerpt: z.string().min(1).max(1000),
  content: z.array(contentBlockSchema).default([]),
  published: z.boolean().default(true),
});

export type BlogInput = z.infer<typeof blogPostSchema>;

export function parseBlogFormData(fd: FormData): BlogInput {
  return blogPostSchema.parse({
    slug: fd.get("slug"),
    title: fd.get("title"),
    date: fd.get("date"),
    image: fd.get("image"),
    excerpt: fd.get("excerpt"),
    content: JSON.parse((fd.get("content") as string) ?? "[]"),
    published: fd.get("published") === "on",
  });
}
```

- [ ] **Step 2: Create actions**

```ts
// actions/blog.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { revalidateBlog } from "@/lib/revalidate";
import { parseBlogFormData } from "@/lib/validation/blog";

export async function createBlogPost(formData: FormData) {
  await requireAdmin();
  const data = parseBlogFormData(formData);
  await prisma.blogPost.create({
    data: { ...data, order: await nextOrder() },
  });
  revalidateBlog();
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function updateBlogPost(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseBlogFormData(formData);
  await prisma.blogPost.update({ where: { id }, data });
  revalidateBlog();
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id } });
  revalidateBlog();
  revalidatePath("/admin/blog");
}

async function nextOrder(): Promise<number> {
  const top = await prisma.blogPost.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (top?.order ?? -1) + 1;
}
```

- [ ] **Step 3: Commit**

```powershell
git add lib/validation/blog.ts actions/blog.ts
git commit -m "feat(admin): blog zod schema + create/update/delete actions"
```

---

### Task 38: Build blog admin pages (list, new, edit)

**Files:**
- Create: `components/admin/blog-form.tsx`
- Create: `app/admin/(panel)/blog/page.tsx`
- Create: `app/admin/(panel)/blog/new/page.tsx`
- Create: `app/admin/(panel)/blog/[id]/page.tsx`

- [ ] **Step 1: Create `BlogForm`**

```tsx
// components/admin/blog-form.tsx
"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import { ContentBlocksEditor } from "./content-blocks-editor";
import type { BlogPost } from "@/lib/types";

interface Props {
  post?: BlogPost;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}

export function BlogForm({ post, action, submitLabel }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-6 max-w-2xl"
    >
      <Field label="Slug">
        <Input name="slug" defaultValue={post?.slug ?? ""} required pattern="[a-z0-9-]+" />
      </Field>
      <Field label="Title">
        <Input name="title" defaultValue={post?.title ?? ""} required />
      </Field>
      <Field label="Date (display string, e.g. Apr 8, 2024)">
        <Input name="date" defaultValue={post?.date ?? ""} required />
      </Field>
      <Field label="Excerpt">
        <Textarea name="excerpt" defaultValue={post?.excerpt ?? ""} required rows={3} />
      </Field>

      <ImageUpload name="image" defaultValue={post?.image} folder="blog" label="Cover image" />
      <ContentBlocksEditor name="content" defaultValue={post?.content} label="Content blocks" />

      <label className="flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? true} />
        <span className="text-sm">Published</span>
      </label>

      <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="block text-sm">{label}</label>{children}</div>;
}
```

- [ ] **Step 2: Create list page**

```tsx
// app/admin/(panel)/blog/page.tsx
import Link from "next/link";
import { getAllBlogPostsForAdmin } from "@/lib/db/blog";
import { deleteBlogPost } from "@/actions/blog";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function AdminBlogPage() {
  const posts = await getAllBlogPostsForAdmin();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-outfit font-bold text-2xl">Blog posts</h1>
        <Link href="/admin/blog/new"><Button>New post</Button></Link>
      </div>
      <ul className="rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-text-muted">/{p.slug} · {p.date} · {p.published ? "published" : "draft"}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/blog/${p.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
              <DeleteButton
                action={async () => { "use server"; await deleteBlogPost(p.id); }}
                confirmText={`Delete "${p.title}"?`}
              />
            </div>
          </li>
        ))}
        {posts.length === 0 && <li className="p-6 text-center text-text-muted">No posts yet.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create new page**

```tsx
// app/admin/(panel)/blog/new/page.tsx
import { BlogForm } from "@/components/admin/blog-form";
import { createBlogPost } from "@/actions/blog";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">New blog post</h1>
      <BlogForm
        action={async (fd) => { "use server"; await createBlogPost(fd); }}
        submitLabel="Create"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create edit page**

```tsx
// app/admin/(panel)/blog/[id]/page.tsx
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/blog-form";
import { updateBlogPost } from "@/actions/blog";
import { getBlogPostByIdForAdmin } from "@/lib/db/blog";
import type { BlogPost } from "@/lib/types";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getBlogPostByIdForAdmin(id);
  if (!row) notFound();
  const post = { ...row, content: row.content as BlogPost["content"] };
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">Edit blog post</h1>
      <BlogForm
        post={post}
        action={async (fd) => { "use server"; await updateBlogPost(id, fd); }}
        submitLabel="Save"
      />
    </div>
  );
}
```

- [ ] **Step 5: End-to-end test**

Login → `/admin/blog` → create a new post → verify on `/blog`. Edit one → verify on `/blog/<slug>`. Delete → gone.

- [ ] **Step 6: Commit**

```powershell
git add app/admin components/admin/blog-form.tsx
git commit -m "feat(admin): blog CRUD pages (list/new/edit/delete)"
```

---

### Task 39: Testimonials zod schema + actions

**Files:**
- Create: `lib/validation/testimonial.ts`
- Create: `actions/testimonials.ts`

- [ ] **Step 1: Create validation**

```ts
// lib/validation/testimonial.ts
import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  avatar: z.string().url(),
  quote: z.string().min(1).max(2000),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

export function parseTestimonialFormData(fd: FormData): TestimonialInput {
  return testimonialSchema.parse({
    name: fd.get("name"),
    role: fd.get("role"),
    avatar: fd.get("avatar"),
    quote: fd.get("quote"),
  });
}
```

- [ ] **Step 2: Create actions**

```ts
// actions/testimonials.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { revalidateTestimonials } from "@/lib/revalidate";
import { parseTestimonialFormData } from "@/lib/validation/testimonial";

export async function createTestimonial(formData: FormData) {
  await requireAdmin();
  const data = parseTestimonialFormData(formData);
  const top = await prisma.testimonial.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.testimonial.create({
    data: { ...data, order: (top?.order ?? -1) + 1 },
  });
  revalidateTestimonials();
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function updateTestimonial(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseTestimonialFormData(formData);
  await prisma.testimonial.update({ where: { id }, data });
  revalidateTestimonials();
  revalidatePath("/admin/testimonials");
  revalidatePath(`/admin/testimonials/${id}`);
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  await prisma.testimonial.delete({ where: { id } });
  revalidateTestimonials();
  revalidatePath("/admin/testimonials");
}
```

- [ ] **Step 3: Commit**

```powershell
git add lib/validation/testimonial.ts actions/testimonials.ts
git commit -m "feat(admin): testimonial zod schema + actions"
```

---

### Task 40: Build testimonials admin pages

**Files:**
- Create: `components/admin/testimonial-form.tsx`
- Create: `app/admin/(panel)/testimonials/page.tsx`
- Create: `app/admin/(panel)/testimonials/new/page.tsx`
- Create: `app/admin/(panel)/testimonials/[id]/page.tsx`

- [ ] **Step 1: Create form**

```tsx
// components/admin/testimonial-form.tsx
"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import type { Testimonial } from "@/lib/types";

interface Props {
  testimonial?: Testimonial;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}

export function TestimonialForm({ testimonial, action, submitLabel }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-6 max-w-xl"
    >
      <div className="space-y-2"><label className="block text-sm">Name</label>
        <Input name="name" defaultValue={testimonial?.name ?? ""} required /></div>
      <div className="space-y-2"><label className="block text-sm">Role</label>
        <Input name="role" defaultValue={testimonial?.role ?? ""} required /></div>
      <ImageUpload name="avatar" defaultValue={testimonial?.avatar} folder="avatars" label="Avatar" />
      <div className="space-y-2"><label className="block text-sm">Quote</label>
        <Textarea name="quote" defaultValue={testimonial?.quote ?? ""} required rows={5} /></div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Create list page**

```tsx
// app/admin/(panel)/testimonials/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { deleteTestimonial } from "@/actions/testimonials";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function AdminTestimonialsPage() {
  const items = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-outfit font-bold text-2xl">Testimonials</h1>
        <Link href="/admin/testimonials/new"><Button>New testimonial</Button></Link>
      </div>
      <ul className="rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {items.map((t) => (
          <li key={t.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-text-muted">{t.role}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/testimonials/${t.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
              <DeleteButton
                action={async () => { "use server"; await deleteTestimonial(t.id); }}
                confirmText={`Delete testimonial from ${t.name}?`}
              />
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-text-muted">No testimonials yet.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create new page**

```tsx
// app/admin/(panel)/testimonials/new/page.tsx
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { createTestimonial } from "@/actions/testimonials";

export default function NewTestimonialPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">New testimonial</h1>
      <TestimonialForm
        action={async (fd) => { "use server"; await createTestimonial(fd); }}
        submitLabel="Create"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create edit page**

```tsx
// app/admin/(panel)/testimonials/[id]/page.tsx
import { notFound } from "next/navigation";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { updateTestimonial } from "@/actions/testimonials";
import { getTestimonialByIdForAdmin } from "@/lib/db/testimonials";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTestimonialByIdForAdmin(id);
  if (!t) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">Edit testimonial</h1>
      <TestimonialForm
        testimonial={t}
        action={async (fd) => { "use server"; await updateTestimonial(id, fd); }}
        submitLabel="Save"
      />
    </div>
  );
}
```

- [ ] **Step 5: End-to-end test**

Login → `/admin/testimonials` → add one → verify on `/`. Edit → verify update. Delete → verify gone.

- [ ] **Step 6: Commit**

```powershell
git add app/admin components/admin/testimonial-form.tsx
git commit -m "feat(admin): testimonials CRUD pages"
```

---

## Phase 6 — Settings (Singletons)

### Task 41: Settings zod schemas + update action

**Files:**
- Create: `lib/validation/settings.ts`
- Create: `actions/settings.ts`

- [ ] **Step 1: Create validation**

```ts
// lib/validation/settings.ts
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  portrait: z.string().url(),
  socials: z.array(z.object({
    label: z.string().min(1),
    href: z.string().url().or(z.string().startsWith("mailto:")),
    iconKey: z.string().min(1),
  })).default([]),
});

export const heroSchema = z.object({
  headingPrefix: z.string().min(1),
  headingAccent: z.string().min(1),
  description: z.string().min(1),
  primaryCta: z.object({ label: z.string().min(1), href: z.string().min(1) }),
  secondaryCta: z.object({ label: z.string().min(1), href: z.string().min(1) }),
});

export const statsSchema = z.array(z.object({
  value: z.coerce.number().int().nonnegative(),
  prefix: z.string().default(""),
  label: z.string().min(1),
}));

export const companiesSchema = z.object({
  caption: z.string().min(1),
  logos: z.array(z.string().min(1)).default([]),
});

export const aboutIntroSchema = z.object({
  headingPrefix: z.string().min(1),
  headingAccent: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).default([]),
});

export const experienceSchema = z.array(z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  period: z.string().min(1),
  href: z.string().default("#"),
}));

export const educationSchema = z.array(z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  description: z.string().min(1),
  period: z.string().min(1),
  href: z.string().default("#"),
}));

export const toolsSchema = z.array(z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  icon: z.string().min(1),
}));

export const faqsSchema = z.array(z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
}));

export const collaborateCtaSchema = z.object({
  headingLine1: z.string().min(1),
  headingLine2: z.string().min(1),
  body: z.string().min(1),
  href: z.string().min(1),
});

export const contactPageSchema = z.object({
  headingPrefix: z.string().min(1),
  headingAccent: z.string().min(1),
});

export const footerSchema = z.object({
  text: z.string().min(1),
});

export const SETTING_SECTIONS = {
  profile: profileSchema,
  hero: heroSchema,
  stats: statsSchema,
  companies: companiesSchema,
  aboutIntro: aboutIntroSchema,
  experience: experienceSchema,
  education: educationSchema,
  tools: toolsSchema,
  faqs: faqsSchema,
  collaborateCta: collaborateCtaSchema,
  contactPage: contactPageSchema,
  footer: footerSchema,
} as const;

export type SettingSection = keyof typeof SETTING_SECTIONS;
```

- [ ] **Step 2: Create the update action**

```ts
// actions/settings.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { revalidateSettings } from "@/lib/revalidate";
import { SETTING_SECTIONS, type SettingSection } from "@/lib/validation/settings";

export async function updateSettings<S extends SettingSection>(
  section: S,
  rawValue: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const schema = SETTING_SECTIONS[section];
  const parsed = schema.safeParse(rawValue);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: { [section]: parsed.data as object },
  });
  revalidateSettings();
  revalidatePath("/admin/settings");
  return { ok: true };
}
```

- [ ] **Step 3: Commit**

```powershell
git add lib/validation/settings.ts actions/settings.ts
git commit -m "feat(admin): settings per-section validation + updateSettings action"
```

---

### Task 42: Settings shell with tabs

**Files:**
- Create: `app/admin/(panel)/settings/layout.tsx`
- Create: `app/admin/(panel)/settings/page.tsx`
- Create: `components/admin/settings-tabs.tsx`

- [ ] **Step 1: Create tabs nav**

```tsx
// components/admin/settings-tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings", label: "Profile" },
  { href: "/admin/settings/hero", label: "Hero" },
  { href: "/admin/settings/about", label: "About" },
  { href: "/admin/settings/experience", label: "Experience" },
  { href: "/admin/settings/education", label: "Education" },
  { href: "/admin/settings/tools", label: "Tools" },
  { href: "/admin/settings/faqs", label: "FAQs" },
  { href: "/admin/settings/meta", label: "Footer/CTA" },
];

export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border-subtle pb-2">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href}
          className={`px-3 py-1.5 text-sm rounded-md ${path === t.href ? "bg-bg-card-hover" : "hover:bg-bg-card-hover/50"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Create settings layout**

```tsx
// app/admin/(panel)/settings/layout.tsx
import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/admin/settings-tabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">Settings</h1>
      <SettingsTabs />
      <div>{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Profile tab (default `/admin/settings`)**

```tsx
// app/admin/(panel)/settings/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { ProfileSettingsForm } from "@/components/admin/settings-forms/profile";

export default async function ProfileSettingsPage() {
  const settings = await getSiteSettings();
  return <ProfileSettingsForm initial={settings.profile} />;
}
```

- [ ] **Step 4: Commit**

```powershell
git add app/admin components/admin/settings-tabs.tsx
git commit -m "feat(admin): settings layout with tab navigation"
```

---

### Task 43: Profile settings form (with icon picker)

**Files:**
- Create: `components/admin/settings-forms/profile.tsx`
- Create: `components/admin/icon-picker.tsx`

- [ ] **Step 1: Create icon picker**

```tsx
// components/admin/icon-picker.tsx
"use client";

import { ICON_KEYS, resolveIcon, type IconKey } from "@/lib/icons/registry";

interface Props {
  value: string;
  onChange: (key: string) => void;
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-card border border-border-subtle rounded px-2 py-1 text-sm"
      >
        {ICON_KEYS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <IconPreview iconKey={value} />
    </div>
  );
}

function IconPreview({ iconKey }: { iconKey: string }) {
  const Icon = resolveIcon(iconKey as IconKey);
  if (!Icon) return <span className="text-xs text-destructive">unknown</span>;
  return <Icon className="size-5 text-text-muted" />;
}
```

- [ ] **Step 2: Create profile form**

```tsx
// components/admin/settings-forms/profile.tsx
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "../image-upload";
import { IconPicker } from "../icon-picker";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

export function ProfileSettingsForm({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [location, setLocation] = useState(initial.location);
  const [portrait, setPortrait] = useState(initial.portrait);
  const [socials, setSocials] = useState(initial.socials);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await updateSettings("profile", {
        name, role, location, portrait, socials,
      });
      if (res.ok) toast.success("Profile saved");
      else toast.error(res.error);
    });
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="space-y-6 max-w-xl"
    >
      <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
      <Field label="Role"><Input value={role} onChange={(e) => setRole(e.target.value)} required /></Field>
      <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} required /></Field>
      <ImageUpload name="portrait" defaultValue={portrait} folder="avatars" label="Portrait" />
      {/* ImageUpload writes to a hidden input — but we need to control state. Quick fix: read on submit. */}

      <div className="space-y-2">
        <label className="block text-sm">Socials</label>
        <ul className="space-y-2">
          {socials.map((s, i) => (
            <li key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-md border border-border-subtle p-2">
              <Input
                placeholder="Label"
                value={s.label}
                onChange={(e) => setSocials((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                className="sm:w-32"
              />
              <Input
                placeholder="https://… or mailto:…"
                value={s.href}
                onChange={(e) => setSocials((p) => p.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}
                className="flex-1"
              />
              <IconPicker
                value={s.iconKey}
                onChange={(k) => setSocials((p) => p.map((x, j) => (j === i ? { ...x, iconKey: k } : x)))}
              />
              <Button type="button" variant="destructive" size="sm" onClick={() => setSocials((p) => p.filter((_, j) => j !== i))}>✕</Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" size="sm"
          onClick={() => setSocials((p) => [...p, { label: "", href: "", iconKey: "mail" }])}>
          + Add social
        </Button>
      </div>

      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="block text-sm">{label}</label>{children}</div>;
}
```

⚠ **Note on `ImageUpload` integration:** `ImageUpload` writes to a hidden `<input name="portrait">`. In this controlled form, we don't read FormData — we use local state. Workaround: also wire `ImageUpload` to call a callback. Add an optional `onChange` prop to `ImageUpload`:

Edit `components/admin/image-upload.tsx`, change the `setUrl(json.secure_url)` line — wrap in:

```tsx
function commit(newUrl: string) {
  setUrl(newUrl);
  onChange?.(newUrl);
}
```

And update the `Props` interface and the file handler to call `commit(...)` instead of `setUrl(...)`. Then in this profile form, pass `onChange={setPortrait}`.

- [ ] **Step 3: Patch `ImageUpload` to support onChange callback**

In `components/admin/image-upload.tsx`:

```tsx
interface Props {
  name: string;
  defaultValue?: string;
  folder: UploadFolder;
  label?: string;
  onChange?: (url: string) => void;   // ← add
}

export function ImageUpload({ name, defaultValue, folder, label = "Image", onChange }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  // ...

  function commit(newUrl: string) {
    setUrl(newUrl);
    onChange?.(newUrl);
  }

  // In handleFile, replace `setUrl(json.secure_url)` with `commit(json.secure_url)`
  // In the Remove button: onClick={() => commit("")}
}
```

- [ ] **Step 4: Update profile form to use the callback**

```tsx
<ImageUpload name="portrait" defaultValue={portrait} folder="avatars" label="Portrait" onChange={setPortrait} />
```

- [ ] **Step 5: End-to-end test**

Login → `/admin/settings` → change name → save → check `/` and sidebar — name updates. Add a social → set icon → save → check sidebar.

- [ ] **Step 6: Commit**

```powershell
git add components/admin/icon-picker.tsx components/admin/settings-forms components/admin/image-upload.tsx
git commit -m "feat(admin): profile settings form with icon picker + ImageUpload onChange"
```

---

### Task 44: Hero, About, Experience, Education, Tools, FAQs, Footer/CTA settings forms

**Files:**
- Create: `app/admin/(panel)/settings/hero/page.tsx` + `components/admin/settings-forms/hero.tsx`
- Create: `app/admin/(panel)/settings/about/page.tsx` + `components/admin/settings-forms/about.tsx`
- Create: `app/admin/(panel)/settings/experience/page.tsx` + `components/admin/settings-forms/experience.tsx`
- Create: `app/admin/(panel)/settings/education/page.tsx` + `components/admin/settings-forms/education.tsx`
- Create: `app/admin/(panel)/settings/tools/page.tsx` + `components/admin/settings-forms/tools.tsx`
- Create: `app/admin/(panel)/settings/faqs/page.tsx` + `components/admin/settings-forms/faqs.tsx`
- Create: `app/admin/(panel)/settings/meta/page.tsx` + `components/admin/settings-forms/meta.tsx`

Each follows the same pattern: server-component page fetches `getSiteSettings()`, passes the relevant slice to a controlled client form, form calls `updateSettings(section, value)`.

- [ ] **Step 1: Hero form**

```tsx
// components/admin/settings-forms/hero.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { Hero } from "@/lib/types";

export function HeroSettingsForm({ initial }: { initial: Hero }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  function set<K extends keyof Hero>(k: K, val: Hero[K]) { setV((p) => ({ ...p, [k]: val })); }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("hero", v);
        res.ok ? toast.success("Hero saved") : toast.error(res.error);
      }); }}
      className="space-y-4 max-w-xl"
    >
      <Field label="Heading prefix"><Input value={v.headingPrefix} onChange={(e) => set("headingPrefix", e.target.value)} /></Field>
      <Field label="Heading accent"><Input value={v.headingAccent} onChange={(e) => set("headingAccent", e.target.value)} /></Field>
      <Field label="Description"><Textarea rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <CtaFields label="Primary CTA" value={v.primaryCta} onChange={(c) => set("primaryCta", c)} />
      <CtaFields label="Secondary CTA" value={v.secondaryCta} onChange={(c) => set("secondaryCta", c)} />
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="block text-sm">{label}</label>{children}</div>;
}
function CtaFields({ label, value, onChange }: { label: string; value: { label: string; href: string }; onChange: (v: { label: string; href: string }) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Label" value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
        <Input placeholder="Href" value={value.href} onChange={(e) => onChange({ ...value, href: e.target.value })} />
      </div>
    </div>
  );
}
```

```tsx
// app/admin/(panel)/settings/hero/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { HeroSettingsForm } from "@/components/admin/settings-forms/hero";

export default async function HeroSettingsPage() {
  const s = await getSiteSettings();
  return <HeroSettingsForm initial={s.hero} />;
}
```

- [ ] **Step 2: About form (with paragraphs list)**

```tsx
// components/admin/settings-forms/about.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { AboutIntro } from "@/lib/types";

export function AboutSettingsForm({ initial }: { initial: AboutIntro }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("aboutIntro", v);
        res.ok ? toast.success("About saved") : toast.error(res.error);
      }); }}
      className="space-y-4 max-w-xl"
    >
      <div className="space-y-2"><label className="block text-sm">Heading prefix</label>
        <Input value={v.headingPrefix} onChange={(e) => setV((p) => ({ ...p, headingPrefix: e.target.value }))} /></div>
      <div className="space-y-2"><label className="block text-sm">Heading accent</label>
        <Input value={v.headingAccent} onChange={(e) => setV((p) => ({ ...p, headingAccent: e.target.value }))} /></div>
      <div className="space-y-2"><label className="block text-sm">Paragraphs</label>
        {v.paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Textarea rows={3} value={p} onChange={(e) => setV((s) => ({ ...s, paragraphs: s.paragraphs.map((x, j) => j === i ? e.target.value : x) }))} />
            <Button type="button" variant="destructive" size="sm" onClick={() => setV((s) => ({ ...s, paragraphs: s.paragraphs.filter((_, j) => j !== i) }))}>✕</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setV((s) => ({ ...s, paragraphs: [...s.paragraphs, ""] }))}>+ Paragraph</Button>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
```

```tsx
// app/admin/(panel)/settings/about/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { AboutSettingsForm } from "@/components/admin/settings-forms/about";

export default async function AboutSettingsPage() {
  const s = await getSiteSettings();
  return <AboutSettingsForm initial={s.aboutIntro} />;
}
```

- [ ] **Step 3: Experience form (list of objects)**

```tsx
// components/admin/settings-forms/experience.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { ExperienceEntry } from "@/lib/types";

export function ExperienceSettingsForm({ initial }: { initial: ExperienceEntry[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  function patch(i: number, p: Partial<ExperienceEntry>) {
    setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("experience", items);
        res.ok ? toast.success("Experience saved") : toast.error(res.error);
      }); }}
      className="space-y-4 max-w-2xl"
    >
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-border-subtle p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Company" value={it.company} onChange={(e) => patch(i, { company: e.target.value })} />
            <Input placeholder="Role" value={it.role} onChange={(e) => patch(i, { role: e.target.value })} />
          </div>
          <Textarea placeholder="Description" rows={3} value={it.description} onChange={(e) => patch(i, { description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Period (e.g. Jan 2025 — Present)" value={it.period} onChange={(e) => patch(i, { period: e.target.value })} />
            <Input placeholder="Href" value={it.href} onChange={(e) => patch(i, { href: e.target.value })} />
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((s) => [...s, { company: "", role: "", description: "", period: "", href: "#" }])}>+ Entry</Button>
      <div><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>
    </form>
  );
}
```

```tsx
// app/admin/(panel)/settings/experience/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { ExperienceSettingsForm } from "@/components/admin/settings-forms/experience";

export default async function ExperienceSettingsPage() {
  const s = await getSiteSettings();
  return <ExperienceSettingsForm initial={s.experience} />;
}
```

- [ ] **Step 4: Education form**

```tsx
// components/admin/settings-forms/education.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { EducationEntry } from "@/lib/types";

export function EducationSettingsForm({ initial }: { initial: EducationEntry[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  function patch(i: number, p: Partial<EducationEntry>) {
    setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("education", items);
        res.ok ? toast.success("Education saved") : toast.error(res.error);
      }); }}
      className="space-y-4 max-w-2xl"
    >
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-border-subtle p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Institution" value={it.institution} onChange={(e) => patch(i, { institution: e.target.value })} />
            <Input placeholder="Degree" value={it.degree} onChange={(e) => patch(i, { degree: e.target.value })} />
          </div>
          <Textarea placeholder="Description" rows={3} value={it.description} onChange={(e) => patch(i, { description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Period" value={it.period} onChange={(e) => patch(i, { period: e.target.value })} />
            <Input placeholder="Href" value={it.href} onChange={(e) => patch(i, { href: e.target.value })} />
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((s) => [...s, { institution: "", degree: "", description: "", period: "", href: "#" }])}>+ Entry</Button>
      <div><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>
    </form>
  );
}
```

```tsx
// app/admin/(panel)/settings/education/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { EducationSettingsForm } from "@/components/admin/settings-forms/education";

export default async function EducationSettingsPage() {
  const s = await getSiteSettings();
  return <EducationSettingsForm initial={s.education} />;
}
```

- [ ] **Step 5: Tools form**

```tsx
// components/admin/settings-forms/tools.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { Tool } from "@/lib/types";

export function ToolsSettingsForm({ initial }: { initial: Tool[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  function patch(i: number, p: Partial<Tool>) {
    setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("tools", items);
        res.ok ? toast.success("Tools saved") : toast.error(res.error);
      }); }}
      className="space-y-4 max-w-2xl"
    >
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-border-subtle p-3 grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
          <Input placeholder="Name" value={it.name} onChange={(e) => patch(i, { name: e.target.value })} />
          <Input placeholder="Role" value={it.role} onChange={(e) => patch(i, { role: e.target.value })} />
          <Input placeholder="Icon URL or /path.svg" value={it.icon} onChange={(e) => patch(i, { icon: e.target.value })} />
          <Button type="button" variant="destructive" size="sm" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((s) => [...s, { name: "", role: "", icon: "" }])}>+ Tool</Button>
      <div><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>
    </form>
  );
}
```

```tsx
// app/admin/(panel)/settings/tools/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { ToolsSettingsForm } from "@/components/admin/settings-forms/tools";

export default async function ToolsSettingsPage() {
  const s = await getSiteSettings();
  return <ToolsSettingsForm initial={s.tools} />;
}
```

- [ ] **Step 6: FAQs form**

```tsx
// components/admin/settings-forms/faqs.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type { FAQ } from "@/lib/types";

export function FaqsSettingsForm({ initial }: { initial: FAQ[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  function patch(i: number, p: Partial<FAQ>) {
    setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("faqs", items);
        res.ok ? toast.success("FAQs saved") : toast.error(res.error);
      }); }}
      className="space-y-4 max-w-2xl"
    >
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-border-subtle p-3 space-y-2">
          <Input placeholder="Question" value={it.question} onChange={(e) => patch(i, { question: e.target.value })} />
          <Textarea placeholder="Answer" rows={3} value={it.answer} onChange={(e) => patch(i, { answer: e.target.value })} />
          <Button type="button" variant="destructive" size="sm" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((s) => [...s, { question: "", answer: "" }])}>+ FAQ</Button>
      <div><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>
    </form>
  );
}
```

```tsx
// app/admin/(panel)/settings/faqs/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { FaqsSettingsForm } from "@/components/admin/settings-forms/faqs";

export default async function FaqsSettingsPage() {
  const s = await getSiteSettings();
  return <FaqsSettingsForm initial={s.faqs} />;
}
```

- [ ] **Step 7: Meta form (footer + collaborateCta + contactPage + companies + stats)**

The "meta" tab bundles five small singletons. Each gets its own sub-form with its own Save button so saves stay atomic per section.

```tsx
// components/admin/settings-forms/meta.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import type {
  Footer,
  CollaborateCta,
  ContactPage,
  Companies,
  Stat,
} from "@/lib/types";

export function MetaSettingsForms({
  footer, collaborateCta, contactPage, companies, stats,
}: {
  footer: Footer;
  collaborateCta: CollaborateCta;
  contactPage: ContactPage;
  companies: Companies;
  stats: Stat[];
}) {
  return (
    <div className="space-y-10">
      <FooterForm initial={footer} />
      <CollaborateCtaForm initial={collaborateCta} />
      <ContactPageForm initial={contactPage} />
      <CompaniesForm initial={companies} />
      <StatsForm initial={stats} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      {children}
    </section>
  );
}

function FooterForm({ initial }: { initial: Footer }) {
  const [text, setText] = useState(initial.text);
  const [pending, start] = useTransition();
  return (
    <Section title="Footer">
      <form onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("footer", { text });
        res.ok ? toast.success("Footer saved") : toast.error(res.error);
      }); }} className="space-y-3 max-w-xl">
        <Input value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save footer"}</Button>
      </form>
    </Section>
  );
}

function CollaborateCtaForm({ initial }: { initial: CollaborateCta }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Section title="Collaborate CTA">
      <form onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("collaborateCta", v);
        res.ok ? toast.success("CTA saved") : toast.error(res.error);
      }); }} className="space-y-3 max-w-xl">
        <Input placeholder="Heading line 1" value={v.headingLine1} onChange={(e) => setV({ ...v, headingLine1: e.target.value })} />
        <Input placeholder="Heading line 2" value={v.headingLine2} onChange={(e) => setV({ ...v, headingLine2: e.target.value })} />
        <Textarea placeholder="Body" rows={3} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
        <Input placeholder="Href" value={v.href} onChange={(e) => setV({ ...v, href: e.target.value })} />
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save CTA"}</Button>
      </form>
    </Section>
  );
}

function ContactPageForm({ initial }: { initial: ContactPage }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Section title="Contact page heading">
      <form onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("contactPage", v);
        res.ok ? toast.success("Contact page saved") : toast.error(res.error);
      }); }} className="space-y-3 max-w-xl">
        <Input placeholder="Heading prefix" value={v.headingPrefix} onChange={(e) => setV({ ...v, headingPrefix: e.target.value })} />
        <Input placeholder="Heading accent" value={v.headingAccent} onChange={(e) => setV({ ...v, headingAccent: e.target.value })} />
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save contact page"}</Button>
      </form>
    </Section>
  );
}

function CompaniesForm({ initial }: { initial: Companies }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Section title="Companies strip">
      <form onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("companies", v);
        res.ok ? toast.success("Companies saved") : toast.error(res.error);
      }); }} className="space-y-3 max-w-xl">
        <Input placeholder="Caption" value={v.caption} onChange={(e) => setV({ ...v, caption: e.target.value })} />
        <div className="space-y-2">
          <label className="block text-sm">Logo keys (one per row)</label>
          {v.logos.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input value={l} onChange={(e) => setV({ ...v, logos: v.logos.map((x, j) => j === i ? e.target.value : x) })} />
              <Button type="button" variant="destructive" size="sm" onClick={() => setV({ ...v, logos: v.logos.filter((_, j) => j !== i) })}>✕</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setV({ ...v, logos: [...v.logos, ""] })}>+ Logo</Button>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save companies"}</Button>
      </form>
    </Section>
  );
}

function StatsForm({ initial }: { initial: Stat[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  function patch(i: number, p: Partial<Stat>) { setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x))); }
  return (
    <Section title="Stats">
      <form onSubmit={(e) => { e.preventDefault(); start(async () => {
        const res = await updateSettings("stats", items);
        res.ok ? toast.success("Stats saved") : toast.error(res.error);
      }); }} className="space-y-3 max-w-xl">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2">
            <Input type="number" placeholder="Value" value={it.value} onChange={(e) => patch(i, { value: Number(e.target.value) })} />
            <Input placeholder="Prefix (e.g. +)" value={it.prefix} onChange={(e) => patch(i, { prefix: e.target.value })} />
            <Input placeholder="Label" value={it.label} onChange={(e) => patch(i, { label: e.target.value })} />
            <Button type="button" variant="destructive" size="sm" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}>✕</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setItems((s) => [...s, { value: 0, prefix: "+", label: "" }])}>+ Stat</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save stats"}</Button>
      </form>
    </Section>
  );
}
```

```tsx
// app/admin/(panel)/settings/meta/page.tsx
import { getSiteSettings } from "@/lib/db/settings";
import { MetaSettingsForms } from "@/components/admin/settings-forms/meta";

export default async function MetaSettingsPage() {
  const s = await getSiteSettings();
  return (
    <MetaSettingsForms
      footer={s.footer}
      collaborateCta={s.collaborateCta}
      contactPage={s.contactPage}
      companies={s.companies}
      stats={s.stats}
    />
  );
}
```

- [ ] **Step 8: End-to-end test**

For each tab: load → edit → save → verify on public site (after page refresh, since revalidateTag has run).

- [ ] **Step 9: Commit**

```powershell
git add app/admin components/admin/settings-forms
git commit -m "feat(admin): all settings tabs (hero/about/experience/education/tools/faqs/meta) with per-section saves"
```

---

## Phase 7 — Contact Form & Inbox

### Task 45: Rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Create: `tests/rate-limit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/rate-limit.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, _resetForTests } from "@/lib/rate-limit";

beforeEach(() => _resetForTests());

describe("rate limit", () => {
  it("allows up to N within window", () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("1.2.3.4", 3, 1000).allowed).toBe(true);
    }
  });

  it("blocks the (N+1)th", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("1.2.3.4", 3, 1000);
    expect(checkRateLimit("1.2.3.4", 3, 1000).allowed).toBe(false);
  });

  it("isolates by ip", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", 3, 1000);
    expect(checkRateLimit("b", 3, 1000).allowed).toBe(true);
  });

  it("resets after window", async () => {
    checkRateLimit("x", 1, 50);
    expect(checkRateLimit("x", 1, 50).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(checkRateLimit("x", 1, 50).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `lib/rate-limit.ts`**

```ts
// lib/rate-limit.ts
//
// Simple in-memory token bucket. Single-instance only — fine for free-tier
// single-region Vercel Hobby. If the project ever scales to multi-region or
// edge runtime, replace with Upstash Redis (free tier available).
//
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { allowed: true, remaining: max - 1, resetAt: fresh.resetAt };
  }
  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

export function _resetForTests() {
  buckets.clear();
}
```

- [ ] **Step 3: Run, verify pass**

```powershell
npm test
```

Expected: 4 tests passed.

- [ ] **Step 4: Commit**

```powershell
git add lib/rate-limit.ts tests/rate-limit.test.ts
git commit -m "feat(rate-limit): in-memory IP rate limiter (free-tier scale)"
```

---

### Task 46: Contact form action (zod + honeypot + rate-limit)

**Files:**
- Create: `lib/validation/contact.ts`
- Create: `actions/contact.ts`

- [ ] **Step 1: Validation**

```ts
// lib/validation/contact.ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(200).trim(),
  message: z.string().min(1).max(2000).trim(),
});

export type ContactInput = z.infer<typeof contactSchema>;
```

- [ ] **Step 2: Action**

```ts
// actions/contact.ts
"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import { contactSchema } from "@/lib/validation/contact";
import { checkRateLimit } from "@/lib/rate-limit";

export type ContactResult = { ok: true } | { ok: false; error: string };

const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function submitContact(formData: FormData): Promise<ContactResult> {
  // Honeypot — if filled, silently succeed without writing
  const honeypot = formData.get("website");
  if (honeypot) return { ok: true };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fill all fields correctly." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`contact:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!limit.allowed) {
    return { ok: false, error: "Too many messages. Please try again in a few minutes." };
  }

  await prisma.contactMessage.create({
    data: { ...parsed.data, ip },
  });
  return { ok: true };
}
```

- [ ] **Step 3: Commit**

```powershell
git add lib/validation/contact.ts actions/contact.ts
git commit -m "feat(contact): submitContact action — zod + honeypot + IP rate limit"
```

---

### Task 47: Wire contact form to the action

**Files:**
- Modify: `components/sections/contact-form.tsx`

- [ ] **Step 1: Replace the fake `setTimeout` with a real submission**

Current behavior: fake delay + sonner toast. New: call `submitContact`, honour real result. **No visual change.**

```tsx
// components/sections/contact-form.tsx
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { toast } from "sonner";
import { submitContact } from "@/actions/contact";
import type { ContactPage } from "@/lib/types";

interface Props {
  contactPage: ContactPage;
}

export function ContactForm({ contactPage }: Props) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await submitContact(fd);
      if (res.ok) {
        toast.success("Message sent!");
        form.reset();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="pt-4 pb-16">
      <FadeIn>
        <h1 className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {contactPage.headingPrefix}{" "}
          <span className="text-accent">{contactPage.headingAccent}</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form
          onSubmit={onSubmit}
          className="mt-10 rounded-2xl border border-border-subtle bg-bg-card p-6 md:p-8 space-y-5"
        >
          {/* Honeypot — invisible, label hidden, autocomplete off */}
          <div aria-hidden="true" className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="contact-name" className="block font-poppins text-sm text-text-primary mb-2">Name</label>
            <Input id="contact-name" name="name" type="text" required placeholder="Your Name"
              className="bg-bg-card-hover border-border-subtle" />
          </div>
          <div>
            <label htmlFor="contact-email" className="block font-poppins text-sm text-text-primary mb-2">Email</label>
            <Input id="contact-email" name="email" type="email" required placeholder="Your@email.com"
              className="bg-bg-card-hover border-border-subtle" />
          </div>
          <div>
            <label htmlFor="contact-message" className="block font-poppins text-sm text-text-primary mb-2">Message</label>
            <Textarea id="contact-message" name="message" required rows={4} placeholder="Your Message"
              className="bg-bg-card-hover border-border-subtle resize-none" />
          </div>

          <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent-hover text-white">
            {pending ? "Sending..." : "Send"}
          </Button>
        </form>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 2: End-to-end test**

Visit `/contact`, fill form, submit. Expect toast "Message sent!". Open Prisma Studio → confirm row in `ContactMessage`. Try submitting 4 times rapidly → 4th should fail with rate-limit toast.

Bot test: open DevTools console:
```js
const fd = new FormData();
fd.set("name", "x"); fd.set("email", "x@x.x"); fd.set("message", "y"); fd.set("website", "trap");
fetch("/contact", { method: "POST", body: fd });
```
(Actually, without an HTTP route this won't reach the action — but if a bot submits the form with the honeypot filled, the action returns ok without inserting. Verify in Prisma Studio: no row added.)

- [ ] **Step 3: Commit**

```powershell
git add components/sections/contact-form.tsx
git commit -m "feat(contact): wire form to submitContact (no UI change), add hidden honeypot"
```

---

### Task 48: Messages inbox + actions

**Files:**
- Create: `actions/messages.ts`
- Create: `app/admin/(panel)/messages/page.tsx`
- Create: `components/admin/message-actions.tsx`

- [ ] **Step 1: Create message actions**

```ts
// actions/messages.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";

export async function markMessageRead(id: string, read: boolean) {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
```

- [ ] **Step 2: Create message-actions client component**

```tsx
// components/admin/message-actions.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markMessageRead, deleteMessage } from "@/actions/messages";

export function MessageActions({ id, read }: { id: string; read: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending}
        onClick={() => start(() => markMessageRead(id, !read))}>
        {read ? "Mark unread" : "Mark read"}
      </Button>
      <Button type="button" variant="destructive" size="sm" disabled={pending}
        onClick={() => { if (confirm("Delete this message?")) start(() => deleteMessage(id)); }}>
        Delete
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create inbox page**

```tsx
// app/admin/(panel)/messages/page.tsx
import { getAllMessages } from "@/lib/db/messages";
import { MessageActions } from "@/components/admin/message-actions";

export default async function AdminMessagesPage() {
  const messages = await getAllMessages();
  return (
    <div className="space-y-6">
      <h1 className="font-outfit font-bold text-2xl">Messages</h1>
      {messages.length === 0 ? (
        <p className="text-text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id}
              className={`rounded-xl border border-border-subtle p-4 ${m.read ? "opacity-60" : ""}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="text-xs text-accent">{m.email}</a>
                    <span className="text-xs text-text-muted">{m.createdAt.toLocaleString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </div>
                <MessageActions id={m.id} read={m.read} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Manual test**

Login → submit a message via `/contact` → `/admin/messages` shows it. Mark read → opacity drops. Delete → row gone. Dashboard unread count updates.

- [ ] **Step 5: Commit**

```powershell
git add actions/messages.ts app/admin components/admin/message-actions.tsx
git commit -m "feat(admin): contact messages inbox + mark-read/delete"
```

---

## Phase 8 — Deploy & Verify

### Task 49: Add `robots.txt`

**Files:**
- Create: `app/robots.ts`

- [ ] **Step 1: Create dynamic robots**

```ts
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin" },
    ],
  };
}
```

- [ ] **Step 2: Verify**

`npm run dev`, visit http://localhost:3000/robots.txt. Expected:

```
User-agent: *
Allow: /
Disallow: /admin
```

- [ ] **Step 3: Commit**

```powershell
git add app/robots.ts
git commit -m "feat(seo): robots.txt — disallow /admin"
```

---

### Task 50: Final type check, lint, and full build

- [ ] **Step 1: Type check**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Production build**

```powershell
npm run build
```

Expected: build succeeds with no errors. Note any warnings.

- [ ] **Step 5: Production smoke test locally**

```powershell
npm start
```

Open http://localhost:3000. Walk every public route; confirm everything renders. Login at `/admin/login` and verify panel works.

Stop the server (`Ctrl+C`).

---

### Task 51: Push to GitHub & deploy to Vercel

**No code in this task. Manual.**

- [ ] **Step 1: Push branch**

```powershell
git push origin main
```

- [ ] **Step 2: Connect repo to Vercel**

1. Go to https://vercel.com/new.
2. Import the GitHub repo.
3. Framework: Next.js (auto-detected). Build command: `prisma generate && next build`. Output: default.
4. **Don't deploy yet.**

- [ ] **Step 3: Add env vars in Vercel dashboard**

Project → Settings → Environment Variables. Add (Production + Preview + Development):

| Name | Value |
|---|---|
| `DATABASE_URL` | pooled Neon URL |
| `DATABASE_URL_UNPOOLED` | direct Neon URL |
| `JWT_SECRET` | the 64-hex string |
| `ADMIN_EMAIL` | your email |
| `ADMIN_PASSWORD_HASH` | the bcrypt hash |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
| `CLOUDINARY_API_KEY` | from Cloudinary |
| `CLOUDINARY_API_SECRET` | from Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | same as `CLOUDINARY_CLOUD_NAME` |

- [ ] **Step 4: Deploy**

Trigger deploy from Vercel dashboard (or push a no-op commit).

Expected: build succeeds. Production URL printed.

- [ ] **Step 5: Run migrations against production DB**

If Neon DB was created fresh and never migrated:

```powershell
$env:DATABASE_URL_UNPOOLED="<production direct URL>"
npx prisma migrate deploy
```

(Or set up a one-time GitHub Action / Vercel build step that runs `prisma migrate deploy` before build.)

- [ ] **Step 6: Seed production DB once**

Via local CLI pointed at production DB:

```powershell
$env:DATABASE_URL="<production pooled URL>"
$env:DATABASE_URL_UNPOOLED="<production direct URL>"
npm run db:seed
```

(Run only once — script does `deleteMany()` on lists.)

- [ ] **Step 7: Verify production**

1. Visit production URL — site should look identical to local.
2. Visit `/admin/login` → login → see dashboard.
3. Edit a project title → save → refresh public page → change visible.
4. Submit `/contact` form → confirm in `/admin/messages`.
5. Visit `/robots.txt` → confirm `Disallow: /admin`.

- [ ] **Step 8: Commit any post-deploy fixes**

If anything broke, fix, commit, push.

---

## Self-Review Checklist (post-implementation)

Before declaring done:

- [ ] Public site visually identical at `/`, `/about`, `/projects`, `/projects/<slug>`, `/blog`, `/blog/<slug>`, `/tools`, `/contact`.
- [ ] No "Login" link on public site (sidebar, footer, anywhere).
- [ ] `/admin` redirects unauthenticated users to `/admin/login`.
- [ ] Admin can CRUD: projects, blog posts, testimonials. Each save reflects on public site after refresh.
- [ ] Admin settings tabs save and reflect on public site.
- [ ] Contact form writes to DB, visible in admin inbox.
- [ ] Honeypot blocks bot submissions silently.
- [ ] Rate limit blocks 4th submission within 10 min from same IP.
- [ ] Image uploads work end-to-end (admin → Cloudinary → DB → public render).
- [ ] `robots.txt` blocks `/admin`.
- [ ] All env vars set in Vercel.
- [ ] No paid services used.
- [ ] Lighthouse Performance on `/` ≥ 90 (run from Chrome DevTools).
