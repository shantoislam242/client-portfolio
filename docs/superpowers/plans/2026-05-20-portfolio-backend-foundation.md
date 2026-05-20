# Portfolio Backend Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the Phase 1 foundation from the [2026-05-20 design spec](../specs/2026-05-20-portfolio-backend-foundation-design.md): Neon-backed Prisma schema (all 13 models), Cloudinary signed-upload helpers, jose-based admin auth primitives, middleware gating `/admin/*`, hash-password CLI, and a seed script that ports every row from [lib/data.ts](../../../lib/data.ts) into Postgres. **No admin UI, no public-site rewiring, no contact form** — those are Phases 2–4.

**Architecture:** Single Next.js 16 app. Edge middleware imports only `jose` (no Prisma). Server Actions (added later) use the Node runtime via `lib/auth/guard.ts` + Prisma client singleton. Cloudinary uploads are signed server-side and POSTed directly from browser to Cloudinary in Phase 2 — Phase 1 just ships the signature helper. Seed is idempotent (upserts keyed on slug/id/singleton) and runs via `prisma db seed`.

**Tech Stack:** Next.js 16.2.6 · Prisma · Postgres (Neon) · jose · bcryptjs · cloudinary SDK · tsx.

---

## Prerequisites (one-time, before Task 1)

The engineer must have these before starting. Document but do not block tasks on them — Tasks 1–10 work without DB credentials; Tasks 11–15 require a working Neon connection.

- A Neon Postgres project. Free tier. Capture two connection strings:
  - **Pooled** (use as `DATABASE_URL`) — typically ends in `pgbouncer=true&connection_limit=1`
  - **Direct** (use as `DIRECT_URL`) — for migrations
