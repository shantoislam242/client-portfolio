"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { ExperienceFormState } from "@/actions/experience";

type ExperienceFormProps = {
  initial?: {
    id?: string;
    company?: string;
    role?: string;
    description?: string;
    startDate?: string;
    endDate?: string | null;
    current?: boolean;
    companyUrl?: string | null;
    logoUrl?: string | null;
    logoPublicId?: string | null;
    order?: number;
    visible?: boolean;
  };
  action: (prev: ExperienceFormState, fd: FormData) => Promise<ExperienceFormState>;
  submitLabel: string;
};

export function ExperienceForm({ initial, action, submitLabel }: ExperienceFormProps) {
  const [state, formAction] = useActionState<ExperienceFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit experience" : "New experience"}
        backHref="/admin/experience"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="company" label="Company" required defaultValue={initial?.company} error={err("company")} />
        <TextField name="role" label="Role" required defaultValue={initial?.role} error={err("role")} />
        <TextAreaField name="description" label="Description" required rows={4} defaultValue={initial?.description} error={err("description")} />
        <TextField name="startDate" label="Start date" required placeholder="Jan 2026" defaultValue={initial?.startDate} error={err("startDate")} />
        <TextField name="endDate" label="End date (leave blank if current)" placeholder="Dec 2025" defaultValue={initial?.endDate} error={err("endDate")} />
        <BooleanField name="current" label="Currently here" defaultValue={initial?.current ?? false} />
        <UrlField name="companyUrl" label="Company URL" defaultValue={initial?.companyUrl} error={err("companyUrl")} />
        <ImageUploader folder="experience" name="logoUrl" publicIdName="logoPublicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.logoPublicId} label="Logo" />
        <NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
