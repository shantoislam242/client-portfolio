# Portfolio Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the public contact form to persist submissions, notify the admin via Resend, and add `sitemap.xml` + `robots.txt`.

**Architecture:** Three loosely-coupled units in one phase: (1) a Server Action that validates, rate-limits, persists, and fires a notification email; (2) a small Resend client + HTML template module; (3) Next.js metadata-route files for sitemap/robots driven by Prisma queries. No DB migration needed — `ContactSubmission` already exists from Phase 1.

**Tech Stack:** Next.js 16 (App Router; `useActionState`; async `headers()`; `MetadataRoute`), React 19, Prisma, zod 3.23, Resend.

**Spec:** `docs/superpowers/specs/2026-05-23-portfolio-phase-4-design.md`

**Branch:** `phase-4-contact-seo` (already created)

---

## ⚠️ Critical context for the implementer

**This is Next.js 16, not the Next you know from training data.** Before writing any code that uses framework APIs, check `node_modules/next/dist/docs/` for the current behavior. Specifically:

- `middleware.ts` is deprecated → this project uses `proxy.ts` instead
- `cookies()` and `headers()` from `next/headers` are **async** — always `await` them
- `params` in dynamic routes is a `Promise` — always `await` it

**Project conventions** (mirror these exactly):
- Server Actions live in `actions/<entity>.ts` at the repo root and start with `"use server";`
- Server Actions use the `(prevState, formData) => Promise<State>` shape paired with `useActionState` on the client
- Public actions (no auth) skip `requireAdmin()`. Only admin actions call it.
- Zod schemas live in `lib/schemas/<entity>.ts` and are imported by both actions and forms when needed
- DB query helpers live in `lib/db/<entity>.ts` and use `cache()` from React for per-request dedup
- Prisma client is imported as `import { prisma } from "@/lib/db/client"`
- After any write, call `revalidatePath("/affected/route")` so server components re-fetch
- The project has **no automated test suite** — verification in each task is manual (curl, browser DevTools, server logs)

**Why no `.test.ts` files in this plan:** consistent with the spec's "Testing Strategy" section and prior phases (2A/2B/2C/3) — verification is end-to-end manual smoke tests. Each task still includes explicit verification steps with expected output.

**Commit style:** small, focused commits per task (`feat(phase-4): ...`, `chore(phase-4): ...`). The commit at the end of each task is the unit of progress.

---

## File Structure Map

| File | Created/Modified | Owner Task | Responsibility |
|------|------------------|------------|----------------|
| `.env.example` | Modified | Task 1 | Document new env vars |
| `package.json` / `package-lock.json` | Modified | Task 1 | Add `resend` dependency |
| `lib/schemas/contact-form.ts` | Created | Task 2 | Zod schema for contact form input |
| `lib/rate-limit.ts` | Created | Task 3 | In-memory IP rate limiter + IP/UA detection |
| `lib/email/resend.ts` | Created | Task 4 | Lazy singleton Resend client |
| `lib/email/templates.ts` | Created | Task 5 | `contactNotification()` returning `{ subject, html, text }` |
| `actions/contact-form.ts` | Created | Task 6 | `submitContactForm` Server Action wiring the above |
| `components/sections/contact-form.tsx` | Modified (rewrite) | Task 7 | `useActionState` + honeypot + field errors + submit button |
| `app/sitemap.ts` | Created | Task 8 | `MetadataRoute.Sitemap` from DB |
| `app/robots.ts` | Created | Task 9 | `MetadataRoute.Robots` |
| (final verification) | — | Task 10 | Production build + smoke test |

Dependencies between tasks: Task 6 imports Tasks 2-5. Task 7 imports Task 6. Tasks 8, 9, 10 are independent of 1-7 (can be done in parallel, but executed sequentially in the plan for simplicity).

---

## Task 1: Add Resend dependency + env vars

**Files:**
- Modify: `package.json` (via `npm install`)
- Modify: `.env.example`
- Optionally update: local `.env` (developer responsibility — not committed)

