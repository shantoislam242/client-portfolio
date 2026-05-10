import {
  Mail,
  Home,
  Folder,
  Wrench,
  Briefcase,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import { BehanceIcon } from "@/components/icons/behance";
import { DribbbleIcon } from "@/components/icons/dribbble";
import { InstagramIcon } from "@/components/icons/instagram";
import type { ComponentType, SVGProps } from "react";

export type IconComponent =
  | LucideIcon
  | ComponentType<SVGProps<SVGSVGElement>>;

export const profile = {
  name: "Arif Hossain",
  role: "Graphic Designer",
  location: "Dhaka, Bangladesh",
  portrait: "https://placehold.co/480x600/1c1c1c/8b5cf6?text=AH",
  socials: [
    { label: "Behance", href: "#", icon: BehanceIcon },
    { label: "Dribbble", href: "#", icon: DribbbleIcon },
    { label: "Instagram", href: "#", icon: InstagramIcon },
    { label: "Email", href: "mailto:hello@arifhossain.com", icon: Mail },
  ],
} as const;

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Briefcase },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/tools", label: "Tools", icon: Wrench },
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
  {
    slug: "nokshi",
    title: "Nokshi",
    subtitle: "Fashion Brand Identity",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Nokshi",
  },
  {
    slug: "aronno",
    title: "Aronno",
    subtitle: "Eco Packaging Design",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Aronno",
  },
  {
    slug: "padma",
    title: "Padma",
    subtitle: "Editorial Magazine",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Padma",
  },
  {
    slug: "dhaka-metro",
    title: "Dhaka Metro",
    subtitle: "Wayfinding System",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Dhaka+Metro",
  },
  {
    slug: "shoroth",
    title: "Shoroth",
    subtitle: "Typography Poster Series",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Shoroth",
  },
  {
    slug: "boithok",
    title: "Boithok",
    subtitle: "Conference Branding",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Boithok",
  },
];

export type Tool = { name: string; role: string; icon: string };

export const tools: Tool[] = [
  {
    name: "Photoshop",
    role: "Photo Editing",
    icon: "https://placehold.co/64x64/ffffff/8b5cf6?text=Ps",
  },
  {
    name: "Illustrator",
    role: "Vector Design",
    icon: "https://placehold.co/64x64/ffffff/8b5cf6?text=Ai",
  },
  {
    name: "Figma",
    role: "UI & Prototyping",
    icon: "https://placehold.co/64x64/ffffff/8b5cf6?text=Fg",
  },
  {
    name: "InDesign",
    role: "Editorial Layout",
    icon: "https://placehold.co/64x64/ffffff/8b5cf6?text=Id",
  },
  {
    name: "After Effects",
    role: "Motion Graphics",
    icon: "https://placehold.co/64x64/ffffff/8b5cf6?text=Ae",
  },
  {
    name: "Procreate",
    role: "Digital Illustration",
    icon: "https://placehold.co/64x64/ffffff/8b5cf6?text=Pr",
  },
];

export type ExperienceEntry = {
  company: string;
  role: string;
  description: string;
  period: string;
  href: string;
};

export const aboutIntro = {
  headingPrefix: "A bit About",
  headingAccent: "Me",
  paragraphs: [
    "I'm Arif — a graphic designer based in Dhaka, Bangladesh, with over a decade of experience helping brands across South Asia find their visual voice.",
    "From editorial spreads to full brand systems, my work is shaped by thoughtful typography, considered color, and a deep curiosity about how design carries cultural meaning. I believe great design is quiet about itself but loud about what it represents.",
  ],
};

export const experienceHeading = {
  prefix: "Over 10 Years of Design",
  accent: "Expertise",
};

export const educationHeading = {
  prefix: "Academic",
  accent: "Background",
};

export type EducationEntry = {
  institution: string;
  degree: string;
  description: string;
  period: string;
  href: string;
};

export const education: EducationEntry[] = [
  {
    institution: "University of Dhaka",
    degree: "Bachelor of Fine Arts — Graphic Design",
    description:
      "Specialised in typography, identity systems, and editorial design. Final thesis explored Bengali type in modern brand systems and won the departmental design award.",
    period: "Jul 2011 — Jun 2015",
    href: "#",
  },
  {
    institution: "Pathshala South Asian Media Institute",
    degree: "Workshop — Editorial & Visual Communication",
    description:
      "Six-week intensive on long-form editorial design, photo editing, and grid systems for print media. Mentored by senior editors of regional publications.",
    period: "Jun 2016 — Jul 2016",
    href: "#",
  },
  {
    institution: "Notre Dame College, Dhaka",
    degree: "Higher Secondary Certificate — Science",
    description:
      "Foundation in science with self-directed study in visual arts and digital illustration. Active member of the college creative arts club, leading event branding for cultural fests.",
    period: "Jul 2009 — Jun 2011",
    href: "#",
  },
];

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

