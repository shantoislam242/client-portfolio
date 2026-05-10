import { aboutIntro } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function AboutIntro() {
  return (
    <section className="pt-4 pb-12">
      <FadeIn>
        <h1 className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {aboutIntro.headingPrefix}{" "}
          <span className="text-accent">{aboutIntro.headingAccent}</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mt-6 space-y-4 max-w-xl">
          {aboutIntro.paragraphs.map((p, i) => (
            <p key={i} className="font-poppins text-base text-text-secondary">
              {p}
            </p>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
