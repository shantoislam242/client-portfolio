# Portfolio Phase 4 — Contact Form Submission, Email Notification, SEO

**Status:** Implemented (2026-05-23)
**Branch:** `phase-4-contact-seo`

## Goal

Ship the final three pieces of the portfolio backend buildout:

1. Wire the public contact form to actually persist submissions and notify the admin.
2. Send admin a transactional notification email per submission via Resend.
3. Add `sitemap.xml` and `robots.txt` so search engines can discover and properly index the public site.

After Phase 4 the site is production-ready end-to-end: visitors can reach out, the admin sees inquiries in both inbox + email, and search engines can crawl the published catalog.

## Non-Goals

- React Email templates / branded HTML emails (simple inline-style HTML string is enough)
- Visitor auto-reply email
- Custom verified Resend domain (test sender `onboarding@resend.dev` for now; switch later via env)
- Distributed / Redis-backed rate limiting (single Next.js process is sufficient for portfolio traffic)
- Cloudflare Turnstile / hCaptcha (honeypot + rate limit catches the spam volume a personal portfolio gets)
- OpenGraph image generation (out of scope; existing per-page metadata sufficient)
- Web App Manifest, PWA, structured data — possible future phase

## Architecture

Three loosely-coupled units, each implementable and testable independently:

| Unit | Responsibility | Surface |
|------|---------------|---------|
| **Contact submission Server Action** | Validate input, rate-limit, persist to `ContactSubmission`, fire notification | `actions/contact-form.ts`, `lib/schemas/contact-form.ts`, `lib/rate-limit.ts` |
| **Email notification** | Format and send admin email via Resend | `lib/email/resend.ts`, `lib/email/templates.ts` |
| **SEO endpoints** | Generate `sitemap.xml` + `robots.txt` from DB | `app/sitemap.ts`, `app/robots.ts` |

The contact form UI (`components/sections/contact-form.tsx`) is also rewired from its current stub state to `useActionState` + real Server Action.

No schema migration is required — `ContactSubmission` model already exists from Phase 1.

## Detailed Design

### Contact Form Submission

**Server Action signature** (`actions/contact-form.ts`):

```typescript
export type ContactFormState = {
  ok: boolean;
  message?: string;                                  // success or generic error message
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState>;
```

**Execution order** (must follow exactly):

1. **Honeypot check** — read `formData.get("_gotcha")`. If non-empty, return `{ ok: true, message: successMessage }` **without** touching DB or Resend. Bots see the same success state as humans.
2. **Validate** with zod (`contactFormSchema` — see below). On failure, return `{ ok: false, fieldErrors }`.
3. **Read IP** from incoming request headers (see "IP detection" below).
4. **Rate-limit check** via `checkRateLimit(ip)`. On block, return `{ ok: false, message: "Too many submissions. Please try again later." }`.
5. **DB write** — wrap `prisma.contactSubmission.create({ data: { name, email, message, ipAddress, userAgent } })` in `try/catch`. On failure, `console.error` and return `{ ok: false, message: "Something went wrong. Please try again." }`. On success, the submission is authoritative — anything after this can fail without losing the lead.
6. **Notification** — wrap in a separate `try/catch`. On Resend failure, `console.error` the error but do not surface it to the user.
7. **Revalidate** `/admin/contact-submissions` so the inbox count updates.
8. Return `{ ok: true, message: successMessage }`.

**Success message source:** the action looks it up via `getSiteSettings()` so the form component does not need to forward `contactSuccessMessage` into the action. (`getSiteSettings` is already React-cached per request.)

**Zod schema** (`lib/schemas/contact-form.ts`):

```typescript
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email").max(200),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000, "Message is too long"),
});
```

### Rate Limiting

**File:** `lib/rate-limit.ts`

In-memory sliding-window counter, keyed by IP. One module-level `Map<string, number[]>` holding submission timestamps.

```typescript
const WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return { allowed: false, remaining: 0 };
  recent.push(now);
  hits.set(ip, recent);
  return { allowed: true, remaining: MAX_PER_WINDOW - recent.length };
}
```

