import { BlogGrid } from "@/components/sections/blog-grid";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export const metadata = { title: "Blog" };

export default function BlogListPage() {
  return (
    <>
      <BlogGrid mode="page" />
      <CollaborateCTA />
    </>
  );
}
