import Link from "next/link";
import { listFaqs } from "@/lib/db/faqs";
import { deleteFaq, toggleVisibleFaq } from "@/actions/faqs";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "FAQs — admin" };

export default async function FaqsListPage() {
  const faqs = await listFaqs();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">FAQs ({faqs.length})</h1>
        <Link
          href="/admin/faqs/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New FAQ
        </Link>
      </header>
      <DataTable
        rows={faqs}
        columns={[
          { key: "question", label: "Question", render: (r) => r.question.length > 60 ? r.question.slice(0, 60) + "…" : r.question },
          { key: "category", label: "Category" },
          { key: "order", label: "Order" },
        ]}
        editHref={(f) => `/admin/faqs/${f.id}`}
        deleteAction={deleteFaq}
        toggleVisibleAction={toggleVisibleFaq}
      />
    </div>
  );
}
