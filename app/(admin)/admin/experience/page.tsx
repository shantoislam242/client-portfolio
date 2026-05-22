import Link from "next/link";
import { listExperience } from "@/lib/db/experience";
import { deleteExperience, toggleVisibleExperience } from "@/actions/experience";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Experience — admin" };

export default async function ExperienceListPage() {
  const rows = await listExperience();
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
      <DataTable
        rows={rows}
        columns={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "startDate", label: "Start" },
          { key: "endDate", label: "End", render: (r) => r.current ? "Present" : (r.endDate ?? "—") },
          { key: "order", label: "Order" },
        ]}
        editHref={(r) => `/admin/experience/${r.id}`}
        deleteAction={deleteExperience}
        toggleVisibleAction={toggleVisibleExperience}
      />
    </div>
  );
}
