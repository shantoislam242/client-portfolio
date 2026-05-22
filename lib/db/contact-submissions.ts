import { cache } from "react";
import { prisma } from "./client";

export const listContactSubmissions = cache(() =>
  prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  }),
);

export const getContactSubmission = cache((id: string) =>
  prisma.contactSubmission.findUnique({ where: { id } }),
);

export const countUnreadSubmissions = cache(() =>
  prisma.contactSubmission.count({ where: { read: false } }),
);
