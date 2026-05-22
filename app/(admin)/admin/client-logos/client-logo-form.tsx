"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { ClientLogoFormState } from "@/actions/client-logos";

type ClientLogoFormProps = {
  initial?: {
    id?: string;
    name?: string;
    logoUrl?: string;
    publicId?: string;
    websiteUrl?: string | null;
    order?: number;
    visible?: boolean;
  };
  action: (prev: ClientLogoFormState, fd: FormData) => Promise<ClientLogoFormState>;
  submitLabel: string;
};

export function ClientLogoForm({ initial, action, submitLabel }: ClientLogoFormProps) {
  const [state, formAction] = useActionState<ClientLogoFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit client logo" : "New client logo"}
        backHref="/admin/client-logos"
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
        <ImageUploader
          folder="logos"
          name="logoUrl"
          publicIdName="publicId"
          initialUrl={initial?.logoUrl}
          initialPublicId={initial?.publicId}
          label="Logo"
          required
          help="Recommended: 400×120px (transparent PNG, ~3:1 aspect)"
        />
        <UrlField
          name="websiteUrl"
          label="Website URL"
          defaultValue={initial?.websiteUrl}
          error={err("websiteUrl")}
        />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
        <BooleanField
          name="visible"
          label="Visible"
          defaultValue={initial?.visible ?? true}
        />
      </FormSection>
    </form>
  );
}
