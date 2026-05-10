import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { blogPosts, type BlogPost } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";

type Props = { post: BlogPost };

export function BlogDetail({ post }: Props) {
  const moreArticles = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article className="pt-4 pb-12">
      <FadeIn>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-poppins text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All Thoughts
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-bg-card">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-8 font-inter text-xs text-text-muted">{post.date}</p>
      </FadeIn>

      <FadeIn delay={0.12}>
        <h1 className="mt-3 font-outfit font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-text-primary">
          {post.title}
        </h1>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="mt-8 space-y-6">
          {post.content.map((block, i) =>
            block.kind === "h2" ? (
              <h2
                key={i}
                className="mt-12 font-outfit font-bold text-2xl md:text-3xl text-text-primary leading-snug"
              >
                {block.text}
              </h2>
            ) : (
              <p
                key={i}
                className="font-poppins text-base text-text-secondary leading-relaxed"
              >
                {block.text}
              </p>
            ),
          )}
        </div>
      </FadeIn>

      {moreArticles.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl leading-tight text-text-primary">
              More <span className="text-accent">Articles</span>
            </h2>
          </FadeIn>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {moreArticles.map((p, i) => (
              <FadeIn key={p.slug} delay={i * 0.05}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(min-width: 768px) 350px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="font-inter text-xs text-text-muted">{p.date}</p>
                    <h3 className="mt-2 font-outfit font-bold text-lg text-text-primary leading-snug">
                      {p.title}
                    </h3>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
