import Link from "next/link";
import { listFaqs } from "@/lib/db/faqs";
import { deleteFaq, toggleVisibleFaq } from "@/actions/faqs";
import { reorderFaqs } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "FAQs — admin" };

export default async function FaqsListPage() {
  const rows = await listFaqs();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">FAQs ({rows.length})</h1>
        <Link
          href="/admin/faqs/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New FAQ
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No FAQs yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderFaqs}
          items={rows.map((r) => ({
            id: r.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {r.question.length > 60 ? r.question.slice(0, 60) + "…" : r.question}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.category ?? "—"}
                  </div>
                </div>
                <VisibleToggle
                  id={r.id}
                  visible={r.visible}
                  action={toggleVisibleFaq}
                />
                <Link
                  href={`/admin/faqs/${r.id}`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={r.id} action={deleteFaq} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
