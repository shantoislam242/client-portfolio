import { Hero } from "@/components/sections/hero";
import { CompaniesStrip } from "@/components/sections/companies-strip";
import { ProjectsGrid } from "@/components/sections/projects-grid";
import { ToolsGrid } from "@/components/sections/tools-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogGrid } from "@/components/sections/blog-grid";
import { FAQ } from "@/components/sections/faq";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CompaniesStrip />
      <ProjectsGrid mode="home" />
      <ToolsGrid mode="home" />
      <Testimonials />
      <BlogGrid mode="home" />
      <FAQ mode="home" />
      <CollaborateCTA />
    </>
  );
}
