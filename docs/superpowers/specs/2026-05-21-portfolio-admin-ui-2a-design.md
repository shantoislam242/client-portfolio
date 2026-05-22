# Portfolio Admin UI — Phase 2A Design Spec

**Date:** 2026-05-21
**Status:** Implemented (2026-05-22)
**Scope:** Phase 2A of the 4-phase backend buildout. Builds on [Phase 1 foundation](./2026-05-20-portfolio-backend-foundation-design.md). Phase 2B (Project + Blog + TipTap + drag-reorder) is a separate spec.
**Predecessor:** Phase 1 (foundation — schema, auth primitives, Cloudinary helpers, `/admin/*` gate)
**Successor:** Phase 2B (advanced admin: Project/Blog CRUD, TipTap, drag-reorder)

---

## Goal

Ship the first usable admin UI on top of Phase 1's foundation. After Phase 2A, the site owner can log in at `/admin/login`, navigate a sidebar dashboard, and create / edit / delete every "simple" entity in the database — anything whose form is mostly text fields plus optional Cloudinary image upload. Complex entities (Project with sections + gallery, BlogPost with rich text) are deferred to Phase 2B.

**The public site behavior does not change in Phase 2A.** It continues to read from `lib/data.ts`. The DB-write path lights up for these 10 entities, but the read path stays unchanged until Phase 3.

## Non-goals (deferred)

- **Phase 2B:** Project CRUD (sections + gallery + related), BlogPost CRUD, TipTap rich-text editor, drag-to-reorder UI.
- **Phase 3:** Public site refactor to read from DB.
- **Phase 4:** Contact form, Resend, sitemap, robots.txt.
- **Never (or much later):** Multi-admin, password reset, signup, audit logging, bulk operations, image library/picker, analytics dashboards.

---

## Constraints

- **Next.js 16.2.6 + React 19.** Form approach is Next 16 Server Actions + zod, **not** react-hook-form. `useActionState` carries error state. Pages that need data are Server Components; only `ImageUploader` and `DeleteButton` are `'use client'`.
- **No new design system.** Reuse existing Tailwind tokens and `radix-ui` primitives. The admin visual style follows the public site: cards on `#272829`, purple accents for active state. Admin pages are desktop-focused (single user, sitting at a computer).
- **Existing `proxy.ts` gate is the first line of defense.** Layout-level `requireAdmin()` is belt-and-suspenders, mainly for type narrowing and ensuring no Server Component renders sensitive data without an admin session.
- **Cost: still $0/month.** No new paid services. Cloudinary stays on free tier; Neon free tier is plenty.
- **No public surface exposed.** No "Login" link anywhere on the public site; `/admin` is unadvertised. Robots disallow added in Phase 4.
- **Existing public-site visual design is preserved.** Phase 2A modifies nothing under public `app/(routes)/**/page.tsx` or public `components/sections/*`.

---

## Tech stack additions (Phase 2A only)

| Package | Purpose | Notes |
|---|---|---|
| `zod` | Server Action validation | Server-only; type inference for entity Inputs |

Postponed packages (not installed in 2A):
- `@tiptap/*` → Phase 2B
- `@dnd-kit/*` → Phase 2B
- `react-hook-form` / `@hookform/resolvers` → **not used** (replaced by Server Actions + zod)
- `resend` → Phase 4

Already installed and reused: `sonner` (toast notifications), `radix-ui`, `lucide-react`, `tailwind-merge`, `clsx`, `class-variance-authority`.

---

## Architecture

### File map (Phase 2A deliverables)

