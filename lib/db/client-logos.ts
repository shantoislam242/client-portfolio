import { cache } from "react";
import { prisma } from "./client";

export const listClientLogos = cache(() =>
  prisma.clientLogo.findMany({ orderBy: { order: "asc" } }),
);

export const getClientLogo = cache((id: string) =>
  prisma.clientLogo.findUnique({ where: { id } }),
);
