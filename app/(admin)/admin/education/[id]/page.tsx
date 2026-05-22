import { notFound } from "next/navigation";
import { getEducation } from "@/lib/db/education";
import { updateEducation } from "@/actions/education";
import { EducationForm } from "../education-form";

export const metadata = { title: "Edit education" };

export default async function EditEducationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const education = await getEducation(id);
  if (!education) notFound();

  const boundAction = updateEducation.bind(null, education.id);
  return (
    <EducationForm
      initial={{
        id: education.id,
        institution: education.institution,
        degree: education.degree,
        description: education.description,
        startDate: education.startDate,
        endDate: education.endDate,
        current: education.current,
        institutionUrl: education.institutionUrl,
        logoUrl: education.logoUrl,
        logoPublicId: education.logoPublicId,
        order: education.order,
        visible: education.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
