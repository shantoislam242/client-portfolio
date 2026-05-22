import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/db/site-settings";
import { FadeIn } from "@/components/motion/fade-in";
import { Magnetic } from "@/components/motion/magnetic";

export async function CollaborateCTA() {
  const s = await getSiteSettings();

  return (
    <FadeIn as="section" className="pb-16">
      <div className="relative rounded-2xl border border-border-subtle bg-bg-card p-8 md:p-10 overflow-hidden">
        <Magnetic strength={0.4} className="absolute top-6 right-6">
          <Link
            href={s.ctaSectionButtonLink}
            aria-label="Go to contact page"
            className="group flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card focus-visible:ring-accent"
          >
            <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:rotate-[-45deg]" />
          </Link>
        </Magnetic>

        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {s.ctaSectionLineOne}
        </h2>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-accent-purple">
          {s.ctaSectionLineTwo}
        </h2>

        <p className="mt-5 max-w-xl font-poppins text-sm text-text-secondary">
          {s.ctaSectionText}
        </p>
      </div>
    </FadeIn>
  );
}
