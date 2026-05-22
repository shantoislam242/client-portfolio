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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextField } from "@/components/admin/field/text-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateGallery, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type SlotItem = {
  uid: string;
  url: string;
  publicId: string;
  alt: string;
  caption: string;
};

let nextUid = 0;
function makeUid() {
  return `g-${Date.now()}-${nextUid++}`;
}

type Props = { project: ProjectWithChildren };

export function GalleryPanel({ project }: Props) {
  const action = updateGallery.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  const [slots, setSlots] = useState<SlotItem[]>(() =>
    project.galleryImages.map((img) => ({
      uid: makeUid(),
      url: img.url,
      publicId: img.publicId,
      alt: img.alt ?? "",
      caption: img.caption ?? "",
    })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setSlots((prev) => {
      const oldIdx = prev.findIndex((s) => s.uid === String(e.active.id));
      const newIdx = prev.findIndex((s) => s.uid === String(e.over!.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { uid: makeUid(), url: "", publicId: "", alt: "", caption: "" },
    ]);
  }

  function removeSlot(uid: string) {
    setSlots((prev) => prev.filter((s) => s.uid !== uid));
  }

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Gallery ({slots.length} {slots.length === 1 ? "image" : "images"})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag to reorder. Each slot is a Cloudinary-uploaded image with optional alt + caption.
        </p>
      </header>

      <TextField
        name="galleryHeading"
        label="Gallery section heading"
        required
        defaultValue={project.galleryHeading}
        placeholder="Selected Visuals"
      />

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slots.map((s) => s.uid)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {slots.map((s, i) => (
              <SortableSlot key={s.uid} slot={s} index={i} onRemove={() => removeSlot(s.uid)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <input type="hidden" name="images.count" value={slots.length} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSlot}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card transition"
        >
          + Add image
        </button>
        <SubmitButton label="Save gallery" />
      </div>
    </form>
  );
}

function SortableSlot({
  slot,
  index,
  onRemove,
}: {
  slot: SlotItem;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.uid,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-md bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
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
        <span className="text-xs text-muted-foreground">Image {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-xs text-red-400 hover:underline"
        >
          Remove
        </button>
      </div>

      <ImageUploader
        folder="projects"
        name={`images.${index}.url`}
        publicIdName={`images.${index}.publicId`}
        initialUrl={slot.url || null}
        initialPublicId={slot.publicId || null}
        label=""
        help="Recommended: 1600×1200px"
      />

      <TextField
        name={`images.${index}.alt`}
        label="Alt text"
        defaultValue={slot.alt}
        placeholder="Describe the image for accessibility"
      />

      <TextField
        name={`images.${index}.caption`}
        label="Caption"
        defaultValue={slot.caption}
        placeholder="Optional caption shown below the image"
      />
    </div>
  );
}
