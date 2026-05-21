import { PrismaClient } from "@prisma/client";
import {
  profile,
  hero,
  stats,
  companies,
  navItems,
  aboutIntro,
  experienceHeading,
  educationHeading,
  certificationHeading,
  collaborateCta,
  contactPage,
  footer,
  tools,
  testimonials,
  faqs,
  experience,
  education,
  certifications,
  projects,
  blogPosts,
  type ContentBlock,
} from "../lib/data";

const prisma = new PrismaClient();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parsePeriod(period: string): { startDate: string; endDate: string | null; current: boolean } {
  const parts = period.split(/\s+[—–-]\s+/);
  const start = parts[0]?.trim() ?? period.trim();
  const endRaw = parts[1]?.trim() ?? null;
  const current = endRaw === "Present" || endRaw === "present";
  return {
    startDate: start,
    endDate: current ? null : endRaw,
    current,
  };
}

type ParsedSections = {
  introHtml: string;
  sections: { heading: string; contentHtml: string; order: number }[];
};

function blocksToSections(blocks: ContentBlock[]): ParsedSections {
  const introParas: string[] = [];
  const sections: ParsedSections["sections"] = [];
  let current: { heading: string; paras: string[] } | null = null;

  for (const b of blocks) {
    if (b.kind === "h2") {
      if (current) {
        sections.push({
          heading: current.heading,
          contentHtml: current.paras.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
          order: sections.length,
        });
      }
      current = { heading: b.text, paras: [] };
    } else {
      if (current) {
        current.paras.push(b.text);
      } else {
        introParas.push(b.text);
      }
    }
  }
  if (current) {
    sections.push({
      heading: current.heading,
      contentHtml: current.paras.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
      order: sections.length,
    });
  }

  return {
    introHtml: introParas.map((p) => `<p>${escapeHtml(p)}</p>`).join(""),
    sections,
  };
}

function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      if (b.kind === "h2") return `<h2>${escapeHtml(b.text)}</h2>`;
      return `<p>${escapeHtml(b.text)}</p>`;
    })
    .join("");
}

function parseBlogDate(date: string): Date {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

async function seedSiteSettings() {
  console.log("→ seeding SiteSettings singleton");

  const heroSubtext = hero.description;
  const trustedByHeading = companies.caption;
  const aboutPageTitle = `${aboutIntro.headingPrefix} ${aboutIntro.headingAccent}`.trim();
  const aboutIntroContent = aboutIntro.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const experienceHeadingText = `${experienceHeading.prefix} ${experienceHeading.accent}`.trim();
  const educationHeadingText = `${educationHeading.prefix} ${educationHeading.accent}`.trim();
  const certificationHeadingText = `${certificationHeading.prefix} ${certificationHeading.accent}`.trim();
  const ctaSectionText = collaborateCta.body;
  const contactPageTitle = `${contactPage.headingPrefix} ${contactPage.headingAccent}`.trim();
  const footerText = footer.text;

  const data = {
    fullName: profile.name,
    role: profile.role,
    location: profile.location,
    portraitUrl: profile.portrait,
    heroHeadline: `${hero.headingPrefix} ${hero.headingAccent}`.trim(),
    heroSubtext,
    heroPrimaryCtaLabel: hero.primaryCta.label,
    heroPrimaryCtaLink: hero.primaryCta.href,
    heroSecondaryCtaLabel: hero.secondaryCta.label,
    heroSecondaryCtaLink: hero.secondaryCta.href,
    statYearsExperience: stats[0].value,
    statYearsLabel: stats[0].label,
    statProjects: stats[1].value,
    statProjectsLabel: stats[1].label,
    statClients: stats[2].value,
    statClientsLabel: stats[2].label,
    statsShowPlus: true,
    trustedByHeading,
    aboutPageTitle,
    aboutIntroContent,
    experienceHeading: experienceHeadingText,
    educationHeading: educationHeadingText,
    certificationHeading: certificationHeadingText,
    ctaSectionLineOne: collaborateCta.headingLine1,
    ctaSectionLineTwo: collaborateCta.headingLine2,
    ctaSectionText,
    ctaSectionButtonLink: collaborateCta.href,
    contactPageTitle,
    footerText,
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
}

async function seedNavItems() {
  console.log("→ seeding NavItem rows");
  await prisma.navItem.deleteMany();
  await prisma.navItem.createMany({
    data: navItems.map((n, i) => ({
      label: n.label,
      href: n.href,
      iconKey: (n.icon as { displayName?: string }).displayName ?? n.label.toLowerCase(),
      order: i,
      external: false,
      visible: true,
    })),
  });
}

async function seedSocialLinks() {
  console.log("→ seeding SocialLink rows");
  await prisma.socialLink.deleteMany();
  await prisma.socialLink.createMany({
    data: profile.socials.map((s, i) => ({
      platform: s.label.toLowerCase(),
      label: s.label,
      url: s.href,
      iconKey: s.label.toLowerCase(),
      order: i,
      visible: true,
    })),
  });
}

async function seedClientLogos() {
  console.log("→ seeding ClientLogo rows");
  await prisma.clientLogo.deleteMany();
  await prisma.clientLogo.createMany({
    data: companies.logos.map((name, i) => ({
      name,
      logoUrl: `https://placehold.co/200x80/1c1c1c/8b5cf6?text=${encodeURIComponent(name)}`,
      publicId: "",
      order: i,
      visible: true,
    })),
  });
}

async function seedTools() {
  console.log("→ seeding Tool rows");
  await prisma.tool.deleteMany();
  await prisma.tool.createMany({
    data: tools.map((t, i) => ({
      name: t.name,
      description: t.role,
      category: null,
      iconUrl: t.icon.startsWith("http") ? null : t.icon,
      iconExternalUrl: t.icon.startsWith("http") ? t.icon : null,
      proficiency: 80,
      order: i,
      showOnHome: true,
      visible: true,
    })),
  });
}

async function seedTestimonials() {
  console.log("→ seeding Testimonial rows");
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: testimonials.map((t, i) => ({
      name: t.name,
      role: t.role,
      content: t.quote,
      avatarUrl: t.avatar,
      rating: 5,
      featured: false,
      order: i,
      visible: true,
    })),
  });
}

