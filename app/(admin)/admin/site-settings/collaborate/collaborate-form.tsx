"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateCollaborate, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { SubmitButton } from "@/components/admin/submit-button";

type CollaborateFormProps = {
  initial: {
    ctaSectionLineOne: string;
    ctaSectionLineTwo: string;
    ctaSectionText: string | null;
    ctaSectionButtonLabel: string;
    ctaSectionButtonLink: string;
  };
};

export function CollaborateForm({ initial }: CollaborateFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateCollaborate, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Collaborate</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="ctaSectionLineOne" label="Headline line 1" required defaultValue={initial.ctaSectionLineOne} error={err("ctaSectionLineOne")} />
        <TextField name="ctaSectionLineTwo" label="Headline line 2" required defaultValue={initial.ctaSectionLineTwo} error={err("ctaSectionLineTwo")} />
        <TextAreaField name="ctaSectionText" label="Body text" rows={3} defaultValue={initial.ctaSectionText} error={err("ctaSectionText")} />
        <TextField name="ctaSectionButtonLabel" label="Button label" required defaultValue={initial.ctaSectionButtonLabel} error={err("ctaSectionButtonLabel")} />
        <TextField name="ctaSectionButtonLink" label="Button link" required defaultValue={initial.ctaSectionButtonLink} error={err("ctaSectionButtonLink")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
