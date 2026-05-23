import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");
  const now = new Date();

  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/tools`,    lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
