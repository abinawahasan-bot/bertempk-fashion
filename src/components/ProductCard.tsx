import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { formatIDR } from "../lib/money";
import { imageSrcSet, imageUrl, ladderUpTo, PRODUCT_RATIO } from "../lib/images";
import { useWishlistStore } from "../store/wishlist";
import { useCartStore } from "../store/cart";
import { SIZES } from "../constants/fit";
import type { Product } from "../types";
import HangerButton from "./HangerButton";

interface ProductCardProps {
  product: Product;
  index?: number;
}

/**
 * Card grid width, measured from the layouts the cards render into:
 * `grid-cols-2 gap-4 px-4` (<640), `gap-6 px-6` (≥640) and
 * `lg:grid-cols-4 gap-6 px-10` inside `max-w-[1600px]` (≥1024).
 * 171 CSS px on a 390 px phone, 362 px on the widest desktop column.
 */
const CARD_SIZES =
  "(min-width: 1024px) min(25vw - 38px, 362px), (min-width: 640px) calc(50vw - 36px), calc(50vw - 24px)";

/** 362 CSS px × dpr 2 = 724, so the ladder stops at 960 (≈2.65×). */
const CARD_WIDTHS = ladderUpTo(960);

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { image, category, name, price, originalPrice, isNew } = product;

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const addItem = useCartStore((s) => s.addItem);
  const [quickAdding, setQuickAdding] = useState<string | null>(null);

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const outOfStock = (product.stock ?? 1) === 0;

  const handleWishlist = () => {
    toggleWishlist(product);
    toast(wished ? "Removed from wishlist" : "Saved to wishlist", {
      description: name,
    });
  };

  const handleQuickAdd = (size: string) => {
    setQuickAdding(size);
    addItem(product, { size, colorway: null, quantity: 1 });
    toast.success(`${name} added to bag`, {
      description: `Size ${size} • 1 pcs • ${formatIDR(price)}`,
    });
    setTimeout(() => setQuickAdding(null), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 4) * 0.07, duration: 0.5, ease: "easeOut" }}
      className="group relative flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-4/5 w-full overflow-hidden border border-steel/40 bg-smoke">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={imageUrl(image, 640)}
            srcSet={imageSrcSet(image, CARD_WIDTHS, PRODUCT_RATIO)}
            sizes={CARD_SIZES}
            alt={name}
            className="h-full w-full object-cover grayscale contrast-125 transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0"
            loading="lazy"
            decoding="async"
          />
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Index */}
        <span className="absolute left-3 top-3 font-display text-sm text-bone/70">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Wishlist + fitting room */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            aria-label="Add to wishlist"
            onClick={handleWishlist}
            className={cn(
              "rounded-none p-2.5 backdrop-blur-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40 active:scale-95",
              wished
                ? "bg-acid text-ink"
                : "bg-ink/60 text-bone hover:bg-ink"
            )}
          >
            <Heart className={cn("h-4 w-4", wished && "fill-current")} />
          </button>
          <HangerButton product={product} />
        </div>

        {/* Tags */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {outOfStock && (
            <span className="bg-ash px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink">
              Habis
            </span>
          )}
          {isNew && (
            <span className="bg-acid px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="border border-bone/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-bone">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick-add size picker — appears on hover (desktop) or always (mobile) */}
        {!outOfStock && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-100 transition-all duration-300 ease-out sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuickAdd(size);
                }}
                disabled={quickAdding === size}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center border px-2.5 text-[9px] font-bold uppercase tracking-[0.1em] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40",
                  quickAdding === size
                    ? "border-acid bg-acid text-ink"
                    : "border-bone/60 bg-bone/90 text-ink hover:bg-acid hover:border-acid backdrop-blur-sm"
                )}
              >
                {quickAdding === size ? "✓" : size}
              </button>
            ))}
            <Link
              to={`/product/${product.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-9 items-center justify-center border border-bone/60 bg-bone/90 px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-ink backdrop-blur-sm transition-colors hover:bg-acid hover:border-acid focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/40"
            >
              Detail
            </Link>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 flex items-start justify-between gap-3 border-t border-steel/40 pt-3">
        <div className="min-w-0">
          <span className="block truncate text-[10px] font-medium uppercase tracking-[0.2em] text-fog">
            {category}
          </span>
          <h3 className="mt-1 truncate font-display text-lg leading-tight text-bone transition-colors group-hover:text-acid">
            <Link to={`/product/${product.id}`} className="block truncate">
              {name}
            </Link>
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-sm font-semibold text-bone">
            {formatIDR(price)}
          </span>
          {originalPrice && (
            <span className="block text-xs text-fog line-through">
              {formatIDR(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
