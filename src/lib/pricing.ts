import { products } from "../constants/products";
import { shippingCostFor } from "../constants/commerce";
import { toRupiah } from "./money";

export interface PreviewLine {
  product_id: string;
  quantity: number;
}

export interface PreviewTotals {
  subtotal: number;
  shipping_cost: number;
  total: number;
}

/**
 * Client-side preview of order totals. Used for Checkout display only — the
 * server recomputes authoritatively on persist (SEC-001). Unknown products
 * contribute 0.
 */
export function computePreview(
  lines: readonly PreviewLine[],
  shippingMethodId: string
): PreviewTotals {
  const productById = new Map(products.map((p) => [p.id, p]));
  const subtotal = toRupiah(
    lines.reduce((sum, line) => {
      const p = productById.get(line.product_id);
      const price = p ? toRupiah(p.price) : 0;
      const q = Number.isInteger(line.quantity) && line.quantity > 0 ? line.quantity : 0;
      return sum + price * q;
    }, 0)
  );
  const shipping_cost = shippingCostFor(subtotal, shippingMethodId);
  const total = toRupiah(subtotal + shipping_cost);
  return { subtotal, shipping_cost, total };
}