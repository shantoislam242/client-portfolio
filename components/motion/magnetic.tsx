"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

type MagneticProps = {
  children: ReactNode;
  /** 0 = no movement, 1 = follows cursor 1:1. Typical 0.2 - 0.4 */
  strength?: number;
  className?: string;
};

/**
 * Cursor-attracting wrapper. Tracks pointer relative to element center
 * and translates the children with a soft spring. Returns smoothly to
 * origin on mouse leave. Honors reduced-motion.
 */
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: MagneticProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 150, damping: 18, mass: 0.5 });
  const ySpring = useSpring(y, { stiffness: 150, damping: 18, mass: 0.5 });

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        x.set((e.clientX - cx) * strength);
        y.set((e.clientY - cy) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: xSpring, y: ySpring }}
    >
      {children}
    </motion.div>
  );
}
