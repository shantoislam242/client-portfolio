import { cache } from "react";
import { prisma } from "./client";

export const listExperience = cache(() =>
  prisma.experience.findMany({ orderBy: { order: "asc" } }),
);

export const getExperience = cache((id: string) =>
  prisma.experience.findUnique({ where: { id } }),
);
