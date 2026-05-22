import Image from "next/image";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listClientLogos } from "@/lib/db/client-logos";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { FadeIn } from "@/components/motion/fade-in";

export async function CompaniesStrip() {
  const [s, allLogos] = await Promise.all([
    getSiteSettings(),
    listClientLogos(),
  ]);

  const logos = allLogos.filter((l) => l.visible);

  return (
    <FadeIn as="section" className="py-12 border-t border-border-subtle">
      <p className="text-center font-inter text-xs uppercase tracking-wider text-text-secondary">
        {s.trustedByHeading}
      </p>
      <div className="mt-8 marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-14 will-change-transform">
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={`${i}-${logo.id}`}
              className="relative h-7 w-auto shrink-0"
            >
              <Image
                src={cldUrl(logo.logoUrl, { width: 120 })}
                alt={logo.name}
                width={120}
                height={28}
                className="h-7 w-auto object-contain opacity-70"
                aria-hidden="true"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
