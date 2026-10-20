import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, RotateCcw, Share2, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { products } from "../constants/products";
import { useCartStore } from "../store/cart";
import { cn } from "../lib/utils";
import { formatIDR } from "../lib/money";
import { fitFor, SLOT_ORDER, SLOT_LABEL, SIZES, colorsFor } from "../constants/fit";
import type { Product } from "../types";
import Mannequin from "../components/Mannequin";
import type { Gender } from "../types";

interface OutfitSelection {
  bottom: Product | null;
  top: Product | null;
  outer: Product | null;
}

const SLOT_CATEGORIES: Record<string, string[]> = {
  bottom: ["Trousers"],
  top: ["Hoodie", "New Crop"],
  outer: ["Outerwear", "Vest"],
};

const BODIES: Gender[] = ["male", "female"];

export default function OutfitBuilder() {
  const [selection, setSelection] = useState<OutfitSelection>({
    bottom: null,
    top: null,
    outer: null,
  });
  const [gender, setGender] = useState<Gender>("male");
  const [activeSlot, setActiveSlot] = useState<string>("bottom");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, number>>({});
  const [showSaveToast, setShowSaveToast] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // Restore a shared look from `?look=` on first mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("look");
    if (!encoded) return;
    try {
      const parsed = JSON.parse(atob(encoded)) as {
        items?: string[];
        gender?: Gender;
        sizes?: Record<string, string>;
        colors?: Record<string, number>;
      };
      if (parsed.gender && BODIES.includes(parsed.gender)) setGender(parsed.gender);
      if (parsed.sizes) setSizes(parsed.sizes);
      if (parsed.colors) setColors(parsed.colors);
      if (Array.isArray(parsed.items)) {
        const byId = new Map(products.map((p) => [p.id, p]));
        const next: OutfitSelection = { bottom: null, top: null, outer: null };
        for (const id of parsed.items) {
          const p = byId.get(id);
          if (!p) continue;
          const slot = fitFor(p).slot as keyof OutfitSelection;
          next[slot] = p;
        }
        setSelection(next);
      }
    } catch {
      // Ignore malformed shared links.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProducts = useMemo(
    () => [selection.bottom, selection.top, selection.outer].filter(Boolean) as Product[],
    [selection]
  );

  const totalPrice = useMemo(
    () => selectedProducts.reduce((sum, p) => sum + p.price, 0),
    [selectedProducts]
  );

  const totalOriginalPrice = useMemo(
    () =>
      selectedProducts.reduce(
        (sum, p) => sum + (p.originalPrice ?? p.price),
        0
      ),
    [selectedProducts]
  );

  const savings = totalOriginalPrice - totalPrice;

  const toggleProduct = (product: Product) => {
    const slot = fitFor(product).slot as keyof OutfitSelection;
    const isSelected = selection[slot]?.id === product.id;

    if (isSelected) {
      setSelection((prev) => ({ ...prev, [slot]: null }));
      setSizes((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      setColors((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } else {
      setSelection((prev) => ({ ...prev, [slot]: product }));
      setActiveSlot(slot);
    }
  };

  const isSelected = (product: Product) => {
    const slot = fitFor(product).slot as keyof OutfitSelection;
    return selection[slot]?.id === product.id;
  };

  const handleShopLook = () => {
    // A piece without a size cannot be bagged — nothing is added unless the
    // whole look is sized.
    const missing = selectedProducts.find((p) => !sizes[p.id]);
    if (missing) {
      setActiveSlot(fitFor(missing).slot);
      toast.error(`Pilih ukuran untuk ${missing.name}`);
      return;
    }

    selectedProducts.forEach((p) => {
      const colorIndex = colors[p.id] ?? 0;
      // Index 0 = "As shown" → no colorway change (null).
      const colorway = colorIndex === 0 ? null : (colorsFor(p)[colorIndex]?.name ?? null);
      addItem(p, { size: sizes[p.id] ?? null, colorway });
    });
    toast.success(`Outfit added to bag`, {
      description: `${selectedProducts.length} pieces • ${formatIDR(totalPrice)}`,
    });
  };

  const handleShareLook = async () => {
    const lookData = {
      items: selectedProducts.map((p) => p.id),
      gender,
      sizes,
      colors,
    };
    const url = `${window.location.origin}/outfit?look=${btoa(JSON.stringify(lookData))}`;

    try {
      await navigator.clipboard.writeText(url);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleStartOver = () => {
    setSelection({ bottom: null, top: null, outer: null });
    setSizes({});
    setColors({});
  };

  const getProductsForSlot = (slot: string) => {
    const categories = SLOT_CATEGORIES[slot] || [];
    return products.filter((p) => categories.includes(p.category));
  };

  const getSlotStatus = (slot: string) => {
    const hasSelection = selection[slot as keyof OutfitSelection] !== null;
    const products = getProductsForSlot(slot);
    return { hasSelection, count: products.length };
  };

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      {/* Header */}
      <div className="mb-10 border-b border-steel/40 pb-8">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
          Wear your version
        </span>
        <h1 className="mt-3 font-display text-4xl leading-[0.9] text-bone sm:text-5xl lg:text-6xl">
          Outfit Builder
        </h1>
        <p className="mt-4 max-w-lg text-sm text-fog sm:text-base">
          Build your look layer by layer. Mix and match pieces to create your
          unique version.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Product Selection */}
        <div className="lg:col-span-7 xl:col-span-8">
          {/* Slot Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {SLOT_ORDER.map((slot) => {
              const status = getSlotStatus(slot);
              const isActive = activeSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setActiveSlot(slot)}
                  className={cn(
                    "border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                    isActive
                      ? "border-acid bg-acid text-ink"
                      : status.hasSelection
                        ? "border-bone/60 text-bone"
                        : "border-steel text-fog hover:border-bone hover:text-bone"
                  )}
                >
                  {SLOT_LABEL[slot as keyof typeof SLOT_LABEL]}
                  {status.hasSelection && (
                    <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-acid" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Products Grid for Active Slot */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            <AnimatePresence mode="sync">
              {getProductsForSlot(activeSlot).map((product, index) => {
                const selected = isSelected(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={cn(
                      "group relative flex flex-col border transition-colors",
                      selected
                        ? "border-acid bg-acid/5"
                        : "border-steel/40 bg-smoke hover:border-bone/60"
                    )}
                  >
                    {/* Image */}
                    <div className="relative aspect-4/5 w-full overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={cn(
                          "h-full w-full object-cover transition-all duration-500",
                          selected
                            ? "grayscale-0"
                            : "grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100"
                        )}
                        loading="lazy"
                      />

                      {/* Selected overlay */}
                      {selected && (
                        <div className="absolute inset-0 bg-acid/10" />
                      )}

                      {/* Check indicator */}
                      {selected && (
                        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-acid text-ink">
                          <Check className="h-4 w-4" />
                        </div>
                      )}

                      {/* Price tag */}
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-ink/80 px-2 py-1 text-xs font-semibold text-bone backdrop-blur-sm">
                          {formatIDR(product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-fog">
                        {product.category}
                      </span>
                      <h3 className="mt-1 font-display text-lg leading-tight text-bone">
                        {product.name}
                      </h3>

                      {/* Size selector for selected item */}
                      {selected && (
                        <div className="mt-3">
                          <span className="text-[10px] uppercase tracking-[0.15em] text-ash">
                            Size
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {SIZES.map((size) => (
                              <button
                                key={size}
                                onClick={() =>
                                  setSizes((prev) => ({
                                    ...prev,
                                    [product.id]: size,
                                  }))
                                }
                                className={cn(
                                  "min-w-8 border px-2 py-1 text-[10px] font-bold uppercase transition-colors",
                                  sizes[product.id] === size
                                    ? "border-acid bg-acid/10 text-bone"
                                    : "border-steel text-ash hover:border-bone hover:text-bone"
                                )}
                              >
                                {size}
                              </button>
                            ))}
                          </div>

                          {/* Colourway picker */}
                          <div className="mt-3">
                            <span className="text-[10px] uppercase tracking-[0.15em] text-ash">
                              Colourway
                            </span>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {colorsFor(product).map((c, idx) => (
                                <button
                                  key={c.name}
                                  onClick={() =>
                                    setColors((prev) => ({
                                      ...prev,
                                      [product.id]: idx,
                                    }))
                                  }
                                  title={c.name}
                                  className={cn(
                                    "h-6 w-6 border-2 transition-all",
                                    (colors[product.id] ?? 0) === idx
                                      ? "border-acid scale-110"
                                      : "border-steel hover:border-bone"
                                  )}
                                  style={{ backgroundColor: c.tone }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Toggle button */}
                      <button
                        onClick={() => toggleProduct(product)}
                        className={cn(
                          "mt-4 flex items-center justify-center gap-2 border py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                          selected
                            ? "border-acid bg-acid text-ink hover:bg-bone hover:border-bone"
                            : "border-steel text-fog hover:border-bone hover:text-bone"
                        )}
                      >
                        {selected ? (
                          <>
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add to look
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Preview & Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Preview */}
            <div className="border border-steel/40 bg-smoke">
              <div className="flex items-center justify-between border-b border-steel/40 px-5 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-fog">
                  Preview
                </span>
                <div className="flex gap-2" role="group" aria-label="Model body">
                  {BODIES.map((body) => (
                    <button
                      key={body}
                      onClick={() => setGender(body)}
                      className={cn(
                        "border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors",
                        gender === body
                          ? "border-acid bg-acid/10 text-bone"
                          : "border-steel text-ash hover:border-bone hover:text-bone"
                      )}
                    >
                      {body}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <div className="studio-grid absolute inset-0 opacity-70" />
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/5 blur-3xl"
                />
                <div className="absolute inset-0 flex items-center justify-center px-8 py-6">
                  <div className="h-full max-h-[400px] w-full max-w-[260px]">
                    <Mannequin
                      picks={selectedProducts}
                      colors={colors}
                      sizes={sizes}
                      gender={gender}
                    />
                  </div>
                </div>

                {selectedProducts.length === 0 && (
                  <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center font-display text-lg text-fog/70">
                    Start building your look
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="border border-steel/40 bg-smoke">
              <div className="border-b border-steel/40 px-5 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-fog">
                  Your look
                </span>
              </div>

              <div className="space-y-3 px-5 py-4">
                <AnimatePresence>
                  {selectedProducts.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-ash"
                    >
                      No pieces selected yet. Start with a base layer.
                    </motion.p>
                  ) : (
                    selectedProducts.map((product) => {
                      const slot = fitFor(product).slot;
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden border border-steel/40">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-bone">
                                {product.name}
                              </p>
                              <p className="text-[10px] uppercase tracking-[0.12em] text-ash">
                                {SLOT_LABEL[slot as keyof typeof SLOT_LABEL]}
                                {sizes[product.id] && ` • Size ${sizes[product.id]}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-bone">
                            {formatIDR(product.price)}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Total */}
              {selectedProducts.length > 0 && (
                <div className="border-t border-steel/40 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-fog">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="font-display text-2xl text-bone">
                        {formatIDR(totalPrice)}
                      </span>
                      {savings > 0 && (
                        <span className="ml-2 text-sm text-fog line-through">
                          {formatIDR(totalOriginalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  {savings > 0 && (
                    <p className="mt-1 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-acid">
                      You save {formatIDR(savings)}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 border-t border-steel/40 px-5 py-4">
                <button
                  onClick={handleShopLook}
                  disabled={selectedProducts.length === 0}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
                    selectedProducts.length > 0
                      ? "bg-acid text-ink hover:bg-bone"
                      : "cursor-not-allowed bg-steel/30 text-ash"
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Shop this look
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleShareLook}
                    disabled={selectedProducts.length === 0}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 border py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                      selectedProducts.length > 0
                        ? "border-steel text-fog hover:border-bone hover:text-bone"
                        : "cursor-not-allowed border-steel/30 text-ash/50"
                    )}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  <button
                    onClick={handleStartOver}
                    disabled={selectedProducts.length === 0}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 border py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors",
                      selectedProducts.length > 0
                        ? "border-steel text-fog hover:border-signal hover:text-signal"
                        : "cursor-not-allowed border-steel/30 text-ash/50"
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start over
                  </button>
                </div>
              </div>
            </div>

            {/* Save toast */}
            <AnimatePresence>
              {showSaveToast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="border border-acid bg-acid/10 px-4 py-3 text-center"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-acid">
                    Link copied to clipboard
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
