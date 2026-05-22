"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = { key: string; label: string };

const TABS: Tab[] = [
  { key: "basics", label: "Basics" },
  { key: "content", label: "Content" },
  { key: "gallery", label: "Gallery" },
  { key: "related", label: "Related" },
  { key: "seo", label: "SEO" },
];

export function TabsNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("tab") ?? "basics";

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border mb-6">
      {TABS.map((t) => {
        const active = current === t.key;
        return (
          <Link
            key={t.key}
            href={`${pathname}?tab=${t.key}`}
            className={
              "px-4 py-2 text-sm rounded-t-md transition " +
              (active
                ? "bg-accent-purple/10 border-b-2 border-accent-purple text-foreground -mb-px"
                : "hover:bg-card text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
