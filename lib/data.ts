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
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Typography",
  },
  {
    slug: "color-theory-palette",
    date: "Mar 15, 2024",
    title: "Color Theory: Building a Palette That Speaks",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Color",
  },
  {
    slug: "bengali-type-south-asian",
    date: "Feb 28, 2024",
    title: "How Bengali Type Is Redefining South Asian Design",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Bengali+Type",
  },
  {
    slug: "pricing-first-client",
    date: "Jan 12, 2024",
    title: "A Designer's Guide to Pricing Your First Client",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Pricing",
  },
  {
    slug: "print-not-dead",
    date: "Feb 6, 2024",
    title: "Print Is Not Dead: The Comeback of Editorial Design",
    image: "https://placehold.co/640x400/1c1c1c/8b5cf6?text=Print",
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
