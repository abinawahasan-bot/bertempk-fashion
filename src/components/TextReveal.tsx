import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * TextReveal — word-by-word staggered headline reveal.
 * Matches the reference video (Bajuku.mp4, Statement section t≈6–8s):
 * the headline appears progressively word/lines-in, e.g.
 * "BUILT T" → "BUILT TO CHANGE" → "BUILT TO CHANGE / MOODS, AND WORLDS".
 *
 * Usage:
 *   <motion.h2 variants={revealContainer} initial="hidden" whileInView="show"
 *              viewport={{ once: true, amount: 0.4 }} className="...">
 *     <TextWord>Built</TextWord> <TextWord>to</TextWord> ...
 *   </motion.h2>
 */
const wordVariants: Variants = {
  hidden: { opacity: 0, y: "0.55em" },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** A single revealed word. `inline-block` so the transform applies. */
export function TextWord({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      variants={wordVariants}
      className={`mr-[0.24em] inline-block last:mr-0 ${className ?? ""}`}
    >
      {children}
    </motion.span>
  );
}
