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
import { LinkedinIcon } from "@/components/icons/linkedin";
import { FacebookIcon } from "@/components/icons/facebook";
import { YoutubeIcon } from "@/components/icons/youtube";
import type { ComponentType, SVGProps } from "react";

export type IconComponent =
  | LucideIcon
  | ComponentType<SVGProps<SVGSVGElement>>;

export const profile = {
  name: "Arifujjaman",
  role: "Graphic & Motion Designer",
  location: "Tejgaon, Dhaka, Bangladesh",
  portrait: "https://placehold.co/480x600/1c1c1c/8b5cf6?text=AJ",
  socials: [
    { label: "Behance", href: "https://www.behance.net/arifdesigner77", icon: BehanceIcon },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/arif-designer77/", icon: LinkedinIcon },
    { label: "Facebook", href: "https://www.facebook.com/arifdesigner77", icon: FacebookIcon },
    { label: "YouTube", href: "https://www.youtube.com/@ArtistixArif", icon: YoutubeIcon },
    { label: "Email", href: "mailto:mdrjarif68723@gmail.com", icon: Mail },
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
    "Passionate about turning ideas into striking visuals — from brand systems and editorial design to motion content that resonates and connects.",
  primaryCta: { label: "Let's Talk", href: "/contact" },
  secondaryCta: { label: "My Work", href: "/projects" },
} as const;

export const stats = [
  { value: 4, prefix: "+", label: "Years of Experience" },
  { value: 50, prefix: "+", label: "Projects Completed" },
  { value: 20, prefix: "+", label: "Happy Clients" },
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
  excerpt: string;
  year: string;
  client: string;
  services: string[];
  content: ContentBlock[];
  gallery: string[];
};

export const projects: Project[] = [
  {
    slug: "nokshi",
    title: "Nokshi",
    subtitle: "Fashion Brand Identity",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Nokshi",
    excerpt:
      "A new visual language for a Dhaka-based fashion label that wanted handwoven jamdani and muslin to speak to a younger, urban audience without losing its handcraft soul.",
    year: "2023",
    client: "Nokshi",
    services: ["Brand identity", "Typography", "Packaging"],
    content: [
      {
        kind: "p",
        text: "Nokshi is a Dhaka-based fashion label working with handwoven jamdani and muslin from weavers in Tangail and Sonargaon. When the founders came to me, the brand felt rooted in heritage but distant from the urban audience they wanted to reach next.",
      },
      { kind: "h2", text: "The brief" },
      {
        kind: "p",
        text: "Modernise without erasing. The new identity needed to hold its own next to international fashion labels on Instagram while still feeling unmistakably tied to the loom, the thread, the hand.",
      },
      { kind: "h2", text: "The approach" },
      {
        kind: "p",
        text: "We built the entire system around a single custom-drawn ligature derived from a jamdani motif. The wordmark uses a contemporary serif with subtle weave-like terminals — quiet enough for a runway lookbook, distinct enough for a thumbnail.",
      },
      {
        kind: "p",
        text: "The packaging avoids the usual handcraft tropes (no kraft paper, no rope ties). Instead, a deep aubergine box with foil-blocked Bangla and Latin lockups makes opening a Nokshi piece feel like unboxing something from a museum gift shop.",
      },
      { kind: "h2", text: "The outcome" },
      {
        kind: "p",
        text: "Six months after launch, the brand grew its Instagram following by 4× and was featured in two regional design publications. More importantly, weavers have started recognising the wordmark as their own — which was the part of the brief I cared about most.",
      },
    ],
    gallery: [
      "https://placehold.co/800x600/4a1d4a/d4af37?text=Logo+Mark",
      "https://placehold.co/800x600/2d0e2d/c9a96e?text=Packaging",
      "https://placehold.co/800x600/4a1d4a/ffffff?text=Lookbook",
      "https://placehold.co/800x600/161616/8b5cf6?text=Type+System",
    ],
  },
  {
    slug: "aronno",
    title: "Aronno",
    subtitle: "Eco Packaging Design",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Aronno",
    excerpt:
      "Packaging for an organic skincare brand built around a single principle: every surface should be either compostable or refillable, and every choice should be visible.",
    year: "2023",
    client: "Aronno Naturals",
    services: ["Packaging", "Illustration", "Brand system"],
    content: [
      {
        kind: "p",
        text: "Aronno makes small-batch organic skincare from indigenous botanicals — neem, amla, hibiscus, ritha. The product was clean. The packaging it arrived in was not.",
      },
      { kind: "h2", text: "Designing what shows" },
      {
        kind: "p",
        text: "We replaced laminated cartons with uncoated FSC-certified board, switched bottles to refillable amber glass, and hand-illustrated each ingredient as a botanical line drawing — visible through a die-cut window in the box.",
      },
      { kind: "h2", text: "The harder choice" },
      {
        kind: "p",
        text: "The harder decision was structural. We removed the secondary box for half the range. Customers dislike opening packaging that feels skimpy, so we replaced ceremony with information: the bottle itself became a small monograph about the ingredient, the farmer, and the process.",
      },
    ],
    gallery: [
      "https://placehold.co/800x600/2d3e2c/d4c896?text=Bottle",
      "https://placehold.co/800x600/3a4a35/e8dcc0?text=Box+Front",
      "https://placehold.co/800x600/2d3e2c/8b5cf6?text=Illustration",
      "https://placehold.co/800x600/4a3a25/d4c896?text=Refill+System",
    ],
  },
  {
    slug: "padma",
    title: "Padma",
    subtitle: "Editorial Magazine",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Padma",
    excerpt:
      "Art direction and design system for a quarterly print magazine covering literature, culture, and visual essays from across the Bengal delta.",
    year: "2022",
    client: "Padma Quarterly",
    services: ["Editorial design", "Art direction", "Type system"],
    content: [
      {
        kind: "p",
        text: "Padma Quarterly is a 144-page print magazine that publishes long-form journalism, fiction, and photo essays from Bangladesh and West Bengal. The previous design treated Bangla as a footnote. We rebuilt the system around it.",
      },
      { kind: "h2", text: "Bangla-first grid" },
      {
        kind: "p",
        text: "Every layout in the new design starts from the Bangla typesetting and flows English alongside it as a parallel column rather than a translation. The grid honours the matra and accommodates the natural vertical extension of conjunct characters without distortion.",
      },
      { kind: "h2", text: "A typeface for the long read" },
      {
        kind: "p",
        text: "We commissioned a custom Bangla text face from a typographer in Kolkata, paired with a low-contrast English serif for English passages. Headlines use a display variant that subtly references woodblock printing — a nod to the magazine's roots in regional print history.",
      },
    ],
    gallery: [
      "https://placehold.co/800x600/f5e6d3/2c1810?text=Cover+01",
      "https://placehold.co/800x600/f5e6d3/8b5cf6?text=Spread",
      "https://placehold.co/800x600/2c1810/f5e6d3?text=Cover+02",
      "https://placehold.co/800x600/4a3a25/f5e6d3?text=Type+Pairing",
    ],
  },
  {
    slug: "dhaka-metro",
    title: "Dhaka Metro",
    subtitle: "Wayfinding System",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Dhaka+Metro",
    excerpt:
      "A speculative wayfinding system for the Dhaka MRT designed around bilingual legibility, glanceable hierarchy, and a colour palette that survives cataract sunlight.",
    year: "2022",
    client: "Self-initiated",
    services: ["Wayfinding", "Typography", "Signage system"],
    content: [
      {
        kind: "p",
        text: "This was a self-initiated project responding to early signage on the Dhaka MRT line — functional, but inconsistent and hard to read at speed. I wanted to explore what a fully bilingual transit system, designed from the ground up, could look like.",
      },
      { kind: "h2", text: "Reading at three meters per second" },
      {
        kind: "p",
        text: "Transit signage is read while moving. Every choice — type weight, x-height, line spacing, arrow geometry — is calibrated to be glanceable at speed. We tested mockups on actual MRT platforms with commuters, refining glyph weight and spacing across three iterations.",
      },
      { kind: "h2", text: "Colour for sunlight" },
      {
        kind: "p",
        text: "Dhaka light is harsh and yellow at noon. Many transit palettes designed in temperate climates wash out under tropical sun. We tested every line color against a reference photograph taken at 1pm and adjusted saturation accordingly.",
      },
    ],
    gallery: [
      "https://placehold.co/800x600/0d3e7a/f5d100?text=Platform+Sign",
      "https://placehold.co/800x600/0d3e7a/ffffff?text=System+Map",
      "https://placehold.co/800x600/c8102e/ffffff?text=Line+Marker",
      "https://placehold.co/800x600/2c5530/ffffff?text=Exit+Sign",
    ],
  },
  {
    slug: "shoroth",
    title: "Shoroth",
    subtitle: "Typography Poster Series",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Shoroth",
    excerpt:
      "A self-initiated series of twelve large-format posters exploring the rhythm of Bangla type during Shoroth — the brief autumnal season between monsoon and winter.",
    year: "2021",
    client: "Self-initiated",
    services: ["Poster design", "Typography", "Print production"],
    content: [
      {
        kind: "p",
        text: "Shoroth is a typographic love letter to one of the six Bengali seasons — that short, golden window after the monsoon ends and before the winter arrives. The series is twelve A1 posters, one for each line of a Tagore poem set in twelve different Bangla typefaces.",
      },
      { kind: "h2", text: "One poem, twelve voices" },
      {
        kind: "p",
        text: "Setting the same line of poetry in twelve different typefaces — old and new, lead-cut and digital — turns the series into an argument about how much a typeface can change the meaning of a sentence without changing a word.",
      },
      { kind: "h2", text: "Risograph in two colours" },
      {
        kind: "p",
        text: "The posters were produced on a risograph in two colour passes — a soft yellow and a deep indigo. The slight registration drift of risograph printing felt right for a series about a season that is itself slightly out of focus.",
      },
    ],
    gallery: [
      "https://placehold.co/800x600/f5d100/2a3380?text=Poster+01",
      "https://placehold.co/800x600/2a3380/f5d100?text=Poster+02",
      "https://placehold.co/800x600/f5d100/2a3380?text=Poster+03",
      "https://placehold.co/800x600/2a3380/f5d100?text=Poster+04",
    ],
  },
  {
    slug: "boithok",
    title: "Boithok",
    subtitle: "Conference Branding",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Boithok",
    excerpt:
      "Identity, environmental graphics, and motion design for the inaugural edition of a regional design conference held at the Bangladesh Shilpakala Academy.",
    year: "2021",
    client: "Boithok Design Conference",
    services: ["Identity", "Motion", "Environmental graphics"],
    content: [
      {
        kind: "p",
        text: "Boithok — meaning 'a sitting' or 'a gathering' in Bangla — is a two-day design conference that brings together designers from across South Asia. We built the brand for the first edition in 2021.",
      },
      { kind: "h2", text: "An identity that gathers" },
      {
        kind: "p",
        text: "The wordmark is built from individual letterforms designed by six different contributing typographers — each letter carries a slightly different voice, but the word reads as one. The whole system is essentially a typographic boithok.",
      },
      { kind: "h2", text: "Filling a building with type" },
      {
        kind: "p",
        text: "The Shilpakala Academy is a brutalist concrete building that demands a graphic system loud enough to hold its own. Vinyl wraps, hanging banners, and projection-mapped opening titles turned every concrete surface into a typographic stage for the duration of the event.",
      },
    ],
    gallery: [
      "https://placehold.co/800x600/3a3a3a/8b5cf6?text=Wordmark",
      "https://placehold.co/800x600/161616/ffffff?text=Banner",
      "https://placehold.co/800x600/525252/8b5cf6?text=Wayfinding",
      "https://placehold.co/800x600/2a2a2a/ffffff?text=Stage+Titles",
    ],
  },
];

export type Tool = { name: string; role: string; icon: string };

export const tools: Tool[] = [
  {
    name: "Photoshop",
    role: "Photo Editing & Compositing",
    icon: "https://skillicons.dev/icons?i=ps",
  },
  {
    name: "Illustrator",
    role: "Vector & Logo Design",
    icon: "https://skillicons.dev/icons?i=ai",
  },
  {
    name: "InDesign",
    role: "Editorial Layout",
    icon: "https://skillicons.dev/icons?i=id",
  },
  {
    name: "After Effects",
    role: "Motion Graphics",
    icon: "https://skillicons.dev/icons?i=ae",
  },
  {
    name: "Premiere Pro",
    role: "Video Editing",
    icon: "https://skillicons.dev/icons?i=pr",
  },
  {
    name: "Lightroom",
    role: "Color Grading",
    icon: "https://skillicons.dev/icons?i=lr",
  },
  {
    name: "Figma",
    role: "UI & Prototyping",
    icon: "https://skillicons.dev/icons?i=figma",
  },
  {
    name: "Blender",
    role: "3D & Motion",
    icon: "https://skillicons.dev/icons?i=blender",
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
    "My name is Arifujjaman, and I am a graphic designer who believes that design can change the world. My specialties are graphic design, animation, and video editing — across brand systems, motion content, and visuals for digital products.",
    "I am constantly inspired by the world around me and strive to create designs that are both beautiful and functional. My work has helped brands across Bangladesh find their visual voice across e-commerce, education, and lifestyle sectors.",
  ],
};

export const experienceHeading = {
  prefix: "My Professional",
  accent: "Journey",
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
    institution: "Daffodil International University",
    degree: "Bachelor of Science — Computer Science & Engineering",
    description:
      "Studied at DIU's Faculty of Science & IT, building a foundation in software engineering and computer graphics alongside self-directed work in visual design. Graduated with a CGPA of 2.99 / 4.00.",
    period: "Jan 2016 — Jun 2022",
    href: "#",
  },
  {
    institution: "Narsingdi Science College",
    degree: "Higher Secondary Certificate — Science",
    description:
      "Completed HSC in Science under the Dhaka Education Board with GPA 4.42 / 5.00. Active in college creative and cultural events.",
    period: "Jul 2013 — Jun 2015",
    href: "#",
  },
  {
    institution: "Madhabdi SP Institution",
    degree: "Secondary School Certificate — Science",
    description:
      "Completed SSC in Science under the Dhaka Education Board with GPA 4.75 / 5.00. Member of the school scout team.",
    period: "Jan 2009 — Jun 2013",
    href: "#",
  },
  {
    institution: "Creative IT Institution",
    degree: "Professional Graphic Design — Certificate",
    description:
      "Comprehensive professional training in social media post design, logo design, product animation, business cards, flyer design, and video editing. Performed at the institute's Jago Ucchashe alumni event in March 2022.",
    period: "Jan 2022 — Aug 2022",
    href: "#",
  },
];

