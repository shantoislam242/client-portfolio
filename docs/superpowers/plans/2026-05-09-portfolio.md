# Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pixel-perfect, multi-page Next.js portfolio for graphic designer Arif Hossain (Dhaka, Bangladesh), matching the Framer template `shantoport.framer.website` with personalised content.

**Architecture:** Next.js 15 App Router with a single root layout that hosts the persistent sidebar, floating top nav, global FAQ + CollaborateCTA, and footer. Six routes (`/`, `/projects`, `/tools`, `/experience`, `/blog`, `/contact`) render their own main content. All copy lives in `lib/data.ts`. Animations are subtle (fade-in on view, count-up stats, hover, page transitions) via Framer Motion with reduced-motion support.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lucide React · shadcn/ui (Radix) · Sonner (toast)

**Working directory:** `c:\dev work\portfolio` — all relative paths in this plan are relative to this directory unless otherwise stated.

**Source spec:** `docs/superpowers/specs/2026-05-09-portfolio-design.md` — read this first if you have not.

---

## Phase 1 — Scaffold & Foundation

### Task 1: Scaffold Next.js project (preserving docs/)

**Files:**
- Modify: `c:\dev work\portfolio\` (entire directory tree, scaffolded)

- [ ] **Step 1: Move existing docs out of the way**

The `portfolio` folder currently contains only `docs/` (the spec + this plan). `create-next-app` refuses to scaffold into a non-empty directory, so move docs aside first.

Run from `c:/dev work`:

```bash
cd "c:/dev work"
mv portfolio _portfolio_docs_backup
```

Expected: `_portfolio_docs_backup/` exists with `docs/` inside; `portfolio/` no longer exists.

- [ ] **Step 2: Run create-next-app**

```bash
cd "c:/dev work"
npx create-next-app@latest portfolio \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-turbopack
```

Expected: Next.js 15 project created at `c:/dev work/portfolio/` with `package.json`, `app/`, `tailwind.config.ts` (or `postcss.config.mjs` + tailwind v4 setup), `tsconfig.json`, `.gitignore`. A git repo is auto-initialised with one initial commit.

- [ ] **Step 3: Restore docs into the new project**

```bash
cd "c:/dev work"
mv _portfolio_docs_backup/docs portfolio/docs
rmdir _portfolio_docs_backup
```

Expected: `portfolio/docs/superpowers/specs/2026-05-09-portfolio-design.md` and `portfolio/docs/superpowers/plans/2026-05-09-portfolio.md` both exist.

- [ ] **Step 4: Verify dev server boots**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000` in browser. Expected: default Next.js welcome page renders with no console errors. Stop the dev server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
cd "c:/dev work/portfolio"
git add -A
git commit -m "chore: restore docs into scaffolded project"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install dependencies**

```bash
cd "c:/dev work/portfolio"
npm install framer-motion lucide-react clsx tailwind-merge class-variance-authority
```

- [ ] **Step 2: Verify install**

```bash
cd "c:/dev work/portfolio"
npm ls framer-motion lucide-react
```

Expected: both packages listed at non-empty versions, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install framer-motion, lucide-react, and styling utils"
```

---

### Task 3: Initialise shadcn/ui and add components

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/accordion.tsx`, `components/ui/sonner.tsx`

- [ ] **Step 1: Initialise shadcn**

```bash
cd "c:/dev work/portfolio"
npx shadcn@latest init -d
```

When prompted (or if `-d` defaults work): style **default**, base color **neutral**, CSS variables **yes**.

Expected: `components.json` created, `lib/utils.ts` created with `cn()`, `app/globals.css` updated with shadcn base layer.

- [ ] **Step 2: Add the primitives we need**

```bash
cd "c:/dev work/portfolio"
npx shadcn@latest add button input textarea accordion sonner
```

Expected: 5 files added under `components/ui/`. Sonner installs as a dep.

- [ ] **Step 3: Verify**

```bash
cd "c:/dev work/portfolio"
ls components/ui
```

