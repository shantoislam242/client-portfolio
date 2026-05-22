"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { FormSection } from "@/components/admin/form-section";
import type { TestimonialFormState } from "@/actions/testimonials";

type TestimonialFormProps = {
  initial?: {
    id?: string;
    name?: string;
    role?: string | null;
    company?: string | null;
    content?: string;
    avatarUrl?: string | null;
    avatarPublicId?: string | null;
    rating?: number;
    featured?: boolean;
    order?: number;
    visible?: boolean;
  };
  action: (prev: TestimonialFormState, fd: FormData) => Promise<TestimonialFormState>;
  submitLabel: string;
};

export function TestimonialForm({ initial, action, submitLabel }: TestimonialFormProps) {
  const [state, formAction] = useActionState<TestimonialFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit testimonial" : "New testimonial"}
        backHref="/admin/testimonials"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="name" label="Name" required defaultValue={initial?.name} error={err("name")} />
        <TextField name="role" label="Role" defaultValue={initial?.role} error={err("role")} />
        <TextField name="company" label="Company" defaultValue={initial?.company} error={err("company")} />
        <TextAreaField name="content" label="Quote" required rows={5} defaultValue={initial?.content} error={err("content")} />
        <ImageUploader folder="testimonials" name="avatarUrl" publicIdName="avatarPublicId" initialUrl={initial?.avatarUrl} initialPublicId={initial?.avatarPublicId} label="Avatar" help="Recommended: 256×256px square (will display as circle)" />
        <NumberField name="rating" label="Rating (1–5)" min={1} max={5} defaultValue={initial?.rating ?? 5} error={err("rating")} />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
        <BooleanField name="featured" label="Featured" defaultValue={initial?.featured ?? false} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
