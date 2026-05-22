import { cache } from "react";
import { prisma } from "./client";

export const listEducation = cache(() =>
  prisma.education.findMany({ orderBy: { order: "asc" } }),
);

export const getEducation = cache((id: string) =>
  prisma.education.findUnique({ where: { id } }),
);
