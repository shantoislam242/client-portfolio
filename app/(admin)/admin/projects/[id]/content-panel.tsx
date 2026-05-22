"use client";
import { useActionState, useState } from "react";
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
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateContent, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type SectionItem = {
  uid: string;
  heading: string;
  content: string;
};

let nextUid = 0;
function makeUid() {
  return `s-${Date.now()}-${nextUid++}`;
}

type Props = { project: ProjectWithChildren };

export function ContentPanel({ project }: Props) {
  const action = updateContent.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  const [sections, setSections] = useState<SectionItem[]>(() =>
    project.sections.map((s) => ({ uid: makeUid(), heading: s.heading, content: s.content })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setSections((prev) => {
      const oldIdx = prev.findIndex((s) => s.uid === String(e.active.id));
      const newIdx = prev.findIndex((s) => s.uid === String(e.over!.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addSection() {
    setSections((prev) => [...prev, { uid: makeUid(), heading: "", content: "" }]);
  }

  function deleteSection(uid: string) {
    setSections((prev) => prev.filter((s) => s.uid !== uid));
  }

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Content sections ({sections.length})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag to reorder. Each section is a heading + rich-text body.
        </p>
      </header>

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.uid)} strategy={verticalListSortingStrategy}>
          {sections.map((s, i) => (
            <SortableSection
              key={s.uid}
              section={s}
              index={i}
              onDelete={() => deleteSection(s.uid)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <input type="hidden" name="sections.count" value={sections.length} />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addSection}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card transition"
        >
          + Add section
        </button>
        <SubmitButton label="Save sections" />
      </div>
    </form>
  );
}

type SortableSectionProps = {
  section: SectionItem;
  index: number;
  onDelete: () => void;
};

function SortableSection({ section, index, onDelete }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.uid,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-md bg-card p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
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
        <span className="text-xs text-muted-foreground">Section {index + 1}</span>
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto text-xs text-red-400 hover:underline"
        >
          Delete
        </button>
      </div>

      <TextField
        name={`sections.${index}.heading`}
        label="Heading"
        required
        defaultValue={section.heading}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Body</label>
        <RichTextEditor
          name={`sections.${index}.content`}
          initialHtml={section.content}
          placeholder="Write the section body…"
          minHeight={160}
        />
      </div>
    </div>
  );
}
