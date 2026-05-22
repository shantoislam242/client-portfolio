import Link from "next/link";
import { listNavItems } from "@/lib/db/nav-items";
import { deleteNavItem, toggleVisibleNavItem } from "@/actions/nav-items";
import { reorderNavItems } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Nav items — admin" };

export default async function NavItemsListPage() {
  const rows = await listNavItems();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Nav items ({rows.length})</h1>
        <Link
          href="/admin/nav-items/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New nav item
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No nav items yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderNavItems}
          items={rows.map((r) => ({
            id: r.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.href}
                  </div>
                </div>
                <VisibleToggle
                  id={r.id}
                  visible={r.visible}
                  action={toggleVisibleNavItem}
                />
                <Link
                  href={`/admin/nav-items/${r.id}`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={r.id} action={deleteNavItem} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
