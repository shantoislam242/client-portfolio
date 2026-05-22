import Image from "next/image";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listTools } from "@/lib/db/tools";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { FadeIn } from "@/components/motion/fade-in";

type Props = {
  mode?: "home" | "page";
};

export async function ToolsGrid({ mode = "home" }: Props) {
  const [s, allTools] = await Promise.all([getSiteSettings(), listTools()]);

  const tools = allTools
    .filter((t) => t.visible)
    .filter((t) => (mode === "home" ? t.showOnHome : true));

  const heading =
    mode === "home" ? s.toolsSectionHeading : s.toolsPageTitle;

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {heading}
        </h2>
        {mode === "page" && s.toolsPageSubtitle && (
          <p className="mt-4 font-poppins text-base text-text-secondary max-w-xl">
            {s.toolsPageSubtitle}
          </p>
        )}
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map((t, i) => {
          const iconSrc = t.iconExternalUrl
            ? t.iconExternalUrl
            : cldUrl(t.iconUrl);

          return (
            <FadeIn key={t.name} delay={i * 0.05}>
              <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  {iconSrc ? (
                    <Image
                      src={iconSrc}
                      alt={`${t.name} icon`}
                      fill
                      sizes="48px"
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-bg-card-hover" />
                  )}
                </div>
                <div>
                  <div className="font-outfit font-bold text-base text-text-primary">
                    {t.name}
                  </div>
                  <div className="font-poppins text-xs text-text-secondary">
                    {t.description ?? t.name}
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
