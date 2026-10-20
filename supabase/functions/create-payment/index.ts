import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";
const MIDTRANS_IS_PRODUCTION = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") ?? "";

const SNAP_BASE = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const ALLOWED_ORIGINS = SITE_ORIGIN
  ? SITE_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
    ? origin
    : (ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS[0] : "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "invalid_request" }, 405, cors);

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return json({ error: "unauthorized" }, 401, cors);

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401, cors);
  const userId = userData.user.id;

  if (!MIDTRANS_SERVER_KEY) {
    return json({ error: "payment_not_configured" }, 503, cors);
  }
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return json({ error: "persist_failed" }, 500, cors);
  }

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_request" }, 400, cors); }
  const body = (raw && typeof raw === "object" && !Array.isArray(raw)) ? (raw as Record<string, unknown>) : null;
  const orderId = typeof body?.order_id === "string" ? body.order_id.trim() : "";
  if (!orderId) return json({ error: "invalid_request" }, 400, cors);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // Look up the order owned by this user (server price authority).
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (orderErr || !order) {
    return json({ error: "order_not_found" }, 404, cors);
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const grossAmount = Math.round(Number(order.total) || 0);
  if (grossAmount <= 0) return json({ error: "invalid_amount" }, 400, cors);

  const itemDetails = items.map((it: Record<string, unknown>) => ({
    id: String(it.product_id ?? ""),
    name: String(it.name ?? "Item"),
    price: Math.round(Number(it.price) || 0),
    quantity: Math.round(Number(it.quantity) || 1),
  }));
  const shippingCost = Math.round(Number(order.shipping_cost) || 0);
  if (shippingCost > 0) {
    itemDetails.push({ id: "shipping", name: "Shipping", price: shippingCost, quantity: 1 });
  }

  const midtransBody = {
    transaction_details: {
      order_id: order.order_number,
      gross_amount: grossAmount,
    },
    item_details: itemDetails,
    customer_details: {
      first_name: order.address?.full_name ?? "",
      email: order.address?.email ?? "",
      phone: order.address?.phone ?? "",
      billing_address: {
        address: order.address?.line1 ?? "",
        city: order.address?.city ?? "",
        postal_code: order.address?.postal_code ?? "",
        country_code: "IDN",
      },
    },
    callbacks: {
      finish: `${SITE_ORIGIN || ""}/orders/${order.id}`,
    },
  };

  try {
    const auth = btoa(`${MIDTRANS_SERVER_KEY}:`);
    const res = await fetch(SNAP_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(midtransBody),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("midtrans error", res.status, data);
      return json({ error: "payment_provider_error", status: res.status }, 502, cors);
    }
    const token = data?.token;
    const redirectUrl = data?.redirect_url;
    if (!token || !redirectUrl) {
      return json({ error: "payment_provider_error" }, 502, cors);
    }
    return json({ token, redirect_url: redirectUrl }, 200, cors);
  } catch (e) {
    console.error("midtrans fetch failed", e);
    return json({ error: "payment_provider_error" }, 502, cors);
  }
});