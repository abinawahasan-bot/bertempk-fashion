import { formatIDR, toRupiah } from "../lib/money";

/**
 * Commerce constants — the single source of truth for currency, shipping and
 * contact details. Pages read from here; nothing hardcodes a price format, a
 * shipping table or a studio address.
 */

/** Indonesia → whole rupiah, `id-ID` grouping. */
export const CURRENCY = { code: "IDR", locale: "id-ID", symbol: "Rp" } as const;

/** Reguler shipping is free at or above this subtotal. */
export const FREE_SHIPPING_THRESHOLD = 1_500_000;

export const SHIPPING_METHODS = [
  {
    id: "standard",
    label: "Reguler",
    eta: "3–5 hari kerja",
    price: 25_000,
    freeEligible: true,
  },
  {
    id: "express",
    label: "Ekspres",
    eta: "1–2 hari kerja",
    price: 45_000,
    freeEligible: false,
  },
] as const;

export type ShippingMethod = (typeof SHIPPING_METHODS)[number];
export type ShippingMethodId = ShippingMethod["id"];

/**
 * Cost of shipping `subtotal` with `methodId`. Reguler is free at/above the
 * threshold; Ekspres always costs its flat price. An unknown id costs 0
 * (nothing is selected yet).
 */
export function shippingCostFor(subtotal: number, methodId: string): number {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId);
  if (!method) return 0;
  if (method.freeEligible && toRupiah(subtotal) >= FREE_SHIPPING_THRESHOLD) return 0;
  return method.price;
}

/** How much more is needed to unlock free Reguler shipping. */
export function freeShippingHint(subtotal: number): {
  qualified: boolean;
  remaining: number;
} {
  const remaining = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - toRupiah(subtotal)
  );
  return { qualified: remaining === 0, remaining };
}

/** Badge copy for the free-shipping promise. */
export const FREE_SHIPPING_LABEL = `Gratis ongkir di atas ${formatIDR(
  FREE_SHIPPING_THRESHOLD
)}`;

/**
 * Studio contact details from the build env. Empty strings mean "not
 * configured" — the UI must say so rather than render a blank link.
 */
export const CONTACT = {
  email: String(import.meta.env.VITE_CONTACT_EMAIL ?? "").trim(),
  whatsapp: String(import.meta.env.VITE_CONTACT_WHATSAPP ?? "").trim(),
  origin: String(import.meta.env.VITE_BRAND_ORIGIN ?? "Indonesia").trim(),
} as const;