Expected output includes: `accordion.tsx`, `button.tsx`, `input.tsx`, `sonner.tsx`, `textarea.tsx`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn primitives (button, input, textarea, accordion, sonner)"
```

---

### Task 4: Configure fonts (Outfit, Poppins, Inter)

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

Open `app/layout.tsx` and replace its contents with:

```tsx
import type { Metadata } from "next";
import { Outfit, Poppins, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "400", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arif Hossain — Graphic Designer",
  description:
    "Crafting visual stories that move people. Brand identity, editorial, packaging, and motion graphics by Arif Hossain, based in Dhaka, Bangladesh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable} ${inter.variable}`}>
      <body className="font-poppins bg-bg-primary text-text-primary antialiased">
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS (no errors). Token-class names like `bg-bg-primary` will resolve once Task 5 lands.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(layout): wire Outfit, Poppins, Inter fonts and Sonner toaster"
```

---

### Task 5: Apply design tokens (CSS variables + Tailwind theme)

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts` (if Tailwind v3) **OR** `app/globals.css` `@theme` block (if Tailwind v4)

- [ ] **Step 1: Detect Tailwind version**

```bash
cd "c:/dev work/portfolio"
npm ls tailwindcss
```

Note the major version (`3.x.x` or `4.x.x`). Branch on the result:

- **If Tailwind v3:** continue with Step 2a.
- **If Tailwind v4:** skip to Step 2b.

- [ ] **Step 2a (Tailwind v3): Update `tailwind.config.ts`**

Replace contents of `tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "border-subtle": "var(--border-subtle)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      maxWidth: {
        content: "720px",
        shell: "1280px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

If `tailwindcss-animate` is missing (Accordion needs it):

```bash
cd "c:/dev work/portfolio"
npm install -D tailwindcss-animate
```

Then prepend the CSS variables block in Step 3.

- [ ] **Step 2b (Tailwind v4): No tailwind.config.ts theme changes needed**

Tailwind v4 uses CSS-first config. The `@theme` block is added in Step 3.

- [ ] **Step 3: Update `app/globals.css`**

Open `app/globals.css`. Keep any `@import` / `@tailwind` directives shadcn added at the top. **Below them**, replace the existing `:root` and `.dark` blocks (and any default shadcn theme variables) with:

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

  /* shadcn token bridges so primitives blend with our palette */
  --background: 0 0% 4%;
  --foreground: 0 0% 100%;
  --card: 0 0% 9%;
  --card-foreground: 0 0% 100%;
  --popover: 0 0% 9%;
  --popover-foreground: 0 0% 100%;
  --primary: 263 70% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 11%;
  --secondary-foreground: 0 0% 100%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 64%;
  --accent-color: 263 70% 60%;
  --accent-color-foreground: 0 0% 100%;
  --destructive: 0 62.8% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --ring: 263 70% 60%;
  --radius: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Selection */
::selection {
  background-color: var(--accent);
  color: white;
}
```

If on **Tailwind v4**, also add this block (typically near the top of `globals.css`, after `@import "tailwindcss";`):

```css
@theme {
  --color-bg-primary: #0A0A0A;
  --color-bg-card: #161616;
  --color-bg-card-hover: #1C1C1C;
  --color-border-subtle: #262626;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A3A3A3;
  --color-text-muted: #525252;
  --color-accent: #8B5CF6;
  --color-accent-hover: #A78BFA;

  --font-outfit: var(--font-outfit);
  --font-poppins: var(--font-poppins);
  --font-inter: var(--font-inter);

  --max-width-content: 720px;
  --max-width-shell: 1280px;
}
```

- [ ] **Step 4: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000`. Expected: page background is now near-black; default Next.js welcome text renders white. No console errors. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(theme): apply portfolio color tokens, fonts, reduced-motion support"
```

---

### Task 6: Create `lib/data.ts` with all content

**Files:**
- Create: `lib/data.ts`
- Create: `components/icons/behance.tsx` (custom SVG — not in Lucide)

- [ ] **Step 1: Create the Behance icon**

Create `components/icons/behance.tsx`:

```tsx
import type { SVGProps } from "react";

export function BehanceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M7.799 5.698c.589 0 1.12.051 1.606.156.484.103.9.276 1.243.519.343.243.611.564.804.964.197.4.295.892.295 1.479 0 .633-.144 1.162-.432 1.584-.288.422-.713.768-1.276 1.037.768.221 1.339.605 1.717 1.153.378.547.566 1.211.566 1.991 0 .629-.121 1.176-.366 1.642-.245.464-.575.85-.991 1.158-.416.308-.892.535-1.428.681-.536.146-1.082.219-1.638.219H2V5.698h5.799m-.35 4.61c.483 0 .881-.115 1.196-.345.314-.23.471-.602.471-1.117 0-.286-.052-.519-.155-.701-.103-.181-.241-.323-.412-.426-.171-.103-.366-.176-.586-.219-.221-.043-.45-.064-.689-.064H4.43v2.872h3.019m.169 4.829c.265 0 .518-.026.756-.078.239-.052.451-.137.635-.255.184-.118.331-.279.443-.482.111-.203.166-.461.166-.774 0-.612-.173-1.05-.52-1.314-.346-.264-.804-.396-1.376-.396H4.43v3.299h3.188M17.466 14.616c.336.327.819.491 1.451.491.452 0 .841-.114 1.166-.341.325-.227.524-.46.598-.704h2.144c-.343 1.064-.869 1.823-1.578 2.279-.708.456-1.566.684-2.572.684-.696 0-1.328-.111-1.892-.336-.564-.225-1.041-.546-1.434-.964-.394-.418-.696-.917-.909-1.502a5.397 5.397 0 0 1-.319-1.871c0-.671.108-1.293.327-1.866.219-.572.527-1.067.929-1.484.402-.418.881-.747 1.437-.987.557-.24 1.166-.36 1.83-.36.737 0 1.39.143 1.957.428.567.286 1.039.671 1.418 1.156.378.486.652 1.044.821 1.674.169.629.236 1.288.198 1.974h-6.552c0 .67.227 1.27.563 1.598m4.027-4.34c-.244-.279-.661-.439-1.232-.439-.376 0-.692.063-.946.191a1.94 1.94 0 0 0-.621.469c-.157.185-.27.382-.337.591-.067.21-.105.394-.116.553h4.001c-.071-.624-.295-1.085-.539-1.365M16 5.5h5v1.5h-5z" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `lib/data.ts`**

Create `lib/data.ts`:

```ts
import { Dribbble, Instagram, Mail, Home, Folder, Wrench, Briefcase, SquarePen, type LucideIcon } from "lucide-react";
import { BehanceIcon } from "@/components/icons/behance";
import type { ComponentType, SVGProps } from "react";

export type IconComponent = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

export const profile = {
  name: "Arif Hossain",
  role: "Graphic Designer",
  location: "Dhaka, Bangladesh",
  portrait: "/profile.jpg",
  socials: [
    { label: "Behance", href: "#", icon: BehanceIcon },
    { label: "Dribbble", href: "#", icon: Dribbble },
    { label: "Instagram", href: "#", icon: Instagram },
    { label: "Email", href: "mailto:hello@arifhossain.com", icon: Mail },
  ],
} as const;

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/experience", label: "Experience", icon: Briefcase },
  { href: "/blog", label: "Blog", icon: SquarePen },
  { href: "/contact", label: "Contact", icon: Mail },
] as const;

