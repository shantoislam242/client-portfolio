import Link from "next/link";
import { listTestimonials } from "@/lib/db/testimonials";
import { deleteTestimonial, toggleVisibleTestimonial } from "@/actions/testimonials";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Testimonials — admin" };

export default async function TestimonialsListPage() {
  const testimonials = await listTestimonials();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Testimonials ({testimonials.length})</h1>
        <Link
          href="/admin/testimonials/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New testimonial
        </Link>
      </header>
      <DataTable
        rows={testimonials}
        columns={[
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "rating", label: "Rating" },
          { key: "order", label: "Order" },
        ]}
        editHref={(t) => `/admin/testimonials/${t.id}`}
        deleteAction={deleteTestimonial}
        toggleVisibleAction={toggleVisibleTestimonial}
      />
    </div>
  );
}
