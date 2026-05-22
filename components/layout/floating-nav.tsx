import { listNavItems } from "@/lib/db/nav-items";
import { FloatingNavClient } from "@/components/layout/floating-nav-client";

export async function FloatingNav() {
  const allItems = await listNavItems();
  const items = allItems
    .filter((i) => i.visible)
    .map(({ href, label, iconKey }) => ({ href, label, iconKey }));

  return <FloatingNavClient items={items} />;
}