export const hero = {
  headingPrefix: "Crafting Visual Stories That Move",
  headingAccent: "People",
  description:
    "Passionate about turning ideas into striking visuals — from brand identities to editorial design that resonates and connects.",
  primaryCta: { label: "Let's Talk", href: "/contact" },
  secondaryCta: { label: "My Work", href: "/projects" },
} as const;

export const stats = [
  { value: 10, prefix: "+", label: "Years of Experience" },
  { value: 85, prefix: "+", label: "Projects Completed" },
  { value: 40, prefix: "+", label: "Happy Clients" },
] as const;

export const companies = {
  caption: "Trusted by brands across South Asia and beyond",
  logos: ["logoipsum-1", "logoipsum-2", "logoipsum-3"],
} as const;

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
};

export const projects: Project[] = [
  { slug: "nokshi", title: "Nokshi", subtitle: "Fashion Brand Identity", image: "/projects/nokshi.jpg" },
  { slug: "aronno", title: "Aronno", subtitle: "Eco Packaging Design", image: "/projects/aronno.jpg" },
  { slug: "padma", title: "Padma", subtitle: "Editorial Magazine", image: "/projects/padma.jpg" },
  { slug: "dhaka-metro", title: "Dhaka Metro", subtitle: "Wayfinding System", image: "/projects/dhaka-metro.jpg" },
  { slug: "shoroth", title: "Shoroth", subtitle: "Typography Poster Series", image: "/projects/shoroth.jpg" },
  { slug: "boithok", title: "Boithok", subtitle: "Conference Branding", image: "/projects/boithok.jpg" },
];

export type Tool = { name: string; role: string; icon: string };

export const tools: Tool[] = [
  { name: "Photoshop", role: "Photo Editing", icon: "/tools/photoshop.svg" },
  { name: "Illustrator", role: "Vector Design", icon: "/tools/illustrator.svg" },
  { name: "Figma", role: "UI & Prototyping", icon: "/tools/figma.svg" },
  { name: "InDesign", role: "Editorial Layout", icon: "/tools/indesign.svg" },
  { name: "After Effects", role: "Motion Graphics", icon: "/tools/aftereffects.svg" },
  { name: "Procreate", role: "Digital Illustration", icon: "/tools/procreate.svg" },
];

export type ExperienceEntry = {
  company: string;
  role: string;
  description: string;
  period: string;
  href: string;
};

export const experienceHeading = {
  prefix: "Over 10 Years of Design",
  accent: "Expertise",
};

export const experience: ExperienceEntry[] = [
  {
    company: "Drik Studio",
    role: "Senior Brand Designer",
    description:
      "Led brand identity projects for fintech and lifestyle clients across South Asia, mentoring junior designers and shaping the studio's visual language.",
    period: "Mar 2022 — Present",
    href: "#",
  },
  {
    company: "Pencil & Pixel",
    role: "Graphic Designer",
    description:
      "Designed packaging, editorial spreads, and campaign visuals for FMCG and publishing clients.",
    period: "Jan 2019 — Feb 2022",
    href: "#",
  },
  {
    company: "Bondhu Creative",
    role: "Junior Designer",
    description:
      "Built brand collateral, social media visuals, and event identities for early-stage startups.",
    period: "Aug 2016 — Dec 2018",
    href: "#",
  },
  {
    company: "Studio Lalon",
    role: "Design Intern",
    description:
      "Assisted with print production, illustration support, and pitch decks for cultural and NGO clients.",
    period: "May 2015 — Jul 2016",
    href: "#",
  },
];

export type BlogPost = {
  slug: string;
  date: string;
  title: string;
  image: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "typography-soul-of-brand",
    date: "Apr 8, 2024",
    title: "Why Typography Is the Soul of Brand Identity",
    image: "/blog/typography.jpg",
  },
  {
    slug: "color-theory-palette",
    date: "Mar 15, 2024",
    title: "Color Theory: Building a Palette That Speaks",
    image: "/blog/color.jpg",
  },
  {
    slug: "bengali-type-south-asian",
    date: "Feb 28, 2024",
    title: "How Bengali Type Is Redefining South Asian Design",
    image: "/blog/bengali-type.jpg",
  },
  {
    slug: "pricing-first-client",
    date: "Jan 12, 2024",
    title: "A Designer's Guide to Pricing Your First Client",
    image: "/blog/pricing.jpg",
  },
  {
    slug: "print-not-dead",
    date: "Feb 6, 2024",
    title: "Print Is Not Dead: The Comeback of Editorial Design",
    image: "/blog/print.jpg",
  },
];

