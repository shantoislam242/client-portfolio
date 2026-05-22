import { getSiteSettings } from "@/lib/db/site-settings";
import { updateContact } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";

export const metadata = { title: "Contact — site settings" };

export default async function ContactPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateContact} title="Contact">
      {({ err }) => (
        <>
          <TextField name="contactPageTitle" label="Contact page title" required defaultValue={s.contactPageTitle} error={err("contactPageTitle")} />
          <TextAreaField name="contactPageSubtitle" label="Contact page subtitle" rows={2} defaultValue={s.contactPageSubtitle} error={err("contactPageSubtitle")} />
          <TextField name="contactEmail" label="Contact email" defaultValue={s.contactEmail} error={err("contactEmail")} />
          <TextField name="contactPhone" label="Contact phone" defaultValue={s.contactPhone} error={err("contactPhone")} />
          <TextField name="contactLocationText" label="Contact location text" defaultValue={s.contactLocationText} error={err("contactLocationText")} />
          <TextField name="contactFormNameLabel" label="Form: Name label" required defaultValue={s.contactFormNameLabel} error={err("contactFormNameLabel")} />
          <TextField name="contactFormEmailLabel" label="Form: Email label" required defaultValue={s.contactFormEmailLabel} error={err("contactFormEmailLabel")} />
          <TextField name="contactFormMessageLabel" label="Form: Message label" required defaultValue={s.contactFormMessageLabel} error={err("contactFormMessageLabel")} />
          <TextField name="contactFormSubmitLabel" label="Form: Submit button label" required defaultValue={s.contactFormSubmitLabel} error={err("contactFormSubmitLabel")} />
          <TextAreaField name="contactSuccessMessage" label="Success message" rows={2} required defaultValue={s.contactSuccessMessage} error={err("contactSuccessMessage")} />
        </>
      )}
    </SettingsForm>
  );
}
