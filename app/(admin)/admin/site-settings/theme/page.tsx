import { getSiteSettings } from "@/lib/db/site-settings";
import { updateTheme } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";

export const metadata = { title: "Theme — site settings" };

export default async function ThemePage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateTheme} title="Theme">
      {({ err }) => (
        <>
          <TextField name="primaryColor" label="Primary color (hex)" required placeholder="#8b5cf6" defaultValue={s.primaryColor} error={err("primaryColor")} />
          <TextField name="accentColor" label="Accent color (hex, optional)" placeholder="#0000EE" defaultValue={s.accentColor} error={err("accentColor")} />
        </>
      )}
    </SettingsForm>
  );
}
