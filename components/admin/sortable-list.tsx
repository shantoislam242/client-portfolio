"use client";
import { useState, useTransition, useEffect } from "react";
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
import { toast } from "sonner";

type SortableListProps = {
  ids: string[];
  reorderAction: (ids: string[]) => Promise<unknown>;
  children: (orderedIds: string[]) => React.ReactNode;
};

export function SortableList({ ids, reorderAction, children }: SortableListProps) {
  const [order, setOrder] = useState(ids);
  const [, startTransition] = useTransition();

  // Sync when parent ids change (after a delete or fresh fetch).
  useEffect(() => {
    setOrder(ids);
  }, [ids]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = order.indexOf(String(e.active.id));
    const newIdx = order.indexOf(String(e.over.id));
    const next = arrayMove(order, oldIdx, newIdx);
    setOrder(next);
    startTransition(async () => {
      try {
        await reorderAction(next);
      } catch {
        setOrder(ids); // revert
        toast.error("Reorder failed");
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {children(order)}
      </SortableContext>
    </DndContext>
  );
}

type SortableRowProps = {
  id: string;
  children: (handle: {
    listeners: Record<string, (e: unknown) => void> | undefined;
    attributes: Record<string, unknown>;
  }) => React.ReactNode;
};

export function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "shadow-lg" : ""}>
      {children({
        listeners: listeners as Record<string, (e: unknown) => void> | undefined,
        attributes: attributes as unknown as Record<string, unknown>,
      })}
    </div>
  );
}
