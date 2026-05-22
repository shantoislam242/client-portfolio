import { cache } from "react";
import { prisma } from "./client";

export const listBlogPosts = cache(() =>
  prisma.blogPost.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
);

export const getBlogPost = cache((id: string) =>
  prisma.blogPost.findUnique({ where: { id } }),
);

export const getBlogPostBySlug = cache((slug: string) =>
  prisma.blogPost.findUnique({ where: { slug } }),
);
