"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { createProject, type ProjectFormState } from "@/actions/projects";

export function NewProjectForm() {
  const [state, formAction] = useActionState<ProjectFormState, FormData>(createProject, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <TextField name="title" label="Title" required error={err("title")} />
      <TextField name="slug" label="Slug" required placeholder="nokshi" error={err("slug")} />
      <TextField name="shortLabel" label="Short label" placeholder="Fashion Brand Identity" error={err("shortLabel")} />
      <TextField name="year" label="Year" placeholder="2023" error={err("year")} />
      <TextField name="client" label="Client" error={err("client")} />
      <TextField name="role" label="Role" error={err("role")} />
      <TextField name="services" label="Services" placeholder="Brand identity, Typography, Packaging" error={err("services")} />
      <UrlField name="liveUrl" label="Live URL" error={err("liveUrl")} />

      <ImageUploader
        folder="projects"
        name="coverImageUrl"
        publicIdName="coverPublicId"
        label="Cover image"
        help="Recommended: 1600×1000px (~16:10)"
        required
      />

      <ImageUploader
        folder="projects"
        name="cardImageUrl"
        publicIdName="cardPublicId"
        label="Card image (optional)"
        help="Recommended: 640×400px. Falls back to cover image if blank."
      />

      <TextAreaField
        name="excerpt"
        label="Excerpt"
        required
        rows={3}
        help="1–3 sentences shown in listings."
        error={err("excerpt")}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Intro content</label>
        <RichTextEditor
          name="introContent"
          initialHtml=""
          placeholder="Optional intro paragraph that appears above the sections…"
        />
      </div>

      <SubmitButton label="Create project" pendingLabel="Creating…" />
    </form>
  );
}
