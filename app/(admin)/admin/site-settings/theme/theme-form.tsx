"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateTheme, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { SubmitButton } from "@/components/admin/submit-button";

type ThemeFormProps = {
  initial: {
    primaryColor: string;
    accentColor: string | null;
  };
};

export function ThemeForm({ initial }: ThemeFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateTheme, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Theme</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="primaryColor" label="Primary color (hex)" required placeholder="#8b5cf6" defaultValue={initial.primaryColor} error={err("primaryColor")} />
        <TextField name="accentColor" label="Accent color (hex, optional)" placeholder="#0000EE" defaultValue={initial.accentColor} error={err("accentColor")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
