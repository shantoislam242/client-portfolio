import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { sanitizeHtml } from "@/lib/sanitize";
import { FadeIn } from "@/components/motion/fade-in";
import type { Prisma } from "@prisma/client";

type ProjectFull = Prisma.ProjectGetPayload<{
  include: {
    sections: true;
    galleryImages: true;
    relatedProjects: {
      include: {
        related: {
          select: {
            id: true;
            title: true;
            slug: true;
            coverImageUrl: true;
            shortLabel: true;
            excerpt: true;
          };
        };
      };
    };
  };
}>;

type Props = { project: ProjectFull };

export function ProjectDetail({ project }: Props) {
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
            src={cldUrl(project.coverImageUrl)}
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
          {project.shortLabel}
        </p>
      </FadeIn>

      <FadeIn delay={0.12}>
        <h1 className="mt-3 font-outfit font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-text-primary">
          {project.title}
        </h1>
      </FadeIn>

      <FadeIn delay={0.14}>
        <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-border-subtle py-6">
          {project.year && (
            <div>
              <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
                Year
              </dt>
              <dd className="mt-1 font-poppins text-sm text-text-primary">
                {project.year}
              </dd>
            </div>
          )}
          {project.client && (
            <div>
              <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
                Client
              </dt>
              <dd className="mt-1 font-poppins text-sm text-text-primary">
                {project.client}
              </dd>
            </div>
          )}
          {project.services.length > 0 && (
            <div>
              <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
                Services
              </dt>
              <dd className="mt-1 font-poppins text-sm text-text-primary">
                {project.services.join(", ")}
              </dd>
            </div>
          )}
          {project.role && (
            <div>
              <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
                Role
              </dt>
              <dd className="mt-1 font-poppins text-sm text-text-primary">
                {project.role}
              </dd>
            </div>
          )}
          {project.liveUrl && (
            <div>
              <dt className="font-inter text-xs uppercase tracking-wider text-text-muted">
                Live
              </dt>
              <dd className="mt-1 font-poppins text-sm text-text-primary">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  View site
                </a>
              </dd>
            </div>
          )}
        </dl>
      </FadeIn>

      {project.introContent && (
        <FadeIn delay={0.16}>
          <div
            className="mt-8 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(project.introContent),
            }}
          />
        </FadeIn>
      )}

      {project.sections.length > 0 && (
        <FadeIn delay={0.18}>
          <div className="mt-8 space-y-6">
            {project.sections.map((s) => (
              <section key={s.id}>
                <h2 className="mt-12 font-outfit font-bold text-2xl md:text-3xl text-text-primary leading-snug">
                  {s.heading}
                </h2>
                <div
                  className="mt-4 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.content) }}
                />
              </section>
            ))}
          </div>
        </FadeIn>
      )}

      {project.galleryImages.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl leading-tight text-text-primary">
              {project.galleryHeading.includes(" ") ? (
                <>
                  {project.galleryHeading.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-accent-purple">
                    {project.galleryHeading.split(" ").slice(-1)[0]}
                  </span>
                </>
              ) : (
                <span className="text-accent-purple">
                  {project.galleryHeading}
                </span>
              )}
            </h2>
          </FadeIn>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.galleryImages.map((img, i) => (
              <FadeIn key={img.id} delay={i * 0.05}>
                <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
                  <Image
                    src={cldUrl(img.url)}
                    alt={img.alt ?? project.title}
                    fill
                    sizes="(min-width: 768px) 350px, 100vw"
                    className="object-cover"
                  />
                  {img.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 font-poppins text-xs text-text-secondary">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {project.relatedProjects.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl leading-tight text-text-primary">
              {project.relatedHeading.includes(" ") ? (
                <>
                  {project.relatedHeading.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-accent-purple">
                    {project.relatedHeading.split(" ").slice(-1)[0]}
                  </span>
                </>
              ) : (
                <span className="text-accent-purple">
                  {project.relatedHeading}
                </span>
              )}
            </h2>
          </FadeIn>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {project.relatedProjects.map((rp, i) => (
              <FadeIn key={rp.id} delay={i * 0.05}>
                <Link
                  href={`/projects/${rp.related.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                    <Image
                      src={cldUrl(rp.related.coverImageUrl)}
                      alt={rp.related.title}
                      fill
                      sizes="(min-width: 768px) 350px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-outfit font-bold text-xl text-text-primary">
                      {rp.related.title}
                    </h3>
                    {rp.related.shortLabel && (
                      <p className="mt-1 font-poppins text-sm text-text-secondary">
                        {rp.related.shortLabel}
                      </p>
                    )}
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
