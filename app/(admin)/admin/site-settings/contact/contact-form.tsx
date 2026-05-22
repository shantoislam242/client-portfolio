"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateContact, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { SubmitButton } from "@/components/admin/submit-button";

type ContactFormProps = {
  initial: {
    contactPageTitle: string;
    contactPageSubtitle: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactLocationText: string | null;
    contactFormNameLabel: string;
    contactFormEmailLabel: string;
    contactFormMessageLabel: string;
    contactFormSubmitLabel: string;
    contactSuccessMessage: string;
  };
};

export function ContactForm({ initial }: ContactFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateContact, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Contact</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="contactPageTitle" label="Contact page title" required defaultValue={initial.contactPageTitle} error={err("contactPageTitle")} />
        <TextAreaField name="contactPageSubtitle" label="Contact page subtitle" rows={2} defaultValue={initial.contactPageSubtitle} error={err("contactPageSubtitle")} />
        <TextField name="contactEmail" label="Contact email" defaultValue={initial.contactEmail} error={err("contactEmail")} />
        <TextField name="contactPhone" label="Contact phone" defaultValue={initial.contactPhone} error={err("contactPhone")} />
        <TextField name="contactLocationText" label="Contact location text" defaultValue={initial.contactLocationText} error={err("contactLocationText")} />
        <TextField name="contactFormNameLabel" label="Form: Name label" required defaultValue={initial.contactFormNameLabel} error={err("contactFormNameLabel")} />
        <TextField name="contactFormEmailLabel" label="Form: Email label" required defaultValue={initial.contactFormEmailLabel} error={err("contactFormEmailLabel")} />
        <TextField name="contactFormMessageLabel" label="Form: Message label" required defaultValue={initial.contactFormMessageLabel} error={err("contactFormMessageLabel")} />
        <TextField name="contactFormSubmitLabel" label="Form: Submit button label" required defaultValue={initial.contactFormSubmitLabel} error={err("contactFormSubmitLabel")} />
        <TextAreaField name="contactSuccessMessage" label="Success message" rows={2} required defaultValue={initial.contactSuccessMessage} error={err("contactSuccessMessage")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
