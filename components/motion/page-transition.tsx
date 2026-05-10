"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={
          reduce ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(6px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={
          reduce ? { opacity: 1 } : { opacity: 0, y: -8, filter: "blur(4px)" }
        }
        transition={{ duration: 0.35, ease: ease.swift }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
