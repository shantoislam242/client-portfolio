# Portfolio Website — Design Spec

**Author:** Arif Hossain (subject) · brainstormed via Claude Code
**Date:** 2026-05-09
**Status:** Approved, ready for implementation plan

---

## 1. Overview

A pixel-perfect rebuild of a Framer portfolio template (`shantoport.framer.website`) as a production-ready Next.js application, personalised for **Arif Hossain**, a graphic designer based in Dhaka, Bangladesh.

**Goal:** Deliver a maintainable, accessible, performant portfolio site that visually matches the source template while replacing all promotional/template artefacts with real content for the subject.

**Non-goals:**
- No backend, database, or CMS
- No authentication
- No analytics in v1
- No internationalisation (English only)
- No real email delivery (contact form is UI-only with toast)

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| Component primitives | shadcn/ui (Radix-based) |
| Fonts | Outfit, Poppins, Inter — via `next/font/google` |

---

## 3. Architecture

### 3.1 Routing strategy

Multi-page App Router routes with a single shared root layout.

| Route | Page content |
|---|---|
| `/` | Hero, projects (4), tools (full), companies strip, testimonial, blog (4), FAQ, CTA |
| `/projects` | All 6 projects |
| `/tools` | Tools grid |
| `/experience` | Experience timeline |
| `/blog` | All 5 blog posts |
| `/contact` | Contact form |

The floating top nav highlights the active route via `usePathname()`.

### 3.2 Layout strategy

Single root layout (`app/layout.tsx`) containing:
- Sidebar (left)
- Floating nav (top, fixed)
- Main content slot (`{children}`)
- Global FAQ section (rendered after page content on every route)
- Global Collaborate CTA (rendered after FAQ on every route)
- Footer

Rationale: every page in the screenshots shows the same persistent chrome plus FAQ + CTA at the bottom. Putting these in the root layout removes duplication and matches the visual model. The home page does not duplicate FAQ/CTA in its own page content — they come from the layout.

### 3.3 Page transition

Root layout wraps `{children}` in `<AnimatePresence mode="wait">`. Each page's main wrapper uses `motion.main` with `pathname` as `key`, performing a 200 ms fade + small Y offset on route change. Honours `prefers-reduced-motion`.

### 3.4 Project file structure

