"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { ToolFormState } from "@/actions/tools";

type ToolFormProps = {
  initial?: {
    id?: string;
    name?: string;
    description?: string | null;
    category?: string | null;
    iconUrl?: string | null;
    iconPublicId?: string | null;
    iconExternalUrl?: string | null;
    proficiency?: number;
    order?: number;
    showOnHome?: boolean;
    visible?: boolean;
  };
  action: (prev: ToolFormState, fd: FormData) => Promise<ToolFormState>;
  submitLabel: string;
};

export function ToolForm({ initial, action, submitLabel }: ToolFormProps) {
  const [state, formAction] = useActionState<ToolFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit tool" : "New tool"}
        backHref="/admin/tools"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField
          name="name"
          label="Name"
          required
          defaultValue={initial?.name}
          error={err("name")}
        />
        <TextAreaField
          name="description"
          label="Description"
          defaultValue={initial?.description}
          rows={3}
          error={err("description")}
        />
        <TextField
          name="category"
          label="Category"
          defaultValue={initial?.category}
          error={err("category")}
        />
        <ImageUploader
          folder="tools"
          name="iconUrl"
          publicIdName="iconPublicId"
          initialUrl={initial?.iconUrl}
          initialPublicId={initial?.iconPublicId}
          label="Icon (uploaded)"
          help="Recommended: 128×128px (transparent PNG)"
        />
        <UrlField
          name="iconExternalUrl"
          label="External icon URL (e.g. skillicons.dev)"
          defaultValue={initial?.iconExternalUrl}
          error={err("iconExternalUrl")}
        />
        <NumberField
          name="proficiency"
          label="Proficiency (0–100)"
          defaultValue={initial?.proficiency ?? 80}
          min={0}
          max={100}
          error={err("proficiency")}
        />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
        <BooleanField
          name="showOnHome"
          label="Show on home page"
          defaultValue={initial?.showOnHome ?? true}
        />
        <BooleanField
          name="visible"
          label="Visible"
          defaultValue={initial?.visible ?? true}
        />
      </FormSection>
    </form>
  );
}