```
portfolio/
├── app/
│   ├── (admin)/                                     # NEW route group: admin-gated layout
│   │   └── admin/
│   │       ├── layout.tsx                           # NEW — calls requireAdmin, renders Sidebar + content
│   │       ├── page.tsx                             # NEW — dashboard home with row-count cards
│   │       ├── site-settings/
│   │       │   ├── page.tsx                         # NEW — index of 10 sub-pages
│   │       │   ├── profile/page.tsx                 # NEW
│   │       │   ├── hero/page.tsx                    # NEW
│   │       │   ├── stats/page.tsx                   # NEW
│   │       │   ├── about/page.tsx                   # NEW — aboutIntroContent as textarea
│   │       │   ├── sections/page.tsx                # NEW — all section headings + limits
│   │       │   ├── contact/page.tsx                 # NEW
│   │       │   ├── collaborate/page.tsx             # NEW
│   │       │   ├── footer/page.tsx                  # NEW
│   │       │   ├── seo/page.tsx                     # NEW
│   │       │   └── theme/page.tsx                   # NEW
│   │       ├── nav-items/
│   │       │   ├── page.tsx                         # NEW — list
│   │       │   ├── new/page.tsx                     # NEW — create form
│   │       │   └── [id]/page.tsx                    # NEW — edit form
│   │       ├── social-links/{page,new/page,[id]/page}.tsx
│   │       ├── tools/{page,new/page,[id]/page}.tsx
│   │       ├── testimonials/{page,new/page,[id]/page}.tsx
│   │       ├── faqs/{page,new/page,[id]/page}.tsx
│   │       ├── experience/{page,new/page,[id]/page}.tsx
│   │       ├── education/{page,new/page,[id]/page}.tsx
│   │       ├── certifications/{page,new/page,[id]/page}.tsx
│   │       └── client-logos/{page,new/page,[id]/page}.tsx
│   │
│   └── (admin-public)/                              # NEW route group: NOT requireAdmin-gated
│       └── admin/
│           └── login/page.tsx                       # NEW — email+password form
│
├── actions/                                         # NEW — all admin Server Actions
│   ├── auth.ts                                      # loginAction, logoutAction
│   ├── upload.ts                                    # signCloudinaryUpload (wraps Phase 1 signUpload)
│   ├── site-settings.ts                             # one action per sub-section: updateProfile, updateHero, ...
│   ├── nav-items.ts                                 # createNavItem, updateNavItem, deleteNavItem
│   ├── social-links.ts
│   ├── tools.ts
│   ├── testimonials.ts
│   ├── faqs.ts
│   ├── experience.ts
│   ├── education.ts
│   ├── certifications.ts
│   └── client-logos.ts
│
├── lib/
│   ├── db/                                          # extends Phase 1's lib/db
│   │   ├── client.ts                                # (already exists)
│   │   ├── site-settings.ts                         # NEW — getSiteSettings (cached, with React cache())
│   │   ├── nav-items.ts                             # NEW — listNavItems
│   │   ├── social-links.ts                          # NEW
│   │   ├── tools.ts                                 # NEW
│   │   ├── testimonials.ts                          # NEW
│   │   ├── faqs.ts                                  # NEW
│   │   ├── experience.ts                            # NEW
│   │   ├── education.ts                             # NEW
│   │   ├── certifications.ts                        # NEW
│   │   └── client-logos.ts                          # NEW
│   └── schemas/                                     # NEW directory
│       ├── site-settings.ts                         # zod schemas per sub-section (ProfileSchema, HeroSchema, ...)
│       ├── nav-item.ts
│       ├── social-link.ts
│       ├── tool.ts
│       ├── testimonial.ts
│       ├── faq.ts
│       ├── experience.ts
│       ├── education.ts
│       ├── certification.ts
│       └── client-logo.ts
│
└── components/admin/                                # NEW directory
    ├── sidebar.tsx                                  # nav grouped (Settings / Content / About / Other) + logout button
    ├── form-section.tsx                             # consistent <form action={...}> wrapper with error display
    ├── image-uploader.tsx                           # 'use client' — file picker + Cloudinary direct upload
    ├── delete-button.tsx                            # 'use client' — confirm modal + form submit
    ├── data-table.tsx                               # generic list table
    ├── visible-toggle.tsx                           # 'use client' — single-checkbox form per row
    └── field/                                       # field primitives, server components
        ├── text-field.tsx
        ├── text-area-field.tsx
        ├── number-field.tsx
        ├── boolean-field.tsx
        ├── url-field.tsx
        └── select-field.tsx                         # e.g. iconKey from registry
```

