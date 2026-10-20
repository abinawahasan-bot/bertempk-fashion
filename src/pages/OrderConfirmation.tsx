import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { getOrder } from "../lib/orders";
import { MANUAL_TRANSFER, manualTransferAvailable } from "../lib/payments";
import { formatIDR } from "../lib/money";
import { CONTACT } from "../constants/commerce";
import OrderVariant from "../components/OrderVariant";
import StatusPill from "../components/StatusPill";
import LineImage from "../components/LineImage";
import type { Order } from "../types";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const { id: orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const o = await getOrder(orderId ?? "");
      if (!cancelled) {
        setOrder(o);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const justPlaced = searchParams.get("placed") === "1";

  /**
   * Checkout appends `local=1` when the order was only written to this
   * browser's localStorage. The studio cannot see such an order, so this page
   * must never claim a confirmation was recorded on the server.
   */
  const localOnly = justPlaced && searchParams.get("local") === "1";

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(MANUAL_TRANSFER.accountNumber);
      toast.success("Account number copied");
    } catch {
      toast.error("Could not copy — select the number manually.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-fog">
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-display text-4xl text-bone">Order not found</h1>
        <Link
          to="/shop"
          className="bg-acid px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex h-14 w-14 items-center justify-center bg-acid">
          <Check className="h-7 w-7 text-ink" strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-display text-5xl text-bone sm:text-6xl">
          {justPlaced ? "Order placed" : "Order details"}
        </h1>
        <p className="mt-3 text-fog">
          {localOnly
            ? "Thanks for your order — it is saved in this browser only."
            : justPlaced
              ? "Thanks for your order. A confirmation has been recorded."
              : "Reference below — keep it for support."}{" "}
          <span className="font-semibold text-acid">{order.order_number}</span>
        </p>
        <div className="mt-3">
          <StatusPill status={order.status} />
        </div>

        {localOnly && (
          <section
            role="alert"
            className="mt-10 border border-signal/50 bg-signal/5 px-5 py-5"
          >
            <h2 className="flex items-center gap-2 font-display text-xl text-bone">
              <TriangleAlert className="h-4 w-4 text-signal" />
              The studio cannot see this order yet
            </h2>
            <p className="mt-1 text-sm text-fog">
              It was stored in this browser only, not on the studio's server.
              Nothing has been charged.{" "}
              {CONTACT.email ? (
                <>
                  Send the number{" "}
                  <span className="font-semibold text-acid">
                    {order.order_number}
                  </span>{" "}
                  to{" "}
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="text-bone underline underline-offset-4"
                  >
                    {CONTACT.email}
                  </a>{" "}
                  so the studio can set it up before you transfer anything.
                </>
              ) : (
                "Quote the order number to the studio before you transfer anything."
              )}
            </p>
          </section>
        )}

        {order.payment_method === "manual_transfer" &&
          (manualTransferAvailable ? (
            <section className="mt-10 border border-acid/40 bg-acid/5 px-5 py-5">
              <h2 className="font-display text-xl text-bone">
                Complete your payment
              </h2>
              <p className="mt-1 text-sm text-fog">
                Transfer the exact total to the account below, then send the
                proof to the studio. We ship after verification.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="border border-steel/60 bg-coal px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-fog">
                    Bank
                  </span>
                  <span className="block text-sm font-semibold text-bone">
                    {MANUAL_TRANSFER.bank}
                  </span>
                </div>
                <div className="border border-steel/60 bg-coal px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-fog">
                    Account number
                  </span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-bone">
                    {MANUAL_TRANSFER.accountNumber}
                    <button
                      onClick={copyAccount}
                      aria-label="Copy account number"
                      className="text-fog transition-colors hover:text-acid"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <div className="border border-steel/60 bg-coal px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-fog">
                    Account name
                  </span>
                  <span className="block text-sm font-semibold text-bone">
                    {MANUAL_TRANSFER.accountName}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-acid">
                Total to transfer: {formatIDR(order.total)}
              </p>
            </section>
          ) : (
            <section className="mt-10 border border-signal/50 bg-signal/5 px-5 py-5">
              <h2 className="flex items-center gap-2 font-display text-xl text-bone">
                <TriangleAlert className="h-4 w-4 text-signal" />
                Payment instructions are not available
              </h2>
              <p className="mt-1 text-sm text-fog">
                This order is marked as manual transfer, but no bank account is
                published in this build. Nothing has been charged —{" "}
                {CONTACT.email ? (
                  <>
                    contact us at{" "}
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="text-bone underline underline-offset-4"
                    >
                      {CONTACT.email}
                    </a>{" "}
                    and the studio will settle it with you.
                  </>
                ) : (
                  "contact the studio and the studio will settle it with you."
                )}
              </p>
            </section>
          ))}

        <section className="mt-10 border border-steel bg-coal">
          <h2 className="border-b border-steel/40 px-5 py-4 font-display text-xl text-bone">
            Items
          </h2>
          <div className="divide-y divide-steel/40">
            {order.items.map((item) => (
              <div
                key={`${item.product_id}::${item.line_id}`}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="h-16 w-14 shrink-0 overflow-hidden border border-steel/40 bg-smoke">
                  <LineImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover grayscale"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-bone">{item.name}</p>
                  <p className="text-xs text-fog">
                    {item.category} · <OrderVariant item={item} /> · Qty{" "}
                    {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-acid">
                  {formatIDR(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-steel/40 px-5 py-5 text-sm">
            <div className="flex justify-between text-fog">
              <span>Subtotal</span>
              <span className="text-bone">{formatIDR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-fog">
              <span>Shipping</span>
              <span className="text-bone">
                {order.shipping_cost === 0
                  ? "Gratis"
                  : formatIDR(order.shipping_cost)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-steel/40 pt-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-fog">
                Total
              </span>
              <span className="font-display text-2xl text-bone">
                {formatIDR(order.total)}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 border border-steel bg-coal px-5 py-5">
          <h2 className="font-display text-xl text-bone">Ship to</h2>
          <address className="mt-2 text-sm not-italic leading-relaxed text-fog">
            <span className="text-bone">{order.address.full_name}</span>
            <br />
            {order.address.line1}
            <br />
            {order.address.city} {order.address.postal_code}
            <br />
            {order.address.country}
            <br />
            {order.address.phone}
            {order.address.notes && (
              <>
                <br />
                <span className="text-ash">Note: {order.address.notes}</span>
              </>
            )}
          </address>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/orders"
            className="border border-steel px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-fog transition-colors hover:border-acid hover:text-acid"
          >
            View all orders
          </Link>
          <Link
            to="/shop"
            className="bg-acid px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
          >
            Continue shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
