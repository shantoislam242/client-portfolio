import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/db/blog-posts";
import { BlogDetail } from "@/components/sections/blog-detail";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || !post.published) notFound();

  return (
    <>
      <BlogDetail post={post} />
      <CollaborateCTA />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
  };
}