**Route-group boundary rule:** Everything under `(admin)/admin/*` is gated by the layout's `requireAdmin()`. The login page sits in `(admin-public)/admin/login/page.tsx` so its layout does **not** call `requireAdmin()`. The `proxy.ts` matcher already allowlists `/admin/login`. This split also gives us a clean place for a future password-reset flow without touching the gated layout.

---

## Auth flow

### Login (`app/(admin-public)/admin/login/page.tsx`)

Server Component renders the form. The form's `action` is `loginAction`. The form is wrapped in a thin client component (or uses React 19's `useActionState`-with-form pattern in a server-island arrangement) so error state can be displayed inline. The minimal viable shape:

```tsx
// page.tsx (Server Component)
import { LoginForm } from './login-form'
export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <LoginForm />
    </div>
  )
}

// login-form.tsx ('use client')
'use client'
import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null)
  return (
    <form action={action}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  )
}
```

`loginAction` (`actions/auth.ts`):

```ts
'use server'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { signSession, setSessionCookie } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid input' }

  const { email, password } = parsed.data
  const adminEmail = process.env.ADMIN_EMAIL
  const adminHash = process.env.ADMIN_PASSWORD_HASH
  if (!adminEmail || !adminHash) return { error: 'Server misconfigured' }

  // Constant-time-ish email compare (case-insensitive)
  const emailOk = email.toLowerCase() === adminEmail.toLowerCase()
  const passwordOk = emailOk ? await verifyPassword(password, adminHash) : false

  // Same generic error for both wrong email and wrong password — no enumeration
  if (!emailOk || !passwordOk) return { error: 'Invalid credentials' }

  const token = await signSession({ sub: 'admin' })
  await setSessionCookie(token)
  redirect('/admin')
}
```

### Logout

Sidebar button is a tiny form:

```tsx
<form action={logoutAction}><button>Log out</button></form>
```

`logoutAction`:

```ts
'use server'
export async function logoutAction() {
  await clearSessionCookie()
  redirect('/admin/login')
}
```

### Auth guard at layout level

```tsx
// app/(admin)/admin/layout.tsx
import { requireAdmin } from '@/lib/auth/guard'
import { Sidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin() // redirects to /admin/login if no valid session
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

`proxy.ts` already redirects unauthenticated requests at the edge. The layout call exists so that (a) Server Components below it have a typed `AdminPayload` available if needed via `getAdminSession()`, and (b) defense-in-depth if middleware ever fails open.

---

## Image uploader primitive

`components/admin/image-uploader.tsx` is a `'use client'` component that handles the full signed-upload dance from Phase 1. **One implementation, reused across 6+ image fields.**

### Props

```ts
type ImageUploaderProps = {
  folder: CloudinaryFolder                 // 'tools' | 'testimonials' | ...
  name: string                             // hidden input name for url
  publicIdName: string                     // hidden input name for publicId
  initialUrl?: string | null
  initialPublicId?: string | null
  label?: string                           // shown above the picker
  required?: boolean
}
```

### Internal flow

1. State: `{ status: 'idle' | 'signing' | 'uploading' | 'done' | 'error', url, publicId, oldPublicId, error? }`.
2. On file pick:
   - Set `status = 'signing'`. Call `signCloudinaryUpload(folder)` (a Server Action that wraps Phase 1's `signUpload()`).
   - Set `status = 'uploading'`. POST `multipart/form-data` to `https://api.cloudinary.com/v1_1/<cloudName>/auto/upload` with fields `file`, `api_key`, `timestamp`, `signature`, `folder`, `eager`, `eager_async=true`.
   - On success: parse response → set `{ url: secure_url, publicId: public_id, status: 'done' }`.
   - On error: set status `'error'` with message.
