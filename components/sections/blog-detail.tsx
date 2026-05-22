import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BlogPost } from "@prisma/client";
import { listBlogPosts } from "@/lib/db/blog-posts";
import { cldUrl } from "@/lib/cloudinary/delivery";
import { sanitizeHtml } from "@/lib/sanitize";
import { FadeIn } from "@/components/motion/fade-in";

type BlogDetailProps = { post: BlogPost };

export async function BlogDetail({ post }: BlogDetailProps) {
  const allPosts = await listBlogPosts();
  const moreArticles = allPosts
    .filter((p) => p.published && p.id !== post.id)
    .slice(0, 2);

  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(post.publishedAt)
    : "";

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
            src={cldUrl(post.coverImageUrl)}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-8 font-inter text-xs text-text-muted">{dateStr}</p>
      </FadeIn>

      <FadeIn delay={0.12}>
        <h1 className="mt-3 font-outfit font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-text-primary">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="mt-3 font-poppins text-base text-text-secondary">
            {post.subtitle}
          </p>
        )}
      </FadeIn>

      <FadeIn delay={0.15}>
        <div
          className="mt-8 prose prose-invert max-w-none font-poppins text-base text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      </FadeIn>

      {post.tags && post.tags.length > 0 && (
        <FadeIn delay={0.18}>
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-subtle bg-bg-card px-3 py-1 font-inter text-xs text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </FadeIn>
      )}

      {moreArticles.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl leading-tight text-text-primary">
              More <span className="text-accent-purple">Articles</span>
            </h2>
          </FadeIn>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {moreArticles.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.05}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-all hover:border-accent/50"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
                    <Image
                      src={cldUrl(p.coverImageUrl)}
                      alt={p.title}
                      fill
                      sizes="(min-width: 768px) 350px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="font-inter text-xs text-text-muted">
                      {p.publishedAt
                        ? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(p.publishedAt)
                        : ""}
                    </p>
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
