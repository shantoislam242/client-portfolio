import Link from "next/link";
import { listTestimonials } from "@/lib/db/testimonials";
import { deleteTestimonial, toggleVisibleTestimonial } from "@/actions/testimonials";
import { reorderTestimonials } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

export const metadata = { title: "Testimonials — admin" };

export default async function TestimonialsListPage() {
  const rows = await listTestimonials();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Testimonials ({rows.length})</h1>
        <Link
          href="/admin/testimonials/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New testimonial
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No testimonials yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderTestimonials}
          items={rows.map((r) => ({
            id: r.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.role ?? "—"}
                  </div>
                </div>
                <VisibleToggle
                  id={r.id}
                  visible={r.visible}
                  action={toggleVisibleTestimonial}
                />
                <Link
                  href={`/admin/testimonials/${r.id}`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={r.id} action={deleteTestimonial} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
