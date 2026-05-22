"use client";
import { createContext, useContext, useState, useTransition } from "react";
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

// Context to pass drag listeners from SortableRow down to <DragHandle />
type Handle = {
  listeners: Record<string, (e: unknown) => void> | undefined;
  attributes: Record<string, unknown>;
};
const RowHandleContext = createContext<Handle | null>(null);

export function useRowHandle(): Handle | null {
  return useContext(RowHandleContext);
}

type SortableItem = { id: string; content: React.ReactNode };

type SortableListProps = {
  items: SortableItem[];
  reorderAction: (ids: string[]) => Promise<unknown>;
};

export function SortableList({ items, reorderAction }: SortableListProps) {
  const initialIds = items.map((i) => i.id);
  const [order, setOrder] = useState(initialIds);
  const [lastInitial, setLastInitial] = useState(initialIds);
  const [, startTransition] = useTransition();

  // Adjust state during render when items prop changes (after delete or fresh fetch).
  // Compare lengths + element-wise — array identity isn't stable on Server re-renders.
  const initialChanged =
    initialIds.length !== lastInitial.length ||
    initialIds.some((id, i) => id !== lastInitial[i]);
  if (initialChanged) {
    setLastInitial(initialIds);
    setOrder(initialIds);
  }

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
        setOrder(initialIds);
        toast.error("Reorder failed");
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {order.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          return <InnerRow key={id} id={id} content={item.content} />;
        })}
      </SortableContext>
    </DndContext>
  );
}

function InnerRow({ id, content }: { id: string; content: React.ReactNode }) {
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

  const handle: Handle = {
    listeners: listeners as unknown as Handle["listeners"],
    attributes: attributes as unknown as Handle["attributes"],
  };

  return (
    <RowHandleContext.Provider value={handle}>
      <div ref={setNodeRef} style={style} className={isDragging ? "shadow-lg" : ""}>
        {content}
      </div>
    </RowHandleContext.Provider>
  );
}
