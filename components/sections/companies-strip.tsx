import { companies } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function CompaniesStrip() {
  return (
    <FadeIn as="section" className="py-12 border-t border-border-subtle">
      <p className="text-center font-inter text-xs uppercase tracking-wider text-text-secondary">
        {companies.caption}
      </p>
      <div className="mt-6 flex items-center justify-center gap-10 opacity-60">
        {companies.logos.map((slug) => (
          <div
            key={slug}
            className="h-7 w-28 rounded bg-bg-card-hover"
            aria-hidden="true"
          />
        ))}
      </div>
    </FadeIn>
  );
}
