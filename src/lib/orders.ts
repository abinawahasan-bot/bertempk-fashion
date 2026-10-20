import { getSupabase, isSupabaseConfigured } from "./supabase";
import { products } from "../constants/products";
import { shippingCostFor } from "../constants/commerce";
import { SIZES } from "../constants/fit";
import { toRupiah } from "./money";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ShippingAddress,
} from "../types";

const LOCAL_ORDERS_KEY = "bato-orders";

const STATUSES: readonly OrderStatus[] = [
  "pending_payment",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "midtrans",
  "manual_transfer",
];

/*
 * Read normalisation.
 *
 * Orders written before the variant-aware cart existed have lines with no
 * `size` / `colorway` / `line_id`, and Supabase jsonb can hold anything. These
 * helpers turn an unknown row into a fully-populated `Order` / `OrderItem` so
 * the UI never renders "undefined" or hides a missing size. Stored data is
 * never rewritten — this runs on read only.
 */

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function amount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** One unknown line → a complete `OrderItem`, or null when unusable. */
function normaliseItem(raw: unknown): OrderItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const productId = text(r.product_id);
  if (!productId) return null;

  const size = text(r.size);
  const colorway = text(r.colorway);
  const quantity = Math.max(1, Math.floor(amount(r.quantity)));

  return {
    product_id: productId,
    name: text(r.name) ?? "",
    image: text(r.image) ?? "",
    category: text(r.category) ?? "",
    price: amount(r.price),
    quantity,
    // Explicit null — "no size recorded", never undefined.
    size,
    colorway,
    line_id: text(r.line_id) ?? "",
  };
}

/** The line array of an unknown order, with unusable rows dropped. */
function normaliseItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = normaliseItem(row);
    return item ? [item] : [];
  });
}

function normaliseAddress(raw: unknown): ShippingAddress {
  const r = (raw ?? {}) as Record<string, unknown>;
  const notes = text(r.notes);
  return {
    full_name: text(r.full_name) ?? "",
    email: text(r.email) ?? "",
    phone: text(r.phone) ?? "",
    line1: text(r.line1) ?? "",
    city: text(r.city) ?? "",
    postal_code: text(r.postal_code) ?? "",
    country: text(r.country) ?? "",
    ...(notes ? { notes } : {}),
  };
}

/** One unknown order → a complete `Order`, or null when unusable. */
function normaliseOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const id = text(r.id);
  if (!id) return null;

  const status = text(r.status) as OrderStatus | null;
  const paymentMethod = text(r.payment_method) as PaymentMethod | null;

  return {
    id,
    order_number: text(r.order_number) ?? id,
    user_id: text(r.user_id),
    status: status && STATUSES.includes(status) ? status : "pending_payment",
    payment_method:
      paymentMethod && PAYMENT_METHODS.includes(paymentMethod)
        ? paymentMethod
        : "manual_transfer",
    items: normaliseItems(r.items),
    subtotal: amount(r.subtotal),
    shipping_cost: amount(r.shipping_cost),
    total: amount(r.total),
    address: normaliseAddress(r.address),
    created_at: text(r.created_at) ?? "",
  };
}

/** The stored array, exactly as persisted — never normalised or rewritten. */
function readStoredOrders(): unknown[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalOrders(): Order[] {
  return readStoredOrders()
    .map(normaliseOrder)
    .filter((o): o is Order => o !== null);
}

function writeLocalOrders(orders: unknown[]) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

/** Clears all locally-stored guest orders (privacy / shared-device hygiene). */
export function clearLocalOrders(): void {
  try {
    localStorage.removeItem(LOCAL_ORDERS_KEY);
  } catch {
    /* ignore — storage may be unavailable */
  }
}

function computeLocal(lines: CreateOrderLine[], shippingMethod: string) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const items = lines.map((l) => {
    const p = productById.get(l.product_id)!;
    return {
      product_id: l.product_id,
      name: p.name,
      image: p.image,
      category: p.category,
      price: toRupiah(p.price),
      quantity: l.quantity,
      size: l.size,
      colorway: l.colorway,
      line_id: `${l.product_id}::${l.size}::${l.colorway ?? "?"}`,
    };
  });
  const subtotal = toRupiah(items.reduce((s, i) => s + i.price * i.quantity, 0));
  const shipping_cost = shippingCostFor(subtotal, shippingMethod);
  const total = toRupiah(subtotal + shipping_cost);
  return { items, subtotal, shipping_cost, total };
}

/**
 * BTPK-YYMMDD-XXXXXX (ambiguous chars excluded from the 6-char suffix).
 *
 * The suffix is 6 symbols from a 32-symbol alphabet (no I/O/0/1), so a day
 * holds ~10^9 ids instead of ~10^6 — `order_number` is `unique` in Postgres
 * and a collision must never be a routine outcome.
 */
