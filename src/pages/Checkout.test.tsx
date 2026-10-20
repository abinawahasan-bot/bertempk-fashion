import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

// Never touch a real Supabase project from tests. The switch lets one file
// cover both sides of the write path: "no Supabase at all" (a guest order is a
// legitimate success) and "Supabase is configured but the insert failed" (the
// order exists nowhere and must never be reported as placed).
const { db } = vi.hoisted(() => ({
  db: {
    configured: false,
    /** Scripted insert failures, one per attempt; empty ⇒ success. */
    errors: [] as { code?: string; message: string }[],
    inserts: [] as Record<string, unknown>[],
  },
}));

vi.mock("../lib/supabase", () => ({
  get isSupabaseConfigured() {
    return db.configured;
  },
  getSupabase: () =>
    Promise.resolve({
      functions: {
        invoke: async (_name: string, _options: { body: unknown }) => {
          // Failure case: a queued error means the server rejected the write.
          if (db.errors.length > 0) {
            const err = db.errors.shift()!;
            return { data: null, error: { message: err.message } };
          }
          // Success case: the server (mocked) inserts the row and returns it,
          // so the confirmation page's re-fetch can find it in `db.inserts`.
          const row = {
            id: crypto.randomUUID(),
            order_number: "BTPK-261018-TEST00",
            user_id: "user-1",
            status: "pending_payment",
            payment_method: "manual_transfer",
            items: [],
            subtotal: 0,
            shipping_cost: 0,
            total: 0,
            address: {},
            created_at: new Date().toISOString(),
          };
          db.inserts.push(row);
          return { data: { order: row }, error: null };
        },
      },
      from: () => ({
        insert: (row: Record<string, unknown>) => {
          db.inserts.push(row);
          return Promise.resolve({ error: db.errors.shift() ?? null });
        },
        select: () => {
          // The "database" holds exactly what was inserted.
          let wanted: string | null = null;
          const chain: Record<string, unknown> = {};
          chain.eq = (column: string, value: unknown) => {
            if (column === "id") wanted = String(value);
            return chain;
          };
          chain.order = () => chain;
          chain.maybeSingle = () =>
            Promise.resolve({
              data: db.inserts.find((row) => row.id === wanted) ?? null,
              error: null,
            });
          return chain;
        },
      }),
    }),
}));

// sonner renders nothing without a <Toaker />; the calls are what we assert on.
const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));

vi.mock("sonner", () => {
  const api = Object.assign(toastMock, {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    custom: vi.fn(),
    promise: vi.fn(),
  });
  return { toast: api, Toaster: () => null };
});

/*
 * `vitest.config.ts` pins VITE_PAYMENT_* to "", so the real module reports
 * "no payment method" in this file by default. Most checkout tests need a
 * payable method, so the registry is stubbed with a switch — the gate tests
 * below flip it off to prove Checkout refuses to write an order.
 */
const { payment } = vi.hoisted(() => ({ payment: { manual: true } }));

vi.mock("../lib/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/payments")>();
  const manual = actual.providers().find((p) => p.id === "manual_transfer")!;
  const live = { ...manual, available: true };
  return {
    ...actual,
    MANUAL_TRANSFER: payment.manual
      ? {
          bank: "Bank Uji",
          accountNumber: "0000-0000-0000",
          accountName: "BERTEMPK Uji",
        }
      : { bank: "", accountNumber: "", accountName: "" },
    manualTransferAvailable: payment.manual,
    availableProviders: () => (payment.manual ? [live] : []),
    providerFor: () =>
      payment.manual
        ? live
        : { ...live, pay: async () => ({ ok: false, message: "Not configured." }) },
  };
});

import Checkout from "./Checkout";
import OrderConfirmation from "./OrderConfirmation";
import { useCartStore } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { SIZES } from "../constants/fit";
import { FREE_SHIPPING_THRESHOLD } from "../constants/commerce";
import { normalizeIDR } from "../lib/money";
import { toast } from "sonner";
import type { Order } from "../types";

