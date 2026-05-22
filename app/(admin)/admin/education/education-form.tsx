"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { EducationFormState } from "@/actions/education";

type EducationFormProps = {
  initial?: {
    id?: string;
    institution?: string;
    degree?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string | null;
    current?: boolean;
    institutionUrl?: string | null;
    logoUrl?: string | null;
    logoPublicId?: string | null;
    order?: number;
    visible?: boolean;
  };
  action: (prev: EducationFormState, fd: FormData) => Promise<EducationFormState>;
  submitLabel: string;
};

export function EducationForm({ initial, action, submitLabel }: EducationFormProps) {
  const [state, formAction] = useActionState<EducationFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit education" : "New education"}
        backHref="/admin/education"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="institution" label="Institution" required defaultValue={initial?.institution} error={err("institution")} />
        <TextField name="degree" label="Degree" required defaultValue={initial?.degree} error={err("degree")} />
        <TextAreaField name="description" label="Description" rows={4} defaultValue={initial?.description} error={err("description")} />
        <TextField name="startDate" label="Start date" required defaultValue={initial?.startDate} error={err("startDate")} />
        <TextField name="endDate" label="End date" defaultValue={initial?.endDate} error={err("endDate")} />
        <BooleanField name="current" label="Currently here" defaultValue={initial?.current ?? false} />
        <UrlField name="institutionUrl" label="Institution URL" defaultValue={initial?.institutionUrl} error={err("institutionUrl")} />
        <ImageUploader folder="education" name="logoUrl" publicIdName="logoPublicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.logoPublicId} label="Logo" help="Recommended: 256×256px square (transparent PNG)" />
        <NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
