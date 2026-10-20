export interface Product {
  id: string;
  /** Primary hero image */
  image: string;
  /** Optional gallery images for stacked/focused gallery (fallback to [image]) */
  images?: string[];
  category: string;
  name: string;
  price: number;
  originalPrice?: number;
  isNew?: boolean;
  /** Available stock (display hint; server is authoritative). */
  stock?: number;
}

/**
 * The variant a piece is bought in.
 *
 * `size` / `colorway` are `null` when the shopper has not chosen one (or when
 * the line came from a pre-variant cart). A null size is legal in the bag but
 * MUST block checkout — the customer has to pick one on the PDP.
 */
export interface ProductVariant {
  /** null = legacy / not yet chosen. A null size MUST block checkout. */
  size: string | null;
  colorway: string | null;
}

/**
 * Stable identity of a cart line: product + variant. Nulls collapse to "?" so
 * a legacy row keeps a usable key (`p2::?::?`) instead of colliding.
 */
export function lineIdOf(p: { id: string }, v: ProductVariant): string {
  return `${p.id}::${v.size ?? "?"}::${v.colorway ?? "?"}`;
}

export interface CartItem extends Product, ProductVariant {
  quantity: number;
  /** `lineIdOf(this product, this variant)` — the key for remove/qty updates. */
  lineId: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "midtrans" | "manual_transfer";

/** Snapshot of a cart line at purchase time (price/name/variant frozen). */
export interface OrderItem {
  product_id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  /** Carried through from the cart line; `null` only for legacy orders. */
  size: string | null;
  colorway: string | null;
  /** `lineIdOf`-style identity of the purchased line, e.g. `p2::L::?`. */
  line_id: string;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
  notes?: string;
}

export interface Order {
  id: string;
  /** Human-facing reference, e.g. BTPK-261018-7F3K */
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  address: ShippingAddress;
  created_at: string;
}

/** Which rigged reference mannequin the fitting room wears. */
export type Gender = "male" | "female";

/** Props shared by the 2D and 3D fitting-room mannequins. */
export interface MannequinProps {
  picks: Product[];
  /** Chosen colourway index per product id (see `colorsFor`). */
  colors: Record<string, number>;
  /** Chosen size per product id (see `SIZES`). */
  sizes?: Record<string, string>;
  /** Which body to dress (see `bodyMetrics`). Defaults to "male". */
  gender?: Gender;
}
