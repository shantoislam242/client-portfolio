import Image from "next/image";
import Link from "next/link";
import { profile, hero } from "@/lib/data";

export function Sidebar() {
  return (
    <aside className="w-full lg:w-[320px] shrink-0">
      <div className="lg:sticky lg:top-24">
        <div className="rounded-3xl bg-bg-card border border-border-subtle p-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-bg-card-hover">
            <Image
              src={profile.portrait}
              alt={`Portrait of ${profile.name}`}
              fill
              sizes="(min-width: 1024px) 280px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-5 text-center">
            <h2 className="font-outfit font-bold text-2xl text-text-primary">
              {profile.name}
            </h2>
            <p className="mt-1 font-poppins text-sm text-text-secondary">
              {profile.role}
            </p>
            <p className="font-poppins text-sm text-text-secondary">
              {profile.location}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            {profile.socials.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-accent hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>

          <Link
            href={hero.primaryCta.href}
            className="mt-5 flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 font-poppins text-sm font-medium text-white transition-all hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card"
          >
            {hero.primaryCta.label}
          </Link>
        </div>
      </div>
    </aside>
  );
}
