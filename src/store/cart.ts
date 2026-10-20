import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  lineIdOf,
  type CartItem,
  type Product,
  type ProductVariant,
} from "../types";

/**
 * Cart store — variant aware.
 *
 * A line is identified by `lineId` (product + size + colourway), never by the
 * product id: the same hoodie in M and in L are two lines. `size` may be null
 * (legacy / not chosen yet); checkout is responsible for blocking that case.
 */

interface CartState {
  items: CartItem[];
  /** Adds `quantity` (default 1) of `product` in the given variant. */
  addItem: (
    product: Product,
    variant?: ProductVariant & { quantity?: number }
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

/** What actually gets written to localStorage. */
interface CartSnapshot {
  items: CartItem[];
}

/** At least 1, whole, never NaN — the persisted value can be anything. */
function safeQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 1 ? n : 1;
}

/** A non-blank string, or null. Junk in storage becomes null, not "undefined". */
function safeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * Turns one unknown persisted row into a valid cart line, or drops it.
 *
 * A v0/v1 cart holds plain products with no variant, so `size` and `colorway`
 * become `null` and the line id collapses to `p2::?::?`. A size is never
 * invented for a legacy row — the PDP has to be visited to pick one.
 */
function coerceItem(row: unknown): CartItem[] {
  if (!row || typeof row !== "object") return [];
  const r = row as Record<string, unknown>;

  const id = safeText(r.id);
  if (!id) return [];

  const product: Product = {
    id,
    image: safeText(r.image) ?? "",
    category: safeText(r.category) ?? "",
    name: safeText(r.name) ?? "",
    price: Number.isFinite(Number(r.price)) ? Number(r.price) : 0,
    ...(Number.isFinite(Number(r.originalPrice))
      ? { originalPrice: Number(r.originalPrice) }
      : {}),
    ...(r.isNew === true ? { isNew: true } : {}),
  };

  const size = safeText(r.size);
  const colorway = safeText(r.colorway);

  return [
    {
      ...product,
      size,
      colorway,
      lineId: lineIdOf(product, { size, colorway }),
      quantity: safeQuantity(r.quantity),
    },
  ];
}

/**
 * v0/v1 → v2. Tolerates non-arrays and junk rows instead of throwing.
 *
 * Two legacy rows for the same product both normalise to the same `lineId`
 * (`p2::?::?`), so they are merged here by summing quantity. Without this the
 * bag would hold two rows under one key and `addItem` would only ever bump the
 * first, `updateQuantity` would write the same count to both and `subtotal`
 * would double-charge.
 */
function migrateCart(persisted: unknown): CartSnapshot {
  const raw = persisted as { items?: unknown } | null | undefined;
  const rows = Array.isArray(raw?.items) ? raw.items : [];

  const merged = new Map<string, CartItem>();
  for (const item of rows.flatMap(coerceItem)) {
    const seen = merged.get(item.lineId);
    merged.set(
      item.lineId,
      seen ? { ...seen, quantity: seen.quantity + item.quantity } : item
    );
  }
  return { items: [...merged.values()] };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Single `set`, no loop: dedupe on lineId only.
      addItem: (product, variant) =>
        set((state) => {
          const chosen: ProductVariant = {
            size: variant?.size ?? null,
            colorway: variant?.colorway ?? null,
          };
          const quantity = safeQuantity(variant?.quantity);
          const lineId = lineIdOf(product, chosen);

          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineId === lineId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...product, ...chosen, quantity, lineId }],
          };
        }),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        })),

      /*
       * Explicit non-positive → the line goes (the drawer's minus button at
       * qty 1 does exactly this). Everything else is coerced by
       * `safeQuantity`, so `Infinity` / `NaN` / fractions can never survive
       * the `> 0` filter and poison `subtotal()` into `Infinity`.
       */
      updateQuantity: (lineId, quantity) =>
        set((state) => {
          const n = Math.floor(Number(quantity));
          if (Number.isFinite(n) && n <= 0) {
            return { items: state.items.filter((i) => i.lineId !== lineId) };
          }
          return {
            items: state.items.map((i) =>
              i.lineId === lineId ? { ...i, quantity: safeQuantity(n) } : i
            ),
          };
        }),

      clear: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "bato-cart",
      version: 2,
      partialize: (state): CartSnapshot => ({ items: state.items }),
      migrate: (persisted) => migrateCart(persisted),
    }
  )
);