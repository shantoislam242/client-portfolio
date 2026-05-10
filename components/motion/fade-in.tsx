"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  yOffset?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li";
};

/**
 * Layered reveal: opacity finishes first, y settles next, blur clears last.
 * The offset timings give each property its own arc — the result feels
 * cinematic instead of flat-faded.
 */
export function FadeIn({
  children,
  delay = 0,
  yOffset = 24,
  className,
  as = "div",
}: FadeInProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: yOffset, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.9,
        delay,
        ease: ease.swift,
        opacity: { duration: 0.6, delay, ease: ease.swift },
        y: { duration: 0.9, delay, ease: ease.swift },
        filter: { duration: 1.0, delay, ease: ease.swift },
      }}
    >
      {children}
    </Tag>
  );
}
