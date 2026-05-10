import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hero, stats } from "@/lib/data";
import { CountUp } from "@/components/motion/count-up";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Magnetic } from "@/components/motion/magnetic";
import { Floating } from "@/components/motion/floating";

export function Hero() {
  return (
    <section className="pt-4 pb-16">
      <Stagger gap={0.12} delay={0.1} className="space-y-10">
        <StaggerItem>
          <h1 className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-text-primary">
            {hero.headingPrefix}{" "}
            <span className="text-accent">{hero.headingAccent}</span>
          </h1>
        </StaggerItem>

        <StaggerItem>
          <p className="font-poppins text-base text-text-secondary max-w-xl">
            {hero.description}
          </p>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <Floating
                key={s.label}
                distance={4}
                duration={5 + i * 0.4}
                delay={i * 0.6}
              >
                <div>
                  <div className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl text-text-primary leading-none">
                    <CountUp to={s.value} prefix={s.prefix} />
                  </div>
                  <div className="mt-3 font-inter text-xs uppercase tracking-wider text-text-secondary">
                    {s.label}
                  </div>
                </div>
              </Floating>
            ))}
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="flex items-center gap-5">
            <Magnetic strength={0.25} className="inline-block">
              <Link
                href={hero.primaryCta.href}
                className="inline-block rounded-xl bg-accent px-6 py-3 font-poppins text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              >
                {hero.primaryCta.label}
              </Link>
            </Magnetic>
            <Magnetic strength={0.2} className="inline-block">
              <Link
                href={hero.secondaryCta.href}
                className="group inline-flex items-center gap-2 font-poppins text-sm text-text-primary transition-colors hover:text-accent"
              >
                {hero.secondaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
          </div>
        </StaggerItem>
      </Stagger>
    </section>
  );
}
