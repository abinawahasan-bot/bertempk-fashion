import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { computeOrder, ComputeError } from "./compute.ts";
import { validateBody } from "./validate.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") ?? "";
const ALLOWED_ORIGINS = SITE_ORIGIN ? SITE_ORIGIN.split(",").map((s)=>s.trim()).filter(Boolean) : [];
function corsHeaders(origin) {
  const allow = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) ? origin : ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS[0] : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}
function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
function generateOrderNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for(let i = 0; i < 6; i += 1){
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BTPK-${yy}${mm}${dd}-${suffix}`;
}
const INSERT_ATTEMPTS = 3;
Deno.serve(async (req)=>{
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors
    });
  }
  if (req.method !== "POST") {
    return json({
      error: "invalid_request",
      message: "method not allowed"
    }, 405, cors);
  }
  // Auth
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return json({
      error: "unauthorized"
    }, 401, cors);
  }
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json({
      error: "unauthorized"
    }, 401, cors);
  }
  const userId = userData.user.id;
  // Parse body
  let raw;
  try {
    raw = await req.json();
  } catch  {
    return json({
      error: "invalid_request",
      message: "invalid json"
    }, 400, cors);
  }
  const validated = validateBody(raw);
  if (!validated.ok) {
    const body = {
      error: validated.code
    };
    if (validated.fields) body.fields = validated.fields;
    return json(body, 400, cors);
  }
  const v = validated.value;
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    console.error("missing service role config");
    return json({
      error: "persist_failed"
    }, 500, cors);
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  // Fetch authoritative catalogue from the DB (single source of truth for money).
  const { data: productRows, error: prodErr } = await admin.from("products").select("id, name, image, category, price, stock");
  if (prodErr || !productRows || productRows.length === 0) {
    console.error("catalog load failed", prodErr?.message);
    return json({
      error: "catalog_unavailable"
    }, 503, cors);
  }
  const catalog = {};
  for (const r of productRows){
    catalog[r.id] = {
      name: r.name,
      image: r.image,
      category: r.category,
      price: Number(r.price),
      stock: Number(r.stock)
    };
  }
  // Compute (server authority)
  let computed;
  try {
    computed = computeOrder(v.items, v.shipping_method, catalog);
  } catch (e) {
    if (e instanceof ComputeError) {
      return json({
        error: e.code
      }, 400, cors);
    }
    console.error("compute failed", e);
    return json({
      error: "persist_failed"
    }, 500, cors);
  }
  let lastError = null;
  for(let attempt = 0; attempt < INSERT_ATTEMPTS; attempt += 1){
    const orderNumber = generateOrderNumber();
    const row = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
      user_id: userId,
      status: "pending_payment",
      payment_method: v.payment_method,
      items: computed.items,
      subtotal: computed.subtotal,
      shipping_cost: computed.shipping_cost,
      total: computed.total,
      address: v.address,
      created_at: new Date().toISOString()
    };
    const { data, error } = await admin.from("orders").insert(row).select().single();
    if (!error && data) {
      // Decrement stock (best-effort, read-then-write).
      for (const item of computed.items) {
        const { data: prod } = await admin.from("products").select("stock").eq("id", item.product_id).single();
        if (prod) {
          await admin.from("products").update({
            stock: Math.max(0, Number(prod.stock) - item.quantity)
          }).eq("id", item.product_id);
        }
      }
      return json({
        order: data
      }, 200, cors);
    }
    lastError = error ?? null;
    const isUnique = error?.code === "23505" || /duplicate key|already exists/i.test(error?.message ?? "");
    if (!isUnique) break;
  }
  console.error("persist failed", lastError?.message);
  if (lastError?.code === "23505") {
    return json({
      error: "order_number_collision"
    }, 500, cors);
  }
  return json({
    error: "persist_failed"
  }, 500, cors);
});
