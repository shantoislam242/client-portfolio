import { PageShell } from "@/components/layout/page-shell";

// All public pages are CMS-driven; skip static prerender to avoid
// exhausting the single-connection Prisma pool during build.
export const dynamic = "force-dynamic";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
