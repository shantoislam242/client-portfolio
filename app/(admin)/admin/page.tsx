import Link from "next/link";
import { prisma } from "@/lib/db/client";

export const metadata = { title: "Admin dashboard" };

type CardProps = {
  label: string;
  count: number;
  href: string;
};

function Card({ label, count, href }: CardProps) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-border bg-card p-4 hover:border-accent-purple transition"
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{count}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [
    navItems,
    socials,
    tools,
    testimonials,
    faqs,
    experience,
    education,
    certifications,
    clientLogos,
    projects,
    blogPosts,
    contactSubmissions,
  ] = await Promise.all([
    prisma.navItem.count(),
    prisma.socialLink.count(),
    prisma.tool.count(),
    prisma.testimonial.count(),
    prisma.fAQ.count(),
    prisma.experience.count(),
    prisma.education.count(),
    prisma.certification.count(),
    prisma.clientLogo.count(),
    prisma.project.count(),
    prisma.blogPost.count(),
    prisma.contactSubmission.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Site settings
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Site settings" count={1} href="/admin/site-settings" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Content
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Tools" count={tools} href="/admin/tools" />
          <Card label="Testimonials" count={testimonials} href="/admin/testimonials" />
          <Card label="FAQs" count={faqs} href="/admin/faqs" />
          <Card label="Client logos" count={clientLogos} href="/admin/client-logos" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          About
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Experience" count={experience} href="/admin/experience" />
          <Card label="Education" count={education} href="/admin/education" />
          <Card label="Certifications" count={certifications} href="/admin/certifications" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Navigation
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Nav items" count={navItems} href="/admin/nav-items" />
          <Card label="Social links" count={socials} href="/admin/social-links" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Messages
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card label="Inbox" count={contactSubmissions} href="/admin/contact-submissions" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Deferred (Phase 2B)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 opacity-60">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Projects
            </div>
            <div className="text-2xl font-semibold mt-1">{projects}</div>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Blog posts
            </div>
            <div className="text-2xl font-semibold mt-1">{blogPosts}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