export const experience: ExperienceEntry[] = [
  {
    company: "Databrandix",
    role: "Senior Visual Artist",
    description:
      "Leading visual identity and motion direction at Databrandix, crafting brand systems, motion content, and campaign visuals across fintech, lifestyle, and SaaS clients.",
    period: "Jan 2026 — Present",
    href: "#",
  },
  {
    company: "Sonarga University",
    role: "Visual Artist",
    description:
      "Designed academic publications, event branding, and visual content for the university's communications team — across editorial, web, and social formats.",
    period: "Jan 2025 — Dec 2025",
    href: "#",
  },
  {
    company: "GlobalED",
    role: "Graphic Designer",
    description:
      "Graphic and video editing for GlobalED — Bangladesh's authorized IELTS testing centre operated by Global Citizen Limited. Built campaign visuals, training materials, and motion content for the test-prep platform.",
    period: "Apr 2024 — Dec 2024",
    href: "#",
  },
  {
    company: "Pingu's English & Global Citizen",
    role: "Senior Graphic & Motion Designer",
    description:
      "Senior graphic and motion designer for Pingu's English — an international children's English-learning brand — and Global Citizen Limited. Led visual content for online courses, social campaigns, and animated lessons.",
    period: "Mar 2023 — Mar 2024",
    href: "#",
  },
  {
    company: "Jachai.com",
    role: "Junior Graphic Designer",
    description:
      "Junior graphic designer at Jachai.com — Bangladesh's largest online marketplace. Designed product banners, e-commerce visuals, social media content, and category artwork connecting buyers with sellers.",
    period: "Feb 2022 — Feb 2023",
    href: "#",
  },
];

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string };

export type BlogPost = {
  slug: string;
  date: string;
  title: string;
  image: string;
  excerpt: string;
  content: ContentBlock[];
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
      "Photoshop and Illustrator for graphic design, After Effects and Premiere Pro for motion and video editing.",
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
  text: "Designed & built by Arifujjaman · 2026",
};
