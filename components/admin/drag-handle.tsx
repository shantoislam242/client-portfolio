"use client";
import { useRowHandle } from "./sortable-list";

export function DragHandle() {
  const handle = useRowHandle();
  const listeners = handle?.listeners ?? {};
  const attributes = handle?.attributes ?? {};

  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="touch-none cursor-grab active:cursor-grabbing select-none px-1.5 py-1 text-muted-foreground hover:text-foreground rounded transition"
      {...listeners}
      {...attributes}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="4" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" />
        <circle cx="10" cy="3" r="1.2" />
        <circle cx="10" cy="7" r="1.2" />
        <circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  );
}
