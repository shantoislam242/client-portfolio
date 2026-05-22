import { getSiteSettings } from "@/lib/db/site-settings";
import { updateAbout } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";

export const metadata = { title: "About — site settings" };

export default async function AboutPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateAbout} title="About">
      {({ err }) => (
        <>
          <TextField name="aboutPageTitle" label="About page title" required defaultValue={s.aboutPageTitle} error={err("aboutPageTitle")} />
          <TextAreaField name="aboutIntroContent" label="About intro (HTML — TipTap in 2B)" rows={10} help="Raw HTML for now; rich editor lands in Phase 2B." defaultValue={s.aboutIntroContent} error={err("aboutIntroContent")} />
          <TextField name="experienceHeading" label="Experience section heading" required defaultValue={s.experienceHeading} error={err("experienceHeading")} />
          <TextField name="educationHeading" label="Education section heading" required defaultValue={s.educationHeading} error={err("educationHeading")} />
          <TextField name="certificationHeading" label="Certification section heading" required defaultValue={s.certificationHeading} error={err("certificationHeading")} />
        </>
      )}
    </SettingsForm>
  );
}
