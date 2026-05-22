"use client";
import { useState, useTransition } from "react";

type DeleteButtonProps = {
  id: string;
  action: (id: string) => Promise<unknown>;
  label?: string;
};

export function DeleteButton({ id, action, label = "Delete" }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-red-300">Confirm?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => action(id).then(() => setConfirming(false)))}
          className="text-red-400 hover:underline text-sm"
        >
          {pending ? "Deleting…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-muted-foreground hover:underline text-sm"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-red-400 hover:underline"
    >
      {label}
    </button>
  );
}
