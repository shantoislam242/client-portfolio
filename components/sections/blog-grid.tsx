import { blogPosts } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { BlogCard } from "@/components/sections/blog-card";

type Props = { limit?: number };

export function BlogGrid({ limit }: Props) {
  const items = limit ? blogPosts.slice(0, limit) : blogPosts;

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl leading-tight text-text-primary">
          Design Thoughts
          <br />
          and <span className="text-accent">Perspectives</span>
        </h2>
      </FadeIn>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((post, i) => (
          <FadeIn key={post.slug} delay={0.05 + i * 0.06}>
            <BlogCard post={post} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
