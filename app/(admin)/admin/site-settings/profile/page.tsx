import { getSiteSettings } from "@/lib/db/site-settings";
import { updateProfile } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";

export const metadata = { title: "Profile — site settings" };

export default async function ProfilePage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateProfile} title="Profile">
      {({ err }) => (
        <>
          <TextField name="fullName" label="Full name" required defaultValue={s.fullName} error={err("fullName")} />
          <TextField name="role" label="Role" required defaultValue={s.role} error={err("role")} />
          <TextField name="location" label="Location" required defaultValue={s.location} error={err("location")} />
          <ImageUploader folder="site" name="portraitUrl" publicIdName="portraitPublicId" initialUrl={s.portraitUrl} initialPublicId={s.portraitPublicId} label="Portrait" />
          <TextField name="ctaButtonLabel" label="Sidebar CTA label" required defaultValue={s.ctaButtonLabel} error={err("ctaButtonLabel")} />
          <TextField name="ctaButtonLink" label="Sidebar CTA link" required defaultValue={s.ctaButtonLink} error={err("ctaButtonLink")} />
          <UrlField name="resumeUrl" label="Resume URL" defaultValue={s.resumeUrl} error={err("resumeUrl")} />
          <input type="hidden" name="resumePublicId" value={s.resumePublicId ?? ""} />
        </>
      )}
    </SettingsForm>
  );
}