3. Render:
   - If `status === 'done'` (or `initialUrl` present and untouched): show preview `<img>` with "Replace" button.
   - Else show drop zone / file picker.
   - Hidden inputs: `<input type="hidden" name={name} value={url ?? ''} />`, `<input type="hidden" name={publicIdName} value={publicId ?? ''} />`, and if replacing an existing image: `<input type="hidden" name={`${name}__oldPublicId`} value={oldPublicId} />`.
4. When the parent form submits, the Server Action sees `url`, `publicId`, and optionally `__oldPublicId`. Before persisting, the action calls `deleteImage(oldPublicId)` (Phase 1 helper) to clean up the replaced asset.

### `signCloudinaryUpload` Server Action (`actions/upload.ts`)

```ts
'use server'
import { requireAdmin } from '@/lib/auth/guard'
import { signUpload, type CloudinaryFolder } from '@/lib/cloudinary/signature'

export async function signCloudinaryUpload(folder: CloudinaryFolder) {
  await requireAdmin()
  return signUpload(folder)
}
```

Single source of truth: only logged-in admins can request upload signatures. The signature is short-lived and folder-locked, so even if leaked it can't be used to upload elsewhere.

---

## Server Action pattern (per entity)

Each entity gets one file at `actions/<entity>.ts`. Standard exports:

| Function | Used by | Returns |
|---|---|---|
| `create<Entity>(prev, formData)` | `new/page.tsx` form | `{ error }` on fail; `redirect()` on success |
| `update<Entity>(id, prev, formData)` (bound) | `[id]/page.tsx` form | same |
| `delete<Entity>(id)` | `<DeleteButton>` | `redirect('/admin/<entity>')` |
| `toggleVisible<Entity>(id, formData)` | `<VisibleToggle>` | `revalidatePath('/admin/<entity>')` |

Pattern:

```ts
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/guard'
import { prisma } from '@/lib/db/client'
import { deleteImage } from '@/lib/cloudinary/delete'
import { ToolSchema } from '@/lib/schemas/tool'

type Result = { error: string; issues?: z.ZodFormattedError<unknown> } | null

export async function createTool(_prev: Result, formData: FormData): Promise<Result> {
  await requireAdmin()
  const parsed = ToolSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid input', issues: parsed.error.format() }
  await prisma.tool.create({ data: parsed.data })
  revalidatePath('/admin/tools')
  redirect('/admin/tools')
}

export async function updateTool(id: string, _prev: Result, formData: FormData): Promise<Result> {
  await requireAdmin()
  const obj = Object.fromEntries(formData)
  const oldPublicId = obj['iconPublicId__oldPublicId'] as string | undefined
  const parsed = ToolSchema.safeParse(obj)
  if (!parsed.success) return { error: 'Invalid input', issues: parsed.error.format() }
  if (oldPublicId && oldPublicId !== parsed.data.iconPublicId) {
    await deleteImage(oldPublicId)
  }
  await prisma.tool.update({ where: { id }, data: parsed.data })
  revalidatePath('/admin/tools')
  redirect('/admin/tools')
}

export async function deleteTool(id: string) {
  await requireAdmin()
  const tool = await prisma.tool.findUnique({ where: { id } })
  if (tool?.iconPublicId) await deleteImage(tool.iconPublicId)
  await prisma.tool.delete({ where: { id } })
  revalidatePath('/admin/tools')
  redirect('/admin/tools')
}
```

`updateTool` is bound at the call site: `const action = updateTool.bind(null, tool.id)` then `<form action={action}>`.

---

## SiteSettings sub-pages

