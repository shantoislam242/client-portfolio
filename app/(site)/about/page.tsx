import { AboutIntro } from "@/components/sections/about-intro";
import { ExperienceList } from "@/components/sections/experience-list";
import { EducationList } from "@/components/sections/education-list";
import { CertificationList } from "@/components/sections/certification-list";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export const metadata = {
  title: "About — Arifujjaman",
};

export default function AboutPage() {
  return (
    <>
      <AboutIntro />
      <ExperienceList />
      <EducationList />
      <CertificationList />
      <CollaborateCTA />
    </>
  );
}