async function seedFaqs() {
  console.log("→ seeding FAQ rows");
  await prisma.fAQ.deleteMany();
  await prisma.fAQ.createMany({
    data: faqs.map((f, i) => ({
      question: f.question,
      answer: f.answer,
      order: i,
      visible: true,
    })),
  });
}

async function seedExperience() {
  console.log("→ seeding Experience rows");
  await prisma.experience.deleteMany();
  await prisma.experience.createMany({
    data: experience.map((e, i) => {
      const { startDate, endDate, current } = parsePeriod(e.period);
      return {
        company: e.company,
        role: e.role,
        description: e.description,
        startDate,
        endDate,
        current,
        companyUrl: e.href === "#" ? null : e.href,
        order: i,
        visible: true,
      };
    }),
  });
}

async function seedEducation() {
  console.log("→ seeding Education rows");
  await prisma.education.deleteMany();
  await prisma.education.createMany({
    data: education.map((e, i) => {
      const { startDate, endDate, current } = parsePeriod(e.period);
      return {
        institution: e.institution,
        degree: e.degree,
        description: e.description,
        startDate,
        endDate,
        current,
        institutionUrl: e.href === "#" ? null : e.href,
        order: i,
        visible: true,
      };
    }),
  });
}

async function seedCertifications() {
  console.log("→ seeding Certification rows");
  await prisma.certification.deleteMany();
  await prisma.certification.createMany({
    data: certifications.map((c, i) => {
      const { startDate, endDate } = parsePeriod(c.period);
      return {
        institution: c.institution,
        title: c.title,
        description: c.description,
        startDate,
        endDate,
        credentialUrl: c.href === "#" ? null : c.href,
        order: i,
        visible: true,
      };
    }),
  });
}

async function seedProjects() {
  console.log("→ seeding Project rows + sections + gallery");
  await prisma.project.deleteMany();

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const { introHtml, sections } = blocksToSections(p.content);

    await prisma.project.create({
      data: {
        slug: p.slug,
        title: p.title,
        shortLabel: p.subtitle,
        year: p.year,
        client: p.client,
        services: p.services,
        coverImageUrl: p.image,
        coverPublicId: "",
        excerpt: p.excerpt,
        introContent: introHtml || null,
        published: true,
        featured: i < 4,
        order: i,
        publishedAt: new Date(),
        sections: {
          create: sections.map((s) => ({
            heading: s.heading,
            content: s.contentHtml,
            order: s.order,
          })),
        },
        galleryImages: {
          create: p.gallery.map((url, idx) => ({
            url,
            publicId: "",
            order: idx,
          })),
        },
      },
    });
  }
}

async function seedBlogPosts() {
  console.log("→ seeding BlogPost rows");
  await prisma.blogPost.deleteMany();
  for (let i = 0; i < blogPosts.length; i++) {
    const b = blogPosts[i];
    await prisma.blogPost.create({
      data: {
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        content: blocksToHtml(b.content),
        coverImageUrl: b.image,
        coverPublicId: "",
        published: true,
        featured: i < 2,
        readTimeMinutes: Math.max(
          1,
          Math.round(
            b.content.reduce((n, blk) => n + blk.text.split(/\s+/).length, 0) / 200,
          ),
        ),
        publishedAt: parseBlogDate(b.date),
      },
    });
  }
}

async function main() {
  console.log("Seeding database from lib/data.ts ...");
  await seedSiteSettings();
  await seedNavItems();
  await seedSocialLinks();
  await seedClientLogos();
  await seedTools();
  await seedTestimonials();
  await seedFaqs();
  await seedExperience();
  await seedEducation();
  await seedCertifications();
  await seedProjects();
  await seedBlogPosts();
  console.log("✓ Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
