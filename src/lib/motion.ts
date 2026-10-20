import type { Variants } from "motion/react";

/**
 * Shared motion tokens — keep easing/stagger consistent across the site
 * (matches the reference video's cohesive "reveal" feel).
 * Non-component module: safe to export constants (no fast-refresh lint rule).
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Parent that staggers its `StaggerItem` children when scrolled into view. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};

/** A single staggered child (fade + rise). */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};
