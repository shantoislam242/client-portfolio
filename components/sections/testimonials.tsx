import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listTestimonials } from "@/lib/db/testimonials";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { FadeIn } from "@/components/motion/fade-in";

export async function Testimonials() {
  const [s, allTestimonials] = await Promise.all([
    getSiteSettings(),
    listTestimonials(),
  ]);

  const testimonials = allTestimonials.filter((t) => t.visible);
  const t = testimonials[0];

  if (!t) return null;

  const headingWords = s.testimonialsHeading.split(" ");
  const headingAccent = headingWords[headingWords.length - 1];
  const headingPrefix = headingWords.slice(0, -1).join(" ");

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {headingPrefix}
          <br />
          <span className="text-accent-purple">{headingAccent}</span>
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
              {t.avatarUrl ? (
                <Image
                  src={cldUrl(t.avatarUrl, { width: 80 })}
                  alt={t.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-bg-card-hover" />
              )}
            </div>
            <div>
              <div className="font-outfit font-bold text-base text-text-primary">
                {t.name}
              </div>
              <div className="font-poppins text-xs text-text-muted">
                {[t.role, t.company].filter(Boolean).join(", ")}
              </div>
            </div>
          </header>
          <blockquote className="mt-4 font-poppins text-sm text-text-secondary">
            {t.content}
          </blockquote>
        </article>
      </FadeIn>
    </section>
  );
}