The schema has ~80 fields. Splitting into logical sub-pages keeps each form short and validation focused. **Each sub-page calls a different Server Action that updates only its own fields**, leaving the rest untouched. The `updatedAt` column tracks the last edit regardless of which sub-section.

| Sub-page | Fields included | Server Action |
|---|---|---|
| `/admin/site-settings` | (index — links to the 10 below) | — |
| `profile` | fullName, role, location, portraitUrl, portraitPublicId, ctaButtonLabel, ctaButtonLink, resumeUrl, resumePublicId | `updateProfile` |
| `hero` | heroHeadline, heroSubtext, heroPrimaryCtaLabel/Link, heroSecondaryCtaLabel/Link | `updateHero` |
| `stats` | statYearsExperience, statYearsLabel, statProjects, statProjectsLabel, statClients, statClientsLabel, statsShowPlus | `updateStats` |
| `about` | aboutPageTitle, aboutIntroContent (textarea — TipTap in 2B), experienceHeading, educationHeading, certificationHeading | `updateAbout` |
| `sections` | trustedByHeading, recentProjectsHeading + Limit, toolsSectionHeading, testimonialsHeading, blogSectionHeading + Limit, faqHeading, projectsPageTitle/Subtitle, blogPageTitle/Subtitle, toolsPageTitle/Subtitle | `updateSections` |
| `contact` | contactPageTitle, contactPageSubtitle, contactEmail, contactPhone, contactLocationText, contactFormNameLabel/EmailLabel/MessageLabel/SubmitLabel, contactSuccessMessage | `updateContact` |
| `collaborate` | ctaSectionLineOne, ctaSectionLineTwo, ctaSectionText, ctaSectionButtonLabel, ctaSectionButtonLink | `updateCollaborate` |
| `footer` | footerText, footerShowYear, footerCopyright | `updateFooter` |
| `seo` | siteName, siteDescription, siteKeywords, ogImage + ogImagePublicId, faviconUrl + faviconPublicId | `updateSeo` |
| `theme` | primaryColor, accentColor | `updateTheme` |

`actions/site-settings.ts` exports all 10 functions, each shape:

```ts
export async function updateProfile(_prev: Result, formData: FormData): Promise<Result> {
  await requireAdmin()
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid input', issues: parsed.error.format() }
  // handle portrait/resume publicId replacements
  await prisma.siteSettings.update({
    where: { id: 'singleton' },
    data: parsed.data,
  })
  revalidatePath('/admin/site-settings/profile')
  return null
}
```

Note: `updateProfile` (and other settings sub-actions) does **not** redirect — it returns `null` on success so the page re-renders with a `toast.success("Saved")` triggered by the form. List-entity actions DO redirect (back to the list) because the user is done.

---

## List page UX (per entity)

`/admin/<entity>/page.tsx` (Server Component):

```tsx
import { listTools } from '@/lib/db/tools'
import { DataTable } from '@/components/admin/data-table'

export default async function ToolsListPage() {
  const tools = await listTools()
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1>Tools ({tools.length})</h1>
        <a href="/admin/tools/new" className="btn-primary">+ New tool</a>
      </header>
      <DataTable
        rows={tools}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'order', label: 'Order' },
        ]}
        editHref={(t) => `/admin/tools/${t.id}`}
        deleteAction={deleteTool}
        visibleToggleAction={toggleVisibleTool}
      />
    </div>
  )
}
```

- No pagination — every entity has fewer than 25 rows. Phase 2A scale.
- The `visible` toggle is a per-row form whose action calls `toggleVisibleTool` server action; it returns and `revalidatePath` redraws the table.
- Delete uses a confirm modal (`'use client'` `DeleteButton`) before submitting.

---

## Dashboard home (`/admin/page.tsx`)

Server Component fetches counts in parallel:

```tsx
const [counts] = await Promise.all([
  Promise.all([
    prisma.tool.count(),
    prisma.testimonial.count(),
    prisma.faQ.count(),
    // ...
  ]),
])
```