```
portfolio/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── projects/page.tsx
│   ├── tools/page.tsx
│   ├── experience/page.tsx
│   ├── blog/page.tsx
│   ├── contact/page.tsx
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── floating-nav.tsx
│   │   ├── footer.tsx
│   │   └── page-shell.tsx
│   ├── sections/
│   │   ├── hero.tsx
│   │   ├── projects-grid.tsx
│   │   ├── companies-strip.tsx
│   │   ├── tools-grid.tsx
│   │   ├── experience-list.tsx
│   │   ├── testimonials.tsx
│   │   ├── blog-grid.tsx
│   │   ├── faq.tsx
│   │   ├── collaborate-cta.tsx
│   │   └── contact-form.tsx
│   ├── ui/                      (shadcn primitives)
│   └── motion/
│       ├── fade-in.tsx
│       └── count-up.tsx
├── lib/
│   ├── data.ts
│   └── utils.ts
├── public/                      (assets — provided later)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.5 Component contracts

| Component | Inputs | Responsibility |
|---|---|---|
| `Sidebar` | none (reads `lib/data.ts` profile) | Render persistent profile card. Sticky on desktop, hidden behind drawer on mobile. |
| `FloatingNav` | none (uses `usePathname`) | Render 6-icon pill nav, mark active route. |
| `PageShell` | `children` | Wraps `{children}` (the page-specific content) and appends the global `FAQ` + `CollaborateCTA` after it. Rendered exactly once, inside `app/layout.tsx`. Pages do **not** import this component themselves. |
| `Hero` | none (reads data) | Home-only hero block. |
| `ProjectsGrid` | `limit?: number` | Grid of project cards; home passes `limit={4}`, projects page passes none (shows all). |
| `ToolsGrid` | none | 2-col grid of tool cards. |
| `ExperienceList` | none | Vertical stack of experience cards. |
| `Testimonials` | none | Single quote card with prev/next arrows (static in v1). |
| `BlogGrid` | `limit?: number` | Grid of blog cards; home passes `limit={4}`, blog page shows all 5. |
| `FAQ` | none | Accordion of 5 Q&A items via shadcn Accordion. |
| `CollaborateCTA` | none | Card with heading + body + arrow link to `/contact`. |
| `ContactForm` | none | Name/email/message form, client-side only, toast on submit. |
| `FadeIn` | `delay?`, `children` | `whileInView` wrapper with reduced-motion respect. |
| `CountUp` | `to`, `prefix?`, `suffix?` | Animated number from 0 to target on view. |

### 3.6 Data layer

A single `lib/data.ts` exports typed constants:

```ts
export const profile = { name, role, location, socials: { ... } } as const;
export const stats = [{ value, label }, ...] as const;
export const projects: Project[] = [...];
export const tools: Tool[] = [...];
export const experience: ExperienceEntry[] = [...];
export const blogPosts: BlogPost[] = [...];
export const testimonials: Testimonial[] = [...];
export const faqs: FAQ[] = [...];
```

All section components import from this single file. No prop-drilling of content.

---

## 4. Design Tokens

### 4.1 Colors (CSS variables in `app/globals.css`)

```css
:root {
  --bg-primary: #0A0A0A;
  --bg-card: #161616;
  --bg-card-hover: #1C1C1C;
  --border-subtle: #262626;
  --text-primary: #FFFFFF;
  --text-secondary: #A3A3A3;
  --text-muted: #525252;
  --accent: #8B5CF6;
  --accent-hover: #A78BFA;
  --accent-glow: rgba(139, 92, 246, 0.15);
}
```

Exposed in `tailwind.config.ts` as semantic colors (`bg-primary`, `bg-card`, `text-primary`, `text-secondary`, `text-muted`, `accent`, `border-subtle`).

### 4.2 Typography

| Use | Font | Weight | Tailwind class |
|---|---|---|---|
| H1 hero, profile name | Outfit | 700 | `font-outfit text-5xl md:text-6xl font-bold` |
| Section headings | Outfit | 700 | `font-outfit text-4xl md:text-5xl font-bold` |
| Stat numbers (+10/+85/+40) | Outfit | 100 | `font-outfit text-5xl md:text-6xl font-thin` |
| Body | Poppins | 400 | `font-poppins text-base` |
| Caption / label | Inter | 400 | `font-inter text-xs uppercase tracking-wider` |

Loaded via `next/font/google` with `display: 'swap'`.

### 4.3 Spacing & layout

- Sidebar width: `280px` desktop; below `md` breakpoint, sidebar collapses into a top sheet/drawer.
- Main content max-width: `720px`.
- Gap between sidebar and main column: `~80px` desktop.
- Section vertical padding: `py-16 md:py-24`.
- Card radius: `rounded-2xl` (16 px).
- Sidebar profile card radius: `rounded-3xl` (24 px).
- Outer container max-width: `1280px`, centred with horizontal padding `px-6 md:px-10`.

### 4.4 Accent application

The last word of every major heading is rendered in `var(--accent)`:
- Hero: "**People**"
- Projects: "**Achievements**"
- Tools: "**Results**"
- Experience: "**Expertise**"
- Testimonials: "**Work**"
- Blog: "**Perspectives**"
- FAQ: "**Questions**"
- CTA: "**collaborate**"
- Contact: "**Amazing**"

Implemented with a `<span className="text-accent">` inside the heading.

### 4.5 Responsive breakpoints

Tailwind defaults. Layout shifts:
- `< md` (768 px): sidebar becomes top drawer; nav stays fixed top centre; grids collapse to 1 column.
- `md+`: 2-column grids; sidebar inline left.
- `lg+` (1024 px): full layout as designed.

---

## 5. Animation Inventory

All animations honour `prefers-reduced-motion` (Framer Motion's built-in support).

| Element | Animation | Trigger |
|---|---|---|
| Hero heading | Fade up + slight blur reduction | On mount |
| Stat numbers | 0 → target count-up | `whileInView`, once |
| Section headings | Fade up | `whileInView`, once |
| Project cards | Fade up, staggered 0.05 s | `whileInView`, once |
| Project card hover | Image `scale 1.05`, border glow accent | hover |
| Tool cards | Fade up, staggered | `whileInView`, once |
| Experience cards | Fade up, staggered; arrow rotates `-45°` | `whileInView`, hover |
| Testimonial | Fade in | `whileInView`, once |
| Blog cards | Fade up, staggered | `whileInView`, once |
| FAQ item | Smooth height open/close, chevron rotate 180° | onClick (Radix Accordion) |
| CTA arrow button | Rotate `-45°` + scale 1.1 | hover |
| Buttons | Background lighten, scale 1.02 | hover |
| Floating nav icon | Background fill accent | active route |
| Page transition | Fade + Y offset 10 px | route change |

Reusable primitives:
- `<FadeIn delay?>` — common scroll-into-view wrapper.
- `<CountUp to prefix? suffix?>` — animated counter.

Stagger via parent variant `staggerChildren: 0.05`.

---

## 6. Content Specification

### 6.1 Profile

- **Name:** Arif Hossain
- **Role:** Graphic Designer
- **Location:** Dhaka, Bangladesh
- **Socials:** Behance, Dribbble, Instagram, Mail (each links to `#` placeholder until URLs provided)