export function generateOrderNumber(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BTPK-${yy}${mm}${dd}-${suffix}`;
}

export type OrderStorage = "supabase" | "local" | "none";

export interface CreateOrderLine {
  product_id: string;
  size: string;
  colorway: string | null;
  quantity: number;
}

export interface CreateOrderInput {
  userId: string | null;
  lines: CreateOrderLine[];
  shippingMethod: string;
  address: Order["address"];
  paymentMethod?: Order["payment_method"];
}

export type CreateOrderFailure = "persist-failed" | "invalid-items";

/**
 * The outcome of a write attempt, as a discriminated union.
 *
 * `ok: true` — the order is stored and may be presented to the customer as
 * placed. `ok: false` — the order exists NOWHERE: not in Postgres, and not in
 * the local fallback either (writing a phantom local row would put an order on
 * `/orders` that the studio has never seen). The caller must not show a
 * success toast, must not empty the bag and must not navigate away; it has to
 * tell the truth and let the customer retry.
 */
export type CreateOrderResult =
  | { ok: true; order: Order; storage: Exclude<OrderStorage, "none"> }
  | {
      ok: false;
      reason: CreateOrderFailure;
      order: Order;
      storage: "none";
    };

/**
 * Persist a new order and report honestly whether it was stored.
 *
 * - Signed in + Supabase configured → the `create-order` Edge Function, which
 *   owns price authority (SEC-001).
 * - Guests, or a build with no Supabase at all → localStorage. That is a
 *   legitimate outcome, so it stays `ok: true` with `storage: "local"`.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const paymentMethod = input.paymentMethod ?? "manual_transfer";
  const now = new Date().toISOString();

  // Client-side backstop validation (mirrors the server's rules).
  if (
    !Array.isArray(input.lines) ||
    input.lines.length === 0 ||
    !input.lines.every((l) => {
      if (!l || typeof l.product_id !== "string" || !l.product_id.trim()) return false;
      if (typeof l.size !== "string" || !SIZES.includes(l.size as (typeof SIZES)[number])) return false;
      if (typeof l.quantity !== "number" || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99) return false;
      return true;
    })
  ) {
    const placeholder: Order = {
      id: crypto.randomUUID(),
      order_number: generateOrderNumber(),
      user_id: input.userId,
      status: "pending_payment",
      payment_method: paymentMethod,
      items: [],
      subtotal: 0,
      shipping_cost: 0,
      total: 0,
      address: input.address,
      created_at: now,
    };
    console.warn("[orders] refusing to persist an order with unusable lines");
    return { ok: false, reason: "invalid-items", order: placeholder, storage: "none" };
  }

  // Guest / unconfigured: compute from constants and write locally (untrusted
  // but own cart — acceptable, matches pre-Phase-1 behaviour).
  if (!isSupabaseConfigured || !input.userId) {
    const computed = computeLocal(input.lines, input.shippingMethod);
    const order: Order = {
      id: crypto.randomUUID(),
      order_number: generateOrderNumber(),
      user_id: input.userId,
      status: "pending_payment",
      payment_method: paymentMethod,
      items: computed.items,
      subtotal: computed.subtotal,
      shipping_cost: computed.shipping_cost,
      total: computed.total,
      address: input.address,
      created_at: now,
    };
    writeLocalOrders([order, ...readStoredOrders()]);
    return { ok: true, order, storage: "local" };
  }

  // Signed in + Supabase configured: price authority lives on the server.
  const supabase = await getSupabase();
  const body = {
    items: input.lines.map((l) => ({
      product_id: l.product_id,
      size: l.size,
      colorway: l.colorway,
      quantity: l.quantity,
    })),
    shipping_method: input.shippingMethod,
    address: input.address,
    payment_method: paymentMethod,
  };

  try {
    const { data, error } = await supabase.functions.invoke("create-order", { body });
    if (error) throw error;
    const order = normaliseOrder((data as { order?: unknown })?.order);
    if (!order) throw new Error("malformed response");
    return { ok: true, order, storage: "supabase" };
  } catch (err) {
    console.warn("[orders] create-order function failed:", (err as { message?: string })?.message ?? err);
  }

  const placeholder: Order = {
    id: crypto.randomUUID(),
    order_number: generateOrderNumber(),
    user_id: input.userId,
    status: "pending_payment",
    payment_method: paymentMethod,
    items: [],
    subtotal: 0,
    shipping_cost: 0,
    total: 0,
    address: input.address,
    created_at: now,
  };
  return { ok: false, reason: "persist-failed", order: placeholder, storage: "none" };
}

export async function getOrder(id: string): Promise<Order | null> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return normaliseOrder(data);
    } catch (err) {
      // Fall through to the local copy rather than failing the confirmation.
      console.warn("[orders] order lookup failed, using local storage:", err);
    }
  }
  return readLocalOrders().find((o) => o.id === id) ?? null;
}

export async function listOrders(userId: string | null): Promise<Order[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return (data as unknown[])
          .map(normaliseOrder)
          .filter((o): o is Order => o !== null);
      }
    } catch (err) {
      // Guest / offline fallback: the local list is a legitimate answer.
      console.warn("[orders] order list failed, using local storage:", err);
    }
  }
  return readLocalOrders();
}

/** True when any line of `order` was recorded without a size. */
export function hasUnSizedLines(order: Order): boolean {
  return order.items.some((i) => i.size === null);
}
