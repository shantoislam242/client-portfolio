"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cardGlow, cardImageZoom, cardLift } from "@/lib/motion";
import type { BlogPost } from "@prisma/client";
import { cldUrl } from "@/lib/cloudinary/delivery";

type BlogCardProps = { post: BlogPost };

export function BlogCard({ post }: BlogCardProps) {
  const reduce = useReducedMotion();

  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(post.publishedAt)
    : "";

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      variants={reduce ? undefined : cardLift}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:border-accent/70"
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: "0 0 60px 6px rgba(139, 92, 246, 0.2)" }}
          variants={reduce ? undefined : cardGlow}
        />

        <div className="relative aspect-[16/10] overflow-hidden bg-bg-card-hover">
          <motion.div
            className="absolute inset-0"
            variants={reduce ? undefined : cardImageZoom}
          >
            <Image
              src={cldUrl(post.coverImageUrl)}
              alt={post.title}
              fill
              sizes="(min-width: 768px) 350px, 100vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="relative p-5">
          <p className="font-inter text-xs text-text-muted">{dateStr}</p>
          <h3 className="mt-2 font-outfit font-bold text-lg text-text-primary leading-snug">
            {post.title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