/** The toast spies installed by the `sonner` mock above. */
const t = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  warning: ReturnType<typeof vi.fn>;
};

/** Rp 749.000 — on its own it is under the free-shipping threshold. */
const CROP = {
  id: "p5",
  image: "img.jpg",
  category: "New Crop",
  name: "Signal Crop / 004",
  price: 749_000,
  quantity: 1,
  size: "M",
  colorway: null,
  lineId: "p5::M::?",
};

/** Rp 989.000 — the two together cross Rp 1.500.000. */
const HOODIE = {
  id: "p2",
  image: "img2.jpg",
  category: "Hoodie",
  name: "Static Hoodie / 002",
  price: 989_000,
  quantity: 1,
  size: "L",
  colorway: "Jet",
  lineId: "p2::L::Jet",
};

/** ICU emits U+00A0 after "Rp" — normalise before comparing. */
const has = (text: string) => (_: string, el?: Element | null) =>
  normalizeIDR(el?.textContent ?? "").trim() === text;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/:id" element={<OrderConfirmation />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Aiman Razali");
  await user.type(screen.getByLabelText(/email/i), "aiman@example.com");
  await user.type(screen.getByLabelText(/phone/i), "+62 812 3456 7890");
  await user.type(screen.getByLabelText(/^address/i), "Jalan Betong 12");
  await user.type(screen.getByLabelText(/city/i), "Jakarta Selatan");
  await user.type(screen.getByLabelText(/postal code/i), "12190");
  await user.type(screen.getByLabelText(/country/i), "Indonesia");
  // Accept consent (required since 2026-10-19).
  const checkbox = screen.getByRole("checkbox");
  if (!checkbox.hasAttribute("checked") && !(checkbox as HTMLInputElement).checked) {
    await user.click(checkbox);
  }
}

/** Submit the form element directly, bypassing the (possibly disabled) button. */
function submitForm() {
  const form = document.querySelector("form");
  if (!form) throw new Error("checkout form not rendered");
  fireEvent.submit(form);
}

/** Signed in, so `createOrder` takes the Supabase branch. */
const SIGNED_IN = {
  id: "user-1",
  email: "",
  user_metadata: {},
} as unknown as NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  payment.manual = true;
  db.configured = false;
  db.errors = [];
  db.inserts = [];
  useAuthStore.setState({ user: null });
  useCartStore.setState({ items: [CROP] });
});

