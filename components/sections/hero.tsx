import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hero, stats } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { CountUp } from "@/components/motion/count-up";

export function Hero() {
  return (
    <section className="pt-4 pb-16">
      <FadeIn>
        <h1 className="font-outfit font-bold text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {hero.headingPrefix}{" "}
          <span className="text-accent">{hero.headingAccent}</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-5 font-poppins text-base text-text-secondary max-w-xl">
          {hero.description}
        </p>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="mt-10 grid grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-outfit font-thin text-5xl md:text-6xl text-text-primary leading-none">
                <CountUp to={s.value} prefix={s.prefix} />
              </div>
              <div className="mt-3 font-inter text-xs uppercase tracking-wider text-text-secondary">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="mt-10 flex items-center gap-5">
          <Link
            href={hero.primaryCta.href}
            className="rounded-xl bg-accent px-6 py-3 font-poppins text-sm font-medium text-white transition-all hover:bg-accent-hover hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            {hero.primaryCta.label}
          </Link>
          <Link
            href={hero.secondaryCta.href}
            className="group inline-flex items-center gap-2 font-poppins text-sm text-text-primary transition-colors hover:text-accent"
          >
            {hero.secondaryCta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