**Constraints accepted:**
- Lives in the Next.js process memory only. Process restart (deploy) clears the counter. Acceptable for portfolio.
- A horizontally-scaled deploy (multiple instances) would let a spammer get `MAX × instances` through. Out of scope; if it becomes a problem we switch to Vercel KV / Upstash.
- "unknown" IP (when headers are missing) gets its own bucket — all anonymous traffic shares it. That's intentional: it caps abuse from upstream proxies that strip IPs.

### IP Detection

Helper in `lib/rate-limit.ts` (or co-located in the action):

```typescript
export async function getClientIp(): Promise<string> {
  const h = await headers();                                 // next/headers, async in Next 16
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
```

User-Agent captured the same way: `h.get("user-agent") ?? null`.

### Email Notification

**`lib/email/resend.ts`** — lazy singleton:

```typescript
import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(key);
  }
  return client;
}
```

Lazy so importing this module at build time doesn't fail when `RESEND_API_KEY` is unset (e.g. during `next build` in CI without secrets).

**`lib/email/templates.ts`** — pure functions returning `{ subject, html, text }`:

```typescript
export function contactNotification(input: {
  name: string;
  email: string;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  receivedAt: Date;
}): { subject: string; html: string; text: string };
```

**HTML structure** (inline styles only, ~200 lines max):
- Header: "New contact form submission"
- Field rows: Name, Email (as `mailto:` link), Message (preserve newlines via `<br>` or `white-space: pre-wrap`)
- Footer (smaller, muted): timestamp, IP, User-Agent — for spam triage
- Plain-text fallback covers the same fields

**Send call** (inside `submitContactForm`):

```typescript
await getResend().emails.send({
  from: "Portfolio <onboarding@resend.dev>",
  to: process.env.NOTIFICATION_EMAIL!,
  replyTo: input.email,                                       // admin can just hit Reply
  subject: tpl.subject,
  html: tpl.html,
  text: tpl.text,
});
```

