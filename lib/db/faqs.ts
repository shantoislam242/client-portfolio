import { cache } from "react";
import { prisma } from "./client";

export const listFaqs = cache(() =>
  prisma.fAQ.findMany({ orderBy: { order: "asc" } }),
);

export const getFaq = cache((id: string) =>
  prisma.fAQ.findUnique({ where: { id } }),
);
