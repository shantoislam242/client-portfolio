import { cache } from "react";
import { prisma } from "./client";

export const listSocialLinks = cache(() =>
  prisma.socialLink.findMany({ orderBy: { order: "asc" } }),
);

export const getSocialLink = cache((id: string) =>
  prisma.socialLink.findUnique({ where: { id } }),
);
