"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type FloatingProps = {
  children: ReactNode;
  /** Vertical drift amplitude in pixels */
  distance?: number;
  /** Full cycle duration in seconds */
  duration?: number;
  /** Stagger delay (useful when several Floating items sit side-by-side) */
  delay?: number;
  className?: string;
};

/**
 * Subtle ambient idle motion. Loops a gentle Y oscillation forever.
 * Use sparingly — meant for hero icons, stats, accent elements.
 */
export function Floating({
  children,
  distance = 6,
  duration = 4,
  delay = 0,
  className,
}: FloatingProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
