import { cache } from "react";
import { prisma } from "./client";

export const getSiteSettings = cache(async () => {
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
});
