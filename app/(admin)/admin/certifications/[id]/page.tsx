import { notFound } from "next/navigation";
import { getCertification } from "@/lib/db/certifications";
import { updateCertification } from "@/actions/certifications";
import { CertificationForm } from "../certification-form";

export const metadata = { title: "Edit certification" };

export default async function EditCertificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const certification = await getCertification(id);
  if (!certification) notFound();

  const boundAction = updateCertification.bind(null, certification.id);
  return (
    <CertificationForm
      initial={{
        id: certification.id,
        institution: certification.institution,
        title: certification.title,
        description: certification.description,
        startDate: certification.startDate,
        endDate: certification.endDate,
        credentialUrl: certification.credentialUrl,
        logoUrl: certification.logoUrl,
        logoPublicId: certification.logoPublicId,
        order: certification.order,
        visible: certification.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