export type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Tahmid R.",
    role: "Founder",
    avatar: "/testimonials/tahmid.jpg",
    quote:
      "Arif transformed our brand from forgettable to unmistakable. His eye for type and color, paired with deep cultural understanding, gave our identity a soul we never thought possible.",
  },
];

export type FAQ = { question: string; answer: string };

export const faqs: FAQ[] = [
  {
    question: "What design services do you offer?",
    answer:
      "Brand identity, logo design, editorial layouts, packaging, posters, motion graphics, and illustration.",
  },
  {
    question: "What is your design process?",
    answer:
      "Discovery → research → concept sketching → iteration → final delivery with full brand guidelines.",
  },
  {
    question: "How do you handle project timelines?",
    answer:
      "Logos: 2–3 weeks. Full brand identities: 4–6 weeks. Editorial projects: depends on scope. Always discussed upfront.",
  },
  {
    question: "Can you work with existing brand guidelines?",
    answer:
      "Yes — happy to extend or refresh existing systems while preserving brand equity.",
  },
  {
    question: "What tools do you use?",
    answer:
      "Photoshop, Illustrator, InDesign, Figma, After Effects, and Procreate for illustration.",
  },
];

export const collaborateCta = {
  headingLine1: "Let's",
  headingLine2: "collaborate",
  body:
    "Unlock the potential of your brand with thoughtful, intentional design. Let's collaborate to create visuals that not only meet your goals but tell your story.",
  href: "/contact",
};

export const contactPage = {
  headingPrefix: "Let's Create Something",
  headingAccent: "Amazing",
};

export const footer = {
  text: "Designed & built by Arif Hossain · 2026",
};
```

- [ ] **Step 3: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/data.ts components/icons/behance.tsx
git commit -m "feat(content): add typed content data + Behance icon"
```

---

## Phase 2 — Motion Primitives

### Task 7: Create `FadeIn` motion primitive

**Files:**
- Create: `components/motion/fade-in.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  yOffset?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li";
};

export function FadeIn({
  children,
  delay = 0,
  yOffset = 20,
  className,
  as = "div",
}: FadeInProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: yOffset }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/motion/fade-in.tsx
git commit -m "feat(motion): FadeIn primitive with reduced-motion support"
```

---

### Task 8: Create `CountUp` motion primitive

**Files:**
- Create: `components/motion/count-up.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

export function CountUp({ to, prefix = "", suffix = "", duration = 1.4 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/motion/count-up.tsx
git commit -m "feat(motion): CountUp primitive with in-view trigger"
```

---

## Phase 3 — Persistent Layout Chrome

### Task 9: Create `Sidebar` component

**Files:**
- Create: `components/layout/sidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import Link from "next/link";
import { profile } from "@/lib/data";

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-[280px] shrink-0">
      <div className="sticky top-24">
        <div className="rounded-3xl bg-bg-card border border-border-subtle p-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-bg-card-hover">
            <Image
              src={profile.portrait}
              alt={`Portrait of ${profile.name}`}
              fill
              sizes="240px"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-5 text-center">
            <h2 className="font-outfit font-bold text-2xl text-text-primary">
              {profile.name}
            </h2>
            <p className="mt-1 font-poppins text-sm text-text-secondary">
              {profile.role}
            </p>
            <p className="font-poppins text-sm text-text-secondary">
              {profile.location}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            {profile.socials.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-accent hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat(layout): Sidebar with profile card and socials"
```

---

### Task 10: Create `FloatingNav` component

**Files:**
- Create: `components/layout/floating-nav.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/data";
import { cn } from "@/lib/utils";

export function FloatingNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-border-subtle bg-bg-card/80 backdrop-blur-md p-1.5 shadow-lg shadow-black/40"
    >
      <ul className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isActive
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/layout/floating-nav.tsx
git commit -m "feat(layout): FloatingNav with active route highlighting"
```

---

### Task 11: Create `Footer` component

**Files:**
- Create: `components/layout/footer.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { footer } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-24 py-8 text-center">
      <p className="font-poppins text-xs text-text-muted">{footer.text}</p>
    </footer>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/layout/footer.tsx
git commit -m "feat(layout): minimal Footer"
```

---

### Task 12: Create global `FAQ` section

**Files:**
- Create: `components/sections/faq.tsx`

