import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { experience, experienceHeading } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function ExperienceList() {
  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {experienceHeading.prefix}{" "}
          <span className="text-accent">{experienceHeading.accent}</span>
        </h2>
      </FadeIn>

      <div className="mt-10 space-y-3">
        {experience.map((entry, i) => (
          <FadeIn key={entry.company} delay={i * 0.05}>
            <article className="relative rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:bg-bg-card-hover">
              <Link
                href={entry.href}
                aria-label={`${entry.company} — ${entry.role}`}
                className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-all hover:bg-accent-hover hover:rotate-[-45deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <h3 className="font-outfit font-bold text-xl text-text-primary pr-12">
                {entry.company}
              </h3>
              <p className="mt-2 font-poppins text-sm text-text-secondary max-w-md">
                {entry.description}
              </p>
              <p className="mt-4 font-inter text-xs text-text-muted">
                {entry.period}
              </p>
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
