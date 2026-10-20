import { describe, it, expect, beforeEach, vi } from "vitest";

/*
 * Companion to `orders.test.ts`, which pins `isSupabaseConfigured: false`.
 * Here the project IS configured, so `createOrder` takes the Supabase path and
 * the only stub needed is `functions.invoke("create-order", …)`.
 */
const { fn } = vi.hoisted(() => ({
  fn: {
    /** Scripted answers: `null` → success with the given order; an Error → throw. */
    answers: [] as ({ ok: true; order: unknown } | { ok: false; error: unknown })[],
    calls: [] as { name: string; options: { body: unknown } }[],
    /** The order returned on success. */
    order: null as unknown,
  },
}));

vi.mock("./supabase", () => ({
  isSupabaseConfigured: true,
  getSupabase: () =>
    Promise.resolve({
      functions: {
        invoke: async (name: string, options: { body: unknown }) => {
          fn.calls.push({ name, options });
          const next = fn.answers.shift();
          if (!next) {
            // default: success with the scripted order
            return { data: { order: fn.order }, error: null };
          }
          if ("error" in next && next.ok === false) {
            return { data: null, error: next.error };
          }
          return { data: { order: (next as { order: unknown }).order ?? fn.order }, error: null };
        },
      },
      from: () => {
        throw new Error("direct table access is forbidden in Phase 1");
      },
    }),
}));

import { createOrder } from "./orders";
import type { ShippingAddress } from "../types";

const ADDRESS: ShippingAddress = {
  full_name: "Aiman Razali",
  email: "aiman@example.com",
  phone: "+62 812",
  line1: "Jalan Betong 12",
  city: "Kuala Lumpur",
  postal_code: "50450",
  country: "Malaysia",
};

const SERVER_ORDER = {
  id: "srv-1",
  order_number: "BTPK-261018-AAAAAA",
  user_id: "user-1",
  status: "pending_payment",
  payment_method: "manual_transfer",
  items: [
    {
      product_id: "p2",
      name: "Static Hoodie / 002",
      image: "img.jpg",
      category: "Hoodie",
      price: 989_000,
      quantity: 2,
      size: "L",
      colorway: null,
      line_id: "p2::L::?",
    },
  ],
  subtotal: 1_978_000,
  shipping_cost: 0,
  total: 1_978_000,
  address: ADDRESS,
  created_at: "2026-10-18T00:00:00.000Z",
};

function input(overrides: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return {
    userId: "user-1",
    lines: [{ product_id: "p2", size: "L", colorway: null, quantity: 2 }],
    shippingMethod: "standard",
    paymentMethod: "manual_transfer" as const,
    address: ADDRESS,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  fn.calls = [];
  fn.answers = [];
  fn.order = SERVER_ORDER;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("createOrder — Supabase configured (Phase 1)", () => {
  it("calls create-order with a body that carries no price/total/status", async () => {
    const result = await createOrder(input());

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected a stored order");
    expect(result.storage).toBe("supabase");
    expect(fn.calls).toHaveLength(1);
    expect(fn.calls[0]!.name).toBe("create-order");
    const body = fn.calls[0]!.options.body as Record<string, unknown>;
    expect(body).not.toHaveProperty("subtotal");
    expect(body).not.toHaveProperty("shippingCost");
    expect(body).not.toHaveProperty("shipping_cost");
    expect(body).not.toHaveProperty("total");
    expect(body).not.toHaveProperty("price");
    expect(body).not.toHaveProperty("status");
    expect(body.items).toEqual([{ product_id: "p2", size: "L", colorway: null, quantity: 2 }]);
    expect(localStorage.getItem("bato-orders")).toBeNull();
  });

  it("uses the server-computed order (totals from the function, not the client)", async () => {
    const result = await createOrder(input());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected a stored order");
    expect(result.order.id).toBe("srv-1");
    expect(result.order.total).toBe(1_978_000);
    expect(result.order.subtotal).toBe(1_978_000);
  });

  it("reports persist-failed when the function returns an error and stores nothing", async () => {
    fn.answers = [{ ok: false, error: { message: "boom", status: 500 } }];

    const result = await createOrder(input());

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failed write");
    expect(result.reason).toBe("persist-failed");
    expect(result.storage).toBe("none");
    expect(localStorage.getItem("bato-orders")).toBeNull();
  });

  it("reports persist-failed when invoke throws", async () => {
    fn.answers = [{ ok: false, error: new Error("network down") }];

    const result = await createOrder(input());

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failed write");
    expect(result.reason).toBe("persist-failed");
    expect(localStorage.getItem("bato-orders")).toBeNull();
  });

  it("reports persist-failed on a malformed (order-less) success response", async () => {
    fn.order = null;
    // make invoke return data without order
    fn.answers = [{ ok: true, order: null }];

    const result = await createOrder(input());

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failed write");
    expect(result.reason).toBe("persist-failed");
  });

  it("refuses an order with an unsized line and never calls the function", async () => {
    const result = await createOrder(
      input({ lines: [{ product_id: "p2", size: null as unknown as string, colorway: null, quantity: 2 }] })
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a refused order");
    expect(result.reason).toBe("invalid-items");
    expect(fn.calls).toHaveLength(0);
    expect(localStorage.getItem("bato-orders")).toBeNull();
  });

  it("refuses an order with no lines at all", async () => {
    const result = await createOrder(input({ lines: [] }));

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a refused order");
    expect(result.reason).toBe("invalid-items");
    expect(fn.calls).toHaveLength(0);
  });

  it("refuses an order with an unknown size and never calls the function", async () => {
    const result = await createOrder(
      input({ lines: [{ product_id: "p2", size: "XXXL", colorway: null, quantity: 2 }] })
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a refused order");
    expect(result.reason).toBe("invalid-items");
    expect(fn.calls).toHaveLength(0);
  });
});