- [ ] **Step 1: Install Resend**

Run:
```
npm install resend
```

Expected: `package.json` gains `"resend": "^4.x"` (or current stable) under `dependencies`. `package-lock.json` updates accordingly.

- [ ] **Step 2: Verify install**

Run:
```
npm ls resend
```

Expected: prints `resend@<version>` with no `UNMET DEPENDENCY` warning.

- [ ] **Step 3: Update `.env.example`**

Open `.env.example`. Replace the existing Phase 4 placeholder block:

```
# Phase 4 (not required until Phase 4 ships)
# RESEND_API_KEY=
# NOTIFICATION_EMAIL=
```

with:

```
# Resend (transactional email — https://resend.com)
# Get key at https://resend.com/api-keys
RESEND_API_KEY=re_xxx
# Where contact-form submissions are delivered (typically the admin's address).
# When using the default Resend test sender (onboarding@resend.dev), this must
# be the email tied to your Resend account, otherwise sends will fail.
NOTIFICATION_EMAIL=you@example.com

# Public site URL — used by sitemap.xml and robots.txt. Trailing slash optional.
# Falls back to http://localhost:3000 when unset (fine for local dev).
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

- [ ] **Step 4: Tell the user to update their local `.env`**

Print the following message at the end of this task (do NOT commit `.env` itself, which is gitignored):

```
ACTION REQUIRED (you, not the implementer):
1. Add RESEND_API_KEY, NOTIFICATION_EMAIL, and NEXT_PUBLIC_SITE_URL to your local .env
2. Get the Resend key from https://resend.com/api-keys (free tier is enough)
3. NOTIFICATION_EMAIL must match the address tied to your Resend account
   while we're using the onboarding@resend.dev test sender.
```

- [ ] **Step 5: Commit**

Run:
```
git add package.json package-lock.json .env.example
git commit -m "chore(phase-4): add resend dep + document env vars"
```

---

## Task 2: Zod schema for contact form

**Files:**
- Create: `lib/schemas/contact-form.ts`

- [ ] **Step 1: Create the schema file**

Create `lib/schemas/contact-form.ts` with this exact content:

```typescript
import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .max(200, "Email is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(5000, "Message is too long"),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors (silent success).

- [ ] **Step 3: Commit**

Run:
```
git add lib/schemas/contact-form.ts
git commit -m "feat(phase-4): zod schema for contact form input"
```

---

## Task 3: Rate-limit + IP/UA helper

**Files:**
- Create: `lib/rate-limit.ts`

This module holds:
1. An in-memory sliding-window rate limiter keyed by IP.
2. Helpers to read the client IP and User-Agent from incoming request headers.

They live together because every caller needs both, and they're tiny.

- [ ] **Step 1: Create the file**

Create `lib/rate-limit.ts` with this exact content:

```typescript
import { headers } from "next/headers";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;

// Module-level Map persists for the lifetime of the Node.js process.
// Cleared on deploy/restart, which is acceptable for this use case.
const hits = new Map<string, number[]>();

export type RateLimitResult = { allowed: boolean; remaining: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { allowed: true, remaining: MAX_PER_WINDOW - recent.length };
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "unknown";
}

export async function getUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent") ?? null;
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

Run:
```
git add lib/rate-limit.ts
git commit -m "feat(phase-4): in-memory IP rate limiter + IP/UA helpers"
```

---

## Task 4: Resend client singleton

**Files:**
- Create: `lib/email/resend.ts`

The client is lazy so importing this module at build time (CI without secrets) doesn't fail.

- [ ] **Step 1: Create the file**

Create `lib/email/resend.ts` with this exact content:

```typescript
import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not set");
    }
    client = new Resend(key);
  }
  return client;
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors. (If you see `Cannot find module 'resend'`, Task 1 was skipped — go back and install it.)

- [ ] **Step 3: Commit**

