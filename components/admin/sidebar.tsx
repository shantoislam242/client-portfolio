import { logoutAction } from "@/actions/auth";
import { SidebarLink } from "./sidebar-link";

type NavLink = { href: string; label: string };

const SETTINGS: NavLink[] = [
  { href: "/admin/site-settings/profile", label: "Profile" },
  { href: "/admin/site-settings/hero", label: "Hero" },
  { href: "/admin/site-settings/stats", label: "Stats" },
  { href: "/admin/site-settings/about", label: "About" },
  { href: "/admin/site-settings/sections", label: "Sections" },
  { href: "/admin/site-settings/contact", label: "Contact" },
  { href: "/admin/site-settings/collaborate", label: "Collaborate" },
  { href: "/admin/site-settings/footer", label: "Footer" },
  { href: "/admin/site-settings/seo", label: "SEO" },
  { href: "/admin/site-settings/theme", label: "Theme" },
];

const CONTENT: NavLink[] = [
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/client-logos", label: "Client logos" },
];

const ABOUT: NavLink[] = [
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/certifications", label: "Certifications" },
];

const NAVIGATION: NavLink[] = [
  { href: "/admin/nav-items", label: "Nav items" },
  { href: "/admin/social-links", label: "Social links" },
];

function Group({ heading, links }: { heading: string; links: NavLink[] }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-2">
        {heading}
      </h3>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <SidebarLink href={l.href}>{l.label}</SidebarLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-border">
        <div className="text-sm font-semibold">Portfolio Admin</div>
        <div className="text-xs text-muted-foreground truncate">
          {process.env.ADMIN_EMAIL ?? ""}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="mb-4">
          <SidebarLink href="/admin">Dashboard</SidebarLink>
        </div>
        <Group heading="Settings" links={SETTINGS} />
        <Group heading="Content" links={CONTENT} />
        <Group heading="About" links={ABOUT} />
        <Group heading="Navigation" links={NAVIGATION} />
      </nav>

      <form action={logoutAction} className="p-4 border-t border-border">
        <button
          type="submit"
          className="w-full text-sm text-left px-3 py-2 rounded-md hover:bg-card text-muted-foreground"
        >
          Log out
        </button>
      </form>
    </aside>
  );
}
