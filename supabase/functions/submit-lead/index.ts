import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";

const NAME_MAX = 120;
const MESSAGE_MAX = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WINDOW_MS = 60_000;
const IP_LIMIT = 5;
const EMAIL_LIMIT = 3;

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "invalid_request" }, 405, cors);

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return json({ ok: false, reason: "not-configured" }, 200, cors);
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ ok: false, reason: "error" }, 400, cors); }
  const body = (raw && typeof raw === "object" && !Array.isArray(raw)) ? (raw as Record<string, unknown>) : null;
  if (!body) return json({ ok: false, reason: "error" }, 400, cors);

  // Honeypot.
  if (typeof body.honeypot === "string" && body.honeypot.trim() !== "") {
    // Pretend success to bots.
    return json({ ok: true }, 200, cors);
  }

  // Turnstile verification (only when secret key is configured).
  if (TURNSTILE_SECRET) {
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    if (!token) return json({ ok: false, reason: "error" }, 400, cors);
    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        console.warn("turnstile verify failed", verifyData["error-codes"]);
        return json({ ok: false, reason: "error" }, 403, cors);
      }
    } catch (e) {
      console.warn("turnstile verify error", e);
      return json({ ok: false, reason: "error" }, 500, cors);
    }
  }

  const type = body.type;
  if (type !== "contact" && type !== "newsletter") {
    return json({ ok: false, reason: "error" }, 400, cors);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Rate limit by IP.
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count: ipCount } = await admin
    .from("lead_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", `ip:${ip}`)
    .gte("created_at", since);
  if ((ipCount ?? 0) >= IP_LIMIT) {
    return json({ ok: false, reason: "rate_limited" }, 429, cors);
  }

  if (type === "contact") {
    const p = (body.payload && typeof body.payload === "object") ? (body.payload as Record<string, unknown>) : null;
    if (!p) return json({ ok: false, reason: "error" }, 400, cors);
    const name = typeof p.name === "string" ? p.name.trim() : "";
    const email = typeof p.email === "string" ? p.email.trim().toLowerCase() : "";
    const message = typeof p.message === "string" ? p.message.trim() : "";
    if (!name || name.length > NAME_MAX) return json({ ok: false, reason: "error" }, 400, cors);
    if (!EMAIL_RE.test(email)) return json({ ok: false, reason: "error" }, 400, cors);
    if (!message || message.length > MESSAGE_MAX) return json({ ok: false, reason: "error" }, 400, cors);

    // Rate limit by email.
    const { count: emailCount } = await admin
      .from("lead_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("key", `email:${email}`)
      .gte("created_at", since);
    if ((emailCount ?? 0) >= EMAIL_LIMIT) {
      return json({ ok: false, reason: "rate_limited" }, 429, cors);
    }

    const { error } = await admin.from("contact_messages").insert({ name, email, message });
    if (error) {
      console.warn("contact insert failed", error.message);
      return json({ ok: false, reason: "error" }, 200, cors);
    }

    // Record rate-limit hits.
    await admin.from("lead_rate_limits").insert([
      { key: `ip:${ip}` },
      { key: `email:${email}` },
    ]);
    return json({ ok: true }, 200, cors);
  }

  // newsletter
  const p = (body.payload && typeof body.payload === "object") ? (body.payload as Record<string, unknown>) : null;
  const email = (p && typeof p.email === "string") ? p.email.trim().toLowerCase() : (typeof body.email === "string" ? body.email.trim().toLowerCase() : "");
  if (!EMAIL_RE.test(email)) return json({ ok: false, reason: "error" }, 400, cors);

  const { count: emailCount } = await admin
    .from("lead_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", `email:${email}`)
    .gte("created_at", since);
  if ((emailCount ?? 0) >= EMAIL_LIMIT) {
    return json({ ok: false, reason: "rate_limited" }, 429, cors);
  }

  const { error } = await admin.from("newsletter_subscribers").insert({ email });
  if (error) {
    console.warn("newsletter insert failed", error.message);
    if (error.code === "23505") return json({ ok: false, reason: "duplicate" }, 200, cors);
    return json({ ok: false, reason: "error" }, 200, cors);
  }

  await admin.from("lead_rate_limits").insert([
    { key: `ip:${ip}` },
    { key: `email:${email}` },
  ]);
  return json({ ok: true }, 200, cors);
});