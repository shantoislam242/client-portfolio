"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateHero, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { SubmitButton } from "@/components/admin/submit-button";

type HeroFormProps = {
  initial: {
    heroHeadline: string;
    heroSubtext: string;
    heroPrimaryCtaLabel: string;
    heroPrimaryCtaLink: string;
    heroSecondaryCtaLabel: string;
    heroSecondaryCtaLink: string;
  };
};

export function HeroForm({ initial }: HeroFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateHero, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Hero</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="heroHeadline" label="Hero headline" required defaultValue={initial.heroHeadline} error={err("heroHeadline")} />
        <TextAreaField name="heroSubtext" label="Hero subtext" rows={3} defaultValue={initial.heroSubtext} error={err("heroSubtext")} />
        <TextField name="heroPrimaryCtaLabel" label="Primary CTA label" required defaultValue={initial.heroPrimaryCtaLabel} error={err("heroPrimaryCtaLabel")} />
        <TextField name="heroPrimaryCtaLink" label="Primary CTA link" required defaultValue={initial.heroPrimaryCtaLink} error={err("heroPrimaryCtaLink")} />
        <TextField name="heroSecondaryCtaLabel" label="Secondary CTA label" required defaultValue={initial.heroSecondaryCtaLabel} error={err("heroSecondaryCtaLabel")} />
        <TextField name="heroSecondaryCtaLink" label="Secondary CTA link" required defaultValue={initial.heroSecondaryCtaLink} error={err("heroSecondaryCtaLink")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
