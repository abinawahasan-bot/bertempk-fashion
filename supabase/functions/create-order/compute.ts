import { SIZES, SHIPPING_METHODS, shippingCostFor, toRupiah } from "./catalog.ts";
export class ComputeError extends Error {
  code;
  constructor(code, message){
    super(message ?? code);
    this.code = code;
    this.name = "ComputeError";
  }
}
export function lineIdOf(productId, size, colorway) {
  return `${productId}::${size ?? "?"}::${colorway ?? "?"}`;
}
export function computeOrder(lines, shippingMethodId, catalog) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ComputeError("empty_cart");
  }
  if (lines.length > 50) throw new ComputeError("too_many_items");
  const method = SHIPPING_METHODS.find((m)=>m.id === shippingMethodId);
  if (!method) throw new ComputeError("invalid_shipping_method");
  const items = [];
  let subtotal = 0;
  for (const line of lines){
    const product = catalog[line.product_id];
    if (!product) throw new ComputeError("unknown_product");
    if (typeof line.size !== "string" || !SIZES.includes(line.size)) {
      throw new ComputeError("invalid_size");
    }
    const q = line.quantity;
    if (typeof q !== "number" || !Number.isInteger(q) || q < 1 || q > 99) {
      throw new ComputeError("invalid_quantity");
    }
    if (product.stock < q) throw new ComputeError("insufficient_stock");
    const colorway = line.colorway === null || line.colorway === undefined ? null : typeof line.colorway === "string" ? line.colorway.trim() || null : null;
    if (colorway !== null && colorway.length > 64) throw new ComputeError("invalid_quantity");
    const price = toRupiah(product.price);
    items.push({
      product_id: line.product_id,
      name: product.name,
      image: product.image,
      category: product.category,
      price,
      quantity: q,
      size: line.size,
      colorway,
      line_id: lineIdOf(line.product_id, line.size, colorway)
    });
    subtotal += price * q;
  }
  subtotal = toRupiah(subtotal);
  const shipping_cost = shippingCostFor(subtotal, shippingMethodId);
  const total = toRupiah(subtotal + shipping_cost);
  return {
    items,
    subtotal,
    shipping_cost,
    total
  };
}
