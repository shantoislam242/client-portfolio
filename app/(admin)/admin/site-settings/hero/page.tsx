import { getSiteSettings } from "@/lib/db/site-settings";
import { updateHero } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";

export const metadata = { title: "Hero — site settings" };

export default async function HeroPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateHero} title="Hero">
      {({ err }) => (
        <>
          <TextField name="heroHeadline" label="Hero headline" required defaultValue={s.heroHeadline} error={err("heroHeadline")} />
          <TextAreaField name="heroSubtext" label="Hero subtext" rows={3} defaultValue={s.heroSubtext} error={err("heroSubtext")} />
          <TextField name="heroPrimaryCtaLabel" label="Primary CTA label" required defaultValue={s.heroPrimaryCtaLabel} error={err("heroPrimaryCtaLabel")} />
          <TextField name="heroPrimaryCtaLink" label="Primary CTA link" required defaultValue={s.heroPrimaryCtaLink} error={err("heroPrimaryCtaLink")} />
          <TextField name="heroSecondaryCtaLabel" label="Secondary CTA label" required defaultValue={s.heroSecondaryCtaLabel} error={err("heroSecondaryCtaLabel")} />
          <TextField name="heroSecondaryCtaLink" label="Secondary CTA link" required defaultValue={s.heroSecondaryCtaLink} error={err("heroSecondaryCtaLink")} />
        </>
      )}
    </SettingsForm>
  );
}