- A Cloudinary account. Free tier. Capture `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Local `.env.local` (gitignored) populated with the values above + a randomly generated `NEXTAUTH_SECRET` (32+ bytes).

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## File Map (locked here; tasks reference these paths)

| Path | Status | Responsibility |
|---|---|---|
| `package.json` | modify | Add deps + Prisma seed config + npm scripts |
| `.gitignore` | modify | Whitelist `.env.example` (currently ignored by `.env*`) |
| `.env.example` | create | Documented env var template |
| `prisma/schema.prisma` | create | Complete Prisma schema, all 13 models |
| `prisma/seed.ts` | create | Idempotent seed reading from `lib/data.ts` |
| `lib/db/client.ts` | create | Prisma singleton (cold-start safe) |
| `lib/auth/password.ts` | create | `verifyPassword` (bcrypt compare) |
| `lib/auth/session.ts` | create | `signSession` / `verifySession` / cookie helpers (jose, Edge-safe) |
| `lib/auth/guard.ts` | create | `requireAdmin()` for server actions (Node runtime) |
| `lib/cloudinary/client.ts` | create | `cloudinary.config()` call (server-only) |
| `lib/cloudinary/signature.ts` | create | `signUpload(folder)` returns signed payload for browser direct upload |
| `lib/cloudinary/delete.ts` | create | `deleteImage(publicId)` (admin cleanup hook, used in Phase 2+) |
| `scripts/hash-password.ts` | create | CLI: generate bcrypt hash for `ADMIN_PASSWORD_HASH` |
| `middleware.ts` | create | Gate `/admin/*` via jose-verified cookie |

No file in `app/` or `components/` is touched. `lib/data.ts`, `lib/motion.ts`, `lib/utils.ts` are unchanged.

---

## Pre-flight: read the Next 16 docs

This is not a task, but a hard reminder. [AGENTS.md](../../../AGENTS.md) warns that Next 16 has breaking changes from training data. Before writing `middleware.ts` (Task 9) and anything that calls `next/headers` (`cookies()` in Tasks 7/8), read:

- `node_modules/next/dist/docs/middleware.mdx` (or `.md`)
- `node_modules/next/dist/docs/api-reference/functions/cookies.mdx`
- `node_modules/next/dist/docs/api-reference/file-conventions/middleware.mdx`

If any API used in this plan has changed (e.g., `cookies()` is async in Next 16 — it might be), adapt the implementation. Note adaptations in commit messages.

---

## Task 1: Install dependencies and add npm scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add runtime + dev dependencies**

Edit `package.json`. Add to `dependencies`:

```json
"@prisma/client": "^5.22.0",
"bcryptjs": "^2.4.3",
"cloudinary": "^2.5.1",
"jose": "^5.9.6"
```

Add to `devDependencies`:

```json
"@types/bcryptjs": "^2.4.6",
"prisma": "^5.22.0",
"tsx": "^4.19.2"
```

- [ ] **Step 2: Add npm scripts and Prisma seed config**

Edit `package.json`. Add to `scripts`:

```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:push": "prisma db push",
"db:studio": "prisma studio",
"db:seed": "prisma db seed",
"db:reset": "prisma migrate reset",
"hash-password": "tsx scripts/hash-password.ts"
```

Add top-level `"prisma"` key:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: completes without errors; `node_modules/.prisma/` is created on `postinstall`.

- [ ] **Step 4: Verify Prisma CLI works**

Run: `npx prisma --version`
Expected: prints `prisma : 5.x.x` etc.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(backend): add prisma, jose, bcryptjs, cloudinary, tsx deps + npm scripts"
```

---

## Task 2: Create `.env.example` and whitelist it from `.gitignore`

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Whitelist `.env.example` in `.gitignore`**

Edit `.gitignore`. Find the line:

```
# env files (can opt-in for committing if needed)
.env*
```

Replace with:

```
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 2: Create `.env.example`**

Create `.env.example`:

```env
# Neon Postgres (free tier — https://neon.tech)
# Pooled URL: used by the app at runtime
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?pgbouncer=true&connection_limit=1
# Direct URL: used by Prisma migrate
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname

# Auth (admin is single-user, env-credential)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=you@example.com
# Generate: npm run hash-password -- "your-password"
ADMIN_PASSWORD_HASH=

# Cloudinary (free tier — https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Phase 4 (not required until Phase 4 ships)
# RESEND_API_KEY=
# NOTIFICATION_EMAIL=
```

- [ ] **Step 3: Verify `.env.example` is now trackable**

Run: `git check-ignore -v .env.example`
Expected: exits with status 1 (file is NOT ignored). If the command prints a rule, the whitelist isn't working.

- [ ] **Step 4: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore(backend): add .env.example documenting required env vars"
```

---

## Task 3: Write `prisma/schema.prisma`

**Files:**
- Create: `prisma/schema.prisma`

This is the entire schema from the spec, in one shot. Don't split — Prisma migrations are easier when the schema is whole.

- [ ] **Step 1: Create `prisma/schema.prisma`**

Create with this exact content (paste from the spec — already validated):

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

  fullName         String  @default("Arifujjaman")
  role             String  @default("Graphic & Motion Designer")
  location         String  @default("Tejgaon, Dhaka, Bangladesh")
  portraitUrl      String?
  portraitPublicId String?
  ctaButtonLabel   String  @default("Let's Talk")
  ctaButtonLink    String  @default("/contact")
  resumeUrl        String?
  resumePublicId   String?

  heroHeadline          String @default("Crafting Visual Stories That Move People")
  heroSubtext           String @db.Text @default("")
  heroPrimaryCtaLabel   String @default("Let's Talk")
  heroPrimaryCtaLink    String @default("/contact")
  heroSecondaryCtaLabel String @default("My Work")
  heroSecondaryCtaLink  String @default("/projects")

  statYearsExperience Int     @default(0)
  statYearsLabel      String  @default("Years of Experience")
  statProjects        Int     @default(0)
  statProjectsLabel   String  @default("Projects Completed")
  statClients         Int     @default(0)
  statClientsLabel    String  @default("Happy Clients")
  statsShowPlus       Boolean @default(true)

  trustedByHeading String @default("Trusted by brands across South Asia and beyond")

  recentProjectsHeading String @default("Recent Projects and Achievements")
  recentProjectsLimit   Int    @default(4)
  toolsSectionHeading   String @default("Top-Tier Tools for Exceptional Results")
  testimonialsHeading   String @default("What Clients Say About My Work")
  blogSectionHeading    String @default("Design Thoughts and Perspectives")
  blogSectionLimit      Int    @default(4)
  faqHeading            String @default("Frequently Asked Questions")

  aboutPageTitle       String @default("A bit About Me")
  aboutIntroContent    String @db.Text @default("")
  experienceHeading    String @default("My Professional Journey")
  educationHeading     String @default("Academic Background")
  certificationHeading String @default("Course and Certification")

  projectsPageTitle    String  @default("Projects")
  projectsPageSubtitle String? @db.Text
  blogPageTitle        String  @default("Blog")
  blogPageSubtitle     String? @db.Text
  toolsPageTitle       String  @default("Tools")
  toolsPageSubtitle    String? @db.Text

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

  ctaSectionLineOne     String @default("Let's")
  ctaSectionLineTwo     String @default("collaborate")
  ctaSectionText        String @db.Text @default("")
  ctaSectionButtonLabel String @default("Get in touch")
  ctaSectionButtonLink  String @default("/contact")

  footerText      String  @default("Designed & built by Arifujjaman")
  footerShowYear  Boolean @default(true)
  footerCopyright String?

  siteName        String  @default("Arifujjaman — Graphic & Motion Designer")
  siteDescription String  @db.Text @default("")
  siteKeywords    String?
  ogImage         String?
  ogImagePublicId String?
  faviconUrl      String?
  faviconPublicId String?

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
  iconKey  String  @default("link")
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
  iconKey  String
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

  introContent    String?  @db.Text

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
  content   String  @db.Text
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
  content         String   @db.Text

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
  iconExternalUrl String?

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
  startDate    String
  endDate      String?
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
  category  String?
  order     Int      @default(0)
  visible   Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([order])
}

// ─────────────────────────────────────────
// CONTACT SUBMISSIONS  (write path lands Phase 4)
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

- [ ] **Step 2: Format and validate**

Run: `npx prisma format`
Expected: rewrites whitespace; exits 0; no errors.

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`.

- [ ] **Step 3: Apply the initial migration to Neon**

Confirm `.env.local` exists with valid `DATABASE_URL` + `DIRECT_URL`. Then run:

```bash
npx prisma migrate dev --name init
```

Expected: Prisma applies the migration, generates the client, and creates `prisma/migrations/<timestamp>_init/migration.sql`. If you see `P3014` (shadow DB error on Neon), the spec notes this is a known Neon caveat — pass `--create-only` instead, then manually `npx prisma db push` to apply, and proceed without the shadow DB. Either path produces the same schema.

- [ ] **Step 4: Confirm tables exist**

Run: `npx prisma db pull --print 2>/dev/null | head -50` (introspects Neon)
Expected: prints schema content with all the models.

Alternatively run `npx prisma studio` and visually confirm all 14 tables (including `_RelatedProject` etc.).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): initial prisma schema with all 13 portfolio models"
```

---

## Task 4: Prisma client singleton

**Files:**
- Create: `lib/db/client.ts`

- [ ] **Step 1: Create `lib/db/client.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
```

- [ ] **Step 2: Smoke-verify the client instantiates and pings the DB**

Run (works in both bash and PowerShell — outer single-quotes prevent any shell-side interpolation of `$queryRaw` / `$disconnect`):

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { const r = await prisma.$queryRaw`SELECT 1 AS ok`; console.log(r); await prisma.$disconnect(); })'
```

Expected: prints `[ { ok: 1 } ]`.
If it errors with "Cannot find module": the import path resolution may need `.js` extension or a tsconfig tweak — switch to `import { prisma } from "./lib/db/client"` and re-run.

- [ ] **Step 3: Commit**

```bash
git add lib/db/client.ts
git commit -m "feat(db): prisma client singleton (cold-start safe)"
```

---

## Task 5: `lib/auth/password.ts` + smoke verify

**Files:**
- Create: `lib/auth/password.ts`

- [ ] **Step 1: Create `lib/auth/password.ts`**

```typescript
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 2: Smoke verify round-trip**

Run:

```bash
npx tsx -e 'import("./lib/auth/password.ts").then(async m => { const h = await m.hashPassword("correct-horse-battery-staple"); console.log("hash starts with $2:", h.startsWith("$2")); console.log("correct:", await m.verifyPassword("correct-horse-battery-staple", h)); console.log("wrong:", await m.verifyPassword("wrong", h)); })'
```

Expected:
```
hash starts with $2: true
correct: true
wrong: false
```

- [ ] **Step 3: Commit**

```bash
git add lib/auth/password.ts
git commit -m "feat(auth): bcrypt password hash + verify helpers"
```

---

## Task 6: `scripts/hash-password.ts` CLI

**Files:**
- Create: `scripts/hash-password.ts`

- [ ] **Step 1: Create `scripts/hash-password.ts`**

```typescript
#!/usr/bin/env tsx
import { hashPassword } from "../lib/auth/password";

async function main() {
  const plain = process.argv[2];
  if (!plain) {
    console.error("Usage: npm run hash-password -- <password>");
    process.exit(1);
  }
  const hash = await hashPassword(plain);
  console.log(hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the script runs**

Run: `npm run hash-password -- "test-password-1234"`
Expected: prints a single line starting with `$2a$12$` or `$2b$12$`.

Run: `npm run hash-password`
Expected: exits with code 1 and prints the usage message.

- [ ] **Step 3: Commit**

```bash
git add scripts/hash-password.ts
git commit -m "feat(auth): hash-password CLI script"
```

---

## Task 7: `lib/auth/session.ts` (jose JWT + cookies)

**Files:**
- Create: `lib/auth/session.ts`

This file must be Edge-runtime safe (middleware imports it). It uses only `jose` and `next/headers` — never Prisma.

**Before writing:** confirm whether Next 16's `cookies()` is async. Read `node_modules/next/dist/docs/api-reference/functions/cookies.mdx`. If `cookies()` returns `Promise<ReadonlyRequestCookies>`, the `await` calls below are correct. If it returns synchronously, drop the `await`s.

- [ ] **Step 1: Create `lib/auth/session.ts`**

```typescript
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const ALGO = "HS256";
const EXPIRES_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type AdminPayload = JWTPayload & { sub: "admin" };

export async function signSession(payload: AdminPayload = { sub: "admin" }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGO })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined | null): Promise<AdminPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGO] });
    if (payload.sub !== "admin") return null;
    return payload as AdminPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
```

- [ ] **Step 2: Smoke verify sign/verify round-trip**

Run (portable across bash & PowerShell — sets a literal test secret inline, then dynamic-imports the module):

```bash
npx tsx -e 'process.env.NEXTAUTH_SECRET = "this-is-only-a-test-secret-do-not-use-in-prod-32-chars"; import("./lib/auth/session.ts").then(async m => { const tok = await m.signSession(); console.log("signed:", tok.split(".").length === 3); const p = await m.verifySession(tok); console.log("verified sub=admin:", p?.sub === "admin"); const bad = await m.verifySession("not.a.token"); console.log("bad token rejected:", bad === null); })'
```

Expected:
```
signed: true
verified sub=admin: true
bad token rejected: true
```

- [ ] **Step 3: Commit**

```bash
git add lib/auth/session.ts
git commit -m "feat(auth): jose-based session sign/verify + cookie helpers"
```

---

## Task 8: `lib/auth/guard.ts` (requireAdmin for Server Actions)

**Files:**
- Create: `lib/auth/guard.ts`

This is Node-runtime only (it can import Prisma later if we add audit logging). Used by Server Actions in Phase 2.

- [ ] **Step 1: Create `lib/auth/guard.ts`**

```typescript
import { redirect } from "next/navigation";
import { getSessionCookie, verifySession, type AdminPayload } from "./session";

export async function getAdminSession(): Promise<AdminPayload | null> {
  const token = await getSessionCookie();
  return verifySession(token);
}

export async function requireAdmin(): Promise<AdminPayload> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If errors appear in unrelated files, only the ones touching `lib/auth/*` need to be clean.)

- [ ] **Step 3: Commit**

```bash
git add lib/auth/guard.ts
git commit -m "feat(auth): requireAdmin guard + getAdminSession helper"
```

---

## Task 9: `middleware.ts` (gate /admin/*)

**Files:**
- Create: `middleware.ts` (at repo root, same level as `app/`)

**Before writing:** read `node_modules/next/dist/docs/middleware.mdx` for Next 16's middleware signature. The classic `NextResponse.redirect` API may have changed.

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const config = {
  matcher: ["/admin/:path*"],
};

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

- [ ] **Step 2: Confirm middleware does not pull Prisma into Edge bundle**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build completes. The build log should show `middleware` listed under Edge runtime. If the build complains about Prisma / `bcryptjs` being included in the Edge bundle, an import is leaking from `lib/auth/session.ts` — middleware should only transitively reach `jose` and `next/headers` (but middleware uses `req.cookies`, not `cookies()` from next/headers — `session.ts`'s cookie functions are not used in middleware, so this should be clean).

- [ ] **Step 3: Manual gate test**

Run: `npm run dev`
In a browser, visit `http://localhost:3000/admin/dashboard`.
Expected: 307 redirect to `http://localhost:3000/admin/login`, which then 404s (login page doesn't exist yet — that's Phase 2).

Visit `http://localhost:3000/admin/login` directly.
Expected: 404 (not a redirect loop).

Visit `http://localhost:3000/`.
Expected: home page renders unchanged.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): middleware gating /admin/* via jose-verified cookie"
```

---

## Task 10: Cloudinary helpers (3 small files)

**Files:**
- Create: `lib/cloudinary/client.ts`
- Create: `lib/cloudinary/signature.ts`
- Create: `lib/cloudinary/delete.ts`

- [ ] **Step 1: Create `lib/cloudinary/client.ts`**

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
```

- [ ] **Step 2: Create `lib/cloudinary/signature.ts`**

```typescript
import { cloudinary } from "./client";

export type CloudinaryFolder =
  | "projects"
  | "blog"
  | "tools"
  | "testimonials"
  | "logos"
  | "experience"
  | "education"
  | "certifications"
  | "site";

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: CloudinaryFolder;
  eager: string;
};

export function signUpload(folder: CloudinaryFolder): SignedUpload {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are not fully set");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const eager = "f_avif,q_auto";

  // Params must be alphabetized and joined as key=value pairs separated by &.
  // cloudinary.utils.api_sign_request handles this for us.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, eager, eager_async: true },
    apiSecret,
  );

  return { cloudName, apiKey, timestamp, signature, folder, eager };
}
```

- [ ] **Step 3: Create `lib/cloudinary/delete.ts`**

```typescript
import { cloudinary } from "./client";

export async function deleteImage(publicId: string | null | undefined): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.error("[cloudinary] delete failed for", publicId, err);
    // Intentional: never throw — orphan asset is recoverable, failing the admin save is not.
  }
}
```

- [ ] **Step 4: Smoke verify signature shape (no network)**

Run (portable; sets test env vars inline):

```bash
npx tsx -e 'process.env.CLOUDINARY_CLOUD_NAME = "test"; process.env.CLOUDINARY_API_KEY = "k"; process.env.CLOUDINARY_API_SECRET = "s"; import("./lib/cloudinary/signature.ts").then(m => { const s = m.signUpload("projects"); console.log("has signature:", !!s.signature); console.log("folder:", s.folder); console.log("eager:", s.eager); console.log("timestamp is number:", typeof s.timestamp === "number"); })'
```

Expected:
```
has signature: true
folder: projects
eager: f_avif,q_auto
timestamp is number: true
```

- [ ] **Step 5: Commit**

```bash
git add lib/cloudinary/
git commit -m "feat(cloudinary): client config + signUpload signature + deleteImage helpers"
```

---

## Task 11: Seed scaffolding + SiteSettings singleton

**Files:**
- Create: `prisma/seed.ts`

This task creates the seed file and writes the SiteSettings singleton from `lib/data.ts` exports. Subsequent tasks (12–14) add entity sections to the same file.

- [ ] **Step 1: Create `prisma/seed.ts` scaffolding**

```typescript
import { PrismaClient } from "@prisma/client";
import {
  profile,
  hero,
  stats,
  companies,
  aboutIntro,
  experienceHeading,
  educationHeading,
  certificationHeading,
  collaborateCta,
  contactPage,
  footer,
} from "../lib/data";

const prisma = new PrismaClient();

async function seedSiteSettings() {
  console.log("→ seeding SiteSettings singleton");

  const heroSubtext = hero.description;
  const trustedByHeading = companies.caption;
  const aboutPageTitle = `${aboutIntro.headingPrefix} ${aboutIntro.headingAccent}`.trim();
  const aboutIntroContent = aboutIntro.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const experienceHeadingText = `${experienceHeading.prefix} ${experienceHeading.accent}`.trim();
  const educationHeadingText = `${educationHeading.prefix} ${educationHeading.accent}`.trim();
  const certificationHeadingText = `${certificationHeading.prefix} ${certificationHeading.accent}`.trim();
  const ctaSectionText = collaborateCta.body;
  const contactPageTitle = `${contactPage.headingPrefix} ${contactPage.headingAccent}`.trim();
  const footerText = footer.text;

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      fullName: profile.name,
      role: profile.role,
      location: profile.location,
      portraitUrl: profile.portrait,
      heroHeadline: `${hero.headingPrefix} ${hero.headingAccent}`.trim(),
      heroSubtext,
      heroPrimaryCtaLabel: hero.primaryCta.label,
      heroPrimaryCtaLink: hero.primaryCta.href,
      heroSecondaryCtaLabel: hero.secondaryCta.label,
      heroSecondaryCtaLink: hero.secondaryCta.href,
      statYearsExperience: stats[0].value,
      statYearsLabel: stats[0].label,
      statProjects: stats[1].value,
      statProjectsLabel: stats[1].label,
      statClients: stats[2].value,
      statClientsLabel: stats[2].label,
      statsShowPlus: true,
      trustedByHeading,
      aboutPageTitle,
      aboutIntroContent,
      experienceHeading: experienceHeadingText,
      educationHeading: educationHeadingText,
      certificationHeading: certificationHeadingText,
      ctaSectionLineOne: collaborateCta.headingLine1,
      ctaSectionLineTwo: collaborateCta.headingLine2,
      ctaSectionText,
      ctaSectionButtonLink: collaborateCta.href,
      contactPageTitle,
      footerText,
    },
    create: {
      id: "singleton",
      fullName: profile.name,
      role: profile.role,
      location: profile.location,
      portraitUrl: profile.portrait,
      heroHeadline: `${hero.headingPrefix} ${hero.headingAccent}`.trim(),
      heroSubtext,
      heroPrimaryCtaLabel: hero.primaryCta.label,
      heroPrimaryCtaLink: hero.primaryCta.href,
      heroSecondaryCtaLabel: hero.secondaryCta.label,
      heroSecondaryCtaLink: hero.secondaryCta.href,
      statYearsExperience: stats[0].value,
      statYearsLabel: stats[0].label,
      statProjects: stats[1].value,
      statProjectsLabel: stats[1].label,
      statClients: stats[2].value,
      statClientsLabel: stats[2].label,
      statsShowPlus: true,
      trustedByHeading,
      aboutPageTitle,
      aboutIntroContent,
      experienceHeading: experienceHeadingText,
      educationHeading: educationHeadingText,
      certificationHeading: certificationHeadingText,
      ctaSectionLineOne: collaborateCta.headingLine1,
      ctaSectionLineTwo: collaborateCta.headingLine2,
      ctaSectionText,
      ctaSectionButtonLink: collaborateCta.href,
      contactPageTitle,
      footerText,
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  console.log("Seeding database from lib/data.ts ...");
  await seedSiteSettings();
  console.log("✓ Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: prints `→ seeding SiteSettings singleton` and `✓ Seed complete`. No errors.

- [ ] **Step 3: Verify the row was inserted**

Run:

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } }); console.log("fullName:", s?.fullName); console.log("heroHeadline:", s?.heroHeadline); console.log("aboutIntroContent length:", s?.aboutIntroContent?.length); await prisma.$disconnect(); })'
```

Expected:
```
fullName: Arifujjaman
heroHeadline: Crafting Visual Stories That Move People
aboutIntroContent length: <a number > 0>
```

- [ ] **Step 4: Run the seed a second time (idempotency check)**

Run: `npm run db:seed`
Expected: completes without unique-constraint errors. No duplicate rows.

Verify: `npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { console.log(await prisma.siteSettings.count()); await prisma.$disconnect(); })'`
Expected: `1`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): SiteSettings singleton from lib/data.ts (idempotent upsert)"
```

---

## Task 12: Seed flat-list entities (Nav, Social, Logo, Tool, FAQ, Testimonial)

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Extend imports**

At the top of `prisma/seed.ts`, replace the import block with:

```typescript
import { PrismaClient } from "@prisma/client";
import {
  profile,
  hero,
  stats,
  companies,
  navItems,
  aboutIntro,
  experienceHeading,
  educationHeading,
  certificationHeading,
  collaborateCta,
  contactPage,
  footer,
  tools,
  testimonials,
  faqs,
} from "../lib/data";
```

- [ ] **Step 2: Add seed functions for these entities**

Add these functions to `prisma/seed.ts` (above `main`):

```typescript
async function seedNavItems() {
  console.log("→ seeding NavItem rows");
  // Wipe and reinsert — list-style data, no FK from other tables.
  await prisma.navItem.deleteMany();
  await prisma.navItem.createMany({
    data: navItems.map((n, i) => ({
      label: n.label,
      href: n.href,
      iconKey: n.icon.displayName ?? n.label.toLowerCase(),
      order: i,
      external: false,
      visible: true,
    })),
  });
}

async function seedSocialLinks() {
  console.log("→ seeding SocialLink rows");
  await prisma.socialLink.deleteMany();
  await prisma.socialLink.createMany({
    data: profile.socials.map((s, i) => ({
      platform: s.label.toLowerCase(),
      label: s.label,
      url: s.href,
      iconKey: s.label.toLowerCase(),
      order: i,
      visible: true,
    })),
  });
}

async function seedClientLogos() {
  console.log("→ seeding ClientLogo rows");
  await prisma.clientLogo.deleteMany();
  await prisma.clientLogo.createMany({
    data: companies.logos.map((name, i) => ({
      name,
      logoUrl: `https://placehold.co/200x80/1c1c1c/8b5cf6?text=${encodeURIComponent(name)}`,
      publicId: "",
      order: i,
      visible: true,
    })),
  });
}

async function seedTools() {
  console.log("→ seeding Tool rows");
  await prisma.tool.deleteMany();
  await prisma.tool.createMany({
    data: tools.map((t, i) => ({
      name: t.name,
      description: t.role,
      category: null,
      iconUrl: t.icon.startsWith("http") ? null : t.icon,
      iconExternalUrl: t.icon.startsWith("http") ? t.icon : null,
      proficiency: 80,
      order: i,
      showOnHome: true,
      visible: true,
    })),
  });
}

async function seedTestimonials() {
  console.log("→ seeding Testimonial rows");
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: testimonials.map((t, i) => ({
      name: t.name,
      role: t.role,
      content: t.quote,
      avatarUrl: t.avatar,
      rating: 5,
      featured: false,
      order: i,
      visible: true,
    })),
  });
}

async function seedFaqs() {
  console.log("→ seeding FAQ rows");
  await prisma.fAQ.deleteMany();
  await prisma.fAQ.createMany({
    data: faqs.map((f, i) => ({
      question: f.question,
      answer: f.answer,
      order: i,
      visible: true,
    })),
  });
}
```

- [ ] **Step 3: Wire into `main()`**

Replace the existing `main` function with:

```typescript
async function main() {
  console.log("Seeding database from lib/data.ts ...");
  await seedSiteSettings();
  await seedNavItems();
  await seedSocialLinks();
  await seedClientLogos();
  await seedTools();
  await seedTestimonials();
  await seedFaqs();
  console.log("✓ Seed complete");
}
```

- [ ] **Step 4: Run the seed**

Run: `npm run db:seed`
Expected: prints all `→ seeding ...` lines and `✓ Seed complete`.

- [ ] **Step 5: Verify row counts**

Run:

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { console.log("NavItem:", await prisma.navItem.count()); console.log("SocialLink:", await prisma.socialLink.count()); console.log("ClientLogo:", await prisma.clientLogo.count()); console.log("Tool:", await prisma.tool.count()); console.log("Testimonial:", await prisma.testimonial.count()); console.log("FAQ:", await prisma.fAQ.count()); await prisma.$disconnect(); })'
```

Expected:
```
NavItem: 6
SocialLink: 5
ClientLogo: 3
Tool: 8
Testimonial: 1
FAQ: 5
```

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): nav, socials, logos, tools, testimonials, faqs"
```

---

## Task 13: Seed timeline entities (Experience, Education, Certification)

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Extend imports**

Add to the import block at the top of `prisma/seed.ts`:

```typescript
import {
  // ... existing imports above
  experience,
  education,
  certifications,
} from "../lib/data";
```

(Merge into the existing single import statement.)

- [ ] **Step 2: Add a period parser helper**

`lib/data.ts` stores periods as `"Jan 2026 — Present"` strings. Schema stores `startDate` + `endDate` + `current`. Add this helper above the seed functions:

```typescript
function parsePeriod(period: string): { startDate: string; endDate: string | null; current: boolean } {
  // Split on em-dash, en-dash, or hyphen with surrounding spaces.
  const parts = period.split(/\s+[—–-]\s+/);
  const start = parts[0]?.trim() ?? period.trim();
  const endRaw = parts[1]?.trim() ?? null;
  const current = endRaw === "Present" || endRaw === "present";
  return {
    startDate: start,
    endDate: current ? null : endRaw,
    current,
  };
}
```

- [ ] **Step 3: Add seed functions**

```typescript
async function seedExperience() {
  console.log("→ seeding Experience rows");
  await prisma.experience.deleteMany();
  await prisma.experience.createMany({
    data: experience.map((e, i) => {
      const { startDate, endDate, current } = parsePeriod(e.period);
      return {
        company: e.company,
        role: e.role,
        description: e.description,
        startDate,
        endDate,
        current,
        companyUrl: e.href === "#" ? null : e.href,
        order: i,
        visible: true,
      };
    }),
  });
}

async function seedEducation() {
  console.log("→ seeding Education rows");
  await prisma.education.deleteMany();
  await prisma.education.createMany({
    data: education.map((e, i) => {
      const { startDate, endDate, current } = parsePeriod(e.period);
      return {
        institution: e.institution,
        degree: e.degree,
        description: e.description,
        startDate,
        endDate,
        current,
        institutionUrl: e.href === "#" ? null : e.href,
        order: i,
        visible: true,
      };
    }),
  });
}

async function seedCertifications() {
  console.log("→ seeding Certification rows");
  await prisma.certification.deleteMany();
  await prisma.certification.createMany({
    data: certifications.map((c, i) => {
      const { startDate, endDate } = parsePeriod(c.period);
      return {
        institution: c.institution,
        title: c.title,
        description: c.description,
        startDate,
        endDate,
        credentialUrl: c.href === "#" ? null : c.href,
        order: i,
        visible: true,
      };
    }),
  });
}
```

- [ ] **Step 4: Wire into `main()`**

After `seedFaqs()` in `main()`, add:

```typescript
  await seedExperience();
  await seedEducation();
  await seedCertifications();
```

- [ ] **Step 5: Run and verify**

Run: `npm run db:seed`

Then:

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { console.log("Experience:", await prisma.experience.count()); console.log("Education:", await prisma.education.count()); console.log("Certification:", await prisma.certification.count()); const e0 = await prisma.experience.findFirst({ where: { current: true } }); console.log("current experience company:", e0?.company); await prisma.$disconnect(); })'
```

Expected:
```
Experience: 5
Education: 3
Certification: 1
current experience company: Databrandix
```

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): experience, education, certifications with period parsing"
```

---

## Task 14: Seed Projects with sections + gallery

**Files:**
- Modify: `prisma/seed.ts`

This is the most involved seed task — it converts `ContentBlock[]` to normalized `ProjectSection` + `introContent` HTML, and `gallery[]` URLs to `ProjectImage` rows.

- [ ] **Step 1: Extend imports**

Add to the import block:

```typescript
import {
  // ... existing
  projects,
  type ContentBlock,
} from "../lib/data";
```

- [ ] **Step 2: Add ContentBlock → sections converter**

Add above the seed functions (uses the existing `escapeHtml` helper):

```typescript
type ParsedSections = {
  introHtml: string;
  sections: { heading: string; contentHtml: string; order: number }[];
};

function blocksToSections(blocks: ContentBlock[]): ParsedSections {
  const introParas: string[] = [];
  const sections: ParsedSections["sections"] = [];
  let current: { heading: string; paras: string[] } | null = null;

  for (const b of blocks) {
    if (b.kind === "h2") {
      if (current) {
        sections.push({
          heading: current.heading,
          contentHtml: current.paras.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
          order: sections.length,
        });
      }
      current = { heading: b.text, paras: [] };
    } else {
      if (current) {
        current.paras.push(b.text);
      } else {
        introParas.push(b.text);
      }
    }
  }
  if (current) {
    sections.push({
      heading: current.heading,
      contentHtml: current.paras.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
      order: sections.length,
    });
  }

  return {
    introHtml: introParas.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
    sections,
  };
}
```

- [ ] **Step 3: Add the projects seed function**

```typescript
async function seedProjects() {
  console.log("→ seeding Project rows + sections + gallery");
  // Delete sections and images first via cascade — clearing Project clears them.
  await prisma.project.deleteMany();

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const { introHtml, sections } = blocksToSections(p.content);

    await prisma.project.create({
      data: {
        slug: p.slug,
        title: p.title,
        shortLabel: p.subtitle,
        year: p.year,
        client: p.client,
        services: p.services,
        coverImageUrl: p.image,
        coverPublicId: "",
        excerpt: p.excerpt,
        introContent: introHtml || null,
        published: true,
        featured: i < 4,
        order: i,
        publishedAt: new Date(),
        sections: {
          create: sections.map((s) => ({
            heading: s.heading,
            content: s.contentHtml,
            order: s.order,
          })),
        },
        galleryImages: {
          create: p.gallery.map((url, idx) => ({
            url,
            publicId: "",
            order: idx,
          })),
        },
      },
    });
  }
}
```

- [ ] **Step 4: Wire into `main()`**

After `seedCertifications()`:

```typescript
  await seedProjects();
```

- [ ] **Step 5: Run and verify**

Run: `npm run db:seed`

Then:

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { const ps = await prisma.project.findMany({ include: { sections: true, galleryImages: true }, orderBy: { order: "asc" } }); console.log("projects:", ps.length); console.log("total sections:", ps.reduce((n, p) => n + p.sections.length, 0)); console.log("total gallery images:", ps.reduce((n, p) => n + p.galleryImages.length, 0)); console.log("nokshi section headings:", ps.find(p => p.slug === "nokshi")?.sections.map(s => s.heading)); await prisma.$disconnect(); })'
```

Expected:
```
projects: 6
total sections: 13
total gallery images: 24
nokshi section headings: [ 'The brief', 'The approach', 'The outcome' ]
```

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): projects with sections + gallery from ContentBlock[]"
```

---

## Task 15: Seed BlogPosts

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Extend imports**

Add `blogPosts` to the import block:

```typescript
import {
  // ... existing
  blogPosts,
} from "../lib/data";
```

- [ ] **Step 2: Add blog seed function**

```typescript
function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      if (b.kind === "h2") return `<h2>${escapeHtml(b.text)}</h2>`;
      return `<p>${escapeHtml(b.text)}</p>`;
    })
    .join("");
}

function parseBlogDate(date: string): Date {
  // "Apr 8, 2024" → Date
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

async function seedBlogPosts() {
  console.log("→ seeding BlogPost rows");
  await prisma.blogPost.deleteMany();
  for (let i = 0; i < blogPosts.length; i++) {
    const b = blogPosts[i];
    await prisma.blogPost.create({
      data: {
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        content: blocksToHtml(b.content),
        coverImageUrl: b.image,
        coverPublicId: "",
        published: true,
        featured: i < 2,
        readTimeMinutes: Math.max(1, Math.round(b.content.reduce((n, blk) => n + blk.text.split(/\s+/).length, 0) / 200)),
        publishedAt: parseBlogDate(b.date),
      },
    });
  }
}
```

- [ ] **Step 3: Wire into `main()`**

After `seedProjects()`:

```typescript
  await seedBlogPosts();
```

- [ ] **Step 4: Run and verify**

Run: `npm run db:seed`

Then:

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { const bs = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } }); console.log("blog posts:", bs.length); console.log("first slug:", bs[0]?.slug); console.log("contains h2:", bs[0]?.content.includes("<h2>")); console.log("read time first post:", bs[0]?.readTimeMinutes); await prisma.$disconnect(); })'
```

Expected:
```
blog posts: 5
first slug: typography-soul-of-brand
contains h2: true
read time first post: <a small number, 3-7>
```

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): blog posts with HTML content"
```

---

## Task 16: Final acceptance verification (Phase 1 checkpoint)

**Files:** none modified. This task is a verification pass — every check must pass before declaring Phase 1 done.

- [ ] **Step 1: Clean slate test**

Run: `npx prisma migrate reset --force --skip-seed`
Expected: drops all tables and re-applies the migration. Confirm with `npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { console.log(await prisma.siteSettings.count()); await prisma.$disconnect(); })'` → prints `0`.

- [ ] **Step 2: Full seed run**

Run: `npm run db:seed`
Expected: all `→ seeding ...` lines print, ends with `✓ Seed complete`, no errors.

- [ ] **Step 3: Row counts match spec**

Run:

```bash
npx tsx -e 'import("./lib/db/client.ts").then(async ({ prisma }) => { const c = { SiteSettings: await prisma.siteSettings.count(), NavItem: await prisma.navItem.count(), SocialLink: await prisma.socialLink.count(), ClientLogo: await prisma.clientLogo.count(), Tool: await prisma.tool.count(), Testimonial: await prisma.testimonial.count(), FAQ: await prisma.fAQ.count(), Experience: await prisma.experience.count(), Education: await prisma.education.count(), Certification: await prisma.certification.count(), Project: await prisma.project.count(), ProjectSection: await prisma.projectSection.count(), ProjectImage: await prisma.projectImage.count(), BlogPost: await prisma.blogPost.count(), ContactSubmission: await prisma.contactSubmission.count() }; console.table(c); await prisma.$disconnect(); })'
```

Expected table:

| (model) | (count) |
|---|---|
| SiteSettings | 1 |
| NavItem | 6 |
| SocialLink | 5 |
| ClientLogo | 3 |
| Tool | 8 |
| Testimonial | 1 |
| FAQ | 5 |
| Experience | 5 |
| Education | 3 |
| Certification | 1 |
| Project | 6 |
| ProjectSection | 13 |
| ProjectImage | 24 |
| BlogPost | 5 |
| ContactSubmission | 0 |

- [ ] **Step 4: Idempotency**

Run: `npm run db:seed` (a second time)
Expected: same counts, no unique-constraint errors.

- [ ] **Step 5: Auth smoke (hash + verify round-trip in one shot)**

Run (portable):

```bash
npx tsx -e 'import("./lib/auth/password.ts").then(async m => { const h = await m.hashPassword("phase1-acceptance"); const ok = await m.verifyPassword("phase1-acceptance", h); console.log(ok && h.startsWith("$2") ? "OK" : "FAIL"); })'
```

Expected: `OK`.

- [ ] **Step 6: Session smoke**

Run (portable; sets test secret inline):

```bash
npx tsx -e 'process.env.NEXTAUTH_SECRET = "phase1-acceptance-test-secret-32-chars-long"; import("./lib/auth/session.ts").then(async m => { const t = await m.signSession(); const p = await m.verifySession(t); console.log(p?.sub === "admin" ? "OK" : "FAIL"); })'
```

Expected: `OK`.

- [ ] **Step 7: Cloudinary signature smoke**

Run (portable; sets test env vars inline):

```bash
npx tsx -e 'process.env.CLOUDINARY_CLOUD_NAME = "test"; process.env.CLOUDINARY_API_KEY = "k"; process.env.CLOUDINARY_API_SECRET = "s"; import("./lib/cloudinary/signature.ts").then(m => { const s = m.signUpload("projects"); console.log(!!s.signature && s.folder === "projects" ? "OK" : "FAIL"); })'
```

Expected: `OK`.

- [ ] **Step 8: Middleware gate**

Run: `npm run dev` (in one shell)

In another shell:

```bash
curl -sI http://localhost:3000/admin/dashboard | head -5
```

Expected: HTTP `307 Temporary Redirect`, with `location: /admin/login` header.

```bash
curl -sI http://localhost:3000/admin/login | head -5
```

Expected: HTTP `404 Not Found` (login page is Phase 2; the route exists in matcher but the page is unbuilt).

```bash
curl -sI http://localhost:3000/ | head -5
```

Expected: HTTP `200 OK`.

Stop the dev server.

- [ ] **Step 9: No-frontend-modified check (spec acceptance #10, part 1)**

Confirm no file under `app/` or `components/` has been modified since the branch started.

Run (replace `<base-sha>` with the commit hash from before Task 1 — if working on `main`, use `git merge-base HEAD origin/main` or pick the commit immediately before this plan's first commit):

```bash
git diff --name-only <base-sha> HEAD -- app/ components/
```

Expected: empty output. If anything appears, investigate before continuing.

- [ ] **Step 10: No-new-deps-outside-allowlist check (spec acceptance #10, part 2)**

Confirm `package.json` added only the Phase 1 allowlist (`prisma`, `@prisma/client`, `bcryptjs`, `cloudinary`, `jose`, `@types/bcryptjs`, `tsx`).

Run:

```bash
git diff <base-sha> HEAD -- package.json
```

Expected diff scope: only the 7 deps above + new scripts + the `"prisma"` config key. If anything else was added (e.g., a stray `resend`, `@tiptap/*`, `@dnd-kit/*`, `react-hook-form`, `zod`, `next-auth`), remove it.

- [ ] **Step 11: Build verification**

Run: `npm run build`
Expected: completes without errors. Middleware appears in the build output under Edge runtime. No new public routes vs. prior builds.

- [ ] **Step 12: Final commit (no-op if everything was already committed)**

```bash
git status
```

If clean, no commit needed. Otherwise commit any straggling changes:

```bash
git add -A
git commit -m "chore(backend): phase 1 acceptance verification passes"
```

- [ ] **Step 13: Mark phase 1 done in the spec**

Edit [docs/superpowers/specs/2026-05-20-portfolio-backend-foundation-design.md](../specs/2026-05-20-portfolio-backend-foundation-design.md) header — change `Status: Draft — awaiting user review` to `Status: Implemented`. Commit:

```bash
git add docs/superpowers/specs/2026-05-20-portfolio-backend-foundation-design.md
git commit -m "docs(spec): mark phase 1 foundation as implemented"
```

---

## What's NOT in this plan (and where it lands)

- **Phase 2:** admin UI (login page, dashboard, CRUD forms, TipTap, drag-reorder, browser-side Cloudinary upload widget wired to `signUpload`).
- **Phase 3:** rewire `app/**/page.tsx` and `components/sections/*` to read from new `lib/db/<entity>.ts` cached query files; remove `lib/data.ts` hardcoded exports (keep only type aliases).
- **Phase 4:** contact form, Resend integration, sitemap, robots.txt, README update.

Each gets its own brainstorming → spec → plan cycle.

---

## Risks captured during planning

1. **Next 16 cookies / middleware API drift.** Pre-flight reminder included; if `cookies()` is sync in Next 16, drop `await` in Task 7. If `NextResponse.redirect` signature changed, adjust Task 9.
2. **Neon shadow DB.** Documented in Task 3 Step 3; fallback to `--create-only` + `db push` is given.
3. **Prisma + Edge runtime.** Architecturally avoided: middleware imports only `jose` and `verifySession` (which itself imports only `jose` + `next/headers`). Confirmed by Task 9 build step.
4. **Seed running on an empty DB after `migrate reset`.** Idempotency handled via `deleteMany()` + `createMany()` for list entities and `upsert` for the singleton.
