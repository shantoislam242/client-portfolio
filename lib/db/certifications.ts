import { cache } from "react";
import { prisma } from "./client";

export const listCertifications = cache(() =>
  prisma.certification.findMany({ orderBy: { order: "asc" } }),
);

export const getCertification = cache((id: string) =>
  prisma.certification.findUnique({ where: { id } }),
);
