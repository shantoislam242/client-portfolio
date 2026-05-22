"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import { buildExtensions } from "./extensions";
import { Toolbar } from "./toolbar";

type RichTextEditorProps = {
  name: string;
  initialHtml?: string;
  placeholder?: string;
  minHeight?: number;
};

export function RichTextEditor({
  name,
  initialHtml = "",
  placeholder,
  minHeight = 240,
}: RichTextEditorProps) {
  const [html, setHtml] = useState(initialHtml);

  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content: initialHtml,
    immediatelyRender: false, // SSR-safe per TipTap docs
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-a:text-accent-purple prose-img:rounded-md prose-blockquote:border-l-accent-purple max-w-none px-4 py-3 focus:outline-none",
      },
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="rounded-md border border-border bg-background animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className="rounded-md border border-border bg-background overflow-hidden">
      <Toolbar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
