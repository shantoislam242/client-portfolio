import { getSiteSettings } from "@/lib/db/site-settings";
import { updateSeo } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { ImageUploader } from "@/components/admin/image-uploader";

export const metadata = { title: "SEO — site settings" };

export default async function SeoPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateSeo} title="SEO">
      {({ err }) => (
        <>
          <TextField name="siteName" label="Site name" required defaultValue={s.siteName} error={err("siteName")} />
          <TextAreaField name="siteDescription" label="Site description (meta)" rows={3} defaultValue={s.siteDescription} error={err("siteDescription")} />
          <TextField name="siteKeywords" label="Meta keywords (comma-separated)" defaultValue={s.siteKeywords} error={err("siteKeywords")} />
          <ImageUploader folder="site" name="ogImage" publicIdName="ogImagePublicId" initialUrl={s.ogImage} initialPublicId={s.ogImagePublicId} label="OG image (1200×630)" />
          <ImageUploader folder="site" name="faviconUrl" publicIdName="faviconPublicId" initialUrl={s.faviconUrl} initialPublicId={s.faviconPublicId} label="Favicon" />
        </>
      )}
    </SettingsForm>
  );
}
