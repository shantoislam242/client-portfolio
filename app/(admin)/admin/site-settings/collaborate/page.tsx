import { getSiteSettings } from "@/lib/db/site-settings";
import { updateCollaborate } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";

export const metadata = { title: "Collaborate — site settings" };

export default async function CollaboratePage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateCollaborate} title="Collaborate">
      {({ err }) => (
        <>
          <TextField name="ctaSectionLineOne" label="Headline line 1" required defaultValue={s.ctaSectionLineOne} error={err("ctaSectionLineOne")} />
          <TextField name="ctaSectionLineTwo" label="Headline line 2" required defaultValue={s.ctaSectionLineTwo} error={err("ctaSectionLineTwo")} />
          <TextAreaField name="ctaSectionText" label="Body text" rows={3} defaultValue={s.ctaSectionText} error={err("ctaSectionText")} />
          <TextField name="ctaSectionButtonLabel" label="Button label" required defaultValue={s.ctaSectionButtonLabel} error={err("ctaSectionButtonLabel")} />
          <TextField name="ctaSectionButtonLink" label="Button link" required defaultValue={s.ctaSectionButtonLink} error={err("ctaSectionButtonLink")} />
        </>
      )}
    </SettingsForm>
  );
}
