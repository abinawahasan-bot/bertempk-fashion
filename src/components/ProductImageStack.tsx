import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { imageSrcSet, imageUrl, ladderUpTo, PRODUCT_RATIO } from "../lib/images";
import useReducedMotion from "../lib/useReducedMotion";

interface ProductImageStackProps {
  images: string[];
  className?: string;
  onSelect?: (index: number) => void;
}

/**
 * Gallery width, measured from `ProductDetail`'s layout: `grid-cols-1 px-4`
 * (<640), `sm:px-6` (≥640) and `lg:grid-cols-2 lg:gap-16 lg:px-10` (≥1024)
 * inside `max-w-[1600px]` — a full-bleed 760 CSS px column at most. Only the
 * visible frame is fetched; the rest load when the shopper steps through them.
 */
const GALLERY_SIZES =
  "(min-width: 1024px) min(50vw - 72px, 760px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";

/** 760 CSS px × dpr 2 = 1520, so the ladder reaches the 1600 px master. */
const GALLERY_WIDTHS = ladderUpTo(1600);

export default function ProductImageStack({
  images,
  className,
  onSelect,
}: ProductImageStackProps) {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const gallery = images.length > 0 ? images : [""];
  const BEZIER = [0.67, -0.03, 0.27, 1.01] as [number, number, number, number];
  const DURATION = 1.2;

  const handleNext = () => {
    const next = (active + 1) % gallery.length;
    setActive(next);
    if (onSelect) onSelect(next);
  };

  return (
    <div
      className={cn("relative aspect-4/5 w-full cursor-pointer overflow-hidden bg-smoke", className)}
      onClick={handleNext}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={active}
          src={imageUrl(gallery[active], 960)}
          srcSet={imageSrcSet(gallery[active], GALLERY_WIDTHS, PRODUCT_RATIO)}
          sizes={GALLERY_SIZES}
          alt={`Product view ${active + 1}`}
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-125"
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.32, filter: "blur(8px)", x: "30%", y: "0%", originX: 0.5, originY: 0.5 }
          }
          animate={
            reducedMotion
              ? { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
              : { opacity: 1, scale: 1, filter: "blur(0px)", x: 0, y: 0, originX: 0.5, originY: 0.5, transition: { duration: DURATION, ease: BEZIER } }
          }
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0.25 } }
              : { opacity: 0.3, scale: 0.85, filter: "blur(14px)", x: "-16%", y: "0%", originX: 0.5, originY: 0.5, transition: { duration: DURATION, ease: BEZIER } }
          }
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}