Run:
```
git add lib/email/resend.ts
git commit -m "feat(phase-4): lazy singleton Resend client"
```

---

## Task 5: Email notification template

**Files:**
- Create: `lib/email/templates.ts`

Pure function — no I/O, no Resend dependency. Returns `{ subject, html, text }`. Inline-styled HTML so it renders consistently across mail clients without external CSS.

- [ ] **Step 1: Create the file**

Create `lib/email/templates.ts` with this exact content:

```typescript
export type ContactNotificationInput = {
  name: string;
  email: string;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  receivedAt: Date;
};

export type EmailPayload = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function contactNotification(
  input: ContactNotificationInput,
): EmailPayload {
  const { name, email, message, ipAddress, userAgent, receivedAt } = input;

  const subject = `New contact: ${name}`;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);
  const safeIp = ipAddress ? escapeHtml(ipAddress) : "unknown";
  const safeUa = userAgent ? escapeHtml(userAgent) : "unknown";
  const timestamp = receivedAt.toISOString();

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;">
      <h1 style="margin:0 0 16px 0;font-size:18px;font-weight:600;">New contact form submission</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#666;width:80px;">Name</td>
          <td style="padding:8px 0;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#0066ff;text-decoration:none;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;vertical-align:top;">Message</td>
          <td style="padding:8px 0;white-space:pre-wrap;">${safeMessage}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <div style="font-size:12px;color:#999;line-height:1.6;">
        Received: ${escapeHtml(timestamp)}<br>
        IP: ${safeIp}<br>
        User-Agent: ${safeUa}
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `New contact form submission`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Message:`,
    message,
    ``,
    `---`,
    `Received: ${timestamp}`,
    `IP: ${ipAddress ?? "unknown"}`,
    `User-Agent: ${userAgent ?? "unknown"}`,
  ].join("\n");

  return { subject, html, text };
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Spot-check the output**

Run this one-liner to render a sample and eyeball it (does NOT need to be committed):

```
node --input-type=module -e "import('./lib/email/templates.ts').catch(()=>import('./lib/email/templates.js')).then(m => { const r = m.contactNotification({ name: 'Alice', email: 'a@example.com', message: 'Hello\nworld', ipAddress: '1.2.3.4', userAgent: 'curl/8', receivedAt: new Date() }); console.log('SUBJECT:', r.subject); console.log('TEXT:\n' + r.text); })"
```

Expected (text section, exactly):
```
SUBJECT: New contact: Alice
TEXT:
New contact form submission

Name: Alice
Email: a@example.com
Message:
Hello
world

---
Received: <ISO timestamp>
IP: 1.2.3.4
User-Agent: curl/8
```

(If Node can't import TS directly, skip this step — the build in Task 10 covers it.)

- [ ] **Step 4: Commit**

Run:
```
git add lib/email/templates.ts
git commit -m "feat(phase-4): contact-notification email template (HTML + text)"
```

---

## Task 6: `submitContactForm` Server Action

**Files:**
- Create: `actions/contact-form.ts`

Wires Tasks 2–5 together. This is the most complex task in the plan — read all of it before writing code.

- [ ] **Step 1: Create the file**

Create `actions/contact-form.ts` with this exact content:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getSiteSettings } from "@/lib/db/site-settings";
import { contactFormSchema } from "@/lib/schemas/contact-form";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
} from "@/lib/rate-limit";
import { getResend } from "@/lib/email/resend";
import { contactNotification } from "@/lib/email/templates";

export type ContactFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

const FROM_ADDRESS = "Portfolio <onboarding@resend.dev>";

