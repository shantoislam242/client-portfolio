import { companies } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { LogoipsumLogo } from "@/components/icons/logoipsum";

const logoSequence = Array.from({ length: 8 }, (_, i) => {
  const variant = ((i % 3) + 1) as 1 | 2 | 3;
  return { id: i, variant };
});

export function CompaniesStrip() {
  return (
    <FadeIn as="section" className="py-12 border-t border-border-subtle">
      <p className="text-center font-inter text-xs uppercase tracking-wider text-text-secondary">
        {companies.caption}
      </p>
      <div className="mt-8 marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-14 will-change-transform">
          {[...logoSequence, ...logoSequence].map(({ id, variant }, i) => (
            <LogoipsumLogo
              key={`${i}-${id}`}
              variant={variant}
              className="h-7 w-auto shrink-0 text-text-primary opacity-70"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
