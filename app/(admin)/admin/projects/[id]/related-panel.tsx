"use client";
import { useActionState, useState, useMemo } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextField } from "@/components/admin/field/text-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateRelated, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren, AvailableProject } from "../project-shared";

type Props = {
  project: ProjectWithChildren;
  available: AvailableProject[];
};

export function RelatedPanel({ project, available }: Props) {
  const action = updateRelated.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  const initialSelectedIds = project.relatedProjects.map((r) => r.relatedId);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [search, setSearch] = useState("");

  const allById = useMemo(() => {
    const map = new Map<string, AvailableProject>();
    for (const p of available) map.set(p.id, p);
    for (const r of project.relatedProjects) {
      map.set(r.relatedId, {
        id: r.related.id,
        title: r.related.title,
        slug: r.related.slug,
        coverImageUrl: r.related.coverImageUrl,
      });
    }
    return map;
  }, [available, project.relatedProjects]);

  const filteredAvailable = useMemo(() => {
    const s = search.trim().toLowerCase();
    return available
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => (s ? p.title.toLowerCase().includes(s) : true));
  }, [available, selectedIds, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setSelectedIds((prev) => {
      const oldIdx = prev.indexOf(String(e.active.id));
      const newIdx = prev.indexOf(String(e.over!.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addId(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeId(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Related projects ({selectedIds.length})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick from other projects. Drag to reorder. Shown in the &quot;More projects&quot; section on the project page.
        </p>
      </header>

      <TextField
        name="relatedHeading"
        label="Section heading"
        required
        defaultValue={project.relatedHeading}
        placeholder="More Projects"
      />

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <section>
          <h3 className="text-sm font-medium mb-2">Selected</h3>
          {selectedIds.length === 0 ? (
            <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md p-4">
              None yet. Click an available project to add.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                {selectedIds.map((id) => {
                  const info = allById.get(id);
                  return (
                    <SelectedRow
                      key={id}
                      id={id}
                      title={info?.title ?? id}
                      coverImageUrl={info?.coverImageUrl ?? ""}
                      onRemove={() => removeId(id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium mb-2">Available</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple mb-2"
          />
          {filteredAvailable.length === 0 ? (
            <p className="text-xs text-muted-foreground">No matches.</p>
          ) : (
            <ul>
              {filteredAvailable.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addId(p.id)}
                    className="flex items-center gap-2 w-full text-left border border-border rounded-md bg-card px-3 py-2 mb-1.5 hover:border-accent-purple transition"
                  >
                    <div className="relative h-8 w-12 flex-shrink-0 rounded overflow-hidden bg-background">
                      {p.coverImageUrl && (
                        <Image src={p.coverImageUrl} alt={p.title} fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                    <span className="text-sm truncate">{p.title}</span>
                    <span className="ml-auto text-xs text-accent-purple">+ Add</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <input type="hidden" name="related.count" value={selectedIds.length} />
      {selectedIds.map((id, i) => (
        <input key={id} type="hidden" name={`related.${i}.id`} value={id} />
      ))}

      <SubmitButton label="Save related" />
    </form>
  );
}

function SelectedRow({
  id,
  title,
  coverImageUrl,
  onRemove,
}: {
  id: string;
  title: string;
  coverImageUrl: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border border-border rounded-md bg-card px-3 py-2 mb-1.5">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="touch-none cursor-grab active:cursor-grabbing select-none px-1.5 py-1 text-muted-foreground hover:text-foreground rounded transition"
        {...listeners}
        {...(attributes as unknown as Record<string, unknown>)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </button>
      <div className="relative h-8 w-12 flex-shrink-0 rounded overflow-hidden bg-background">
        {coverImageUrl && (
          <Image src={coverImageUrl} alt={title} fill sizes="48px" className="object-cover" />
        )}
      </div>
      <span className="text-sm truncate flex-1">{title}</span>
      <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:underline">
        Remove
      </button>
    </div>
  );
}
