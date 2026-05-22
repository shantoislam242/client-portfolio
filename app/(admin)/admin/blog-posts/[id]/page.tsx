import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/db/blog-posts";
import { updateBlogPost } from "@/actions/blog-posts";
import { BlogPostForm } from "../blog-post-form";

export const metadata = { title: "Edit blog post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();

  const boundAction = updateBlogPost.bind(null, post.id);
  return (
    <BlogPostForm
      initial={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        subtitle: post.subtitle,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        coverPublicId: post.coverPublicId,
        category: post.category,
        tags: post.tags,
        readTimeMinutes: post.readTimeMinutes,
        author: post.author,
        published: post.published,
        featured: post.featured,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        order: post.order,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
