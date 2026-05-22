import { createBlogPost } from "@/actions/blog-posts";
import { BlogPostForm } from "../blog-post-form";

export const metadata = { title: "New blog post" };

export default function NewBlogPostPage() {
  return <BlogPostForm action={createBlogPost} submitLabel="Create blog post" />;
}
