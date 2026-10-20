import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useFittingStore } from "../store/fitting";
import type { Product } from "../types";
import HangerIcon from "./HangerIcon";

interface HangerButtonProps {
  product: Product;
  className?: string;
  /** Renders the labelled variant used on the product detail page. */
  showLabel?: boolean;
}

export default function HangerButton({
  product,
  className,
  showLabel = false,
}: HangerButtonProps) {
  const worn = useFittingStore((s) => s.picks.some((p) => p.id === product.id));
  const togglePick = useFittingStore((s) => s.togglePick);

  const handle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = togglePick(product);
    toast(added ? "On the model" : "Taken off", {
      description: added ? `${product.name} — fitting room` : product.name,
    });
  };

  if (showLabel) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handle}
        aria-pressed={worn}
        className={cn(
          "inline-flex items-center justify-center gap-2 border px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40",
          worn
            ? "border-acid bg-acid text-ink"
            : "border-steel text-fog hover:border-bone hover:text-bone",
          className
        )}
      >
        <HangerIcon className="h-4 w-4" />
        {worn ? "Wearing it" : "Fitting room"}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={handle}
      aria-pressed={worn}
      aria-label={
        worn
          ? `Take ${product.name} off the model`
          : `Wear ${product.name} in the fitting room`
      }
      className={cn(
        "rounded-none p-2.5 backdrop-blur-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40 active:scale-95",
        worn ? "bg-acid text-ink" : "bg-ink/60 text-bone hover:bg-ink",
        className
      )}
    >
      <HangerIcon className="h-4 w-4" />
    </motion.button>
  );
}
