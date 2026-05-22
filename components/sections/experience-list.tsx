import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listExperience } from "@/lib/db/experience";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { FadeIn } from "@/components/motion/fade-in";

export async function ExperienceList() {
  const [s, allEntries] = await Promise.all([getSiteSettings(), listExperience()]);
  const entries = allEntries.filter((e) => e.visible);

  const words = s.experienceHeading.split(" ");
  const prefix = words.slice(0, -1).join(" ");
  const accent = words[words.length - 1];

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {prefix}{" "}
          <span className="text-accent-purple">{accent}</span>
        </h2>
      </FadeIn>

      <div className="mt-10 space-y-3">
        {entries.map((e, i) => {
          const period = `${e.startDate} – ${e.current ? "Present" : (e.endDate ?? "—")}`;
          const logoSrc = e.logoUrl ? cldUrl(e.logoUrl) : null;
          return (
            <FadeIn key={e.id} delay={i * 0.05}>
              <article className="relative rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:bg-bg-card-hover">
                {e.companyUrl && (
                  <Link
                    href={e.companyUrl}
                    aria-label={`${e.company} — ${e.role}`}
                    className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-all hover:bg-accent-hover hover:rotate-[-45deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
                <h3 className="font-outfit font-bold text-xl text-text-primary pr-12">
                  {e.company}
                </h3>
                <p className="mt-1 font-inter text-xs uppercase tracking-wider text-text-secondary">
                  {e.role}
                </p>
                <p className="mt-3 font-poppins text-sm text-text-secondary max-w-md">
                  {e.description}
                </p>
                <p className="mt-4 font-inter text-xs text-text-muted">
                  {period}
                </p>
              </article>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
