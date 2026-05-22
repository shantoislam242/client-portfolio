import Link from "next/link";
import { listSocialLinks } from "@/lib/db/social-links";
import { deleteSocialLink, toggleVisibleSocialLink } from "@/actions/social-links";
import { reorderSocialLinks } from "@/actions/reorder";
import { SortableList, SortableRow } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Social links — admin" };

export default async function SocialLinksListPage() {
  const rows = await listSocialLinks();
  const ids = rows.map((r) => r.id);

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Social links ({rows.length})</h1>
        <Link
          href="/admin/social-links/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New social link
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No social links yet.</p>
      ) : (
        <SortableList ids={ids} reorderAction={reorderSocialLinks}>
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
                        <div className="font-medium truncate">{r.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {r.url}
                        </div>
                      </div>
                      <VisibleToggle
                        id={r.id}
                        visible={r.visible}
                        action={toggleVisibleSocialLink}
                      />
                      <Link
                        href={`/admin/social-links/${r.id}`}
                        className="text-accent-purple hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={r.id} action={deleteSocialLink} />
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
