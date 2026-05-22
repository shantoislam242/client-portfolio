import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { ProjectDetail } from "@/components/sections/project-detail";

type Params = Promise<{ slug: string }>;

export default async function ProjectSlugPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
      relatedProjects: {
        orderBy: { order: "asc" },
        include: {
          related: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              shortLabel: true,
              excerpt: true,
            },
          },
        },
      },
    },
  });

  if (!project || !project.published) notFound();
  return <ProjectDetail project={project} />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return { title: "Not found" };
  return {
    title: project.metaTitle ?? project.title,
    description: project.metaDescription ?? project.excerpt,
  };
}
