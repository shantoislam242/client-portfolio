import Link from "next/link";
import { listTools } from "@/lib/db/tools";
import { deleteTool, toggleVisibleTool } from "@/actions/tools";
import { reorderTools } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";
import { VisibleToggle } from "@/components/admin/visible-toggle";

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

      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tools yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderTools}
          items={tools.map((tool) => ({
            id: tool.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{tool.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tool.category ?? "—"}
                  </div>
                </div>
                <VisibleToggle
                  id={tool.id}
                  visible={tool.visible}
                  action={toggleVisibleTool}
                />
                <Link
                  href={`/admin/tools/${tool.id}`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={tool.id} action={deleteTool} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
