"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSeo, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { SubmitButton } from "@/components/admin/submit-button";

type SeoFormProps = {
  initial: {
    siteName: string;
    siteDescription: string | null;
    siteKeywords: string | null;
    ogImage: string | null;
    ogImagePublicId: string | null;
    faviconUrl: string | null;
    faviconPublicId: string | null;
  };
};

export function SeoForm({ initial }: SeoFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateSeo, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">SEO</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="siteName" label="Site name" required defaultValue={initial.siteName} error={err("siteName")} />
        <TextAreaField name="siteDescription" label="Site description (meta)" rows={3} defaultValue={initial.siteDescription} error={err("siteDescription")} />
        <TextField name="siteKeywords" label="Meta keywords (comma-separated)" defaultValue={initial.siteKeywords} error={err("siteKeywords")} />
        <ImageUploader folder="site" name="ogImage" publicIdName="ogImagePublicId" initialUrl={initial.ogImage} initialPublicId={initial.ogImagePublicId} label="OG image" help="Recommended: 1200×630px (Open Graph standard, JPG or PNG)" />
        <ImageUploader folder="site" name="faviconUrl" publicIdName="faviconPublicId" initialUrl={initial.faviconUrl} initialPublicId={initial.faviconPublicId} label="Favicon" help="Recommended: 512×512px PNG (browsers auto-scale to 16/32/192px)" />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
