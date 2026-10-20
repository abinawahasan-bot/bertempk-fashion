import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
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

  const email = (userData.user.email ?? "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return json({ error: "forbidden" }, 403, cors);
  }

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return json({ error: "not_configured" }, 503, cors);
  }

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_request" }, 400, cors); }
  const body = (raw && typeof raw === "object" && !Array.isArray(raw)) ? (raw as Record<string, unknown>) : null;
  if (!body) return json({ error: "invalid_request" }, 400, cors);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const action = body.action;
  if (action === "list") {
    const status = typeof body.status === "string" ? body.status : null;
    const limit = Math.min(Number(body.limit) || 50, 200);
    let q = admin.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return json({ error: "query_failed", message: error.message }, 500, cors);
    return json({ orders: data ?? [] }, 200, cors);
  }

  if (action === "update_status") {
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";
    const allowed = ["pending_payment", "paid", "shipped", "delivered", "cancelled", "refunded"];
    if (!id || !allowed.includes(status)) {
      return json({ error: "invalid_request" }, 400, cors);
    }
    const { error } = await admin.from("orders").update({ status }).eq("id", id);
    if (error) return json({ error: "update_failed", message: error.message }, 500, cors);
    return json({ ok: true }, 200, cors);
  }

  return json({ error: "unknown_action" }, 400, cors);
});