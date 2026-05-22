import { getSiteSettings } from "@/lib/db/site-settings";
import { updateSections } from "@/actions/site-settings";
import { SettingsForm } from "../settings-form";
import { TextField } from "@/components/admin/field/text-field";
import { TextAreaField } from "@/components/admin/field/text-area-field";
import { NumberField } from "@/components/admin/field/number-field";

export const metadata = { title: "Sections — site settings" };

export default async function SectionsPage() {
  const s = await getSiteSettings();
  return (
    <SettingsForm action={updateSections} title="Sections">
      {({ err }) => (
        <>
          <TextField name="trustedByHeading" label="'Trusted by' heading" required defaultValue={s.trustedByHeading} error={err("trustedByHeading")} />
          <TextField name="recentProjectsHeading" label="Recent projects heading" required defaultValue={s.recentProjectsHeading} error={err("recentProjectsHeading")} />
          <NumberField name="recentProjectsLimit" label="Recent projects limit" min={1} max={50} defaultValue={s.recentProjectsLimit} error={err("recentProjectsLimit")} />
          <TextField name="toolsSectionHeading" label="Tools section heading" required defaultValue={s.toolsSectionHeading} error={err("toolsSectionHeading")} />
          <TextField name="testimonialsHeading" label="Testimonials heading" required defaultValue={s.testimonialsHeading} error={err("testimonialsHeading")} />
          <TextField name="blogSectionHeading" label="Blog section heading" required defaultValue={s.blogSectionHeading} error={err("blogSectionHeading")} />
          <NumberField name="blogSectionLimit" label="Blog section limit" min={1} max={50} defaultValue={s.blogSectionLimit} error={err("blogSectionLimit")} />
          <TextField name="faqHeading" label="FAQ heading" required defaultValue={s.faqHeading} error={err("faqHeading")} />
          <TextField name="projectsPageTitle" label="Projects page title" required defaultValue={s.projectsPageTitle} error={err("projectsPageTitle")} />
          <TextAreaField name="projectsPageSubtitle" label="Projects page subtitle" rows={2} defaultValue={s.projectsPageSubtitle} error={err("projectsPageSubtitle")} />
          <TextField name="blogPageTitle" label="Blog page title" required defaultValue={s.blogPageTitle} error={err("blogPageTitle")} />
          <TextAreaField name="blogPageSubtitle" label="Blog page subtitle" rows={2} defaultValue={s.blogPageSubtitle} error={err("blogPageSubtitle")} />
          <TextField name="toolsPageTitle" label="Tools page title" required defaultValue={s.toolsPageTitle} error={err("toolsPageTitle")} />
          <TextAreaField name="toolsPageSubtitle" label="Tools page subtitle" rows={2} defaultValue={s.toolsPageSubtitle} error={err("toolsPageSubtitle")} />
        </>
      )}
    </SettingsForm>
  );
}
