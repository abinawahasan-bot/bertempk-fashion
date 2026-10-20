import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { useCartStore } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { useUIStore } from "../store/ui";
import { createOrder } from "../lib/orders";
import { availableProviders, providerFor } from "../lib/payments";
import { formatIDR, toRupiah } from "../lib/money";
import { SIZES } from "../constants/fit";
import {
  CONTACT,
  SHIPPING_METHODS,
  freeShippingHint,
  shippingCostFor,
  type ShippingMethodId,
} from "../constants/commerce";
import type { ShippingAddress } from "../types";
import LineImage from "../components/LineImage";

const EMPTY_ADDRESS: ShippingAddress = {
  full_name: "",
  email: "",
  phone: "",
  line1: "",
  city: "",
  postal_code: "",
  country: "",
  notes: "",
};

/** `SIZES` in `../constants/fit` is the authority on which sizes exist. */
function isKnownSize(size: string): boolean {
  return (SIZES as readonly string[]).includes(size);
}

function validateAddress(a: ShippingAddress): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!a.full_name.trim()) errs.full_name = "Full name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim()))
    errs.email = "Valid email is required.";
  if (!a.phone.trim()) errs.phone = "Phone number is required.";
  if (!a.line1.trim()) errs.line1 = "Address is required.";
  if (!a.city.trim()) errs.city = "City is required.";
  if (!a.postal_code.trim()) errs.postal_code = "Postal code is required.";
  if (!a.country.trim()) errs.country = "Country is required.";
  return errs;
}