Renders a grid of cards: each card shows entity name, count, and a "Manage →" link to `/admin/<entity>`. The cards function as quick visual navigation in addition to the sidebar.

---

## Validation strategy

Zod schemas in `lib/schemas/<entity>.ts`. Pattern:

```ts
import { z } from 'zod'

export const ToolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  iconUrl: z.string().url().or(z.literal('')).optional().nullable(),
  iconPublicId: z.string().optional().nullable(),
  iconExternalUrl: z.string().url().or(z.literal('')).optional().nullable(),
  proficiency: z.coerce.number().int().min(0).max(100).default(80),
  order: z.coerce.number().int().nonnegative().default(0),
  showOnHome: z.coerce.boolean().default(true),
  visible: z.coerce.boolean().default(true),
})

export type ToolInput = z.infer<typeof ToolSchema>
```

Key patterns:
- **Numbers from FormData come as strings** → always `z.coerce.number()`.
- **Checkboxes from FormData are missing when unchecked, `'on'` when checked** → `z.coerce.boolean()` handles both correctly when paired with a hidden `<input type="hidden" name={field} value="" />` before the checkbox, or use `z.preprocess((v) => v === 'on' || v === 'true', z.boolean())`.
- **Optional URLs** → `z.string().url().or(z.literal('')).optional()` because HTML inputs return `""` for empty, not `undefined`.
- **String arrays (`Project.services`)** → defer to Phase 2B (not used in 2A entities).

Field-level errors from `parsed.error.format()` are returned in the Server Action result. The page re-renders with errors next to fields:

```tsx
{state?.issues?.name?._errors[0] && <p className="text-red-500">{state.issues.name._errors[0]}</p>}
```

A `<FormField issues={state?.issues}>` helper component centralizes this.

---

## Sidebar navigation

`components/admin/sidebar.tsx`:

```
┌────────────────────────┐
│  Portfolio Admin       │
│  gfxarifdesigner@…     │
├────────────────────────┤
│  ▸ Dashboard            │
│                         │
│  SETTINGS               │
│    Profile              │
│    Hero                 │
│    Stats                │
│    About                │
│    Sections             │
│    Contact              │
│    Collaborate          │
│    Footer               │
│    SEO                  │
│    Theme                │
│                         │
│  CONTENT                │
│    Tools                │
│    Testimonials         │
│    FAQs                 │
│    Client logos         │
│                         │
│  ABOUT                  │
│    Experience           │
│    Education            │
│    Certifications       │
│                         │
│  NAVIGATION             │
│    Nav items            │
│    Social links         │
│                         │
├────────────────────────┤
│  [Log out]              │
└────────────────────────┘
```

Active route highlighted with purple accent (`bg-accent-purple/10` + left border). Sidebar is fixed left, 260px wide on `lg+`, collapses to a hamburger menu on `md` (rare — admin is desktop-only but the public layout might be visited on a phone; still, keep the admin layout responsive enough not to break).

---

## Phase 2A acceptance criteria

1. `npm run build` and `npm run lint` are clean.
2. `npx tsc --noEmit` is clean.
3. `/admin/login` renders an email + password form. Wrong creds → "Invalid credentials". Correct creds → redirected to `/admin` with `admin_session` cookie set.
4. `/admin` renders the dashboard with row-count cards for all entities.
5. The sidebar links work for every admin section.
6. **Tools (sample entity, but the pattern repeats for all 10):**
   - `/admin/tools` lists 8 rows (the seeded count).
   - `/admin/tools/new` creates a row. After save, the table shows 9 rows.
   - Editing a row updates only the changed fields.
   - Uploading a new icon image POSTs to Cloudinary, persists URL + publicId; the asset visibly appears in the Cloudinary dashboard.
   - Replacing an icon deletes the old Cloudinary asset (verifiable via Cloudinary dashboard).
   - Deleting a row removes it from the table and deletes the associated Cloudinary asset.
   - The `visible` toggle persists.
