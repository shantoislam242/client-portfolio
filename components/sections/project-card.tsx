"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cardGlow, cardImageZoom, cardLift } from "@/lib/motion";
import { cldUrl } from "@/lib/cloudinary/delivery";
import type { Project } from "@prisma/client";

type Props = { project: Project };

export function ProjectCard({ project }: Props) {
  const reduce = useReducedMotion();
  const imageUrl = project.cardImageUrl ?? project.coverImageUrl;

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      variants={reduce ? undefined : cardLift}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:border-accent/70"
      >
        {/* Glow halo */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: "0 0 60px 6px rgba(139, 92, 246, 0.25)" }}
          variants={reduce ? undefined : cardGlow}
        />

        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
          <motion.div
            className="absolute inset-0"
            variants={reduce ? undefined : cardImageZoom}
          >
            <Image
              src={cldUrl(imageUrl)}
              alt={project.title}
              fill
              sizes="(min-width: 768px) 350px, 100vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="relative p-5">
          <h3 className="font-outfit font-bold text-xl text-text-primary">
            {project.title}
          </h3>
          <p className="mt-1 font-poppins text-sm text-text-secondary">
            {project.shortLabel}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
