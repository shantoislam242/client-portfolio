import { z } from "zod";
import { checkbox, intField, optionalText, optionalUrl } from "./_helpers";

export const ProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(200),
  portraitUrl: optionalUrl,
  portraitPublicId: optionalText,
  ctaButtonLabel: z.string().trim().min(1).max(50),
  ctaButtonLink: z.string().trim().min(1).max(500),
  resumeUrl: optionalUrl,
  resumePublicId: optionalText,
});

export const HeroSchema = z.object({
  heroHeadline: z.string().trim().min(1).max(200),
  heroSubtext: z.string().trim().max(2000).default(""),
  heroPrimaryCtaLabel: z.string().trim().min(1).max(50),
  heroPrimaryCtaLink: z.string().trim().min(1).max(500),
  heroSecondaryCtaLabel: z.string().trim().min(1).max(50),
  heroSecondaryCtaLink: z.string().trim().min(1).max(500),
});

export const StatsSchema = z.object({
  statYearsExperience: intField.nonnegative().default(0),
  statYearsLabel: z.string().trim().min(1).max(50),
  statProjects: intField.nonnegative().default(0),
  statProjectsLabel: z.string().trim().min(1).max(50),
  statClients: intField.nonnegative().default(0),
  statClientsLabel: z.string().trim().min(1).max(50),
  statsShowPlus: checkbox.default(true),
});

export const AboutSchema = z.object({
  aboutPageTitle: z.string().trim().min(1).max(200),
  aboutIntroContent: z.string().max(20000).default(""),
  experienceHeading: z.string().trim().min(1).max(200),
  educationHeading: z.string().trim().min(1).max(200),
  certificationHeading: z.string().trim().min(1).max(200),
});

export const SectionsSchema = z.object({
  trustedByHeading: z.string().trim().min(1).max(200),
  recentProjectsHeading: z.string().trim().min(1).max(200),
  recentProjectsLimit: intField.min(1).max(50).default(4),
  toolsSectionHeading: z.string().trim().min(1).max(200),
  testimonialsHeading: z.string().trim().min(1).max(200),
  blogSectionHeading: z.string().trim().min(1).max(200),
  blogSectionLimit: intField.min(1).max(50).default(4),
  faqHeading: z.string().trim().min(1).max(200),
  projectsPageTitle: z.string().trim().min(1).max(200),
  projectsPageSubtitle: optionalText,
  blogPageTitle: z.string().trim().min(1).max(200),
  blogPageSubtitle: optionalText,
  toolsPageTitle: z.string().trim().min(1).max(200),
  toolsPageSubtitle: optionalText,
});

export const ContactSchema = z.object({
  contactPageTitle: z.string().trim().min(1).max(200),
  contactPageSubtitle: optionalText,
  contactEmail: optionalText,
  contactPhone: optionalText,
  contactLocationText: optionalText,
  contactFormNameLabel: z.string().trim().min(1).max(50),
  contactFormEmailLabel: z.string().trim().min(1).max(50),
  contactFormMessageLabel: z.string().trim().min(1).max(50),
  contactFormSubmitLabel: z.string().trim().min(1).max(50),
  contactSuccessMessage: z.string().trim().min(1).max(500),
});

export const CollaborateSchema = z.object({
  ctaSectionLineOne: z.string().trim().min(1).max(100),
  ctaSectionLineTwo: z.string().trim().min(1).max(100),
  ctaSectionText: z.string().trim().max(2000).default(""),
  ctaSectionButtonLabel: z.string().trim().min(1).max(50),
  ctaSectionButtonLink: z.string().trim().min(1).max(500),
});

export const FooterSchema = z.object({
  footerText: z.string().trim().min(1).max(500),
  footerShowYear: checkbox.default(true),
  footerCopyright: optionalText,
});

export const SeoSchema = z.object({
  siteName: z.string().trim().min(1).max(200),
  siteDescription: z.string().trim().max(2000).default(""),
  siteKeywords: optionalText,
  ogImage: optionalUrl,
  ogImagePublicId: optionalText,
  faviconUrl: optionalUrl,
  faviconPublicId: optionalText,
});

export const ThemeSchema = z.object({
  primaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, "Must be a hex color"),
  accentColor: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/), z.null()])),
});
