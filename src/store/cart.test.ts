import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cart";
import type { Product } from "../types";

const HOODIE: Product = {
  id: "p2",
  image: "img.jpg",
  category: "Hoodie",
  name: "Static Hoodie / 002",
  price: 989_000,
};

const TROUSERS: Product = {
  id: "p3",
  image: "img3.jpg",
  category: "Trousers",
  name: "Wide Trousers / 003",
  price: 1_190_000,
};

/** Legacy rows: what a real v0/v1 browser still holds. */
const LEGACY_CART = JSON.stringify({
  state: {
    items: [
      {
        id: "p2",
        price: 989000,
        quantity: 2,
        name: "x",
        image: "y",
        category: "Hoodie",
      },
    ],
  },
  version: 1,
});

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cart store", () => {
  it("adds a new product with quantity 1 and no variant", () => {
    useCartStore.getState().addItem(HOODIE);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].id).toBe("p2");
    expect(items[0].size).toBeNull();
    expect(items[0].colorway).toBeNull();
    expect(items[0].lineId).toBe("p2::?::?");
  });

  it("stores the chosen variant on the line", () => {
    useCartStore.getState().addItem(HOODIE, { size: "L", colorway: "Jet" });
    const { items } = useCartStore.getState();
    expect(items[0].size).toBe("L");
    expect(items[0].colorway).toBe("Jet");
    expect(items[0].lineId).toBe("p2::L::Jet");
  });

  it("increments quantity when the same product+variant is added again", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("keeps the same product in different sizes on separate lines", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().addItem(HOODIE, { size: "L", colorway: null });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.lineId)).toEqual(["p2::M::?", "p2::L::?"]);
    expect(items.map((i) => i.quantity)).toEqual([1, 1]);
  });

  it("adds quantity 3 as a single line", () => {
    useCartStore.getState().addItem(HOODIE, {
      size: "S",
      colorway: null,
      quantity: 3,
    });
    const { items, totalItems } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
    expect(totalItems()).toBe(3);
  });

  it("keeps distinct products on separate lines", () => {
    useCartStore.getState().addItem(HOODIE);
    useCartStore.getState().addItem(TROUSERS);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("computes subtotal across quantities", () => {
    useCartStore.getState().addItem(HOODIE); // 989.000
    useCartStore.getState().addItem(HOODIE);
    useCartStore.getState().addItem(TROUSERS); // 1.190.000
    expect(useCartStore.getState().subtotal()).toBe(989_000 * 2 + 1_190_000);
    expect(useCartStore.getState().totalItems()).toBe(3);
  });

  it("removes the line entirely when quantity drops to zero", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().updateQuantity("p2::M::?", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("reduces quantity without removing the line above zero", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().updateQuantity("p2::M::?", 1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("updates and removes by lineId, leaving other sizes alone", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().addItem(HOODIE, { size: "L", colorway: null });

    useCartStore.getState().removeItem("p2::M::?");
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].lineId).toBe("p2::L::?");
  });

  it("clamps a bogus quantity to 1", () => {
    useCartStore.getState().addItem(HOODIE, {
      size: "M",
      colorway: null,
      quantity: 0,
    });
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("coerces Infinity to 1 instead of poisoning the subtotal", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().updateQuantity("p2::M::?", Number.POSITIVE_INFINITY);

    const { items, subtotal, totalItems } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(subtotal()).toBe(989_000);
    expect(totalItems()).toBe(1);
  });

  it("coerces NaN to 1 instead of poisoning the subtotal", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().updateQuantity("p2::M::?", Number.NaN);

    const { items, subtotal } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(subtotal()).toBe(989_000);
  });

  it("removes the line on a negative quantity", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().updateQuantity("p2::M::?", -5);

    const { items, subtotal } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(subtotal()).toBe(0);
  });

  it("floors a fractional quantity", () => {
    useCartStore.getState().addItem(HOODIE, { size: "M", colorway: null });
    useCartStore.getState().updateQuantity("p2::M::?", 3.9);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("clears everything", () => {
    useCartStore.getState().addItem(HOODIE);
    useCartStore.getState().addItem(TROUSERS);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().subtotal()).toBe(0);
  });
});

describe("cart persistence (v0/v1 → v2 migration)", () => {
  it("migrates a legacy cart and never invents a size", async () => {
    localStorage.setItem("bato-cart", LEGACY_CART);

    await useCartStore.persist.rehydrate();

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("p2");
    expect(items[0].quantity).toBe(2);
    expect(items[0].size).toBeNull();
    expect(items[0].colorway).toBeNull();
    expect(items[0].lineId).toBe("p2::?::?");
  });

  it("survives garbage instead of throwing", async () => {
    localStorage.setItem(
      "bato-cart",
      JSON.stringify({
        state: { items: [null, "nope", 42, { name: "no id" }, { id: "p1" }] },
        version: 0,
      })
    );

    await expect(useCartStore.persist.rehydrate()).resolves.not.toThrow();

    const { items } = useCartStore.getState();
    // Rows without a string id are dropped; `{ id: "p1" }` is coerced.
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("p1");
    expect(items[0].quantity).toBe(1);
    expect(items[0].lineId).toBe("p1::?::?");
  });

  it("survives a non-array items field", async () => {
    localStorage.setItem(
      "bato-cart",
      JSON.stringify({ state: { items: { nope: true } }, version: 1 })
    );

    await expect(useCartStore.persist.rehydrate()).resolves.not.toThrow();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("clamps a negative or fractional persisted quantity", async () => {
    localStorage.setItem(
      "bato-cart",
      JSON.stringify({
        state: {
          items: [
            { id: "p1", quantity: -4 },
            { id: "p2", quantity: 2.9 },
          ],
        },
        version: 1,
      })
    );

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().items.map((i) => i.quantity)).toEqual([1, 2]);
  });

  /**
   * Two legacy rows for the same product normalise to the same lineId
   * (`p2::?::?`). Left unmerged they are one logical line with two rows:
   * `addItem` bumps only the first, `updateQuantity` writes to both and
   * `removeItem` deletes both.
   */
  describe("duplicate legacy rows collapse into one line", () => {
    const DUPLICATES = JSON.stringify({
      state: {
        items: [
          { id: "p2", price: 989000, quantity: 2, name: "Static Hoodie / 002", image: "y", category: "Hoodie" },
          { id: "p2", price: 989000, quantity: 2, name: "Static Hoodie / 002", image: "y", category: "Hoodie" },
          { id: "p3", price: 1190000, quantity: 1, name: "Wide Trousers / 003", image: "z", category: "Trousers" },
        ],
      },
      version: 1,
    });

    it("sums the quantities of same-lineId rows", async () => {
      localStorage.setItem("bato-cart", DUPLICATES);

      await useCartStore.persist.rehydrate();

      const { items, totalItems } = useCartStore.getState();
      expect(items.map((i) => i.lineId)).toEqual(["p2::?::?", "p3::?::?"]);
      expect(items[0].quantity).toBe(4); // 2 + 2, not two rows
      expect(totalItems()).toBe(5);
    });

    it("charges the merged line once in the subtotal", async () => {
      localStorage.setItem("bato-cart", DUPLICATES);

      await useCartStore.persist.rehydrate();

      expect(useCartStore.getState().subtotal()).toBe(989_000 * 4 + 1_190_000);
    });

    it("removes the whole line with a single removeItem call", async () => {
      localStorage.setItem("bato-cart", DUPLICATES);
      await useCartStore.persist.rehydrate();

      useCartStore.getState().removeItem("p2::?::?");

      const { items } = useCartStore.getState();
      expect(items.map((i) => i.lineId)).toEqual(["p3::?::?"]);
    });

    it("empties the bag when the duplicated line is removed", async () => {
      localStorage.setItem(
        "bato-cart",
        JSON.stringify({
          state: {
            items: [
              { id: "p2", price: 989000, quantity: 2 },
              { id: "p2", price: 989000, quantity: 2 },
            ],
          },
          version: 1,
        })
      );
      await useCartStore.persist.rehydrate();

      useCartStore.getState().removeItem("p2::?::?");

      expect(useCartStore.getState().items).toEqual([]);
      expect(useCartStore.getState().subtotal()).toBe(0);
    });

    it("keeps incrementing the single merged line", async () => {
      localStorage.setItem("bato-cart", DUPLICATES);
      await useCartStore.persist.rehydrate();

      useCartStore.getState().addItem(HOODIE); // no variant → p2::?::?
      useCartStore.getState().updateQuantity("p2::?::?", 6);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
      expect(items.find((i) => i.lineId === "p2::?::?")?.quantity).toBe(6);
    });
  });
});