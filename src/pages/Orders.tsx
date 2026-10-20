import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { PackageSearch, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { hasUnSizedLines, listOrders, clearLocalOrders } from "../lib/orders";
import { formatIDR } from "../lib/money";
import { useAuthStore } from "../store/auth";
import { useUIStore } from "../store/ui";
import StatusPill from "../components/StatusPill";
import type { Order } from "../types";

export default function Orders() {
  const { user } = useAuthStore();
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const handleClearLocal = () => {
    clearLocalOrders();
    setOrders([]);
    toast.success("Local orders cleared.");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listOrders(user?.id ?? null);
      if (!cancelled) {
        setOrders(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-acid">
          Account
        </p>
        <h1 className="mt-2 font-display text-5xl text-bone sm:text-6xl">
          Your orders
        </h1>

        {loading ? (
          <p className="mt-10 text-fog">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 border border-steel/50 px-6 py-16 text-center">
            <PackageSearch className="h-9 w-9 text-fog" />
            <p className="font-display text-2xl text-bone">No orders yet</p>
            <p className="text-sm text-fog">Your placed orders will show up here.</p>
            {!user && (
              <button
                onClick={openAuthModal}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-acid underline-offset-4 hover:underline"
              >
                Sign in to sync orders across devices
              </button>
            )}
            <Link
              to="/shop"
              className="mt-2 bg-acid px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-bone"
            >
              Shop the drop
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-wrap items-center gap-4 border border-steel bg-coal px-5 py-5 transition-colors hover:border-ash"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-bone">
                    {order.order_number}
                  </p>
                  <p className="mt-0.5 text-xs text-fog">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                  </p>
                  {hasUnSizedLines(order) && (
                    <p className="mt-1 text-xs text-signal">
                      Sebagian item belum memiliki ukuran — buka order untuk
                      melihat detail.
                    </p>
                  )}
                </div>
                <StatusPill status={order.status} />
                <p className="w-32 text-right font-display text-xl text-acid">
                  {formatIDR(order.total)}
                </p>
              </Link>
            ))}
          </div>
        )}
        {!user && orders.length > 0 && (
          <button
            onClick={handleClearLocal}
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-fog transition-colors hover:text-signal"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my local orders
          </button>
        )}
      </motion.div>
    </div>
  );
}
