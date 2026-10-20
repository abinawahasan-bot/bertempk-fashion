import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCartStore } from "../store/cart";
import { useUIStore } from "../store/ui";
import { formatIDR } from "../lib/money";
import { freeShippingHint } from "../constants/commerce";
import LineImage from "./LineImage";

export default function CartDrawer() {
  const navigate = useNavigate();
  const { cartOpen, closeCart } = useUIStore();
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const remaining = freeShippingHint(subtotal()).remaining;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-steel/50 bg-coal"
          >
            <div className="flex items-center justify-between border-b border-steel/40 px-5 py-5">
              <h2 className="font-display text-xl text-bone">
                Your bag
                <span className="ml-2 text-acid">({items.length})</span>
              </h2>
              <button
                onClick={closeCart}
                aria-label="Close bag"
                className="p-2 text-fog transition-colors hover:bg-smoke hover:text-bone"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="border border-steel/50 p-5">
                  <ShoppingBag className="h-8 w-8 text-fog" />
                </div>
                <div>
                  <p className="font-display text-lg text-bone">Bag is empty</p>
                  <p className="mt-1 text-sm text-fog">
                    Start with the latest drop.
                  </p>
                </div>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="bg-acid px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
                >
                  Shop now
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {items.map((item) => (
                    <motion.div
                      key={item.lineId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4"
                    >
                      <div className="h-24 w-20 shrink-0 overflow-hidden border border-steel/40 bg-smoke">
                        <LineImage
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover grayscale"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-fog">
                          {item.category}
                        </span>
                        <span className="truncate font-display text-base text-bone">
                          {item.name}
                        </span>
                        <span className="mt-1 text-sm font-semibold text-acid">
                          {formatIDR(item.price)}
                        </span>

                        {/* Variant line — a null size cannot be checked out. */}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {item.size === null ? (
                            <Link
                              to={`/product/${item.id}`}
                              onClick={closeCart}
                              className="border border-signal/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-signal transition-colors hover:border-acid hover:text-acid"
                            >
                              Choose size
                            </Link>
                          ) : (
                            <span className="border border-steel px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-fog">
                              Size {item.size}
                            </span>
                          )}
                          {item.colorway && (
                            <span className="border border-steel px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-fog">
                              {item.colorway}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-steel">
                            <button
                              aria-label={`Decrease ${item.name}`}
                              onClick={() =>
                                updateQuantity(item.lineId, item.quantity - 1)
                              }
                              className="p-2.5 text-fog transition-colors hover:bg-smoke hover:text-bone"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-medium text-bone">
                              {item.quantity}
                            </span>
                            <button
                              aria-label={`Increase ${item.name}`}
                              onClick={() =>
                                updateQuantity(item.lineId, item.quantity + 1)
                              }
                              className="p-2.5 text-fog transition-colors hover:bg-smoke hover:text-bone"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            aria-label={`Remove ${item.name}`}
                            onClick={() => {
                              removeItem(item.lineId);
                              toast("Removed from bag");
                            }}
                            className="p-1.5 text-ash transition-colors hover:text-acid"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-steel/40 px-5 py-5">
                  {remaining > 0 && (
                    <p className="mb-3 text-xs text-fog">
                      Tambah{" "}
                      <span className="font-semibold text-acid">
                        {formatIDR(remaining)}
                      </span>{" "}
                      lagi untuk gratis ongkir.
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="uppercase tracking-[0.2em] text-fog">
                      Subtotal
                    </span>
                    <span className="font-display text-xl text-bone">
                      {formatIDR(subtotal())}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ash">
                    Shipping & taxes calculated at checkout.
                  </p>
                  <button
                    onClick={() => {
                      closeCart();
                      navigate("/checkout");
                    }}
                    className="mt-4 w-full bg-acid px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}