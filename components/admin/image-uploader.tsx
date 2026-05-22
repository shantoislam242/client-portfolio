"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { signCloudinaryUpload } from "@/actions/upload";

type CloudinaryFolder =
  | "projects"
  | "blog"
  | "tools"
  | "testimonials"
  | "logos"
  | "experience"
  | "education"
  | "certifications"
  | "site";

type ImageUploaderProps = {
  folder: CloudinaryFolder;
  name: string;
  publicIdName: string;
  initialUrl?: string | null;
  initialPublicId?: string | null;
  label: string;
  required?: boolean;
  help?: string;
};

type State = {
  status: "idle" | "signing" | "uploading" | "done" | "error";
  url: string;
  publicId: string;
  oldPublicId: string;
  error?: string;
};

export function ImageUploader({
  folder,
  name,
  publicIdName,
  initialUrl,
  initialPublicId,
  label,
  required,
  help,
}: ImageUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({
    status: initialUrl ? "done" : "idle",
    url: initialUrl ?? "",
    publicId: initialPublicId ?? "",
    oldPublicId: initialPublicId ?? "",
  });

  async function handleFile(file: File) {
    setState((s) => ({ ...s, status: "signing", error: undefined }));
    let signed;
    try {
      signed = await signCloudinaryUpload(folder);
    } catch {
      setState((s) => ({ ...s, status: "error", error: "Could not get upload signature" }));
      return;
    }

    setState((s) => ({ ...s, status: "uploading" }));
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
    if (!res.ok) {
      setState((s) => ({ ...s, status: "error", error: "Cloudinary upload failed" }));
      return;
    }
    const data = (await res.json()) as { secure_url: string; public_id: string };
    setState((s) => ({
      status: "done",
      url: data.secure_url,
      publicId: data.public_id,
      oldPublicId: s.oldPublicId,
    }));
  }

  return (
    <div className="mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>

      <input type="hidden" name={name} value={state.url} />
      <input type="hidden" name={publicIdName} value={state.publicId} />
      {state.oldPublicId && state.oldPublicId !== state.publicId && (
        <input type="hidden" name={`${name}__oldPublicId`} value={state.oldPublicId} />
      )}

      {state.status === "done" && state.url && (
        <div className="flex items-center gap-4 mb-2">
          <div className="relative h-24 w-24 rounded-md overflow-hidden bg-card border border-border">
            <Image src={state.url} alt={label} fill sizes="96px" />
          </div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="text-sm text-accent-purple hover:underline"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => setState({ status: "idle", url: "", publicId: "", oldPublicId: state.oldPublicId })}
            className="text-sm text-muted-foreground hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {state.status !== "done" && (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="border-2 border-dashed border-border rounded-md px-4 py-6 text-sm text-muted-foreground hover:border-accent-purple hover:text-foreground transition w-full"
          disabled={state.status === "signing" || state.status === "uploading"}
        >
          {state.status === "signing" && "Preparing…"}
          {state.status === "uploading" && "Uploading…"}
          {(state.status === "idle" || state.status === "error") && "Click to choose an image"}
        </button>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
      {state.error && <p className="text-sm text-red-400 mt-1">{state.error}</p>}
    </div>
  );
}
