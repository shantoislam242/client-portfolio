import { createExperience } from "@/actions/experience";
import { ExperienceForm } from "../experience-form";

export const metadata = { title: "New experience" };

export default function NewExperiencePage() {
  return <ExperienceForm action={createExperience} submitLabel="Create experience" />;
}
