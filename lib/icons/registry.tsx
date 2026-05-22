import {
  Home,
  Briefcase,
  Folder,
  Wrench,
  SquarePen,
  Mail,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { BehanceIcon } from "@/components/icons/behance";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { FacebookIcon } from "@/components/icons/facebook";
import { YoutubeIcon } from "@/components/icons/youtube";
import type { ComponentType, SVGProps } from "react";

type IconComponent =
  | LucideIcon
  | ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, IconComponent> = {
  // Semantic nav keys
  home: Home,
  about: Briefcase,
  projects: Folder,
  tools: Wrench,
  blog: SquarePen,
  contact: Mail,

  // Lucide component-name aliases (Phase 1 seed wrote these via displayName)
  house: Home,
  briefcase: Briefcase,
  folder: Folder,
  wrench: Wrench,
  squarepen: SquarePen,
  mail: Mail,

  // Socials (custom)
  behance: BehanceIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  email: Mail,

  // Fallback
  link: LinkIcon,
};

export function iconForKey(key: string | null | undefined): IconComponent {
  if (!key) return LinkIcon;
  return ICONS[key.toLowerCase()] ?? LinkIcon;
}
