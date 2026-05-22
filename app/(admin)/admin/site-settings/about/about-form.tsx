"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateAbout, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { SubmitButton } from "@/components/admin/submit-button";

type AboutFormProps = {
  initial: {
    aboutPageTitle: string;
    aboutIntroContent: string;
    experienceHeading: string;
    educationHeading: string;
    certificationHeading: string;
  };
};

export function AboutForm({ initial }: AboutFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateAbout, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">About</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="aboutPageTitle" label="About page title" required defaultValue={initial.aboutPageTitle} error={err("aboutPageTitle")} />
        <TextAreaField name="aboutIntroContent" label="About intro (HTML — TipTap in 2B)" rows={10} help="Raw HTML for now; rich editor lands in Phase 2B." defaultValue={initial.aboutIntroContent} error={err("aboutIntroContent")} />
        <TextField name="experienceHeading" label="Experience section heading" required defaultValue={initial.experienceHeading} error={err("experienceHeading")} />
        <TextField name="educationHeading" label="Education section heading" required defaultValue={initial.educationHeading} error={err("educationHeading")} />
        <TextField name="certificationHeading" label="Certification section heading" required defaultValue={initial.certificationHeading} error={err("certificationHeading")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
