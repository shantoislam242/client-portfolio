import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { testimonials } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function Testimonials() {
  const t = testimonials[0];

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          What Clients Say
          <br />
          About My <span className="text-accent-purple">Work</span>
        </h2>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Previous testimonial"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <article className="mt-6 rounded-2xl border border-border-subtle bg-bg-card p-6">
          <header className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-bg-card-hover">
              <Image
                src={t.avatar}
                alt={t.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-outfit font-bold text-base text-text-primary">
                {t.name}
              </div>
              <div className="font-poppins text-xs text-text-muted">
                {t.role}
              </div>
            </div>
          </header>
          <blockquote className="mt-4 font-poppins text-sm text-text-secondary">
            {t.quote}
          </blockquote>
        </article>
      </FadeIn>
    </section>
  );
}