const inputCls =
  "w-full border border-steel bg-smoke px-4 py-3 text-sm text-bone placeholder:text-ash focus:border-acid focus:outline-none";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCartStore();
  const { user } = useAuthStore();
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const [placing, setPlacing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    ...EMPTY_ADDRESS,
    full_name: user?.user_metadata?.full_name ?? "",
    email: user?.email ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingId, setShippingId] = useState<ShippingMethodId>("standard");

  /**
   * Gate 1 — payment. If no provider is live in this build the customer must
   * not be able to place an order at all: there would be no way to pay.
   */
  const paymentProviders = useMemo(() => availableProviders(), []);
  const paymentReady = paymentProviders.length > 0;
  const [paymentId, setPaymentId] = useState(
    () => paymentProviders[0]?.id ?? "manual_transfer"
  );

  /**
   * Gate 2 — size. A line without a size cannot be fulfilled, and neither can
   * a line whose size the shop does not sell (`"XXXL"`, `"0"` — anything a
   * hand-edited localStorage row or a stale build can produce).
   */
  const unsized = items.filter((i) => !i.size || !isKnownSize(i.size));
  const unlistedSizes = items.filter(
    (i) => i.size !== null && !isKnownSize(i.size)
  );
  const sizesReady = unsized.length === 0;

  const shipping = SHIPPING_METHODS.find((m) => m.id === shippingId)!;
  const sub = toRupiah(subtotal());
  const shippingCost = toRupiah(shippingCostFor(sub, shippingId));
  const total = toRupiah(sub + shippingCost);
  const freeHint = freeShippingHint(sub);

  const set = (key: keyof ShippingAddress) => (value: string) =>
    setAddress((a) => ({ ...a, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Gate 1 — never write an order nobody can pay for.
    if (!paymentReady) {
      toast.error("No payment method is live yet.", {
        description: CONTACT.email
          ? `Hubungi ${CONTACT.email} untuk assistance.`
          : "Hubungi kami untuk assistance.",
      });
      return;
    }

    // Gate 2 — never write an order with an unchosen or unavailable size.
    if (!sizesReady) {
      toast.error("Choose a size first.", {
        description: unlistedSizes.length
          ? "Sebagian ukuran di tas tidak tersedia lagi — pilih ulang di halaman produk."
          : `${unsized.length} item di tas belum memiliki ukuran.`,
      });
      return;
    }

    const errs = validateAddress(address);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Check the highlighted fields.");
      return;
    }
    if (!consent) {
      toast.error("Please accept the privacy policy and terms.");
      return;
    }

    setPlacing(true);
    try {
      const result = await createOrder({
        userId: user?.id ?? null,
        lines: items.map((i) => ({
          product_id: i.id,
          size: i.size!,
          colorway: i.colorway ?? null,
          quantity: i.quantity,
        })),
        shippingMethod: shippingId,
        paymentMethod: paymentId,
        address,
      });

      /*
       * A failed write means the order exists NOWHERE — not in Postgres, not
       * locally. No success toast, no emptied bag, no redirect: the customer
       * has to be able to try again with the same bag.
       */
      if (!result.ok) {
        toast.warning("Your order was not saved.", {
          description: CONTACT.email
            ? `Pesanan belum tersimpan di server dan tidak ada apa yang terpotong dari kartu atau rekeningmu. Coba lagi, atau hubungi kami di ${CONTACT.email}.`
            : "Pesanan belum tersimpan di server dan tidak ada apa yang terpotong dari kartu atau rekeningmu. Silakan coba lagi.",
        });
        return;
      }

      const { order } = result;
      const payment = await providerFor(paymentId).pay(order);

      if (payment && !payment.ok) {
        toast.error(payment.message, {
          description:
            "Pesananmu sudah tersimpan — detail pembayaran ada di halaman konfirmasi.",
        });
      }

      clear();
      toast.success(`Order ${order.order_number} placed.`, {
        description:
          paymentId === "manual_transfer"
            ? "Transfer the total, then send the proof to complete."
            : "Complete your payment to confirm the order.",
      });
      // `local=1` keeps the confirmation honest about a guest order the studio
      // cannot see from its own database.
      const localFlag = result.storage === "local" ? "&local=1" : "";
      navigate(`/orders/${order.id}?placed=1${localFlag}`);
    } catch (err) {
      toast.error("Could not place the order.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-4xl text-bone">Nothing to check out</h1>
        <p className="text-sm text-fog">Your bag is empty.</p>
        <Link
          to="/shop"
          className="bg-acid px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
        >
          Shop the drop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-acid">
          Step 02 / 02
        </p>
        <h1 className="mt-2 font-display text-5xl text-bone sm:text-6xl">
          Checkout
        </h1>

        {!user && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-steel bg-coal px-5 py-4">
            <p className="text-sm text-fog">
              Checking out as guest.{" "}
              <button
                onClick={openAuthModal}
                className="font-semibold text-acid underline-offset-4 hover:underline"
              >
                Sign in
              </button>{" "}
              to track orders across devices.
            </p>
          </div>
        )}

        {/* ---- Gate: size ---- */}
        {!sizesReady && (
          <div
            role="alert"
            className="mt-6 border border-signal/50 bg-signal/5 px-5 py-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-signal">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              Pilih ukuran dulu — order belum bisa dibuat
            </p>
            <p className="mt-1 text-sm text-fog">
              {unlistedSizes.length
                ? "Sebagian ukuran di tas tidak tersedia lagi. Buka halaman produk, pilih ukuran yang tersedia, lalu kembali ke checkout."
                : "Item berikut di tas belum punya ukuran. Buka halaman produk, pilih ukuran, lalu kembali ke checkout."}
            </p>
            <ul className="mt-3 space-y-1.5">
              {unsized.map((item) => (
                <li key={item.lineId}>
                  <Link
                    to={`/product/${item.id}`}
                    className="text-sm font-semibold text-acid underline-offset-4 hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="ml-2 text-xs text-ash">
                    {item.size
                      ? `Size ${item.size} — tidak tersedia · ${formatIDR(item.price * item.quantity)}`
                      : formatIDR(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- Gate: payment ---- */}
        {!paymentReady && (
          <div
            role="alert"
            className="mt-6 border border-signal/50 bg-signal/5 px-5 py-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-signal">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              Belum ada metode pembayaran yang aktif
            </p>
            <p className="mt-1 text-sm text-fog">
              Toko ini belum dikonfigurasi untuk menerima pembayaran, jadi order
              belum dapat dibuat.{" "}
              {CONTACT.email ? (
                <>
                  Untuk sekarang, hubungi kami di{" "}
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="text-bone underline underline-offset-4"
                  >
                    {CONTACT.email}
                  </a>
                  .
                </>
              ) : (
                "Hubungi kami untuk assistance."
              )}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]"
        >
          {/* ---------- Left: form ---------- */}
          <div className="space-y-10">
            <section>
              <h2 className="font-display text-2xl text-bone">
                Contact &amp; shipping
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Full name
                  </span>
                  <input
                    className={inputCls}
                    value={address.full_name}
                    onChange={(e) => set("full_name")(e.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                  {errors.full_name && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.full_name}
                    </span>
                  )}
                </label>
                <label>
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Email
                  </span>
                  <input
                    type="email"
                    className={inputCls}
                    value={address.email}
                    onChange={(e) => set("email")(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.email}
                    </span>
                  )}
                </label>
                <label>
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Phone
                  </span>
                  <input
                    className={inputCls}
                    value={address.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    placeholder="+62 …"
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.phone}
                    </span>
                  )}
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Address
                  </span>
                  <input
                    className={inputCls}
                    value={address.line1}
                    onChange={(e) => set("line1")(e.target.value)}
                    placeholder="Street and number"
                    autoComplete="street-address"
                  />
                  {errors.line1 && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.line1}
                    </span>
                  )}
                </label>
                <label>
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    City
                  </span>
                  <input
                    className={inputCls}
                    value={address.city}
                    onChange={(e) => set("city")(e.target.value)}
                    autoComplete="address-level2"
                  />
                  {errors.city && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.city}
                    </span>
                  )}
                </label>
                <label>
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Postal code
                  </span>
                  <input
                    className={inputCls}
                    value={address.postal_code}
                    onChange={(e) => set("postal_code")(e.target.value)}
                    autoComplete="postal-code"
                  />
                  {errors.postal_code && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.postal_code}
                    </span>
                  )}
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Country
                  </span>
                  <input
                    className={inputCls}
                    value={address.country}
                    onChange={(e) => set("country")(e.target.value)}
                    placeholder="Indonesia"
                    autoComplete="country-name"
                  />
                  {errors.country && (
                    <span className="mt-1 block text-xs text-signal">
                      {errors.country}
                    </span>
                  )}
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-fog">
                    Order notes (optional)
                  </span>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={address.notes ?? ""}
                    onChange={(e) => set("notes")(e.target.value)}
                    placeholder="Delivery instructions, gate code…"
                  />
                </label>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-bone">Shipping</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {SHIPPING_METHODS.map((m) => {
                  const cost = shippingCostFor(sub, m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setShippingId(m.id)}
                      aria-pressed={shippingId === m.id}
                      className={`flex items-center justify-between border px-5 py-4 text-left transition-colors ${
                        shippingId === m.id
                          ? "border-acid bg-acid/5"
                          : "border-steel hover:border-ash"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-bone">
                          {m.label}
                        </span>
                        <span className="text-xs text-fog">{m.eta}</span>
                      </span>
                      <span className="text-sm font-semibold text-acid">
                        {cost === 0 ? "Gratis" : formatIDR(cost)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {shipping.freeEligible && !freeHint.qualified && (
                <p className="mt-3 text-xs text-fog">
                  Tambah {formatIDR(freeHint.remaining)} lagi untuk gratis ongkir
                  Reguler.
                </p>
              )}
            </section>

            <section>
              <h2 className="font-display text-2xl text-bone">Payment</h2>
              {paymentReady ? (
                <div className="mt-5 space-y-3">
                  {paymentProviders.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentId(p.id)}
                      aria-pressed={paymentId === p.id}
                      className={`flex w-full items-center justify-between border px-5 py-4 text-left transition-colors ${
                        paymentId === p.id
                          ? "border-acid bg-acid/5"
                          : "border-steel hover:border-ash"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-bone">
                          {p.label}
                        </span>
                        <span className="text-xs text-fog">{p.blurb}</span>
                      </span>
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          paymentId === p.id
                            ? "bg-acid"
                            : "border border-steel"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-5 border border-steel bg-coal px-5 py-4 text-sm text-fog">
                  Tidak ada metode pembayaran yang bisa dipilih saat ini.
                </p>
              )}
            </section>
          </div>

          {/* ---------- Right: summary ---------- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-steel bg-coal">
              <h2 className="border-b border-steel/40 px-5 py-4 font-display text-xl text-bone">
                Order summary
              </h2>
              <div className="space-y-4 px-5 py-5">
                {items.map((item) => (
                  <div key={item.lineId} className="flex gap-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden border border-steel/40 bg-smoke">
                      <LineImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover grayscale"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="truncate text-sm text-bone">
                        {item.name}
                      </span>
                      <span className="text-xs text-fog">
                        {item.size ? `Size ${item.size}` : "Ukuran belum dipilih"}
                        {item.colorway ? ` · ${item.colorway}` : ""} · Qty{" "}
                        {item.quantity}
                      </span>
                      <span className="mt-auto text-sm font-semibold text-acid">
                        {formatIDR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-steel/40 px-5 py-5 text-sm">
                <div className="flex justify-between text-fog">
                  <span>Subtotal</span>
                  <span className="text-bone">{formatIDR(sub)}</span>
                </div>
                <div className="flex justify-between text-fog">
                  <span>Shipping ({shipping.label})</span>
                  <span className="text-bone">
                    {shippingCost === 0 ? "Gratis" : formatIDR(shippingCost)}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-steel/40 pt-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-fog">
                    Total
                  </span>
                  <span className="font-display text-2xl text-bone">
                    {formatIDR(total)}
                  </span>
                </div>
              </div>
              <div className="border-t border-steel/40 px-5 py-5">
                <label className="mb-4 flex items-start gap-3 text-xs text-fog">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-acid"
                  />
                  <span>
                    Saya setuju dengan{" "}
                    <Link to="/privacy" className="text-acid underline-offset-2 hover:underline">
                      Kebijakan Privasi
                    </Link>{" "}
                    dan{" "}
                    <Link to="/terms" className="text-acid underline-offset-2 hover:underline">
                      Syarat & Ketentuan
                    </Link>
                    .
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={placing || !paymentReady || !sizesReady}
                  className="flex w-full items-center justify-center gap-2 bg-acid px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {placing ? "Placing order…" : "Place order"}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ash">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Data kartu tidak pernah disimpan di situs ini
                </p>
              </div>
            </div>
          </aside>
        </form>
      </motion.div>
    </div>
  );
}
