"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerItem, staggerParent } from "@/lib/motion";

type StaggerTag = "div" | "section" | "article" | "ul" | "ol";

type StaggerProps = {
  children: ReactNode;
  /** Seconds between each child reveal */
  gap?: number;
  /** Initial delay before first child */
  delay?: number;
  className?: string;
  as?: StaggerTag;
};

/**
 * Variants-based stagger orchestrator. Each direct StaggerItem child
 * reveals in sequence — far more reliable than per-item delay props.
 */
export function Stagger({
  children,
  gap = 0.08,
  delay = 0.1,
  className,
  as = "div",
}: StaggerProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={className}
      variants={staggerParent(gap, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </Tag>
  );
}

type StaggerItemTag = "div" | "section" | "article" | "li";

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: StaggerItemTag;
};

export function StaggerItem({
  children,
  className,
  as = "div",
}: StaggerItemProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag className={className} variants={staggerItem}>
      {children}
    </Tag>
  );
}
