import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT, staggerItem } from "../lib/motion";

/**
 * ScrollReveal — fade + rise a block when it scrolls into view.
 * Use inside a parent that has `variants={staggerContainer} whileInView="show"`
 * to get a staggered sequence of blocks.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child — drives its animation from the parent variants. */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
