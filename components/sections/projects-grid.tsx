import Image from "next/image";
import { projects } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

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
          <FadeIn key={p.slug} delay={i * 0.05}>
            <a
              href="#"
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
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
