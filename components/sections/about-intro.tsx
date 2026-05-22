import { getSiteSettings } from "@/lib/db/site-settings";
import { sanitizeHtml } from "@/lib/sanitize";
import { FadeIn } from "@/components/motion/fade-in";

export async function AboutIntro() {
  const s = await getSiteSettings();

  const words = s.aboutPageTitle.split(" ");
  const prefix = words.slice(0, -1).join(" ");
  const accent = words[words.length - 1];

  return (
    <section className="pt-4 pb-12">
      <FadeIn>
        <h1 className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {prefix && <>{prefix} </>}
          <span className="text-accent-purple">{accent}</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div
          className="mt-6 max-w-xl space-y-4 font-poppins text-base text-text-secondary"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.aboutIntroContent) }}
        />
      </FadeIn>
    </section>
  );
}