describe("Checkout — rupiah totals", () => {
  it("shows the empty state when the bag is empty", () => {
    useCartStore.setState({ items: [] });
    renderCheckout();
    expect(screen.getByText(/nothing to check out/i)).toBeInTheDocument();
  });

  it("renders whole-rupiah prices, not dollars", () => {
    renderCheckout();
    expect(screen.getAllByText(has("Rp 749.000")).length).toBeGreaterThanOrEqual(
      2
    ); // line + subtotal
    expect(document.body.textContent).not.toMatch(/\$\s?\d/);
    expect(document.body.textContent).not.toMatch(/\d+\.\d\d\b(?!\d)/);
  });

  it("charges Reguler 25.000 below the free-shipping threshold", () => {
    renderCheckout();
    // 749.000 + 25.000 = 774.000.
    expect(screen.getAllByText(has("Rp 25.000")).length).toBeGreaterThanOrEqual(
      2
    ); // method button + summary row
    expect(screen.getAllByText(has("Rp 774.000")).length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getByText(/shipping \(reguler\)/i)).toBeInTheDocument();
  });

  it("nudges the shopper toward free shipping with the exact shortfall", () => {
    renderCheckout();
    // 1.500.000 − 749.000 = 751.000.
    expect(screen.getByText(/751\.000/)).toBeInTheDocument();
  });

  it("makes Reguler free at and above the threshold", () => {
    useCartStore.setState({ items: [CROP, HOODIE] }); // 1.738.000
    renderCheckout();
    expect(
      screen.getAllByText(has("Rp 1.738.000")).length
    ).toBeGreaterThanOrEqual(2); // subtotal + total
    expect(screen.getAllByText("Gratis").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(has("Rp 25.000"))).not.toBeInTheDocument();
  });

  it("never makes Ekspres free, even above the threshold", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [CROP, HOODIE] });
    renderCheckout();

    await user.click(screen.getByRole("button", { name: /ekspres/i }));

    // 1.738.000 + 45.000 — Ekspres keeps its flat price.
    expect(screen.getAllByText(has("Rp 45.000")).length).toBeGreaterThanOrEqual(
      2
    );
    expect(
      screen.getAllByText(has("Rp 1.783.000")).length
    ).toBeGreaterThanOrEqual(1); // grand total = subtotal + 45.000

    // The chosen shipping row is not the free one. (The Reguler *button* still
    // reads "Gratis" — correctly, Reguler is free at this subtotal.)
    const shippingRow = screen.getByText(/shipping \(ekspres\)/i).parentElement!;
    expect(normalizeIDR(shippingRow.textContent ?? "")).toContain("Rp 45.000");
    expect(shippingRow.textContent).not.toMatch(/gratis/i);
  });

  it("shows the shipping label and eta from the commerce constants", () => {
    renderCheckout();
    expect(screen.getByRole("button", { name: /reguler/i })).toHaveTextContent(
      "3–5 hari kerja"
    );
    expect(screen.getByRole("button", { name: /ekspres/i })).toHaveTextContent(
      "1–2 hari kerja"
    );
  });

  it("shows the chosen size and colourway on every summary line", () => {
    renderCheckout();
    expect(screen.getByText(/size m · qty 1/i)).toBeInTheDocument();
  });
});

describe("Checkout — validation", () => {
  it("blocks submission and lists field errors when the form is empty", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/valid email is required/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/address is required/i)).toBeInTheDocument();

    // No order was persisted, cart untouched.
    expect(localStorage.getItem("bato-orders")).toBeNull();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("keeps autoComplete on the address fields", () => {
    renderCheckout();
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
      "autocomplete",
      "name"
    );
    expect(screen.getByLabelText(/^address/i)).toHaveAttribute(
      "autocomplete",
      "street-address"
    );
    expect(screen.getByLabelText(/postal code/i)).toHaveAttribute(
      "autocomplete",
      "postal-code"
    );
  });
});

