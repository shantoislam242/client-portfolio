import { createCertification } from "@/actions/certifications";
import { CertificationForm } from "../certification-form";

export const metadata = { title: "New certification" };

export default function NewCertificationPage() {
  return <CertificationForm action={createCertification} submitLabel="Create certification" />;
}