export type BlogBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string };

export type BlogPost = {
  slug: string;
  date: string;
  title: string;
  image: string;
  excerpt: string;
  content: BlogBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "typography-soul-of-brand",
    date: "Apr 8, 2024",
    title: "Why Typography Is the Soul of Brand Identity",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Typography",
    excerpt:
      "Long before a logo registers as a shape, the typeface has already begun whispering. Here is why I spend the first week of every brand project just looking at letterforms.",
    content: [
      {
        kind: "p",
        text: "Type is the most overlooked yet most powerful tool in a brand designer's kit. Long before a logo registers as a shape, the typeface has already begun whispering — confident or hesitant, warm or austere, classical or radical. After a decade of building identities for studios from Dhaka to Dubai, I've come to believe that most of a brand's emotional signal is carried by typography alone.",
      },
      { kind: "h2", text: "The voice before the voice" },
      {
        kind: "p",
        text: "When a customer encounters your brand for the first time, they don't read the manifesto on your About page. They read your menu, your invoice, your packaging. The typeface you use in those moments IS your voice. A geometric sans says clarity and modernity; a humanist serif says heritage and care; a condensed display says urgency and confidence.",
      },
      {
        kind: "p",
        text: "Choosing type is not a styling decision. It's a positioning decision. Which is why I spend the first week of any branding project just looking at letterforms — not designing, not sketching, just reading and listening.",
      },
      { kind: "h2", text: "The brief is in the counter" },
      {
        kind: "p",
        text: "The negative space inside an \"o\" or \"e\" — what typographers call the counter — tells you more about a typeface's mood than any marketing description ever will. Wider counters feel friendlier and more democratic. Tight, dark counters feel premium and disciplined.",
      },
      {
        kind: "p",
        text: "When clients arrive with vague briefs (\"make it feel premium but approachable\"), I show them three logos set in three typefaces with very different counters. The brief writes itself. They point and say: that one. That's the brand.",
      },
      { kind: "h2", text: "Get it right early" },
      {
        kind: "p",
        text: "Get the type right and most other decisions become easier. Color, layout, illustration, motion — they all follow naturally from a typographic foundation that has been chosen with care. Get type wrong and even the most beautiful palette and clever wordmark can't rescue the brand from feeling generic.",
      },
    ],
  },
  {
    slug: "color-theory-palette",
    date: "Mar 15, 2024",
    title: "Color Theory: Building a Palette That Speaks",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Color",
    excerpt:
      "A good palette is not a collection of colors that look pretty together — it is a system that tells your brand's story across every surface, screen, and season.",
    content: [
      {
        kind: "p",
        text: "Most palettes fail not because the colors are wrong, but because the relationships between the colors are unconsidered. A palette that survives in print, screen, packaging, and motion has to be designed as a system — not a moodboard.",
      },
      { kind: "h2", text: "Start with one decision, not five" },
      {
        kind: "p",
        text: "Every palette I build begins with a single anchor color — the one decision that all others must serve. Once that anchor is set, every other choice (neutral, accent, alert, surface) becomes a question about contrast, hierarchy, and proportion rather than taste.",
      },
      {
        kind: "p",
        text: "This is why I never start a palette with five swatches on a board. I start with one. The other four exist only to make that one shine.",
      },
      { kind: "h2", text: "Test under pressure, not in showcase" },
      {
        kind: "p",
        text: "A palette tested only in a polished case-study mockup will betray you on real surfaces. I test every palette in three places before signing it off: a 12-pixel button, a phone screen at noon outdoors, and a black-and-white photocopy. If the relationships hold there, they will hold anywhere.",
      },
      { kind: "h2", text: "Cultural color is contextual color" },
      {
        kind: "p",
        text: "Working in South Asia has taught me that color carries cultural memory. Saffron is not just orange. Indigo is not just blue. A palette that ignores its cultural context becomes a translation rather than a voice.",
      },
    ],
  },
  {
    slug: "bengali-type-south-asian",
    date: "Feb 28, 2024",
    title: "How Bengali Type Is Redefining South Asian Design",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Bengali+Type",
    excerpt:
      "A new generation of type designers is treating Bangla not as a Latin add-on but as a primary script with its own rhythm, weight, and cultural voice. The shift is subtle, and overdue.",
    content: [
      {
        kind: "p",
        text: "For decades, Bangla type in branding was an afterthought — a Latin design with the script grafted on, often awkwardly. That era is ending. A new generation of type designers from Dhaka, Kolkata, and the diaspora is treating Bangla as a primary script with its own rhythm, weight, and history to preserve.",
      },
      { kind: "h2", text: "From translation to authorship" },
      {
        kind: "p",
        text: "The most exciting projects I've seen recently start in Bangla and translate to English, not the other way around. The matra (the headline that connects letters in Bangla) becomes a design system anchor rather than a constraint to work around.",
      },
      { kind: "h2", text: "Why this matters beyond Bangladesh" },
      {
        kind: "p",
        text: "When a script is treated with care in its primary form, it changes how global brands approach localisation everywhere. Bangla typography is part of a broader shift in non-Latin design — alongside Arabic, Devanagari, and CJK — that is forcing the industry to rethink what \"international\" branding really means.",
      },
      {
        kind: "p",
        text: "It's not about decoration. It's about authorship. And it's overdue.",
      },
    ],
  },
  {
    slug: "pricing-first-client",
    date: "Jan 12, 2024",
    title: "A Designer's Guide to Pricing Your First Client",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Pricing",
    excerpt:
      "Pricing your first paid project is mostly a confidence problem disguised as a math problem. Here is the framework I wish someone had handed me when I started.",
    content: [
      {
        kind: "p",
        text: "Pricing your first paid project is mostly a confidence problem disguised as a math problem. You don't need a complicated rate card. You need a simple framework that protects your time and gives the client clarity.",
      },
      { kind: "h2", text: "Price the deliverable, not the hour" },
      {
        kind: "p",
        text: "Hourly billing punishes you for getting better. The faster and more skilled you become, the less you earn. Project-based pricing aligns the incentive: the client pays for the outcome, you keep the upside of efficiency.",
      },
      { kind: "h2", text: "Always quote a range" },
      {
        kind: "p",
        text: "A single number sounds final and either too high or too low. A range (\"between X and Y depending on scope\") signals that you are thinking carefully and gives both sides room to negotiate without losing face.",
      },
      { kind: "h2", text: "Charge for revisions, not for thinking" },
      {
        kind: "p",
        text: "Two rounds of feedback should be included. After that, additional revisions are billed separately at a clearly stated rate. This is not greedy — it's the only way to keep the project from quietly turning into unpaid work.",
      },
    ],
  },
  {
    slug: "print-not-dead",
    date: "Feb 6, 2024",
    title: "Print Is Not Dead: The Comeback of Editorial Design",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Print",
    excerpt:
      "Independent magazines, photo zines, and exhibition catalogues are quietly thriving — and they are pulling editorial design in directions the screen cannot follow.",
    content: [
      {
        kind: "p",
        text: "The obituary for print has been written more times than I can count. Yet, walk into any independent bookshop in Dhaka, London, or Tokyo and you will find shelves of beautifully designed magazines, photo zines, and exhibition catalogues — most of them launched in the last five years.",
      },
      { kind: "h2", text: "Print does what screens cannot" },
      {
        kind: "p",
        text: "Print rewards slowness, intentionality, and the texture of paper. It cannot be A/B tested into mediocrity. It does not autoplay. It exists in one fixed form, which is exactly why it can take risks that a digital surface — endlessly tweakable — rarely will.",
      },
      { kind: "h2", text: "The new editorial designers" },
      {
        kind: "p",
        text: "The most interesting editorial design today is happening at the margins — small print runs of 500 to 2000, often financed by patronage or pre-order. The designers behind these projects are treating layout as authorship, not service. The grid is back, and it has something to say.",
      },
    ],
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
    avatar: "https://placehold.co/80x80/1c1c1c/8b5cf6?text=TR",
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
  body: "Unlock the potential of your brand with thoughtful, intentional design. Let's collaborate to create visuals that not only meet your goals but tell your story.",
  href: "/contact",
};

export const contactPage = {
  headingPrefix: "Let's Create Something",
  headingAccent: "Amazing",
};

export const footer = {
  text: "Designed & built by Arif Hossain · 2026",
};
