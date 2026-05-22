import Link from "next/link";
import { listClientLogos } from "@/lib/db/client-logos";
import { deleteClientLogo, toggleVisibleClientLogo } from "@/actions/client-logos";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Client logos — admin" };

export default async function ClientLogosListPage() {
  const clientLogos = await listClientLogos();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Client logos ({clientLogos.length})</h1>
        <Link
          href="/admin/client-logos/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New logo
        </Link>
      </header>
      <DataTable
        rows={clientLogos}
        columns={[
          { key: "name", label: "Name" },
          { key: "order", label: "Order" },
        ]}
        editHref={(l) => `/admin/client-logos/${l.id}`}
        deleteAction={deleteClientLogo}
        toggleVisibleAction={toggleVisibleClientLogo}
      />
    </div>
  );
}
