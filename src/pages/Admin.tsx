import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { getSupabase } from "../lib/supabase";
import { formatIDR } from "../lib/money";

interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  total: number;
  created_at: string;
  address?: { full_name?: string; email?: string };
}

const STATUSES = ["pending_payment", "paid", "shipped", "delivered", "cancelled", "refunded"];

export default function Admin() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = await getSupabase();
      const { data, error: fnErr } = await supabase.functions.invoke("admin-orders", {
        body: { action: "list", status: filter || null, limit: 100 },
      });
      if (fnErr) throw fnErr;
      setOrders((data as { orders: AdminOrder[] })?.orders ?? []);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const supabase = await getSupabase();
      await supabase.functions.invoke("admin-orders", { body: { action: "update_status", id, status } });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      alert((e as { message?: string })?.message ?? "Update failed");
    }
  };

  if (!user) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-fog">Sign in required.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-bone">Admin — Orders</h1>
      <div className="mt-4 flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-steel bg-ink px-3 py-2 text-sm text-bone"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={load}
          className="border border-steel px-3 py-2 text-sm text-bone hover:border-bone"
        >
          Refresh
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && <p className="mt-4 text-sm text-fog">Loading…</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-steel/40 text-left text-[10px] uppercase tracking-[0.2em] text-silver">
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-steel/20">
                <td className="py-2 pr-4 font-mono text-xs text-bone">{o.order_number}</td>
                <td className="py-2 pr-4 text-fog">
                  {o.address?.full_name ?? "—"}
                  <br />
                  <span className="text-xs">{o.address?.email}</span>
                </td>
                <td className="py-2 pr-4 text-bone">{formatIDR(o.total)}</td>
                <td className="py-2 pr-4 text-fog">{o.status}</td>
                <td className="py-2 pr-4 text-xs text-fog">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="border border-steel bg-ink px-2 py-1 text-xs text-bone"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <p className="mt-6 text-sm text-fog">No orders.</p>
        )}
      </div>
    </div>
  );
}