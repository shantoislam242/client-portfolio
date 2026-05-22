import { getSiteSettings } from "@/lib/db/site-settings";
import { listProjects } from "@/lib/db/projects";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectCard } from "@/components/sections/project-card";

type Props = { mode?: "home" | "page" };

export async function ProjectsGrid({ mode = "home" }: Props) {
  const [s, projects] = await Promise.all([getSiteSettings(), listProjects()]);
  const published = projects.filter((p) => p.published);
  const limited =
    mode === "home" ? published.slice(0, s.recentProjectsLimit) : published;

  const heading =
    mode === "home" ? s.recentProjectsHeading : s.projectsPageTitle;
  const subtitle = mode === "page" ? s.projectsPageSubtitle : null;

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {heading.includes(" and ") ? (
            <>
              {heading.split(" and ")[0]} and{" "}
              <span className="text-accent-purple">
                {heading.split(" and ")[1]}
              </span>
            </>
          ) : (
            heading
          )}
        </h2>
        {subtitle && (
          <p className="mt-4 font-poppins text-base text-text-secondary max-w-2xl">
            {subtitle}
          </p>
        )}
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {limited.map((p, i) => (
          <FadeIn key={p.id} delay={0.05 + i * 0.06}>
            <ProjectCard project={p} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
