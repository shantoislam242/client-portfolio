"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/react";

type LinkPopoverProps = {
  editor: Editor;
  open: boolean;
  onClose: () => void;
};

export function LinkPopover({ editor, open, onClose }: LinkPopoverProps) {
  const existing = editor.getAttributes("link").href as string | undefined;
  const [href, setHref] = useState(existing ?? "");

  if (!open) return null;

  function apply() {
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  }

  return (
    <div className="absolute z-10 mt-1 rounded-md border border-border bg-card p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://"
          className="rounded-md bg-background border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple w-64"
          autoFocus
        />
        <button
          type="button"
          onClick={apply}
          className="rounded-full bg-accent-purple px-3 py-1 text-xs font-medium hover:opacity-90"
        >
          Apply
        </button>
        {existing && (
          <button
            type="button"
            onClick={remove}
            className="rounded-full border border-border px-3 py-1 text-xs hover:bg-card transition"
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