describe("Checkout — size gate", () => {
  const UNSIZED = { ...CROP, size: null, lineId: "p5::?::?" };

  it("refuses the order and names every unsized product with a link to its PDP", () => {
    useCartStore.setState({ items: [CROP, UNSIZED] });
    renderCheckout();

    expect(
      screen.getByText(/pilih ukuran dulu — order belum bisa dibuat/i)
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Signal Crop / 004" });
    expect(link).toHaveAttribute("href", "/product/p5");

    expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled();
  });

  it("writes nothing to bato-orders even on a direct submit", () => {
    useCartStore.setState({ items: [UNSIZED] });
    renderCheckout();

    submitForm();

    expect(localStorage.getItem("bato-orders")).toBeNull();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("says so on the summary line as well", () => {
    useCartStore.setState({ items: [UNSIZED] });
    renderCheckout();
    expect(screen.getByText(/ukuran belum dipilih/i)).toBeInTheDocument();
  });
});

describe("Checkout — payment gate", () => {
  it("refuses the order, disables the button and says why", () => {
    payment.manual = false;
    renderCheckout();

    expect(
      screen.getByText(/belum ada metode pembayaran yang aktif/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/tidak ada metode pembayaran yang bisa dipilih/i)
    ).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: /place order/i });
    expect(submit).toBeDisabled();
  });

  it("writes nothing to bato-orders even on a direct submit", async () => {
    payment.manual = false;
    const user = userEvent.setup();
    renderCheckout();
    await fillForm(user);

    submitForm();

    expect(localStorage.getItem("bato-orders")).toBeNull();
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(screen.getByTestId("location")).toHaveTextContent("/checkout");
  });

  it("offers no provider button when the gate is closed", () => {
    payment.manual = false;
    renderCheckout();
    expect(
      screen.queryByRole("button", { name: /manual bank transfer/i })
    ).not.toBeInTheDocument();
  });
});

describe("Checkout — placing an order", () => {
  it("places the order, clears the cart and lands on confirmation", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    // Redirected to the confirmation route.
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toMatch(
        /^\/orders\/[0-9a-f-]+$/
      )
    );

    // Order persisted with whole-rupiah numbers.
    const stored = JSON.parse(
      localStorage.getItem("bato-orders") ?? "[]"
    ) as Order[];
    expect(stored).toHaveLength(1);
    expect(stored[0].subtotal).toBe(749_000);
    expect(stored[0].shipping_cost).toBe(25_000);
    expect(stored[0].total).toBe(774_000);
    expect(stored[0].address.full_name).toBe("Aiman Razali");

    // The variant rides along with the line.
    expect(stored[0].items[0]).toMatchObject({
      product_id: "p5",
      size: "M",
      colorway: null,
      line_id: "p5::M::?",
    });

    // Cart emptied after purchase.
    expect(useCartStore.getState().items).toHaveLength(0);

    // Confirmation shows the order number and payment instructions in rupiah.
    expect(await screen.findByText(/order placed/i)).toBeInTheDocument();
    expect(screen.getByText(/^BTPK-\d{6}-[A-Z0-9]{6}$/)).toBeInTheDocument();
    expect(screen.getByText(/complete your payment/i)).toBeInTheDocument();
    expect(
      normalizeIDR(screen.getByText(/total to transfer:/i).textContent ?? "")
    ).toContain("Rp 774.000");
    expect(screen.getAllByText(has("Rp 749.000")).length).toBeGreaterThanOrEqual(
      2
    ); // line + subtotal
    expect(screen.getAllByText(has("Rp 774.000")).length).toBeGreaterThanOrEqual(
      1
    ); // grand total
    expect(document.body.textContent).not.toMatch(/\$\s?\d/);
  });

  it("respects the Ekspres choice in the persisted total", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: /ekspres/i }));
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem("bato-orders") ?? "[]"
      ) as Order[];
      expect(stored[0]?.total).toBe(749_000 + 45_000);
    });
  });

  it("persists zero shipping for a free Reguler order", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [CROP, HOODIE] });
    renderCheckout();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem("bato-orders") ?? "[]"
      ) as Order[];
      expect(stored[0]?.subtotal).toBe(1_738_000);
      expect(stored[0]?.shipping_cost).toBe(0);
      expect(stored[0]?.total).toBe(1_738_000);
    });
    expect(1_738_000).toBeGreaterThan(FREE_SHIPPING_THRESHOLD);
  });

  it("rounds a fractional line price before it reaches the order", async () => {
    const user = userEvent.setup();
    // A price that is not a whole rupiah: only the totals were rounded before.
    useCartStore.setState({ items: [{ ...CROP, price: 749_000.4 }] });
    renderCheckout();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("bato-orders") ?? "[]")
      ).toHaveLength(1)
    );
    const stored = JSON.parse(
      localStorage.getItem("bato-orders") ?? "[]"
    ) as Order[];
    expect(stored[0]!.items[0]!.price).toBe(749_000);
    expect(Number.isInteger(stored[0]!.items[0]!.price)).toBe(true);
    expect(stored[0]!.subtotal).toBe(749_000);
  });

  it("renders a placeholder, not an empty <img>, for a legacy row", () => {
    useCartStore.setState({ items: [{ ...CROP, image: "" }] });
    renderCheckout();

    expect(document.querySelector('img[src=""]')).toBeNull();
    expect(
      screen.getByRole("img", { name: /no image available/i })
    ).toBeInTheDocument();
  });

  it("does not claim a server confirmation for a local-only guest order", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(
      await screen.findByText(/saved in this browser only/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/a confirmation has been recorded/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/cannot see this order yet/i)).toBeInTheDocument();
  });

  it("does claim a recorded confirmation when the row really is server-side", async () => {
    const user = userEvent.setup();
    db.configured = true;
    useAuthStore.setState({ user: SIGNED_IN });
    renderCheckout();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(
      await screen.findByText(/a confirmation has been recorded/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/saved in this browser only/i)
    ).not.toBeInTheDocument();
  });
});

