import { cache } from "react";
import { prisma } from "./client";

export const listNavItems = cache(() =>
  prisma.navItem.findMany({ orderBy: { order: "asc" } }),
);

export const getNavItem = cache((id: string) =>
  prisma.navItem.findUnique({ where: { id } }),
);
