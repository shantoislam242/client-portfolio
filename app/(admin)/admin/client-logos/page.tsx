import Link from "next/link";
import Image from "next/image";
import { listClientLogos } from "@/lib/db/client-logos";
import { deleteClientLogo, toggleVisibleClientLogo } from "@/actions/client-logos";
import { reorderClientLogos } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Client logos — admin" };

export default async function ClientLogosListPage() {
  const rows = await listClientLogos();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Client logos ({rows.length})</h1>
        <Link
          href="/admin/client-logos/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New logo
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No client logos yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderClientLogos}
          items={rows.map((r) => ({
            id: r.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <Image
                  src={r.logoUrl}
                  alt={r.name}
                  width={48}
                  height={32}
                  className="rounded bg-background flex-shrink-0 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                </div>
                <VisibleToggle
                  id={r.id}
                  visible={r.visible}
                  action={toggleVisibleClientLogo}
                />
                <Link
                  href={`/admin/client-logos/${r.id}`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={r.id} action={deleteClientLogo} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
