import Link from "next/link";
import { listCertifications } from "@/lib/db/certifications";
import { deleteCertification, toggleVisibleCertification } from "@/actions/certifications";
import { reorderCertifications } from "@/actions/reorder";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Certifications — admin" };

export default async function CertificationListPage() {
  const rows = await listCertifications();
  const ids = rows.map((r) => r.id);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Certifications ({rows.length})</h1>
        <Link
          href="/admin/certifications/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New certification
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certifications yet.</p>
      ) : (
        <SortableList ids={ids} reorderAction={reorderCertifications}>
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
                        <div className="font-medium truncate">{r.institution}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {`${r.title} · ${r.startDate} – ${r.endDate ?? "—"}`}
                        </div>
                      </div>
                      <VisibleToggle
                        id={r.id}
                        visible={r.visible}
                        action={toggleVisibleCertification}
                      />
                      <Link
                        href={`/admin/certifications/${r.id}`}
                        className="text-accent-purple hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={r.id} action={deleteCertification} />
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