### 6.2 Hero

- **Heading:** "Crafting Visual Stories That Move People" (last word accent)
- **Description:** "Passionate about turning ideas into striking visuals — from brand identities to editorial design that resonates and connects."
- **Stats:**
  - +10 — Years of Experience
  - +85 — Projects Completed
  - +40 — Happy Clients
- **CTAs:** `Let's Talk` (solid accent button → `/contact`) · `My Work →` (text link → `/projects`)
- **Companies strip:** "Trusted by brands across South Asia and beyond" + 3 placeholder logos.

### 6.3 Projects (6)

| Title | Subtitle |
|---|---|
| Nokshi | Fashion Brand Identity |
| Aronno | Eco Packaging Design |
| Padma | Editorial Magazine |
| Dhaka Metro | Wayfinding System |
| Shoroth | Typography Poster Series |
| Boithok | Conference Branding |

Card image paths point to `/projects/<slug>.jpg` placeholders. Real assets supplied later; build will not break on missing files (Next.js Image with fallback).

### 6.4 Tools (6)

| Tool | Role |
|---|---|
| Photoshop | Photo Editing |
| Illustrator | Vector Design |
| Figma | UI & Prototyping |
| InDesign | Editorial Layout |
| After Effects | Motion Graphics |
| Procreate | Digital Illustration |

Tool icons: lucide placeholders or SVG glyphs in `public/tools/`.

### 6.5 Experience (4)

Heading: "Over 10 Years of Design Expertise"

1. **Drik Studio** — Senior Brand Designer. *Mar 2022 – Present*
   "Led brand identity projects for fintech and lifestyle clients across South Asia, mentoring junior designers and shaping the studio's visual language."
2. **Pencil & Pixel** — Graphic Designer. *Jan 2019 – Feb 2022*
   "Designed packaging, editorial spreads, and campaign visuals for FMCG and publishing clients."
3. **Bondhu Creative** — Junior Designer. *Aug 2016 – Dec 2018*
   "Built brand collateral, social media visuals, and event identities for early-stage startups."
4. **Studio Lalon** — Design Intern. *May 2015 – Jul 2016*
   "Assisted with print production, illustration support, and pitch decks for cultural and NGO clients."

### 6.6 Testimonial (1)

> "Arif transformed our brand from forgettable to unmistakable. His eye for type and color, paired with deep cultural understanding, gave our identity a soul we never thought possible."
> — **Tahmid R.**, Founder

### 6.7 Blog (5)

Heading: "Design Thoughts and Perspectives"

| Date | Title |
|---|---|
| Apr 8, 2024 | Why Typography Is the Soul of Brand Identity |
| Mar 15, 2024 | Color Theory: Building a Palette That Speaks |
| Feb 28, 2024 | How Bengali Type Is Redefining South Asian Design |
| Jan 12, 2024 | A Designer's Guide to Pricing Your First Client |
| Feb 6, 2024 | Print Is Not Dead: The Comeback of Editorial Design |

