import { projects } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { ProjectCard } from "@/components/sections/project-card";

type Props = { limit?: number };

export function ProjectsGrid({ limit }: Props) {
  const items = limit ? projects.slice(0, limit) : projects;

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          Recent Projects
          <br />
          and <span className="text-accent">Achievements</span>
        </h2>
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((p, i) => (
          <FadeIn key={p.slug} delay={0.05 + i * 0.06}>
            <ProjectCard project={p} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
