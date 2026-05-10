import type { Variants } from "framer-motion";

/**
 * Premium easing curves. Used across all motion in the portfolio.
 * - swift:  smooth deceleration with subtle anticipation. Default for most reveals.
 * - gentle: slower, calm. For long copy / hero text.
 * - smooth: Material-style. For UI state transitions.
 * - spring: slight overshoot. Use sparingly for delight moments.
 */
export const ease = {
  swift: [0.16, 1, 0.3, 1] as [number, number, number, number],
  gentle: [0.22, 1, 0.36, 1] as [number, number, number, number],
  smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: [0.34, 1.4, 0.64, 1] as [number, number, number, number],
} as const;

/**
 * Stagger orchestration parent. Children animate in sequence with `staggerChildren` gap.
 */
export const staggerParent = (
  staggerChildren = 0.08,
  delayChildren = 0.1,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

/**
 * Default stagger child reveal — opacity + y + scale + blur.
 * Each property has its own timing so the reveal feels layered, not flat.
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: ease.swift,
      opacity: { duration: 0.5, ease: ease.swift },
      filter: { duration: 0.7, ease: ease.swift },
    },
  },
};

/**
 * Card depth hover — parent variants for project/blog cards.
 * Card lifts; image scales; glow fades in. Coordinated via shared `hover` state.
 */
export const cardLift: Variants = {
  rest: { y: 0 },
  hover: {
    y: -6,
    transition: { duration: 0.5, ease: ease.swift },
  },
};

export const cardImageZoom: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.08,
    transition: { duration: 0.7, ease: ease.swift },
  },
};

export const cardGlow: Variants = {
  rest: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: { duration: 0.4, ease: ease.swift },
  },
};
