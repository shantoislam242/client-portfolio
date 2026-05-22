import Link from "next/link";
import { listEducation } from "@/lib/db/education";
import { deleteEducation, toggleVisibleEducation } from "@/actions/education";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Education — admin" };

export default async function EducationListPage() {
  const rows = await listEducation();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Education ({rows.length})</h1>
        <Link
          href="/admin/education/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New education
        </Link>
      </header>
      <DataTable
        rows={rows}
        columns={[
          { key: "institution", label: "Institution" },
          { key: "degree", label: "Degree" },
          { key: "startDate", label: "Start" },
          { key: "endDate", label: "End", render: (r) => r.current ? "Present" : (r.endDate ?? "—") },
        ]}
        editHref={(r) => `/admin/education/${r.id}`}
        deleteAction={deleteEducation}
        toggleVisibleAction={toggleVisibleEducation}
      />
    </div>
  );
}