- [ ] **Step 1: Create the component**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function FAQ() {
  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl text-text-primary leading-tight">
          Frequently
          <br />
          Asked <span className="text-accent">Questions</span>
        </h2>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-10">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border-subtle bg-bg-card rounded-xl px-5 data-[state=open]:bg-bg-card-hover"
            >
              <AccordionTrigger className="font-poppins text-base text-text-primary hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-poppins text-sm text-text-secondary pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/faq.tsx
git commit -m "feat(sections): FAQ accordion"
```

---

### Task 13: Create global `CollaborateCTA` section

**Files:**
- Create: `components/sections/collaborate-cta.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collaborateCta } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function CollaborateCTA() {
  return (
    <FadeIn as="section" className="pb-16">
      <div className="relative rounded-2xl border border-border-subtle bg-bg-card p-8 md:p-10">
        <Link
          href={collaborateCta.href}
          aria-label="Go to contact page"
          className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-all hover:bg-accent-hover hover:scale-110 hover:rotate-[-45deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card focus-visible:ring-accent"
        >
          <ArrowUpRight className="h-5 w-5" />
        </Link>

        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {collaborateCta.headingLine1}
        </h2>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-accent">
          {collaborateCta.headingLine2}
        </h2>

        <p className="mt-5 max-w-xl font-poppins text-sm text-text-secondary">
          {collaborateCta.body}
        </p>
      </div>
    </FadeIn>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/collaborate-cta.tsx
git commit -m "feat(sections): CollaborateCTA card"
```

---

### Task 14: Create `PageShell` and integrate root layout

**Files:**
- Create: `components/layout/page-shell.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `PageShell`**

`components/layout/page-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Footer } from "@/components/layout/footer";
import { FAQ } from "@/components/sections/faq";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <FloatingNav />

      <div className="mx-auto max-w-shell px-6 md:px-10 pt-28 md:pt-32">
        <div className="flex gap-10 lg:gap-20">
          <Sidebar />
          <main id="main" className="min-w-0 flex-1 max-w-content">
            {children}
            <FAQ />
            <CollaborateCTA />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Update `app/layout.tsx` to use `PageShell`**

Replace the body in `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Outfit, Poppins, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PageShell } from "@/components/layout/page-shell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "400", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arif Hossain — Graphic Designer",
  description:
    "Crafting visual stories that move people. Brand identity, editorial, packaging, and motion graphics by Arif Hossain, based in Dhaka, Bangladesh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable} ${inter.variable}`}>
      <body className="font-poppins bg-bg-primary text-text-primary antialiased">
        <PageShell>{children}</PageShell>
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Add a placeholder portrait so build doesn't fail**

Create a simple SVG placeholder. From `c:/dev work/portfolio`:

```bash
mkdir -p public public/projects public/blog public/tools public/testimonials
```

Then create `public/profile.jpg` as a small SVG-disguised-as-jpg won't work — use a real placeholder. Easiest: copy any tiny image. For build safety, create `public/profile.svg` and update the data path to `/profile.svg`. **Or** use a remote placeholder for now:

Edit `lib/data.ts` line for `portrait`:

```ts
portrait: "https://placehold.co/480x600/1C1C1C/8B5CF6?text=AH",
```

Add the host to `next.config.ts` (or `next.config.mjs` whichever was generated):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
```

Apply the same `placehold.co` URL pattern to `image` fields in `projects[]`, `blogPosts[]`, `testimonials[]`, and `tools[]` until real assets are provided. Use varied sizes:

- Projects: `https://placehold.co/640x400/1C1C1C/8B5CF6?text=<title>`
- Blog: `https://placehold.co/640x400/1C1C1C/8B5CF6?text=<short>`
- Tools: `https://placehold.co/64x64/FFFFFF/8B5CF6?text=<initial>`
- Testimonials avatar: `https://placehold.co/80x80/1C1C1C/8B5CF6?text=TR`

Update each entry in `lib/data.ts` accordingly.

- [ ] **Step 4: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000`. Expected: floating nav visible at top with all 6 icons (home active), sidebar visible on left with placeholder portrait + "Arif Hossain", FAQ accordion visible, "Let's collaborate" card visible, footer visible. The default Next.js page content shows in the main column. No console errors. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(layout): PageShell with sidebar, nav, global FAQ + CTA, footer"
```

---

## Phase 4 — Section Components

### Task 15: Hero section

**Files:**
- Create: `components/sections/hero.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hero, stats } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { CountUp } from "@/components/motion/count-up";

export function Hero() {
  return (
    <section className="pt-4 pb-16">
      <FadeIn>
        <h1 className="font-outfit font-bold text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {hero.headingPrefix} <span className="text-accent">{hero.headingAccent}</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-5 font-poppins text-base text-text-secondary max-w-xl">
          {hero.description}
        </p>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="mt-10 grid grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-outfit font-thin text-5xl md:text-6xl text-text-primary leading-none">
                <CountUp to={s.value} prefix={s.prefix} />
              </div>
              <div className="mt-3 font-inter text-xs uppercase tracking-wider text-text-secondary">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="mt-10 flex items-center gap-5">
          <Link
            href={hero.primaryCta.href}
            className="rounded-xl bg-accent px-6 py-3 font-poppins text-sm font-medium text-white transition-all hover:bg-accent-hover hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            {hero.primaryCta.label}
          </Link>
          <Link
            href={hero.secondaryCta.href}
            className="group inline-flex items-center gap-2 font-poppins text-sm text-text-primary transition-colors hover:text-accent"
          >
            {hero.secondaryCta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/hero.tsx
git commit -m "feat(sections): Hero with stats counter and CTAs"
```

---

### Task 16: CompaniesStrip section

**Files:**
- Create: `components/sections/companies-strip.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { companies } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function CompaniesStrip() {
  return (
    <FadeIn as="section" className="py-12 border-t border-border-subtle">
      <p className="text-center font-inter text-xs uppercase tracking-wider text-text-secondary">
        {companies.caption}
      </p>
      <div className="mt-6 flex items-center justify-center gap-10 opacity-60">
        {companies.logos.map((slug) => (
          <div
            key={slug}
            className="h-7 w-28 rounded bg-bg-card-hover"
            aria-hidden="true"
          />
        ))}
      </div>
    </FadeIn>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/companies-strip.tsx
git commit -m "feat(sections): CompaniesStrip with placeholder logos"
```

---

### Task 17: ProjectsGrid section

**Files:**
- Create: `components/sections/projects-grid.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import { projects } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

type Props = { limit?: number };

export function ProjectsGrid({ limit }: Props) {
  const items = limit ? projects.slice(0, limit) : projects;

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          Recent Projects
          <br />
          and <span className="text-accent">Achievements</span>
        </h2>
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((p, i) => (
          <FadeIn key={p.slug} delay={i * 0.05}>
            <a
              href="#"
              className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(min-width: 768px) 350px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-outfit font-bold text-xl text-text-primary">
                  {p.title}
                </h3>
                <p className="mt-1 font-poppins text-sm text-text-secondary">
                  {p.subtitle}
                </p>
              </div>
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/projects-grid.tsx
git commit -m "feat(sections): ProjectsGrid with limit prop and hover glow"
```

---

### Task 18: ToolsGrid section

**Files:**
- Create: `components/sections/tools-grid.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import { tools } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function ToolsGrid() {
  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          Top-Tier Tools for
          <br />
          Exceptional <span className="text-accent">Results</span>
        </h2>
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map((t, i) => (
          <FadeIn key={t.name} delay={i * 0.05}>
            <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white overflow-hidden">
                <Image
                  src={t.icon}
                  alt={`${t.name} icon`}
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <div className="font-outfit font-bold text-base text-text-primary">
                  {t.name}
                </div>
                <div className="font-poppins text-xs text-text-secondary">
                  {t.role}
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/tools-grid.tsx
git commit -m "feat(sections): ToolsGrid 2-col layout"
```

---

### Task 19: ExperienceList section

**Files:**
- Create: `components/sections/experience-list.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { experience, experienceHeading } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function ExperienceList() {
  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {experienceHeading.prefix}{" "}
          <span className="text-accent">{experienceHeading.accent}</span>
        </h2>
      </FadeIn>

      <div className="mt-10 space-y-3">
        {experience.map((entry, i) => (
          <FadeIn key={entry.company} delay={i * 0.05}>
            <article className="relative rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:bg-bg-card-hover">
              <Link
                href={entry.href}
                aria-label={`${entry.company} — ${entry.role}`}
                className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-all hover:bg-accent-hover hover:rotate-[-45deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <h3 className="font-outfit font-bold text-xl text-text-primary pr-12">
                {entry.company}
              </h3>
              <p className="mt-2 font-poppins text-sm text-text-secondary max-w-md">
                {entry.description}
              </p>
              <p className="mt-4 font-inter text-xs text-text-muted">
                {entry.period}
              </p>
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/experience-list.tsx
git commit -m "feat(sections): ExperienceList with hover-rotating arrow"
```

---

### Task 20: Testimonials section

**Files:**
- Create: `components/sections/testimonials.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { testimonials } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function Testimonials() {
  const t = testimonials[0];

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          What Clients Say
          <br />
          About My <span className="text-accent">Work</span>
        </h2>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Previous testimonial"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <article className="mt-6 rounded-2xl border border-border-subtle bg-bg-card p-6">
          <header className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-bg-card-hover">
              <Image
                src={t.avatar}
                alt={t.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="font-outfit font-bold text-base text-text-primary">
              {t.name}
            </div>
          </header>
          <blockquote className="mt-4 font-poppins text-sm text-text-secondary">
            {t.quote}
          </blockquote>
        </article>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/testimonials.tsx
git commit -m "feat(sections): Testimonials with single quote and decorative arrows"
```

---

### Task 21: BlogGrid section

**Files:**
- Create: `components/sections/blog-grid.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import { blogPosts } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

type Props = { limit?: number };

export function BlogGrid({ limit }: Props) {
  const items = limit ? blogPosts.slice(0, limit) : blogPosts;

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          Design Thoughts
          <br />
          and <span className="text-accent">Perspectives</span>
        </h2>
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((post, i) => (
          <FadeIn key={post.slug} delay={i * 0.05}>
            <a
              href="#"
              className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(min-width: 768px) 350px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="font-inter text-xs text-text-muted">{post.date}</p>
                <h3 className="mt-2 font-outfit font-bold text-lg text-text-primary leading-snug">
                  {post.title}
                </h3>
              </div>
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/blog-grid.tsx
git commit -m "feat(sections): BlogGrid with limit prop"
```

---

### Task 22: ContactForm section

**Files:**
- Create: `components/sections/contact-form.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { contactPage } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { toast } from "sonner";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! (demo)");
      (e.target as HTMLFormElement).reset();
      setSubmitting(false);
    }, 400);
  }

  return (
    <section className="pt-4 pb-16">
      <FadeIn>
        <h1 className="font-outfit font-bold text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {contactPage.headingPrefix}{" "}
          <span className="text-accent">{contactPage.headingAccent}</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form
          onSubmit={onSubmit}
          className="mt-10 rounded-2xl border border-border-subtle bg-bg-card p-6 md:p-8 space-y-5"
        >
          <div>
            <label
              htmlFor="contact-name"
              className="block font-poppins text-sm text-text-primary mb-2"
            >
              Name
            </label>
            <Input
              id="contact-name"
              name="name"
              type="text"
              required
              placeholder="Your Name"
              className="bg-bg-card-hover border-border-subtle"
            />
          </div>

          <div>
            <label
              htmlFor="contact-email"
              className="block font-poppins text-sm text-text-primary mb-2"
            >
              Email
            </label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              placeholder="Your@email.com"
              className="bg-bg-card-hover border-border-subtle"
            />
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="block font-poppins text-sm text-text-primary mb-2"
            >
              Message
            </label>
            <Textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              placeholder="Your Message"
              className="bg-bg-card-hover border-border-subtle resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent hover:bg-accent-hover text-white"
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </form>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/sections/contact-form.tsx
git commit -m "feat(sections): ContactForm with toast on submit"
```

---

## Phase 5 — Routes

### Task 23: Home page (`/`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { Hero } from "@/components/sections/hero";
import { CompaniesStrip } from "@/components/sections/companies-strip";
import { ProjectsGrid } from "@/components/sections/projects-grid";
import { ToolsGrid } from "@/components/sections/tools-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogGrid } from "@/components/sections/blog-grid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CompaniesStrip />
      <ProjectsGrid limit={4} />
      <ToolsGrid />
      <Testimonials />
      <BlogGrid limit={4} />
    </>
  );
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000`. Expected to render in order: Hero (with stats counting up), companies strip, 4 project cards, tools grid, testimonial, 4 blog cards, then global FAQ + CollaborateCTA from layout. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(routes): home page composition"
```

---

### Task 24: Projects page (`/projects`)

**Files:**
- Create: `app/projects/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ProjectsGrid } from "@/components/sections/projects-grid";

export const metadata = {
  title: "Projects — Arif Hossain",
};

export default function ProjectsPage() {
  return <ProjectsGrid />;
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000/projects`. Expected: all 6 project cards render. Folder icon in nav is highlighted purple. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/projects/page.tsx
git commit -m "feat(routes): /projects page (all 6)"
```

---

### Task 25: Tools page (`/tools`)

**Files:**
- Create: `app/tools/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ToolsGrid } from "@/components/sections/tools-grid";

