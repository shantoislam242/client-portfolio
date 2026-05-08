import Image from "next/image";
import { blogPosts } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

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
          <FadeIn key={post.slug} delay={i * 0.05}>
            <a
              href="#"
              className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(min-width: 768px) 350px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="font-inter text-xs text-text-muted">{post.date}</p>
                <h3 className="mt-2 font-outfit font-bold text-lg text-text-primary leading-snug">
                  {post.title}
                </h3>
              </div>
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
