import Image from "next/image";
import { tools } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function ToolsGrid() {
  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          Top-Tier Tools for
          <br />
          Exceptional <span className="text-accent">Results</span>
        </h2>
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map((t, i) => (
          <FadeIn key={t.name} delay={i * 0.05}>
            <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={t.icon}
                  alt={`${t.name} icon`}
                  fill
                  sizes="48px"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <div className="font-outfit font-bold text-base text-text-primary">
                  {t.name}
                </div>
                <div className="font-poppins text-xs text-text-secondary">
                  {t.role}
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
