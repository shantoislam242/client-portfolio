"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { CertificationFormState } from "@/actions/certifications";

type CertificationFormProps = {
  initial?: {
    id?: string;
    institution?: string;
    title?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string | null;
    credentialUrl?: string | null;
    logoUrl?: string | null;
    logoPublicId?: string | null;
    order?: number;
    visible?: boolean;
  };
  action: (prev: CertificationFormState, fd: FormData) => Promise<CertificationFormState>;
  submitLabel: string;
};

export function CertificationForm({ initial, action, submitLabel }: CertificationFormProps) {
  const [state, formAction] = useActionState<CertificationFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit certification" : "New certification"}
        backHref="/admin/certifications"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="institution" label="Institution" required defaultValue={initial?.institution} error={err("institution")} />
        <TextField name="title" label="Title" required defaultValue={initial?.title} error={err("title")} />
        <TextAreaField name="description" label="Description" rows={4} defaultValue={initial?.description} error={err("description")} />
        <TextField name="startDate" label="Start date" required defaultValue={initial?.startDate} error={err("startDate")} />
        <TextField name="endDate" label="End date" defaultValue={initial?.endDate} error={err("endDate")} />
        <UrlField name="credentialUrl" label="Credential URL" defaultValue={initial?.credentialUrl} error={err("credentialUrl")} />
        <ImageUploader folder="certifications" name="logoUrl" publicIdName="logoPublicId" initialUrl={initial?.logoUrl} initialPublicId={initial?.logoPublicId} label="Logo" help="Recommended: 256×256px square (transparent PNG)" />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
