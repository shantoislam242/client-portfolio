"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function SidebarLink({ href, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
  const base = "block px-3 py-1.5 text-sm rounded-md transition";
  const classes = isActive
    ? `${base} bg-accent-purple/10 border-l-2 border-accent-purple text-foreground`
    : `${base} hover:bg-card text-muted-foreground hover:text-foreground`;
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