If `NOTIFICATION_EMAIL` is unset, log a warning and skip the send (don't crash). Submission is still saved.

### Contact Form UI

**File:** `components/sections/contact-form.tsx` — rewrite from stub:

- Drop local `useState` for `submitted`
- Add `useActionState(submitContactForm, { ok: false } as ContactFormState)`
- Render success message inline when `state.ok` is true
- Show field errors next to each input when `state.fieldErrors?.<field>` is set
- Show top-level `state.message` (e.g. rate-limit error) above the form when present and `!state.ok`
- Add honeypot input: `<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />`
- Submit button uses a small `<SubmitButton>` wrapper that reads `useFormStatus().pending` to disable itself and show "Sending..." while the action is in flight

The existing prop interface (`nameLabel`, `emailLabel`, etc.) stays unchanged. The contact page (`app/(site)/contact/page.tsx`) needs no change.

### Sitemap

**File:** `app/sitemap.ts`

```typescript
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const [projects, posts] = await Promise.all([
    prisma.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/tools`,    lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
```

Served at `/sitemap.xml`. Dynamic on every request (consistent with the `(site)` layout's `force-dynamic` policy).

### Robots

**File:** `app/robots.ts`

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

Served at `/robots.txt`.

### Environment Variables

`.env.example` updates:

```diff
-# Phase 4 (not required until Phase 4 ships)
-# RESEND_API_KEY=
-# NOTIFICATION_EMAIL=
+# Resend (transactional email — https://resend.com)
+RESEND_API_KEY=re_xxx
+NOTIFICATION_EMAIL=you@example.com
+
+# Public site URL (used by sitemap + robots; trailing slash optional)
+NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

All three have sensible runtime behavior when missing:
- `RESEND_API_KEY` unset → email send throws inside try/catch, submission still saved
- `NOTIFICATION_EMAIL` unset → email skipped with console warning, submission still saved
- `NEXT_PUBLIC_SITE_URL` unset → falls back to `http://localhost:3000` (dev works out of the box)

### Dependency Changes

Add: `resend` (latest stable)

No other deps. Zod is already in the project. No react-email, no rate-limit library.

## Data Flow

Contact submission happy path:

```
[Visitor fills form] → useActionState invokes submitContactForm(formData)
  → honeypot empty ✓
  → zod parse ✓
  → headers() → ip + userAgent
  → checkRateLimit(ip) ✓
  → prisma.contactSubmission.create  ←  AUTHORITATIVE WRITE
  → try { resend.emails.send(...) } catch { console.error }
  → revalidatePath("/admin/contact-submissions")
  → return { ok: true, message: successMessage }
[Form renders inline success message; admin inbox updated]
[Admin receives email with Reply-To set to visitor's email]
```

Sitemap request:

```
GET /sitemap.xml
  → app/sitemap.ts default()
  → parallel prisma queries (projects + posts where published)
  → return Sitemap[]
  → Next.js serializes to XML
```

## Error Handling Summary

| Failure | User sees | Admin sees |
|---------|-----------|-----------|
| Honeypot filled | Success message (silent) | Nothing logged (avoid filling logs with bot noise) |
| Validation fail | Field-level errors | Nothing logged |
| Rate limit hit | "Too many submissions, try again later" | Nothing logged |
| DB write fails | "Something went wrong. Please try again." (inline form-level error) | `console.error` of the Prisma error; action returns `{ ok: false }` cleanly (no error boundary) |
| Resend fails | Success message | DB has submission + console.error of Resend failure |
| `RESEND_API_KEY` missing | Success message | DB has submission + console.error |
| `NOTIFICATION_EMAIL` missing | Success message | DB has submission + console.warn (one-time per process is fine) |

## Testing Strategy

Manual end-to-end testing (consistent with prior phases — this project has no automated test suite):

**Contact submission:**
1. Submit valid form → success message, DB row created, email received
2. Submit with invalid email → field error rendered
3. Submit empty message → field error rendered  
4. Submit 6 times in rapid succession → 6th submission shows rate-limit error
5. Fill honeypot via DevTools → success message but no DB row, no email
6. Stop Resend service (unset key) → success message + DB row + console error

**SEO:**
1. `curl http://localhost:3000/robots.txt` → valid robots.txt with disallow `/admin`, `/api` + sitemap URL
2. `curl http://localhost:3000/sitemap.xml` → valid XML containing all static pages + all published project/blog slugs
3. Unpublish a project → refresh sitemap → that slug no longer present
4. Build verifies no type errors

**Admin inbox:**
1. New submission appears in admin inbox
2. Unread count updates after `revalidatePath`

## Open Questions / Risks

- **Production deployment platform unknown** — `NEXT_PUBLIC_SITE_URL` must be set wherever the site deploys. Documentation in `.env.example` is enough.
- **Resend test sender deliverability** — emails from `onboarding@resend.dev` only deliver to the address tied to the Resend account. Once a verified domain is added (future), only the `from` value changes; the rest of the wiring is the same.
- **In-memory rate limit** — accepted constraint, see "Rate Limiting" above. Revisit if the site scales horizontally or sees serious targeted spam.
- **`NEXT_PUBLIC_SITE_URL` is public** — it ships to the client bundle (Next requires the `NEXT_PUBLIC_` prefix for that). That's fine; it's not a secret.

## Acceptance Criteria

- [ ] Submitting the public contact form persists a row to `ContactSubmission` with `ipAddress` and `userAgent` populated
- [ ] Admin receives a Resend email per submission, with Reply-To set to the visitor's email
- [ ] Validation errors render inline next to each field
- [ ] Honeypot submissions silently return success without creating a DB row or sending email
- [ ] 6th submission from the same IP within an hour shows a rate-limit error
- [ ] If Resend fails or its env vars are missing, the submission still saves and the user still sees success
- [ ] `/robots.txt` returns the configured rules with `Disallow: /admin` and `Disallow: /api`, plus the sitemap URL
- [ ] `/sitemap.xml` returns all static public pages plus every `published: true` project and blog post
- [ ] `npm run build` passes with no type errors or new lint warnings
- [ ] Admin inbox unread count updates after a new submission (via `revalidatePath`)
