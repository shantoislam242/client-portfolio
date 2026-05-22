"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { UrlField } from "@/components/admin/field/url-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { SubmitButton } from "@/components/admin/submit-button";

type ProfileFormProps = {
  initial: {
    fullName: string;
    role: string;
    location: string;
    portraitUrl: string | null;
    portraitPublicId: string | null;
    ctaButtonLabel: string;
    ctaButtonLink: string;
    resumeUrl: string | null;
    resumePublicId: string | null;
  };
};

export function ProfileForm({ initial }: ProfileFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateProfile, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Profile</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="fullName" label="Full name" required defaultValue={initial.fullName} error={err("fullName")} />
        <TextField name="role" label="Role" required defaultValue={initial.role} error={err("role")} />
        <TextField name="location" label="Location" required defaultValue={initial.location} error={err("location")} />
        <ImageUploader folder="site" name="portraitUrl" publicIdName="portraitPublicId" initialUrl={initial.portraitUrl} initialPublicId={initial.portraitPublicId} label="Portrait" />
        <TextField name="ctaButtonLabel" label="Sidebar CTA label" required defaultValue={initial.ctaButtonLabel} error={err("ctaButtonLabel")} />
        <TextField name="ctaButtonLink" label="Sidebar CTA link" required defaultValue={initial.ctaButtonLink} error={err("ctaButtonLink")} />
        <UrlField name="resumeUrl" label="Resume URL" defaultValue={initial.resumeUrl} error={err("resumeUrl")} />
        <input type="hidden" name="resumePublicId" value={initial.resumePublicId ?? ""} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
