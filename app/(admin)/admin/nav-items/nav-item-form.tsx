"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { FormSection } from "@/components/admin/form-section";
import type { NavItemFormState } from "@/actions/nav-items";

type NavItemFormProps = {
  initial?: {
    id?: string;
    label?: string;
    href?: string;
    iconKey?: string;
    order?: number;
    external?: boolean;
    visible?: boolean;
  };
  action: (prev: NavItemFormState, fd: FormData) => Promise<NavItemFormState>;
  submitLabel: string;
};

export function NavItemForm({ initial, action, submitLabel }: NavItemFormProps) {
  const [state, formAction] = useActionState<NavItemFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit nav item" : "New nav item"}
        backHref="/admin/nav-items"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="label" label="Label" required defaultValue={initial?.label} error={err("label")} />
        <TextField name="href" label="Href" required defaultValue={initial?.href} error={err("href")} />
        <TextField name="iconKey" label="Icon key" defaultValue={initial?.iconKey ?? "link"} error={err("iconKey")} />
        <NumberField name="order" label="Order" min={0} defaultValue={initial?.order ?? 0} error={err("order")} />
        <BooleanField name="external" label="External link" defaultValue={initial?.external ?? false} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
