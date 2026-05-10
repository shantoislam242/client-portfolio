import { AboutIntro } from "@/components/sections/about-intro";
import { ExperienceList } from "@/components/sections/experience-list";
import { EducationList } from "@/components/sections/education-list";

export const metadata = {
  title: "About — Arif Hossain",
};

export default function AboutPage() {
  return (
    <>
      <AboutIntro />
      <ExperienceList />
      <EducationList />
    </>
  );
}
