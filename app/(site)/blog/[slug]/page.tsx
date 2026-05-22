import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data";
import { BlogDetail } from "@/components/sections/blog-detail";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return { title: "Post not found — Arifujjaman" };
  }

  return {
    title: `${post.title} — Arifujjaman`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return <BlogDetail post={post} />;
}
