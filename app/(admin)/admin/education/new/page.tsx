import { createEducation } from "@/actions/education";
import { EducationForm } from "../education-form";

export const metadata = { title: "New education" };

export default function NewEducationPage() {
  return <EducationForm action={createEducation} submitLabel="Create education" />;
}