async function sendNotificationEmail(
  parsed: { name: string; email: string; message: string },
  ipAddress: string | null,
  userAgent: string | null,
  receivedAt: Date,
): Promise<void> {
  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) {
    console.warn(
      "[contact-form] NOTIFICATION_EMAIL is not set — skipping email send.",
    );
    return;
  }
  const tpl = contactNotification({
    name: parsed.name,
    email: parsed.email,
    message: parsed.message,
    ipAddress,
    userAgent,
    receivedAt,
  });
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    replyTo: parsed.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const settings = await getSiteSettings();
  const successMessage = settings.contactSuccessMessage;

  // 1. Honeypot — bots fill this field, humans never see it.
  const honeypot = formData.get("_gotcha");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { ok: true, message: successMessage };
  }

  // 2. Validate
  const parsed = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const fieldErrors: ContactFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "message") {
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  // 3. IP + UA
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  // 4. Rate limit
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return {
      ok: false,
      message: "Too many submissions. Please try again later.",
    };
  }

  // 5. DB write (authoritative)
  try {
    await prisma.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        ipAddress: ip === "unknown" ? null : ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[contact-form] DB write failed:", err);
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }

  // 6. Notification (best-effort)
  try {
    await sendNotificationEmail(parsed.data, ip, userAgent, new Date());
  } catch (err) {
    console.error("[contact-form] Notification email failed:", err);
  }

  // 7. Revalidate admin inbox
  revalidatePath("/admin/contact-submissions");

  // 8. Success
  return { ok: true, message: successMessage };
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

Run:
```
git add actions/contact-form.ts
git commit -m "feat(phase-4): submitContactForm Server Action with honeypot, rate limit, save-first, notify"
```

---

## Task 7: Rewire the contact form UI

**Files:**
- Modify: `components/sections/contact-form.tsx` (full rewrite)

The current file is a stub that just toggles a local `submitted` flag. Replace it with a `useActionState`-driven form that posts to `submitContactForm` and renders field errors, top-level errors, and a success message inline.

- [ ] **Step 1: Replace the file**

Open `components/sections/contact-form.tsx` and replace its entire contents with:

```typescript
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import {
  submitContactForm,
  type ContactFormState,
} from "@/actions/contact-form";

type ContactFormProps = {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
};

const initialState: ContactFormState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent hover:bg-accent-hover text-white py-3 h-auto"
    >
      {pending ? "Sending..." : label}
    </Button>
  );
}

export function ContactForm({
  nameLabel,
  emailLabel,
  messageLabel,
  submitLabel,
  successMessage,
}: ContactFormProps) {
  const [state, formAction] = useActionState(submitContactForm, initialState);

  if (state.ok) {
    return (
      <FadeIn>
        <p className="mt-10 font-poppins text-base text-text-secondary">
          {state.message ?? successMessage}
        </p>
      </FadeIn>
    );
  }

  const topError = state.message && !state.ok ? state.message : null;
  const fe = state.fieldErrors ?? {};

  return (
    <FadeIn delay={0.1}>
      <form
        action={formAction}
        className="mt-10 rounded-2xl border border-border-subtle bg-bg-card p-6 md:p-8 space-y-5"
      >
        {/* Honeypot — visible to bots, hidden from humans + screen readers */}
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          aria-hidden="true"
          defaultValue=""
        />

        {topError && (
          <p
            role="alert"
            className="font-poppins text-sm text-red-400"
          >
            {topError}
          </p>
        )}

        <div>
          <label
            htmlFor="contact-name"
            className="block font-poppins text-sm text-text-primary mb-2"
          >
            {nameLabel}
          </label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="Your Name"
            aria-invalid={Boolean(fe.name)}
            aria-describedby={fe.name ? "contact-name-error" : undefined}
            className="bg-bg-card-hover border-border-subtle"
          />
          {fe.name && (
            <p
              id="contact-name-error"
              className="mt-1 font-poppins text-xs text-red-400"
            >
              {fe.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block font-poppins text-sm text-text-primary mb-2"
          >
            {emailLabel}
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="Your@email.com"
            aria-invalid={Boolean(fe.email)}
            aria-describedby={fe.email ? "contact-email-error" : undefined}
            className="bg-bg-card-hover border-border-subtle"
          />
          {fe.email && (
            <p
              id="contact-email-error"
              className="mt-1 font-poppins text-xs text-red-400"
            >
              {fe.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block font-poppins text-sm text-text-primary mb-2"
          >
            {messageLabel}
          </label>
          <Textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            placeholder="Your Message"
            aria-invalid={Boolean(fe.message)}
            aria-describedby={fe.message ? "contact-message-error" : undefined}
            className="bg-bg-card-hover border-border-subtle resize-none"
          />
          {fe.message && (
            <p
              id="contact-message-error"
              className="mt-1 font-poppins text-xs text-red-400"
            >
              {fe.message}
            </p>
          )}
        </div>

        <SubmitButton label={submitLabel} />
      </form>
    </FadeIn>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify lint passes**

Run:
```
npm run lint -- --quiet 2>&1 | tail -20
```

Expected: no errors in `components/sections/contact-form.tsx`. If a curly-quote / unescaped-entity rule fires, fix by replacing literal `'` in JSX text with `&#39;` or the actual variable.

