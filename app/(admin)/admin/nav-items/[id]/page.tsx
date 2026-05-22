import { notFound } from "next/navigation";
import { getNavItem } from "@/lib/db/nav-items";
import { updateNavItem } from "@/actions/nav-items";
import { NavItemForm } from "../nav-item-form";

export const metadata = { title: "Edit nav item" };

export default async function EditNavItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const navItem = await getNavItem(id);
  if (!navItem) notFound();

  const boundAction = updateNavItem.bind(null, navItem.id);
  return (
    <NavItemForm
      initial={{
        id: navItem.id,
        label: navItem.label,
        href: navItem.href,
        iconKey: navItem.iconKey,
        order: navItem.order,
        external: navItem.external,
        visible: navItem.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
