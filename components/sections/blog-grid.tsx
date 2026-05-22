import { getSiteSettings } from "@/lib/db/site-settings";
import { listBlogPosts } from "@/lib/db/blog-posts";
import { FadeIn } from "@/components/motion/fade-in";
import { BlogCard } from "@/components/sections/blog-card";

type BlogGridProps = { mode?: "home" | "page" };

export async function BlogGrid({ mode = "home" }: BlogGridProps) {
  const [s, posts] = await Promise.all([getSiteSettings(), listBlogPosts()]);
  const published = posts.filter((p) => p.published);
  const limited =
    mode === "home" ? published.slice(0, s.blogSectionLimit) : published;

  const heading =
    mode === "home" ? s.blogSectionHeading : s.blogPageTitle;
  const subtitle = mode === "page" ? s.blogPageSubtitle : null;

  // Split heading on last word for accent styling
  const headingWords = heading.split(" ");
  const lastWord = headingWords.pop() ?? "";
  const firstWords = headingWords.join(" ");

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          {firstWords && (
            <>
              {firstWords}
              <br />
            </>
          )}
          <span className="text-accent-purple">{lastWord}</span>
        </h2>
        {subtitle && (
          <p className="mt-4 font-poppins text-base text-text-secondary max-w-xl">
            {subtitle}
          </p>
        )}
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {limited.map((post, i) => (
          <FadeIn key={post.id} delay={0.05 + i * 0.06}>
            <BlogCard post={post} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