- [ ] **Step 4: Smoke-test in dev browser**

Start dev server (if not already running) and visit `http://localhost:3000/contact`. Without filling fields, click Submit — browser-native required validation should fire (no Server Action call). Fill all three with invalid email (e.g. `notanemail`), submit — page should render an inline error under the email field. Fill all three valid, submit — page should show the success message and the form should disappear.

Expected behavior matches above. If the action throws server-side (check terminal logs), check that all imports resolve and that `prisma.contactSubmission` exists (it should — schema has it).

- [ ] **Step 5: Commit**

Run:
```
git add components/sections/contact-form.tsx
git commit -m "feat(phase-4): wire ContactForm to submitContactForm via useActionState + honeypot"
```

---

## Task 8: Sitemap

**Files:**
- Create: `app/sitemap.ts`

- [ ] **Step 1: Create the file**

Create `app/sitemap.ts` with this exact content:

```typescript
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");
  const now = new Date();

  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
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

`export const dynamic = "force-dynamic"` matches the policy from `app/(site)/layout.tsx` and avoids tripping the single-connection Prisma pool at build time.

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke-test**

With dev server running, hit `/sitemap.xml`:

```
curl -s http://localhost:3000/sitemap.xml | head -40
```

Expected: an XML response starting with `<?xml version="1.0" encoding="UTF-8"?>` and a `<urlset>` containing at minimum entries for `/`, `/about`, `/projects`, `/tools`, `/blog`, `/contact`. If projects/blog posts exist in the seeded DB, those `<url>` entries appear too.

- [ ] **Step 4: Commit**

Run:
```
git add app/sitemap.ts
git commit -m "feat(phase-4): app/sitemap.ts with DB-driven project + blog slugs"
```

---

## Task 9: Robots

**Files:**
- Create: `app/robots.ts`

- [ ] **Step 1: Create the file**

Create `app/robots.ts` with this exact content:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke-test**

With dev server running:

```
curl -s http://localhost:3000/robots.txt
```

Expected (exactly):
```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: http://localhost:3000/sitemap.xml
```

(`Sitemap` line uses `NEXT_PUBLIC_SITE_URL` if set; otherwise the localhost fallback.)

- [ ] **Step 4: Commit**

Run:
```
git add app/robots.ts
git commit -m "feat(phase-4): app/robots.ts disallowing /admin and /api"
```

---

## Task 10: End-to-end smoke test + production build

**Files:** none modified — verification only.

- [ ] **Step 1: Production build**

Run:
```
npm run build
```

Expected: build completes with no type errors, no new lint warnings, and the route table lists `/sitemap.xml` and `/robots.txt`. If a Prisma connection error appears, check that `DATABASE_URL` is set (this build needs DB at request-time, but most routes are `force-dynamic` so build itself shouldn't query).

- [ ] **Step 2: End-to-end contact form test (happy path)**

With dev server running and a valid `RESEND_API_KEY` + `NOTIFICATION_EMAIL` in `.env`:

1. Visit `http://localhost:3000/contact`
2. Fill `Name = Test User`, `Email = <your-own-resend-account-email>`, `Message = Hello from the Phase 4 smoke test.`
3. Click submit
4. Confirm in browser: form replaced by success message
5. Confirm in admin: visit `http://localhost:3000/admin/contact-submissions` — the new submission appears with `ipAddress` populated (e.g. `::1` on localhost) and `userAgent` populated
6. Confirm in inbox: the address in `NOTIFICATION_EMAIL` received an email with subject `New contact: Test User`. Hit Reply — the To: field should auto-populate with the visitor email (Reply-To header working).

