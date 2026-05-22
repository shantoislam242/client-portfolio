import { getSiteSettings } from "@/lib/db/site-settings";
import { updateFooter } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { BooleanField } from "@/components/admin/field/boolean-field";

export const metadata = { title: "Footer — site settings" };

export default async function FooterPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateFooter} title="Footer">
      {({ err }) => (
        <>
          <TextField name="footerText" label="Footer text" required defaultValue={s.footerText} error={err("footerText")} />
          <BooleanField name="footerShowYear" label="Show current year" defaultValue={s.footerShowYear} />
          <TextField name="footerCopyright" label="Copyright line (optional)" defaultValue={s.footerCopyright} error={err("footerCopyright")} />
        </>
      )}
    </SettingsForm>
  );
}
