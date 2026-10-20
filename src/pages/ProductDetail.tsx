import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, Minus, Plus, ShoppingBag, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { products } from "../constants/products";
import { SIZES } from "../constants/fit";
import { FREE_SHIPPING_LABEL } from "../constants/commerce";
import { useCartStore } from "../store/cart";
import { useWishlistStore } from "../store/wishlist";
import { cn } from "../lib/utils";
import { formatIDR } from "../lib/money";
import HangerButton from "../components/HangerButton";
import ProductImageStack from "../components/ProductImageStack";
import SizeGuide from "../components/SizeGuide";

export default function ProductDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  const [quantity, setQuantity] = useState(1);
  // null until the shopper picks — a size is never assumed.
  const [size, setSize] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  // Stable identity: SizeGuide focuses/restores focus in an effect keyed on it.
  const closeGuide = useCallback(() => setGuideOpen(false), [setGuideOpen]);

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) =>
    product ? s.items.some((i) => i.id === product.id) : false
  );

  if (!product) {
    return (
      <section className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-4 px-4 py-32 text-center">
        <h1 className="font-display text-3xl text-bone">Piece not found</h1>
        <p className="text-fog">
          The piece you're looking for is off the grid.
        </p>
        <Link
          to="/shop"
          className="bg-acid px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
        >
          Back to shop
        </Link>
      </section>
    );
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const sizeChosen = size !== null;
  const outOfStock = (product.stock ?? 1) === 0;

  const handleAdd = () => {
    if (!sizeChosen) return;
    addItem(product, { size, colorway: null, quantity });
    toast.success(`${product.name} added to bag`, {
      description: `Size ${size} • ${quantity} pcs • ${formatIDR(
        product.price * quantity
      )}`,
    });
  };

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-fog">
        <Link to="/" className="transition-colors hover:text-acid">
          Home
        </Link>
        <span className="text-steel">/</span>
        <Link to="/shop" className="transition-colors hover:text-acid">
          Shop
        </Link>
        <span className="text-steel">/</span>
        <span className="text-bone">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image Gallery - Stacked Focus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative border border-steel/40 bg-smoke"
        >
          <ProductImageStack
            images={product.images ?? [product.image]}
            className="aspect-4/5 w-full"
          />
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
            {product.isNew && (
              <span className="bg-acid px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink">
                New
              </span>
            )}
            {discount > 0 && (
              <span className="border border-bone/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-bone">
                -{discount}%
              </span>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
            {product.category}
          </span>
          <h1 className="mt-3 font-display text-4xl leading-[0.92] text-bone sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="font-display text-2xl text-bone">
              {formatIDR(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-fog line-through">
                {formatIDR(product.originalPrice)}
              </span>
            )}
          </div>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-fog">
            Heavy-weight construction with a relaxed, expressive cut. Built to
            be worn hard and kept for years — not a seasonal preset.{" "}
            <span className="text-bone">Wear your version.</span>
          </p>

          {/* Size */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-bone">
                Size
              </span>
              <button
                onClick={() => setGuideOpen(true)}
                className="text-[11px] uppercase tracking-[0.15em] text-fog underline-offset-4 hover:text-acid hover:underline"
              >
                Size guide
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-12 border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors",
                    size === s
                      ? "border-acid bg-acid text-ink"
                      : "border-steel text-fog hover:border-bone hover:text-bone"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {!sizeChosen && (
              <p
                id="size-hint"
                role="status"
                className="mt-3 text-xs text-ash"
              >
                Pilih ukuran dulu.
              </p>
            )}
          </div>

          {/* Quantity + Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center border border-steel">
              <button
                aria-label="Decrease"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3.5 text-fog transition-colors hover:bg-smoke hover:text-bone"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center text-sm font-medium text-bone">
                {quantity}
              </span>
              <button
                aria-label="Increase"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-3.5 text-fog transition-colors hover:bg-smoke hover:text-bone"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!sizeChosen || outOfStock}
              aria-describedby={!sizeChosen ? "size-hint" : undefined}
              className={cn(
                "group inline-flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
                outOfStock
                  ? "cursor-not-allowed bg-steel/30 text-ash"
                  : sizeChosen
                    ? "bg-acid text-ink hover:bg-bone"
                    : "cursor-not-allowed bg-steel/30 text-ash"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              {outOfStock ? "Stok habis" : "Add to bag"}
            </button>

            <button
              aria-label="Wishlist"
              onClick={() => {
                toggleWishlist(product);
                toast(wished ? "Removed from wishlist" : "Saved to wishlist");
              }}
              className={cn(
                "inline-flex items-center justify-center border p-3.5 transition-colors",
                wished
                  ? "border-acid bg-acid text-ink"
                  : "border-steel text-fog hover:border-bone hover:text-bone"
              )}
            >
              <Heart className={cn("h-5 w-5", wished && "fill-current")} />
            </button>
          </div>

          {/* Fitting room */}
          <HangerButton product={product} showLabel className="mt-3 w-full" />

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-1 gap-px border-t border-steel/40 pt-8 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Free shipping", sub: FREE_SHIPPING_LABEL },
              { icon: RotateCcw, label: "30-day returns", sub: "No questions" },
              { icon: ShieldCheck, label: "100% original", sub: "Made to last" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="border border-steel p-2 text-acid">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-bone">
                    {label}
                  </p>
                  <p className="text-xs text-fog">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <SizeGuide open={guideOpen} onClose={closeGuide} />
    </section>
  );
}