Posts are list items only — clicking does not navigate to a detail page in v1 (links to `#`).

### 6.8 FAQ (5)

1. **What design services do you offer?** Brand identity, logo design, editorial layouts, packaging, posters, motion graphics, and illustration.
2. **What is your design process?** Discovery → research → concept sketching → iteration → final delivery with full brand guidelines.
3. **How do you handle project timelines?** Logos: 2–3 weeks. Full brand identities: 4–6 weeks. Editorial projects: depends on scope. Always discussed upfront.
4. **Can you work with existing brand guidelines?** Yes — happy to extend or refresh existing systems while preserving brand equity.
5. **What tools do you use?** Photoshop, Illustrator, InDesign, Figma, After Effects, and Procreate for illustration.

### 6.9 Collaborate CTA

- **Heading:** "Let's collaborate" ("collaborate" accent, on its own line)
- **Body:** "Unlock the potential of your brand with thoughtful, intentional design. Let's collaborate to create visuals that not only meet your goals but tell your story."
- **Arrow button:** circular accent button (top-right of card) → `/contact`

### 6.10 Contact

- **Heading:** "Let's Create Something Amazing"
- **Form fields:** Name (text input, required), Email (email input, required, validated), Message (textarea, 4 rows, required)
- **Submit button:** full-width, solid accent, label "Send"
- **Behaviour:** `onSubmit` → `e.preventDefault()` → show shadcn `toast` "Message sent! (demo)" → reset form. No backend.

### 6.11 Footer

Single line, centred, muted: "Designed & built by Arif Hossain · 2026"

All Framer promotional badges (`Use Template for Free`, `More Templates`, `Made in Framer`) are **removed**.

---

## 7. Accessibility

- All interactive elements reachable via keyboard.
- Focus rings visible (Tailwind `focus-visible:ring-2 ring-accent`).
- Form inputs have associated `<label>` elements.
- Images have meaningful `alt` text from `data.ts`.
- Colour contrast: text-secondary (`#A3A3A3`) on bg-primary (`#0A0A0A`) passes WCAG AA for normal text. text-muted (`#525252`) is reserved for decorative/dimmed text only.
- Respects `prefers-reduced-motion` (no scroll-triggered animation, instant page transitions).
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Skip-to-content link at top of layout.

---

## 8. Testing Strategy

This project is primarily presentational. Testing scope:

- **Type safety:** `tsc --noEmit` in CI.
- **Build:** `next build` must succeed.
- **Lint:** ESLint + Prettier.
- **Manual QA checklist:** every route renders, every link works, contact form submits without errors, animations play once, reduced-motion mode disables animations, mobile drawer opens/closes, FAQ accordion opens/closes.

Unit tests are not in scope for v1 — there is no business logic to test. If logic emerges (data transforms, etc.), Vitest would be added.

---

## 9. Open Questions / Deferred

- **Real assets:** project images, profile portrait, tool icons, company logos — to be provided by user after scaffolding. Build uses `/placeholder.svg` fallbacks until then.
- **Real social URLs:** placeholders use `#` until provided.
- **Blog post detail pages:** out of scope for v1. May be added later as `/blog/[slug]` with MDX.
- **Real testimonial carousel:** v1 shows a single testimonial; carousel logic deferred until more testimonials exist.
- **i18n / Bengali language toggle:** out of scope for v1.

---

## 10. Success Criteria

The implementation is considered complete when:

1. All 6 routes render without console errors or hydration warnings.
2. Visual fidelity matches the source Framer template within reasonable tolerance (allowing for substituted content).
3. Lighthouse scores: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 on a clean build.
4. No TypeScript errors.
5. Mobile (375 px) and desktop (1440 px) breakpoints both render correctly.
6. Contact form, FAQ accordion, and floating nav active state all work as specified.
7. Reduced-motion mode disables all motion.

---

## 11. Out of Scope (explicit non-goals)

- Backend / database / API
- Authentication / user accounts
- CMS integration (Sanity, Contentful, etc.)
- Real email sending
- Analytics
- Internationalisation
- Blog post detail pages
- Project case-study detail pages
- E-commerce / Stripe
- Server Actions / form persistence
- SEO beyond Next.js defaults (`<title>`, `<meta description>`)
