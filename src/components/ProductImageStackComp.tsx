import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { imageSrcSet, imageUrl, ladderUpTo, PRODUCT_RATIO } from "../lib/images";
import useReducedMotion from "../lib/useReducedMotion";

interface ProductImageStackCompCompProps {
  images: string[];
  className?: string;
  onSelect?: (index: number) => void;
}

/** Same PDP gallery box as `ProductImageStack` — see the measurement there. */
const GALLERY_SIZES =
  "(min-width: 1024px) min(50vw - 72px, 760px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";
const GALLERY_WIDTHS = ladderUpTo(1600);

export default function ProductImageStackCompComp({
  images,
  className,
  onSelect,
}: ProductImageStackCompCompProps) {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const gallery = images.length > 0 ? images : [];
  const BEZIER = [0.67, -0.03, 0.27, 1.01] as [number, number, number, number];
  const DURATION = 1.2;

  const handleNext = () => {
    const next = (active + 1) % gallery.length;
    setActive(next);
    onSelect?.(next);
  };

  return (
    <div
      className={cn("relative aspect-4/5 w-full cursor-pointer overflow-hidden bg-smoke", className)}
      onClick={handleNext}
    >
      <AnimatePresence mode="wait" initial={false}>
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
              : { opacity: 0, scale: 1.18, filter: "blur(4px)", x: "22%" }
          }
          animate={
            reducedMotion
              ? { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
              : { opacity: 1, scale: 1, filter: "blur(0px)", x: 0, transition: { duration: DURATION, ease: BEZIER } }
          }
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0.25 } }
              : { opacity: 0.5, scale: 0.9, filter: "blur(14px)", x: "-18%", transition: { duration: DURATION, ease: BEZIER } }
          }
          draggable={false}
        />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center gap-1.5 bg-gradient-to-t from-smoke/60 to-transparent px-4 py-3">
        {gallery.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Show image ${idx + 1}`}
            className={cn(
              "pointer-events-auto h-1.5 w-6 rounded-none transition-all",
              idx === active ? "bg-acid" : "bg-bone/30"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setActive(idx);
              onSelect?.(idx);
            }}
          />
        ))}
      </div>
    </div>
  );
}
