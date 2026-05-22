import type { Prisma } from "@prisma/client";

export type ProjectWithChildren = Prisma.ProjectGetPayload<{
  include: {
    sections: true;
    galleryImages: true;
    relatedProjects: {
      include: {
        related: { select: { id: true; title: true; slug: true; coverImageUrl: true } };
      };
    };
  };
}>;

export type GallerySlot = {
  url: string;
  publicId: string;
  alt: string;
  caption: string;
  oldPublicId: string;
};

export type AvailableProject = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
};
