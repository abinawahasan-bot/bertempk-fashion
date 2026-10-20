// Vendored copy of the storefront catalogue + commerce constants.
// Canonical source: src/constants/products.ts + src/constants/commerce.ts +
// src/constants/fit.ts (frontend). Keep in sync via scripts/sync-catalog.mjs;
// the parity test src/lib/catalog.parity.test.ts fails if they diverge.
// See docs/adr/0001-price-authority-edge-function.md.
export const SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL"
];
export const FREE_SHIPPING_THRESHOLD = 1_500_000;
export const SHIPPING_METHODS = [
  {
    id: "standard",
    label: "Reguler",
    eta: "3–5 hari kerja",
    price: 25_000,
    freeEligible: true
  },
  {
    id: "express",
    label: "Ekspres",
    eta: "1–2 hari kerja",
    price: 45_000,
    freeEligible: false
  }
];
export const PRODUCTS = {
  p1: {
    name: "Mod Jacket / 001",
    image: "https://images.pexels.com/photos/29900469/pexels-photo-29900469.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    category: "Outerwear",
    price: 1_290_000
  },
  p2: {
    name: "Static Hoodie / 002",
    image: "https://images.pexels.com/photos/28701960/pexels-photo-28701960.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    category: "Hoodie",
    price: 989_000
  },
  p3: {
    name: "Wide Trousers / 003",
    image: "https://images.pexels.com/photos/36611867/pexels-photo-36611867.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    category: "Trousers",
    price: 1_190_000
  },
  p4: {
    name: "Multi-pocket Vest / 001",
    image: "https://images.pexels.com/photos/14437343/pexels-photo-14437343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    category: "Outerwear",
    price: 1_590_000
  },
  p5: {
    name: "Signal Crop / 004",
    image: "https://images.pexels.com/photos/5443935/pexels-photo-5443935.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    category: "New Crop",
    price: 749_000
  },
  p6: {
    name: "Wide Trousers / 002",
    image: "https://images.pexels.com/photos/17908419/pexels-photo-17908419.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop",
    category: "Trousers",
    price: 1_190_000
  }
};
export function shippingCostFor(subtotal, methodId) {
  const method = SHIPPING_METHODS.find((m)=>m.id === methodId);
  if (!method) return 0;
  if (method.freeEligible && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return method.price;
}
export function toRupiah(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}
