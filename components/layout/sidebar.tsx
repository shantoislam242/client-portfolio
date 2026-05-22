import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listSocialLinks } from "@/lib/db/social-links";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { iconForKey } from "@/lib/icons/registry";
import { StickyCard } from "@/components/layout/sticky-card";

export async function Sidebar() {
  const [s, socials] = await Promise.all([
    getSiteSettings(),
    listSocialLinks(),
  ]);

  const visibleSocials = socials.filter((x) => x.visible);
  const portraitSrc =
    cldUrl(s.portraitUrl) ||
    "https://placehold.co/480x600/1c1c1c/8b5cf6?text=AJ";

  return (
    <aside className="w-full lg:w-[320px] shrink-0">
      <StickyCard topPadding={96} bottomPadding={24}>
        <div className="rounded-3xl bg-bg-card border border-border-subtle p-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-bg-card-hover">
            <Image
              src={portraitSrc}
              alt={`Portrait of ${s.fullName}`}
              fill
              sizes="(min-width: 1024px) 280px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-5 text-center">
            <h2 className="font-outfit font-bold text-2xl text-text-primary">
              {s.fullName}
            </h2>
            <p className="mt-1 font-poppins text-sm text-text-secondary">
              {s.role}
            </p>
            <p className="font-poppins text-sm text-text-secondary">
              {s.location}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            {visibleSocials.map((link) => {
              const Icon = iconForKey(link.iconKey);
              return (
                <Link
                  key={link.label}
                  href={link.url}
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-accent hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>

          <Link
            href={s.ctaButtonLink}
            className="mt-5 flex items-center justify-center rounded-full bg-accent px-6 py-2.5 font-poppins text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
          >
            {s.ctaButtonLabel}
          </Link>
        </div>
      </StickyCard>
    </aside>
  );
}
