import { getSiteSettings } from "@/lib/db/site-settings";
import { updateStats } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";

export const metadata = { title: "Stats — site settings" };

export default async function StatsPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateStats} title="Stats">
      {({ err }) => (
        <>
          <NumberField name="statYearsExperience" label="Years of experience" min={0} defaultValue={s.statYearsExperience} error={err("statYearsExperience")} />
          <TextField name="statYearsLabel" label="Years label" required defaultValue={s.statYearsLabel} error={err("statYearsLabel")} />
          <NumberField name="statProjects" label="Projects completed" min={0} defaultValue={s.statProjects} error={err("statProjects")} />
          <TextField name="statProjectsLabel" label="Projects label" required defaultValue={s.statProjectsLabel} error={err("statProjectsLabel")} />
          <NumberField name="statClients" label="Happy clients" min={0} defaultValue={s.statClients} error={err("statClients")} />
          <TextField name="statClientsLabel" label="Clients label" required defaultValue={s.statClientsLabel} error={err("statClientsLabel")} />
          <BooleanField name="statsShowPlus" label="Show '+' suffix on numbers" defaultValue={s.statsShowPlus} />
        </>
      )}
    </SettingsForm>
  );
}
