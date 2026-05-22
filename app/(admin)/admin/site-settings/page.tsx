import Link from "next/link";

export const metadata = { title: "Site settings" };

const SECTIONS = [
  { href: "/admin/site-settings/profile", label: "Profile", description: "Name, role, location, portrait, resume" },
  { href: "/admin/site-settings/hero", label: "Hero", description: "Home page headline + CTAs" },
  { href: "/admin/site-settings/stats", label: "Stats", description: "3 home-page numbers" },
  { href: "/admin/site-settings/about", label: "About", description: "About page heading + intro" },
  { href: "/admin/site-settings/sections", label: "Sections", description: "All section headings + limits" },
  { href: "/admin/site-settings/contact", label: "Contact", description: "Contact page + form labels" },
  { href: "/admin/site-settings/collaborate", label: "Collaborate", description: "Bottom-of-page CTA" },
  { href: "/admin/site-settings/footer", label: "Footer", description: "Footer text + copyright" },
  { href: "/admin/site-settings/seo", label: "SEO", description: "Meta, OG image, favicon" },
  { href: "/admin/site-settings/theme", label: "Theme", description: "Primary & accent colors" },
];

export default function SiteSettingsIndex() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Site settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-md border border-border bg-card p-4 hover:border-accent-purple transition"
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
