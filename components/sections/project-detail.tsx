import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { projects, type Project } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

type Props = { project: Project };

export function ProjectDetail({ project }: Props) {
  const moreProjects = projects.filter((p) => p.slug !== project.slug).slice(0, 2);

  return (
    <article className="pt-4 pb-12">
      <FadeIn>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 font-poppins text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-bg-card">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-8 font-inter text-xs uppercase tracking-wider text-text-muted">
          {project.subtitle}
        </p>
      </FadeIn>

      <FadeIn delay={0.12}>
        <h1 className="mt-3 font-outfit font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-text-primary">
          {project.title}
        </h1>
      </FadeIn>

      <FadeIn delay={0.14}>
        <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-border-subtle py-6">
          <div>
            <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
              Year
            </dt>
            <dd className="mt-1 font-poppins text-sm text-text-primary">
              {project.year}
            </dd>
          </div>
          <div>
            <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
              Client
            </dt>
            <dd className="mt-1 font-poppins text-sm text-text-primary">
              {project.client}
            </dd>
          </div>
          <div>
            <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
              Services
            </dt>
            <dd className="mt-1 font-poppins text-sm text-text-primary">
              {project.services.join(", ")}
            </dd>
          </div>
        </dl>
      </FadeIn>

      <FadeIn delay={0.16}>
        <div className="mt-8 space-y-6">
          {project.content.map((block, i) =>
            block.kind === "h2" ? (
              <h2
                key={i}
                className="mt-12 font-outfit font-bold text-2xl md:text-3xl text-text-primary leading-snug"
              >
                {block.text}
              </h2>
            ) : (
              <p
                key={i}
                className="font-poppins text-base text-text-secondary leading-relaxed"
              >
                {block.text}
              </p>
            ),
          )}
        </div>
      </FadeIn>

      {project.gallery.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl leading-tight text-text-primary">
              Selected <span className="text-accent">Visuals</span>
            </h2>
          </FadeIn>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.gallery.map((src, i) => (
              <FadeIn key={src} delay={i * 0.05}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
                  <Image
                    src={src}
                    alt={`${project.title} — visual sample ${i + 1}`}
                    fill
                    sizes="(min-width: 768px) 350px, 100vw"
                    className="object-cover"
                  />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {moreProjects.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl leading-tight text-text-primary">
              More <span className="text-accent">Projects</span>
            </h2>
          </FadeIn>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {moreProjects.map((p, i) => (
              <FadeIn key={p.slug} delay={i * 0.05}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(min-width: 768px) 350px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-outfit font-bold text-xl text-text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-1 font-poppins text-sm text-text-secondary">
                      {p.subtitle}
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
