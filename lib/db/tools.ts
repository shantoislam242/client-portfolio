import { cache } from "react";
import { prisma } from "./client";

export const listTools = cache(() =>
  prisma.tool.findMany({ orderBy: { order: "asc" } }),
);

export const getTool = cache((id: string) =>
  prisma.tool.findUnique({ where: { id } }),
);
