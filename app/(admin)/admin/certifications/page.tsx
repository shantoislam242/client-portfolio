import Link from "next/link";
import { listCertifications } from "@/lib/db/certifications";
import { deleteCertification, toggleVisibleCertification } from "@/actions/certifications";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Certifications — admin" };

export default async function CertificationListPage() {
  const rows = await listCertifications();
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
      <DataTable
        rows={rows}
        columns={[
          { key: "institution", label: "Institution" },
          { key: "title", label: "Title" },
          { key: "startDate", label: "Start" },
          { key: "endDate", label: "End" },
        ]}
        editHref={(r) => `/admin/certifications/${r.id}`}
        deleteAction={deleteCertification}
        toggleVisibleAction={toggleVisibleCertification}
      />
    </div>
  );
}
