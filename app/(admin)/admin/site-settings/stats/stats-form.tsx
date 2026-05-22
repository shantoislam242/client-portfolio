"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateStats, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { SubmitButton } from "@/components/admin/submit-button";

type StatsFormProps = {
  initial: {
    statYearsExperience: number;
    statYearsLabel: string;
    statProjects: number;
    statProjectsLabel: string;
    statClients: number;
    statClientsLabel: string;
    statsShowPlus: boolean;
  };
};

export function StatsForm({ initial }: StatsFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateStats, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Stats</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <NumberField name="statYearsExperience" label="Years of experience" min={0} defaultValue={initial.statYearsExperience} error={err("statYearsExperience")} />
        <TextField name="statYearsLabel" label="Years label" required defaultValue={initial.statYearsLabel} error={err("statYearsLabel")} />
        <NumberField name="statProjects" label="Projects completed" min={0} defaultValue={initial.statProjects} error={err("statProjects")} />
        <TextField name="statProjectsLabel" label="Projects label" required defaultValue={initial.statProjectsLabel} error={err("statProjectsLabel")} />
        <NumberField name="statClients" label="Happy clients" min={0} defaultValue={initial.statClients} error={err("statClients")} />
        <TextField name="statClientsLabel" label="Clients label" required defaultValue={initial.statClientsLabel} error={err("statClientsLabel")} />
        <BooleanField name="statsShowPlus" label="Show '+' suffix on numbers" defaultValue={initial.statsShowPlus} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
