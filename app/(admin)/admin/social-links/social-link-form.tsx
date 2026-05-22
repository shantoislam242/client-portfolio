"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { UrlField } from "@/components/admin/field/url-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { FormSection } from "@/components/admin/form-section";
import type { SocialLinkFormState } from "@/actions/social-links";

type SocialLinkFormProps = {
  initial?: {
    id?: string;
    platform?: string;
    label?: string;
    url?: string;
    iconKey?: string;
    order?: number;
    visible?: boolean;
  };
  action: (prev: SocialLinkFormState, fd: FormData) => Promise<SocialLinkFormState>;
  submitLabel: string;
};

export function SocialLinkForm({ initial, action, submitLabel }: SocialLinkFormProps) {
  const [state, formAction] = useActionState<SocialLinkFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit social link" : "New social link"}
        backHref="/admin/social-links"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="platform" label="Platform" required defaultValue={initial?.platform} error={err("platform")} />
        <TextField name="label" label="Label" required defaultValue={initial?.label} error={err("label")} />
        <UrlField name="url" label="URL" required defaultValue={initial?.url} error={err("url")} />
        <TextField name="iconKey" label="Icon key" required defaultValue={initial?.iconKey} error={err("iconKey")} />
        <NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
