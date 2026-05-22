import { cache } from "react";
import { prisma } from "./client";

export const listTestimonials = cache(() =>
  prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
);

export const getTestimonial = cache((id: string) =>
  prisma.testimonial.findUnique({ where: { id } }),
);
