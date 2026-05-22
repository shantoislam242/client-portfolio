"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSections, type SettingsState } from "@/actions/site-settings";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";
import { SubmitButton } from "@/components/admin/submit-button";

type SectionsFormProps = {
  initial: {
    trustedByHeading: string;
    recentProjectsHeading: string;
    recentProjectsLimit: number;
    toolsSectionHeading: string;
    testimonialsHeading: string;
    blogSectionHeading: string;
    blogSectionLimit: number;
    faqHeading: string;
    projectsPageTitle: string;
    projectsPageSubtitle: string | null;
    blogPageTitle: string;
    blogPageSubtitle: string | null;
    toolsPageTitle: string;
    toolsPageSubtitle: string | null;
  };
};

export function SectionsForm({ initial }: SectionsFormProps) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateSections, null);
  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Sections</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        <TextField name="trustedByHeading" label="'Trusted by' heading" required defaultValue={initial.trustedByHeading} error={err("trustedByHeading")} />
        <TextField name="recentProjectsHeading" label="Recent projects heading" required defaultValue={initial.recentProjectsHeading} error={err("recentProjectsHeading")} />
        <NumberField name="recentProjectsLimit" label="Recent projects limit" min={1} max={50} defaultValue={initial.recentProjectsLimit} error={err("recentProjectsLimit")} />
        <TextField name="toolsSectionHeading" label="Tools section heading" required defaultValue={initial.toolsSectionHeading} error={err("toolsSectionHeading")} />
        <TextField name="testimonialsHeading" label="Testimonials heading" required defaultValue={initial.testimonialsHeading} error={err("testimonialsHeading")} />
        <TextField name="blogSectionHeading" label="Blog section heading" required defaultValue={initial.blogSectionHeading} error={err("blogSectionHeading")} />
        <NumberField name="blogSectionLimit" label="Blog section limit" min={1} max={50} defaultValue={initial.blogSectionLimit} error={err("blogSectionLimit")} />
        <TextField name="faqHeading" label="FAQ heading" required defaultValue={initial.faqHeading} error={err("faqHeading")} />
        <TextField name="projectsPageTitle" label="Projects page title" required defaultValue={initial.projectsPageTitle} error={err("projectsPageTitle")} />
        <TextAreaField name="projectsPageSubtitle" label="Projects page subtitle" rows={2} defaultValue={initial.projectsPageSubtitle} error={err("projectsPageSubtitle")} />
        <TextField name="blogPageTitle" label="Blog page title" required defaultValue={initial.blogPageTitle} error={err("blogPageTitle")} />
        <TextAreaField name="blogPageSubtitle" label="Blog page subtitle" rows={2} defaultValue={initial.blogPageSubtitle} error={err("blogPageSubtitle")} />
        <TextField name="toolsPageTitle" label="Tools page title" required defaultValue={initial.toolsPageTitle} error={err("toolsPageTitle")} />
        <TextAreaField name="toolsPageSubtitle" label="Tools page subtitle" rows={2} defaultValue={initial.toolsPageSubtitle} error={err("toolsPageSubtitle")} />
      </div>
      <div className="mt-6 max-w-2xl">
        <SubmitButton label="Save" />
      </div>
    </form>
  );
}