Expected: all six steps succeed.

- [ ] **Step 3: Validation test**

Submit the form with `email = notanemail` and short `message = hi`. Expected: inline errors under both fields, no submission saved.

- [ ] **Step 4: Honeypot test**

Open DevTools, set the value of the hidden `<input name="_gotcha">` to `"bot"`, submit a valid form. Expected: success message renders, but the admin inbox row count does NOT increase and no email is sent.

- [ ] **Step 5: Rate-limit test**

Submit six valid forms in succession (within an hour, from the same IP). Expected: 6th submission shows "Too many submissions. Please try again later." and the inbox count increased by exactly 5.

- [ ] **Step 6: Resend failure test**

Comment out `RESEND_API_KEY` in `.env`, restart dev server, submit one valid form. Expected: success message in browser, row in admin inbox, and `[contact-form] Notification email failed:` printed to the dev-server terminal. Restore the key after this test.

- [ ] **Step 7: SEO smoke**

```
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml | head -60
```

Expected: robots.txt as in Task 9 Step 3; sitemap.xml is valid XML with both static pages and published-slug entries.

- [ ] **Step 8: Unpublish-reflects-in-sitemap test**

In the admin, take one published project (or blog post) and toggle it to unpublished. Re-fetch `/sitemap.xml`. Expected: that slug is no longer listed.

- [ ] **Step 9: Mark spec as Implemented**

Open `docs/superpowers/specs/2026-05-23-portfolio-phase-4-design.md` and change the header line:

```
**Status:** Approved (2026-05-23)
```

to:

```
**Status:** Implemented (2026-05-23)
```

Commit:
```
git add docs/superpowers/specs/2026-05-23-portfolio-phase-4-design.md
git commit -m "docs(phase-4): mark spec as Implemented"
```

- [ ] **Step 10: Done**

If all of Steps 1–9 passed, Phase 4 is feature-complete. Hand off to the user for final review before merging into `main`.

---

## Self-Review (the plan author's checklist — already done before handoff)

**Spec coverage:**
- ContactForm Server Action → Task 6
- Honeypot → Task 6 (action) + Task 7 (form)
- Rate limit → Task 3 + Task 6
- IP/UA capture → Task 3 + Task 6
- DB write authoritative + try/catch → Task 6
- Resend send with Reply-To → Task 6
- Failure modes (`RESEND_API_KEY` / `NOTIFICATION_EMAIL` missing) → Task 6
- ContactForm UI rewire with `useActionState`, field errors, top-level error, pending state → Task 7
- Sitemap from DB → Task 8
- Robots disallowing `/admin` and `/api` → Task 9
- Env vars documented → Task 1
- Acceptance criteria verified → Task 10

**Type consistency check:**
- `ContactFormState` defined in Task 6, imported in Task 7 — names match ✓
- `submitContactForm` signature matches the spec ✓
- `contactFormSchema` exported name matches across Tasks 2 and 6 ✓
- `checkRateLimit`, `getClientIp`, `getUserAgent` all exported from `lib/rate-limit.ts` and imported in `actions/contact-form.ts` — names match ✓
- `contactNotification` returns `EmailPayload` with `{subject, html, text}` matching the Resend send call ✓
- `getResend()` return type is `Resend` so `.emails.send(...)` is valid ✓
