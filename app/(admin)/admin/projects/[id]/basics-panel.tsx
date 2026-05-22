"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor/editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateBasics, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function BasicsPanel({ project }: Props) {
  const action = updateBasics.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      {state?.error && !state?.issues && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200"
        >
          {state.error}
        </div>
      )}

      <TextField name="title" label="Title" required defaultValue={project.title} error={err("title")} />
      <TextField name="slug" label="Slug" required defaultValue={project.slug} placeholder="nokshi" error={err("slug")} />
      <TextField name="shortLabel" label="Short label" defaultValue={project.shortLabel} placeholder="Fashion Brand Identity" error={err("shortLabel")} />
      <TextField name="year" label="Year" defaultValue={project.year} placeholder="2023" error={err("year")} />
      <TextField name="client" label="Client" defaultValue={project.client} error={err("client")} />
      <TextField name="role" label="Role" defaultValue={project.role} error={err("role")} />
      <TextField name="services" label="Services" defaultValue={project.services.join(", ")} placeholder="Brand identity, Typography, Packaging" error={err("services")} />
      <UrlField name="liveUrl" label="Live URL" defaultValue={project.liveUrl} error={err("liveUrl")} />

      <ImageUploader
        folder="projects"
        name="coverImageUrl"
        publicIdName="coverPublicId"
        initialUrl={project.coverImageUrl}
        initialPublicId={project.coverPublicId}
        label="Cover image"
        help="Recommended: 1600×1000px (~16:10)"
        required
      />

      <ImageUploader
        folder="projects"
        name="cardImageUrl"
        publicIdName="cardPublicId"
        initialUrl={project.cardImageUrl}
        initialPublicId={project.cardPublicId}
        label="Card image (optional)"
        help="Recommended: 640×400px. Falls back to cover image if blank."
      />

      <TextAreaField
        name="excerpt"
        label="Excerpt"
        required
        rows={3}
        defaultValue={project.excerpt}
        help="1–3 sentences shown in listings and previews."
        error={err("excerpt")}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Intro content</label>
        <RichTextEditor
          name="introContent"
          initialHtml={project.introContent ?? ""}
          placeholder="Optional intro paragraph that appears above the sections…"
        />
      </div>

      <SubmitButton label="Save Basics" />
    </form>
  );
}
