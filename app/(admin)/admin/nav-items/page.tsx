import Link from "next/link";
import { listNavItems } from "@/lib/db/nav-items";
import { deleteNavItem, toggleVisibleNavItem } from "@/actions/nav-items";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Nav items — admin" };

export default async function NavItemsListPage() {
  const navItems = await listNavItems();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Nav items ({navItems.length})</h1>
        <Link
          href="/admin/nav-items/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New nav item
        </Link>
      </header>
      <DataTable
        rows={navItems}
        columns={[
          { key: "label", label: "Label" },
          { key: "href", label: "Href" },
          { key: "order", label: "Order" },
        ]}
        editHref={(n) => `/admin/nav-items/${n.id}`}
        deleteAction={deleteNavItem}
        toggleVisibleAction={toggleVisibleNavItem}
      />
    </div>
  );
}