/**
 * FIX 1 — a write that fails must never be reported to the customer as a
 * placed order. Supabase IS configured here (the customer is signed in), so
 * this is the "configured but the write failed" case, not a guest order.
 */
describe("Checkout — a failed write is never reported as success", () => {
  beforeEach(() => {
    db.configured = true;
    db.errors = [{ code: "42501", message: "permission denied for table orders" }];
    useAuthStore.setState({ user: SIGNED_IN });
  });

  it("warns, keeps the bag and stays put instead of toasting success", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => expect(t.warning).toHaveBeenCalled());

    expect(t.warning.mock.calls[0]![0]).toMatch(/not saved/i);
    expect(t.success).not.toHaveBeenCalled();
    // Nothing reached Postgres (the insert was rejected) and nothing was
    // written to the local fallback either.
    expect(db.inserts).toHaveLength(0);
    expect(localStorage.getItem("bato-orders")).toBeNull();
    // The bag survives, so the customer can simply press the button again.
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(screen.getByTestId("location")).toHaveTextContent("/checkout");
    expect(screen.getByRole("button", { name: /place order/i })).toBeEnabled();
  });

  it("succeeds on a retry after a transient failure", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await fillForm(user);

    await user.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(t.warning).toHaveBeenCalled());
    expect(t.success).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => expect(t.success).toHaveBeenCalled());
    expect(db.inserts).toHaveLength(1);
    expect(useCartStore.getState().items).toHaveLength(0);
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toMatch(
        /^\/orders\/[0-9a-f-]+/
      )
    );
  });

  it("still refuses an unsized bag before it ever touches the database", async () => {
    useCartStore.setState({
      items: [{ ...CROP, size: null, lineId: "p5::?::?" }],
    });
    renderCheckout();
    await fillForm(userEvent.setup());

    submitForm();

    expect(db.inserts).toHaveLength(0);
    expect(localStorage.getItem("bato-orders")).toBeNull();
  });
});

/**
 * FIX 5 — `size !== null` accepted any string, so `"XXXL"` or `"0"` could be
 * persisted. `SIZES` in `constants/fit` is the authority.
 */
describe("Checkout — size gate validates against SIZES", () => {
  const badSize = (size: string) => ({ ...CROP, size, lineId: `p5::${size}::?` });

  for (const size of ["XXXL", "0", "medium", "m"]) {
    it(`blocks checkout for the out-of-range size "${size}"`, () => {
      useCartStore.setState({ items: [badSize(size)] });
      renderCheckout();

      expect(screen.getByText(/tidak tersedia lagi/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled();

      submitForm();
      expect(localStorage.getItem("bato-orders")).toBeNull();
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  }

  for (const size of SIZES) {
    it(`allows the in-range size "${size}"`, () => {
      useCartStore.setState({ items: [badSize(size)] });
      renderCheckout();

      expect(
        screen.getByRole("button", { name: /place order/i })
      ).toBeEnabled();
      expect(screen.queryByText(/tidak tersedia/i)).not.toBeInTheDocument();
    });
  }
});
