"use client";
import { useActionState } from "react";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { BooleanField } from "@/components/admin/field/boolean-field";
import { FormSection } from "@/components/admin/form-section";
import type { FaqFormState } from "@/actions/faqs";

type FaqFormProps = {
  initial?: {
    id?: string;
    question?: string;
    answer?: string;
    category?: string | null;
    order?: number;
    visible?: boolean;
  };
  action: (prev: FaqFormState, fd: FormData) => Promise<FaqFormState>;
  submitLabel: string;
};

export function FaqForm({ initial, action, submitLabel }: FaqFormProps) {
  const [state, formAction] = useActionState<FaqFormState, FormData>(
    action,
    null,
  );
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  return (
    <form action={formAction}>
      <FormSection
        title={initial?.id ? "Edit FAQ" : "New FAQ"}
        backHref="/admin/faqs"
        topLevelError={state?.error && !state.issues ? state.error : null}
        submitLabel={submitLabel}
      >
        <TextField name="question" label="Question" required defaultValue={initial?.question} error={err("question")} />
        <TextAreaField name="answer" label="Answer" required rows={4} defaultValue={initial?.answer} error={err("answer")} />
        <TextField name="category" label="Category" defaultValue={initial?.category ?? undefined} error={err("category")} />
        <input type="hidden" name="order" value={initial?.order ?? 0} />
        <BooleanField name="visible" label="Visible" defaultValue={initial?.visible ?? true} />
      </FormSection>
    </form>
  );
}
