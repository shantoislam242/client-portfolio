import { companies } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { LogoipsumLogo } from "@/components/icons/logoipsum";

const variants = [1, 2, 3] as const;

export function CompaniesStrip() {
  return (
    <FadeIn as="section" className="py-12 border-t border-border-subtle">
      <p className="text-center font-inter text-xs uppercase tracking-wider text-text-secondary">
        {companies.caption}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70">
        {companies.logos.map((slug, i) => (
          <LogoipsumLogo
            key={slug}
            variant={variants[i % 3]}
            className="h-7 w-auto text-text-primary"
          />
        ))}
      </div>
    </FadeIn>
  );
}
