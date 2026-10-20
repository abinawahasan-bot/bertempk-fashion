import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";

async function sha512Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const orderId = String(payload.order_id ?? "").trim();
  const statusCode = String(payload.status_code ?? "").trim();
  const grossAmount = String(payload.gross_amount ?? "").trim();
  const signatureKey = String(payload.signature_key ?? "").trim();
  const transactionStatus = String(payload.transaction_status ?? "").trim();
  const fraudStatus = String(payload.fraud_status ?? "").trim();
  const transactionId = String(payload.transaction_id ?? "").trim();
  const paymentType = String(payload.payment_type ?? "").trim();

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return new Response("missing fields", { status: 400 });
  }

  if (!MIDTRANS_SERVER_KEY || !SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return new Response("not configured", { status: 503 });
  }

  // Verify signature.
  const expected = await sha512Hex(orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY);
  if (expected !== signatureKey.toLowerCase()) {
    return new Response("invalid signature", { status: 403 });
  }

  // Map Midtrans status → our status.
  let newStatus: string;
  if (transactionStatus === "capture" || transactionStatus === "settlement") {
    // For card payments, also check fraud status.
    if (transactionStatus === "capture" && fraudStatus && fraudStatus !== "accept") {
      newStatus = "pending_payment";
    } else {
      newStatus = "paid";
    }
  } else if (transactionStatus === "pending") {
    newStatus = "pending_payment";
  } else if (["deny", "cancel", "expire"].includes(transactionStatus)) {
    newStatus = "cancelled";
  } else if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
    newStatus = "refunded";
  } else {
    newStatus = "pending_payment";
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Look up order.
  const { data: order, error: findErr } = await admin
    .from("orders")
    .select("id, status, total, order_number, address, items")
    .eq("order_number", orderId)
    .maybeSingle();

  if (findErr || !order) {
    return new Response("order not found", { status: 404 });
  }

  // Idempotency: don't downgrade a paid order, but allow re-confirming.
  if (order.status === "paid" && newStatus !== "paid") {
    // Already paid; ignore late non-paid notifications (refund handled separately).
    if (newStatus !== "refunded") {
      return new Response("ok", { status: 200 });
    }
  }

  // Verify amount matches (gross_amount is a string like "1978000.00").
  const notifiedAmount = Math.round(Number(grossAmount));
  if (Number.isFinite(notifiedAmount) && notifiedAmount > 0 && notifiedAmount !== Math.round(Number(order.total))) {
    console.error("amount mismatch", { orderId, notifiedAmount, stored: order.total });
    return new Response("amount mismatch", { status: 400 });
  }

  const { error: updErr } = await admin
    .from("orders")
    .update({
      status: newStatus,
      // store payment metadata in a best-effort way; ignore if column absent
    })
    .eq("id", order.id);

  if (updErr) {
    console.error("update failed", updErr.message);
    return new Response("update failed", { status: 500 });
  }

  // Best-effort transactional email on payment confirmation.
  if (newStatus === "paid" && order.address?.email) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          to: order.address.email,
          subject: `Pembayaran diterima — ${order.order_number}`,
          html: `<p>Halo ${order.address.full_name ?? ""},</p><p>Pembayaran untuk order <strong>${order.order_number}</strong> telah kami terima. Total: Rp ${Number(order.total).toLocaleString("id-ID")}.</p><p>Kami akan segera memproses pengiriman. Terima kasih.</p>`,
        }),
      });
    } catch (e) {
      console.error("email send failed", e);
    }
  }

  console.log("webhook processed", { orderId, transactionStatus, newStatus, paymentType, transactionId });
  return new Response("ok", { status: 200 });
});