import { notFound } from "next/navigation";
import { getExperience } from "@/lib/db/experience";
import { updateExperience } from "@/actions/experience";
import { ExperienceForm } from "../experience-form";

export const metadata = { title: "Edit experience" };

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experience = await getExperience(id);
  if (!experience) notFound();

  const boundAction = updateExperience.bind(null, experience.id);
  return (
    <ExperienceForm
      initial={{
        id: experience.id,
        company: experience.company,
        role: experience.role,
        description: experience.description,
        startDate: experience.startDate,
        endDate: experience.endDate,
        current: experience.current,
        companyUrl: experience.companyUrl,
        logoUrl: experience.logoUrl,
        logoPublicId: experience.logoPublicId,
        order: experience.order,
        visible: experience.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
