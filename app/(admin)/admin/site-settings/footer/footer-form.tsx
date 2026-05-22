"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateFooter, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { SubmitButton } from "@/components/admin/submit-button";

type FooterFormProps = {
  initial: {
    footerText: string;
    footerShowYear: boolean;
    footerCopyright: string | null;
  };
};

export function FooterForm({ initial }: FooterFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateFooter, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Footer</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="footerText" label="Footer text" required defaultValue={initial.footerText} error={err("footerText")} />
        <BooleanField name="footerShowYear" label="Show current year" defaultValue={initial.footerShowYear} />
        <TextField name="footerCopyright" label="Copyright line (optional)" defaultValue={initial.footerCopyright} error={err("footerCopyright")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
