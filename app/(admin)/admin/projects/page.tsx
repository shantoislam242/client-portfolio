import Link from "next/link";
import Image from "next/image";
import { listProjects } from "@/lib/db/projects";
import { deleteProject } from "@/actions/projects";
import { reorderProjects } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Projects — admin" };

export default async function ProjectsListPage() {
  const projects = await listProjects();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects ({projects.length})</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New project
        </Link>
      </header>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderProjects}
          items={projects.map((p) => ({
            id: p.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="relative h-12 w-20 flex-shrink-0 rounded overflow-hidden bg-background">
                  <Image
                    src={p.coverImageUrl}
                    alt={p.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.shortLabel ?? "—"}
                    {p.year && ` · ${p.year}`}
                    {p.client && ` · ${p.client}`}
                    {` · ${p.published ? "Published" : "Draft"}`}
                    {p.featured && " · Featured"}
                  </div>
                </div>
                <Link
                  href={`/admin/projects/${p.id}?tab=basics`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={p.id} action={deleteProject} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
