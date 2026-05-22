"use client";
import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { signCloudinaryUpload } from "@/actions/upload";

type ImageButtonProps = {
  editor: Editor;
};

export function ImageButton({ editor }: ImageButtonProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File) {
    setPending(true);
    try {
      const signed = await signCloudinaryUpload("blog");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", signed.apiKey);
      fd.append("timestamp", String(signed.timestamp));
      fd.append("signature", signed.signature);
      fd.append("folder", signed.folder);
      fd.append("eager", signed.eager);
      fd.append("eager_async", "true");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`,
        { method: "POST", body: fd },
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { secure_url: string };
      editor
        .chain()
        .focus()
        .setImage({ src: data.secure_url, alt: file.name })
        .run();
    } catch {
      // Silent fail — user sees no image inserted
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={pending}
        className="px-2 py-1 text-sm rounded hover:bg-card transition disabled:opacity-60"
        title="Insert image"
      >
        {pending ? "⏳" : "🖼"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ""; // allow re-picking same file
        }}
      />
    </>
  );
}
