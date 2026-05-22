import Link from "next/link";
import { listExperience } from "@/lib/db/experience";
import { deleteExperience, toggleVisibleExperience } from "@/actions/experience";
import { reorderExperience } from "@/actions/reorder";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Experience — admin" };

export default async function ExperienceListPage() {
  const rows = await listExperience();
  const ids = rows.map((r) => r.id);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Experience ({rows.length})</h1>
        <Link
          href="/admin/experience/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New experience
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No experience yet.</p>
      ) : (
        <SortableList ids={ids} reorderAction={reorderExperience}>
          {(orderedIds) =>
            orderedIds.map((id) => {
              const r = rows.find((x) => x.id === id);
              if (!r) return null;
              return (
                <SortableRow key={id} id={id}>
                  {({ listeners, attributes }) => (
                    <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                      <DragHandle listeners={listeners} {...attributes} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{r.company}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {`${r.role} · ${r.startDate} – ${r.current ? "Present" : (r.endDate ?? "—")}`}
                        </div>
                      </div>
                      <VisibleToggle
                        id={r.id}
                        visible={r.visible}
                        action={toggleVisibleExperience}
                      />
                      <Link
                        href={`/admin/experience/${r.id}`}
                        className="text-accent-purple hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={r.id} action={deleteExperience} />
                    </div>
                  )}
                </SortableRow>
              );
            })
          }
        </SortableList>
      )}
    </div>
  );
}
