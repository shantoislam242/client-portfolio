import { Hero } from "@/components/sections/hero";
import { CompaniesStrip } from "@/components/sections/companies-strip";
import { ProjectsGrid } from "@/components/sections/projects-grid";
import { ToolsGrid } from "@/components/sections/tools-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { BlogGrid } from "@/components/sections/blog-grid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CompaniesStrip />
      <ProjectsGrid limit={4} />
      <ToolsGrid />
      <Testimonials />
      <BlogGrid limit={4} />
    </>
  );
}
