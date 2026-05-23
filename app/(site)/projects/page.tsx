import { ProjectsGrid } from "@/components/sections/projects-grid";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export const metadata = {
  title: "Projects — Arifujjaman",
};

export default function ProjectsListPage() {
  return (
    <>
      <ProjectsGrid mode="page" />
      <CollaborateCTA />
    </>
  );
}