export const metadata = {
  title: "Tools — Arif Hossain",
};

export default function ToolsPage() {
  return <ToolsGrid />;
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000/tools`. Expected: tools grid renders with all 6 tools. Wrench icon active. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/tools/page.tsx
git commit -m "feat(routes): /tools page"
```

---

### Task 26: Experience page (`/experience`)

**Files:**
- Create: `app/experience/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ExperienceList } from "@/components/sections/experience-list";

export const metadata = {
  title: "Experience — Arif Hossain",
};

export default function ExperiencePage() {
  return <ExperienceList />;
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000/experience`. Expected: all 4 experience cards. Briefcase icon active. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/experience/page.tsx
git commit -m "feat(routes): /experience page"
```

---

### Task 27: Blog page (`/blog`)

**Files:**
- Create: `app/blog/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { BlogGrid } from "@/components/sections/blog-grid";

export const metadata = {
  title: "Blog — Arif Hossain",
};

export default function BlogPage() {
  return <BlogGrid />;
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000/blog`. Expected: all 5 blog cards. SquarePen icon active. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/blog/page.tsx
git commit -m "feat(routes): /blog page"
```

---

### Task 28: Contact page (`/contact`)

**Files:**
- Create: `app/contact/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ContactForm } from "@/components/sections/contact-form";

export const metadata = {
  title: "Contact — Arif Hossain",
};

export default function ContactPage() {
  return <ContactForm />;
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000/contact`. Expected: heading "Let's Create Something Amazing" with last word purple, then form with Name/Email/Message + Send button. Mail icon active. Submit shows "Message sent! (demo)" toast and resets form. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/contact/page.tsx
git commit -m "feat(routes): /contact page"
```

---

### Task 29: 404 page

**Files:**
- Create: `app/not-found.tsx`

- [ ] **Step 1: Create the page**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="font-outfit font-bold text-5xl md:text-6xl text-text-primary">
        Page <span className="text-accent">Not Found</span>
      </h1>
      <p className="mt-4 font-poppins text-text-secondary">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-accent px-6 py-3 font-poppins text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to Home
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Open `http://localhost:3000/this-route-does-not-exist`. Expected: 404 page renders inside the layout chrome (sidebar + nav still visible). Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat(routes): 404 page"
```

---

## Phase 6 — Polish

### Task 30: Page transitions via `AnimatePresence`

**Files:**
- Create: `components/motion/page-transition.tsx`
- Modify: `components/layout/page-shell.tsx`

- [ ] **Step 1: Create the wrapper**

`components/motion/page-transition.tsx`:

```tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 1 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Integrate into `PageShell`**

Edit `components/layout/page-shell.tsx`. Wrap `{children}` only (FAQ + CTA must stay outside, otherwise they re-mount on every navigation):

```tsx
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Footer } from "@/components/layout/footer";
import { FAQ } from "@/components/sections/faq";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";
import { PageTransition } from "@/components/motion/page-transition";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <FloatingNav />

      <div className="mx-auto max-w-shell px-6 md:px-10 pt-28 md:pt-32">
        <div className="flex gap-10 lg:gap-20">
          <Sidebar />
          <main id="main" className="min-w-0 flex-1 max-w-content">
            <PageTransition>{children}</PageTransition>
            <FAQ />
            <CollaborateCTA />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Smoke test**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

Click between nav icons. Expected: smooth fade between page-specific content; FAQ + CTA at the bottom do not re-animate. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(motion): page-transition wrapper around route children"
```

---

### Task 31: Mobile drawer for sidebar

**Files:**
- Create: `components/layout/mobile-profile.tsx`
- Modify: `components/layout/page-shell.tsx`

- [ ] **Step 1: Create the mobile profile bar**

`components/layout/mobile-profile.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "@/lib/data";
import { cn } from "@/lib/utils";

export function MobileProfile() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-6 rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-bg-card-hover">
          <Image
            src={profile.portrait}
            alt={profile.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="font-outfit font-bold text-base text-text-primary">
            {profile.name}
          </div>
          <div className="font-poppins text-xs text-text-secondary">
            {profile.role} · {profile.location}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-secondary transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-4 px-4 pb-4">
              {profile.socials.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-text-secondary hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Insert into `PageShell`**

Edit `components/layout/page-shell.tsx`, importing and rendering `MobileProfile` above the page transition:

```tsx
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Footer } from "@/components/layout/footer";
import { FAQ } from "@/components/sections/faq";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";
import { PageTransition } from "@/components/motion/page-transition";
import { MobileProfile } from "@/components/layout/mobile-profile";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <FloatingNav />

      <div className="mx-auto max-w-shell px-6 md:px-10 pt-28 md:pt-32">
        <div className="flex gap-10 lg:gap-20">
          <Sidebar />
          <main id="main" className="min-w-0 flex-1 max-w-content">
            <MobileProfile />
            <PageTransition>{children}</PageTransition>
            <FAQ />
            <CollaborateCTA />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Smoke test on mobile width**

```bash
cd "c:/dev work/portfolio"
npm run dev
```

In browser DevTools, set viewport to 375 px width. Expected: sidebar disappears, mobile profile bar appears at top of main column with chevron toggle. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(layout): mobile profile drawer for sub-lg viewports"
```

---

### Task 32: Production build verification

**Files:**
- None (verification only)

- [ ] **Step 1: Lint**

```bash
cd "c:/dev work/portfolio"
npm run lint
```

Expected: no errors. Fix any reported issue inline (most often unused imports).

- [ ] **Step 2: Type-check**

```bash
cd "c:/dev work/portfolio"
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Production build**

```bash
cd "c:/dev work/portfolio"
npm run build
```

Expected: build succeeds, all 6 routes prerender as static (▲ static), bundle sizes reasonable, no warnings about missing images (placeholder URLs are external, that's fine).

- [ ] **Step 4: Production preview**

```bash
cd "c:/dev work/portfolio"
npm start
```

Visit each route and verify:

- `/` — hero stats count up; nav home active; full home composition
- `/projects` — 6 project cards; folder active
- `/tools` — 6 tools; wrench active
- `/experience` — 4 entries; briefcase active
- `/blog` — 5 posts; square-pen active
- `/contact` — form, submit shows toast; mail active
- `/this-does-not-exist` — 404 inside chrome
- Resize to 375 px — mobile profile drawer toggles; floating nav stays centred; grids stack
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` — animations disabled, page transitions still work without motion

Stop the production server.

- [ ] **Step 5: Commit any cleanup, tag the milestone**

```bash
cd "c:/dev work/portfolio"
git add -A
git diff --cached --quiet || git commit -m "chore: post-build cleanup"
git tag v1.0.0-mvp
```

---

## Self-Review (executed before this plan was committed)

**Spec coverage check** — every numbered spec section maps to one or more tasks:

| Spec § | Tasks |
|---|---|
| §2 Tech stack | 1, 2, 3 |
| §3.1 Routing | 23, 24, 25, 26, 27, 28 |
| §3.2 Layout strategy | 14, 30 |
| §3.3 Page transition | 30 |
| §3.4 File structure | 1 (scaffold), all subsequent component tasks |
| §3.5 Component contracts | 7–22, 30, 31 |
| §3.6 Data layer | 6 |
| §4.1 Colors | 5 |
| §4.2 Typography | 4, 5 |
| §4.3 Spacing & layout | 5 (max-widths, gaps), 14 (shell) |
| §4.4 Accent application | 12, 13, 15, 17, 18, 19, 20, 21, 22, 29 (each heading) |
| §4.5 Responsive breakpoints | 9 (`hidden lg:block`), 31 (mobile drawer) |
| §5 Animations | 7, 8, 13, 15, 17, 19, 30 |
| §6 Content | 6, plus rendering in 9, 12–22 |
| §7 Accessibility | 9 (alt, focus rings), 10 (aria-current), 12 (Radix Accordion handles a11y), 14 (skip link), 22 (labels) |
| §8 Testing strategy | 4, 5, every component task (`tsc --noEmit`), 32 (full build + manual checks) |
| §9 Open questions | placeholder image strategy in 14 step 3 |
| §10 Success criteria | 32 |
| §11 Out of scope | not built (correctly omitted) |

**Placeholder scan:** No "TBD", "implement later", or vague directives. Every code step contains the full code.

**Type consistency:** Component names and prop signatures consistent across tasks (`ProjectsGrid`/`BlogGrid` use `limit?: number` everywhere; `PageShell` accepts `children` only; `FadeIn` takes `delay`/`yOffset`/`className`/`as`/`children` consistently). Data exports in Task 6 (`profile`, `navItems`, `hero`, `stats`, `companies`, `projects`, `tools`, `experience`, `experienceHeading`, `blogPosts`, `testimonials`, `faqs`, `collaborateCta`, `contactPage`, `footer`) are imported by exactly the names used in Tasks 9–22.