7. **SiteSettings:**
   - `/admin/site-settings` shows index links to 10 sub-pages.
   - Each sub-page form pre-fills with current values, saves only its own fields (verify via Prisma Studio that unchanged fields stay unchanged).
   - The "About" sub-page accepts a textarea (raw HTML) for `aboutIntroContent`; TipTap will replace this in 2B.
8. Log-out clears the cookie and redirects to `/admin/login`. Visiting `/admin/anything` after logout redirects back to login.
9. **No public-site file modified.** Existing public routes (`app/page.tsx`, `app/about/`, `app/blog/`, `app/contact/`, `app/projects/`, `app/tools/`) and `components/sections/*` and `lib/data.ts` stay unchanged. Phase 2A only adds new files under `app/(admin)/admin/*`, `app/(admin-public)/admin/login/`, `actions/`, `lib/db/` (new files only — Phase 1's `lib/db/client.ts` unchanged), `lib/schemas/`, and `components/admin/`. Route groups `(admin)` and `(admin-public)` don't affect URL paths; existing public routes don't need to move.
10. **No deps added outside the Phase 2A allowlist (`zod`).**

---

## Out of scope (defer to Phase 2B / later)

- Project CRUD (sections + gallery + related projects) — needs nested forms and reusable image-uploader grid
- BlogPost CRUD — needs rich text editor
- TipTap rich text editor — replaces the textarea on `about/page.tsx` and lights up Project/Blog content fields
- Drag-to-reorder UI — replaces the numeric `order` input across list pages
- Image library / picker for reusing already-uploaded assets
- Multi-select / bulk operations on list pages
- Audit log of admin changes
- Two-factor auth, password reset, signup, multi-admin

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Next 16 Server Action API differs from training data | Implementation tasks must read `node_modules/next/dist/docs/` for `useActionState`, `revalidatePath`, and Server Action patterns before writing. Spec uses only documented Next 16 APIs (no `unstable_*`). |
| `useActionState` + redirect interplay (redirect inside a Server Action thrown vs returned) | Pattern: list-entity actions `redirect()` on success (Next throws a redirect signal); SiteSettings sub-actions `return null` on success and the page emits a toast. Implementation must test both paths. |
| Checkbox FormData semantics ("on" / absent) | Use `z.preprocess` or a paired hidden input. Documented in the validation section. |
| Cloudinary upload race when user replaces an image and then cancels the form | Acceptable: a replaced-but-uncommitted image stays orphan in Cloudinary. Cost is bounded (free tier, manual cleanup possible). Not worth solving in 2A. |
| User accidentally deletes a row | Delete confirms via modal ("Delete <name>? This cannot be undone."). Plus Cloudinary auto-delete of associated assets — also irreversible. Acceptable for single-admin context; if user wants soft-delete, add later. |
| Layout-level `requireAdmin()` runs on every admin page request | Acceptable: it's a single DB-free JWT verify, microseconds. The cookie is read from `next/headers` once per request anyway. |
| `revalidatePath` doesn't clear Server Component cache when expected | `revalidatePath('/admin/<entity>')` after every mutation, both list and edit pages. Phase 1 doesn't use `unstable_cache` so the surface is small. |

---

## Open questions

None — all decisions captured above:

- Q1: Scope split between 2A (login + 10 simple CRUDs) and 2B (Project + Blog + TipTap + reorder) — settled.
- Q2: Form approach = Next 16 Server Actions + zod (no react-hook-form) — settled.
- Q3: Image upload = full Cloudinary widget in 2A, reusable in 2B — settled.
- Q4: Admin layout = page-per-entity with sidebar nav, route groups for gated/public split — settled.
- Q5: SiteSettings = sub-pages per logical group with per-section Server Actions — settled.
