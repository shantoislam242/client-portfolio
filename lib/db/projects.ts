import { cache } from "react";
import { prisma } from "./client";

export const listProjects = cache(() =>
  prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
);

export const getProject = cache((id: string) =>
  prisma.project.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
      relatedProjects: {
        orderBy: { order: "asc" },
        include: {
          related: { select: { id: true, title: true, slug: true, coverImageUrl: true } },
        },
      },
    },
  }),
);

export const getProjectBySlug = cache((slug: string) =>
  prisma.project.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { order: "asc" } },
      galleryImages: { orderBy: { order: "asc" } },
    },
  }),
);

export const getAvailableRelatedProjects = cache((excludeId: string) =>
  prisma.project.findMany({
    where: { id: { not: excludeId }, published: true },
    select: { id: true, title: true, slug: true, coverImageUrl: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
);
