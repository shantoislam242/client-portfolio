import Link from "next/link";
import Image from "next/image";
import { listBlogPosts } from "@/lib/db/blog-posts";
import { deleteBlogPost } from "@/actions/blog-posts";
import { reorderBlogPosts } from "@/actions/reorder";
import { SortableList } from "@/components/admin/sortable-list";
import { DragHandle } from "@/components/admin/drag-handle";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Blog posts — admin" };

export default async function BlogPostsListPage() {
  const posts = await listBlogPosts();

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Blog posts ({posts.length})</h1>
        <Link
          href="/admin/blog-posts/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New blog post
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blog posts yet.</p>
      ) : (
        <SortableList
          reorderAction={reorderBlogPosts}
          items={posts.map((post) => ({
            id: post.id,
            content: (
              <div className="flex items-center gap-3 border border-border rounded-md bg-card px-3 py-2 mb-2">
                <DragHandle />
                <div className="relative h-12 w-20 flex-shrink-0 rounded overflow-hidden bg-background">
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{post.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {post.published ? "Published" : "Draft"}
                    {post.featured && " · Featured"}
                    {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
                  </div>
                </div>
                <Link
                  href={`/admin/blog-posts/${post.id}`}
                  className="text-accent-purple hover:underline text-sm"
                >
                  Edit
                </Link>
                <DeleteButton id={post.id} action={deleteBlogPost} />
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
