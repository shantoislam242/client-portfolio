"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateSeo, type ProjectFormState } from "@/actions/projects";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function SeoPanel({ project }: Props) {
  const action = updateSeo.bind(null, project.id);
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, null);

  return (
    <form action={formAction}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">SEO & publish</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Override defaults derived from title and excerpt. Publishing sets the first-published
          date automatically.
        </p>
      </header>

      {state?.error && !state?.issues && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <TextField
        name="metaTitle"
        label="Meta title (override)"
        defaultValue={project.metaTitle}
        placeholder="Defaults to project title"
      />

      <TextAreaField
        name="metaDescription"
        label="Meta description (override)"
        rows={2}
        defaultValue={project.metaDescription}
        help="Defaults to excerpt if blank."
      />

      <BooleanField name="featured" label="Featured" defaultValue={project.featured} />
      <BooleanField name="published" label="Published" defaultValue={project.published} />

      <p className="text-xs text-muted-foreground mb-4">
        Currently {project.published ? "published" : "draft"}.
        {project.publishedAt && ` First published ${project.publishedAt.toISOString().slice(0, 10)}.`}
      </p>

      <SubmitButton label="Save SEO" />
    </form>
  );
}
