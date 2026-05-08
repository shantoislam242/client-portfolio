import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collaborateCta } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

export function CollaborateCTA() {
  return (
    <FadeIn as="section" className="pb-16">
      <div className="relative rounded-2xl border border-border-subtle bg-bg-card p-8 md:p-10">
        <Link
          href={collaborateCta.href}
          aria-label="Go to contact page"
          className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-all hover:bg-accent-hover hover:scale-110 hover:rotate-[-45deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card focus-visible:ring-accent"
        >
          <ArrowUpRight className="h-5 w-5" />
        </Link>

        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {collaborateCta.headingLine1}
        </h2>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-accent">
          {collaborateCta.headingLine2}
        </h2>

        <p className="mt-5 max-w-xl font-poppins text-sm text-text-secondary">
          {collaborateCta.body}
        </p>
      </div>
    </FadeIn>
  );
}
