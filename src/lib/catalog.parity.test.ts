import { describe, it, expect } from "vitest";
import { products } from "../constants/products";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_METHODS } from "../constants/commerce";
import { SIZES } from "../constants/fit";

/**
 * Parity guard: the frontend catalogue must agree with the vendored copy inside
 * the `create-order` Edge Function (supabase/functions/create-order/catalog.ts).
 * If a price or shipping constant changes here, the function copy must be
 * updated (run scripts/sync-catalog.mjs) — otherwise the server would bill a
 * different amount than the storefront shows.
 *
 * The expected values below are the function's catalogue, mirrored by hand.
 * Update both sides together.
 */
const FUNCTION_CATALOG = {
  products: {
    p1: { price: 1_290_000 },
    p2: { price: 989_000 },
    p3: { price: 1_190_000 },
    p4: { price: 1_590_000 },
    p5: { price: 749_000 },
    p6: { price: 1_190_000 },
  },
  freeShippingThreshold: 1_500_000,
  shipping: [
    { id: "standard", price: 25_000 },
    { id: "express", price: 45_000 },
  ],
  sizes: ["XS", "S", "M", "L", "XL"],
};

describe("catalog parity (frontend ↔ create-order function)", () => {
  it("has the same product ids and prices", () => {
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const [id, entry] of Object.entries(FUNCTION_CATALOG.products)) {
      const p = byId.get(id);
      expect(p, `missing product ${id}`).toBeDefined();
      expect(p!.price).toBe(entry.price);
    }
    expect(products.map((p) => p.id).sort()).toEqual(
      Object.keys(FUNCTION_CATALOG.products).sort()
    );
  });

  it("has the same free-shipping threshold", () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(FUNCTION_CATALOG.freeShippingThreshold);
  });

  it("has the same shipping prices", () => {
    for (const s of FUNCTION_CATALOG.shipping) {
      const m = SHIPPING_METHODS.find((x) => x.id === s.id);
      expect(m, `missing shipping method ${s.id}`).toBeDefined();
      expect(m!.price).toBe(s.price);
    }
  });

  it("has the same sizes", () => {
    expect([...SIZES]).toEqual(FUNCTION_CATALOG.sizes);
  });
});