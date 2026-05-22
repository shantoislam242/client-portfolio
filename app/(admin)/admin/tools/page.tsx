import Link from "next/link";
import { listTools } from "@/lib/db/tools";
import { deleteTool, toggleVisibleTool } from "@/actions/tools";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Tools — admin" };

export default async function ToolsListPage() {
  const tools = await listTools();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tools ({tools.length})</h1>
        <Link
          href="/admin/tools/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New tool
        </Link>
      </header>
      <DataTable
        rows={tools}
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "order", label: "Order" },
        ]}
        editHref={(t) => `/admin/tools/${t.id}`}
        deleteAction={deleteTool}
        toggleVisibleAction={toggleVisibleTool}
      />
    </div>
  );
}
