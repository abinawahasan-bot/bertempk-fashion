import { describe, it, expect, beforeEach, vi } from "vitest";

// Force the localStorage fallback: never touch a real Supabase project.
vi.mock("./supabase", () => ({
  isSupabaseConfigured: false,
  getSupabase: () =>
    Promise.resolve({
      from: () => {
        throw new Error("network calls are forbidden in tests");
      },
    }),
}));

import {
  createOrder,
  getOrder,
  listOrders,
  generateOrderNumber,
} from "./orders";
import type { Order, ShippingAddress } from "../types";

const ADDRESS: ShippingAddress = {
  full_name: "Aiman Razali",
  email: "aiman@example.com",
  phone: "+62 812 3456 7890",
  line1: "Jalan Betong 12",
  city: "Kuala Lumpur",
  postal_code: "50450",
  country: "Malaysia",
  notes: "Ring twice.",
};

function input(overrides: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return {
    userId: null,
    lines: [
      { product_id: "p2", size: "L", colorway: null, quantity: 2 },
      { product_id: "p5", size: "M", colorway: null, quantity: 1 },
    ],
    shippingMethod: "standard",
    paymentMethod: "manual_transfer" as const,
    address: ADDRESS,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("generateOrderNumber", () => {
  it("formats as BTPK-YYMMDD-XXXXXX", () => {
    const n = generateOrderNumber(new Date(2026, 9, 18));
    expect(n).toMatch(/^BTPK-261018-[A-Z0-9]{6}$/);
  });

  it("excludes ambiguous characters from the suffix", () => {
    for (let i = 0; i < 300; i += 1) {
      const suffix = generateOrderNumber().split("-")[2];
      expect(suffix).not.toMatch(/[IO01]/);
    }
  });

  it("keeps the suffix wide enough that a collision is not routine", () => {
    // 6 symbols from a 32-symbol alphabet: ~10^9 ids per day, not ~10^6.
    const seen = new Set<string>();
    for (let i = 0; i < 2_000; i += 1) {
      seen.add(generateOrderNumber(new Date(2026, 9, 18)).split("-")[2]!);
    }
    expect(seen.size).toBe(2_000);
  });
});

describe("createOrder (localStorage fallback)", () => {
  it("persists a pending order and reports local storage", async () => {
    const result = await createOrder(input());

    // A guest order with no Supabase is a legitimate, successful outcome.
    expect(result.ok).toBe(true);
    const { order, storage } = result;
    if (!result.ok) throw new Error("expected a stored order");

    expect(storage).toBe("local");
    expect(order.status).toBe("pending_payment");
    expect(order.payment_method).toBe("manual_transfer");
    expect(order.user_id).toBeNull();
    expect(order.order_number).toMatch(/^BTPK-/);

    const raw = JSON.parse(
      localStorage.getItem("bato-orders") ?? "[]"
    ) as Order[];
    expect(raw).toHaveLength(1);
    expect(raw[0].id).toBe(order.id);
  });

  it("freezes the price and quantity snapshot at purchase time", async () => {
    const result = await createOrder(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected a stored order");
    const { order } = result;
    // Prices come from the server-side catalogue (constants), frozen at
    // purchase time: p2 = 989000 x2, p5 = 749000 x1.
    expect(order.items).toHaveLength(2);
    expect(order.items[0]!.product_id).toBe("p2");
    expect(order.items[0]!.price).toBe(989000);
    expect(order.items[0]!.quantity).toBe(2);
    expect(order.items[1]!.product_id).toBe("p5");
    expect(order.items[1]!.price).toBe(749000);
    expect(order.items[1]!.quantity).toBe(1);
    // subtotal 2727000 >= free-shipping threshold 1500000 → shipping 0.
    expect(order.subtotal).toBe(2727000);
    expect(order.shipping_cost).toBe(0);
    expect(order.total).toBe(2727000);
  });

  it("stores the shipping address verbatim", async () => {
    const result = await createOrder(input());
    if (!result.ok) throw new Error("expected a stored order");
    expect(result.order.address).toEqual(ADDRESS);
  });

  it("keeps multiple orders, newest first", async () => {
    const a = await createOrder(input());
    const b = await createOrder(input());
    const list = await listOrders(null);
    expect(list.map((o) => o.id)).toEqual([b.order.id, a.order.id]);
  });
});

describe("getOrder", () => {
  it("round-trips a created order", async () => {
    const created = await createOrder(input());
    const found = await getOrder(created.order.id);
    expect(found).not.toBeNull();
    expect(found?.order_number).toBe(created.order.order_number);
    expect(found?.total).toBe(2727000);
  });

  it("returns null for an unknown id", async () => {
    await createOrder(input());
    expect(await getOrder("does-not-exist")).toBeNull();
  });
});

describe("listOrders", () => {
  it("returns an empty list when nothing was ordered", async () => {
    expect(await listOrders(null)).toEqual([]);
  });

  it("survives corrupted localStorage data", async () => {
    localStorage.setItem("bato-orders", "{not valid json");
    await expect(listOrders(null)).resolves.toEqual([]);
  });
});

/**
 * Orders placed before the variant-aware cart have lines with no
 * `size` / `colorway` / `line_id`. Reading them must produce explicit values —
 * the UI has to be able to say "size not chosen", not render `undefined`.
 */
const LEGACY_ORDER = {
  id: "legacy-1",
  order_number: "BTPK-260101-ABCD",
  user_id: null,
  status: "pending_payment",
  payment_method: "manual_transfer",
  items: [
    {
      product_id: "p2",
      name: "Static Hoodie / 002",
      image: "img.jpg",
      category: "Hoodie",
      price: 120,
      quantity: 1,
    },
  ],
  subtotal: 120,
  shipping_cost: 12,
  total: 132,
  address: {
    full_name: "Aiman Razali",
    email: "aiman@example.com",
    phone: "+62 812",
    line1: "Jalan Betong 12",
    city: "Kuala Lumpur",
    postal_code: "50450",
    country: "Malaysia",
  },
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("read normalisation (legacy rows)", () => {
  beforeEach(() => {
    localStorage.setItem("bato-orders", JSON.stringify([LEGACY_ORDER]));
  });

  it("fills explicit nulls for a line with no variant", async () => {
    const [order] = await listOrders(null);

    expect(order!.items).toHaveLength(1);
    const line = order!.items[0]!;
    expect(line.size).toBeNull();
    expect(line.colorway).toBeNull();
    expect(line.line_id).toBe("");
    // Present as own keys, so nothing downstream ever sees `undefined`.
    expect(Object.keys(line)).toEqual(
      expect.arrayContaining(["size", "colorway", "line_id"])
    );
    expect(line.product_id).toBe("p2");
  });

  it("leaves the rest of a legacy order intact", async () => {
    const order = (await listOrders(null))[0]!;
    expect(order.order_number).toBe("BTPK-260101-ABCD");
    expect(order.subtotal).toBe(120);
    expect(order.shipping_cost).toBe(12);
    expect(order.total).toBe(132);
    expect(order.address.city).toBe("Kuala Lumpur");
  });

  it("normalises through getOrder too", async () => {
    const found = await getOrder("legacy-1");
    expect(found!.items[0]!.size).toBeNull();
  });

  it("does not rewrite the stored row on read", async () => {
    await listOrders(null);
    const raw = JSON.parse(localStorage.getItem("bato-orders") ?? "[]") as {
      items: Record<string, unknown>[];
    }[];
    expect(raw[0]!.items[0]).not.toHaveProperty("size");
    expect(raw[0]!.items[0]).not.toHaveProperty("line_id");
  });

  it("keeps a legacy row verbatim when a new order is appended", async () => {
    const created = await createOrder(input());
    const raw = JSON.parse(localStorage.getItem("bato-orders") ?? "[]") as {
      id: string;
      items: Record<string, unknown>[];
    }[];
    expect(raw).toHaveLength(2);
    // Newest first, legacy row untouched below it.
    expect(raw[0]!.id).toBe(created.order.id);
    expect(raw[1]!.id).toBe(LEGACY_ORDER.id);
    expect(raw[1]!.items[0]).toEqual(LEGACY_ORDER.items[0]);
  });

  it("drops unusable lines instead of rendering blanks", async () => {
    localStorage.setItem(
      "bato-orders",
      JSON.stringify([
        { ...LEGACY_ORDER, items: [null, { name: "no id" }, "junk"] },
      ])
    );
    const order = (await listOrders(null))[0]!;
    expect(order.items).toEqual([]);
  });

  it("coerces a junk status/payment_method to safe defaults", async () => {
    localStorage.setItem(
      "bato-orders",
      JSON.stringify([
        { ...LEGACY_ORDER, status: "teleported", payment_method: "goat" },
      ])
    );
    const order = (await listOrders(null))[0]!;
    expect(order.status).toBe("pending_payment");
    expect(order.payment_method).toBe("manual_transfer");
  });
});
