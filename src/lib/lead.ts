import { getSupabase } from "./supabase";
import { isSupabaseConfiguredForWrites } from "./env";

/**
 * Lead capture — contact messages and newsletter signups.
 *
 * Honest by construction: `ok: true` means a row was actually written to
 * Supabase. When the project is not configured, or the insert fails, the
 * caller is told so and must NOT tell the customer it worked.
 *
 * The backing migration is `supabase/migrations/20261019_leads.sql`; until it
 * is applied every call returns `{ ok: false, reason: "not-configured" }` or
 * `{ ok: false, reason: "error" }` and the UI degrades to "write to us".
 */

export type LeadResult = {
  ok: boolean;
  /** Why it did not succeed. Absent on success. */
  reason?: "not-configured" | "error" | "duplicate";
};

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/** Mirrors the `check` constraints in the migration. */
const NAME_MAX = 120;
const MESSAGE_MAX = 4000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NOT_CONFIGURED: LeadResult = { ok: false, reason: "not-configured" };
const FAILED: LeadResult = { ok: false, reason: "error" };

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Runs an insert and reports only what actually happened. */
async function insertLead(
  table: "contact_messages" | "newsletter_subscribers",
  row: Record<string, string>,
  honeypot?: string,
  turnstileToken?: string
): Promise<LeadResult> {
  if (!isSupabaseConfiguredForWrites()) return NOT_CONFIGURED;

  const endpoint = import.meta.env.VITE_LEAD_ENDPOINT;
  if (endpoint) {
    try {
      const { getSupabase } = await import("./supabase");
      const supabase = await getSupabase();
      const type = table === "contact_messages" ? "contact" : "newsletter";
      const payload = table === "contact_messages"
        ? { name: row.name, email: row.email, message: row.message }
        : { email: row.email };
      const { data, error } = await supabase.functions.invoke("submit-lead", {
        body: { type, payload, honeypot: honeypot ?? "", turnstileToken: turnstileToken ?? "" },
      });
      if (error) {
        console.warn(`[lead] submit-lead failed:`, error.message);
        return FAILED;
      }
      const result = data as { ok?: boolean; reason?: string } | null;
      if (result?.ok) return { ok: true };
      if (result?.reason === "duplicate") return { ok: false, reason: "duplicate" };
      return FAILED;
    } catch (err) {
      console.warn(`[lead] submit-lead threw:`, err);
      return FAILED;
    }
  }

  try {
    // The SDK is loaded on demand; a guest form must never pay for it.
    const supabase = await getSupabase();
    const { error } = await supabase.from(table).insert(row);
    if (error) {
      // Duplicate email on newsletter (unique index) → friendly message.
      if (error.code === "23505") return { ok: false, reason: "duplicate" };
      console.warn(`[lead] ${table} insert failed:`, error.message);
      return FAILED;
    }
    return { ok: true };
  } catch (err) {
    console.warn(`[lead] ${table} insert threw:`, err);
    return FAILED;
  }
}

/**
 * Store a contact form submission. Rejects blank / oversized / malformed
 * input before it reaches the network.
 */
export async function submitContactMessage(
  input: ContactMessageInput,
  turnstileToken?: string
): Promise<LeadResult> {
  const name = trimmed(input?.name);
  const email = trimmed(input?.email).toLowerCase();
  const message = trimmed(input?.message);

  if (!name || name.length > NAME_MAX) return FAILED;
  if (!EMAIL_PATTERN.test(email)) return FAILED;
  if (!message || message.length > MESSAGE_MAX) return FAILED;

  return insertLead("contact_messages", { name, email, message }, undefined, turnstileToken);
}

/** Store a newsletter signup. De-duplicated case-insensitively by the index. */
export async function subscribeNewsletter(email: string, turnstileToken?: string): Promise<LeadResult> {
  const normalised = trimmed(email).toLowerCase();
  if (!EMAIL_PATTERN.test(normalised)) return FAILED;

  return insertLead("newsletter_subscribers", { email: normalised }, undefined, turnstileToken);
}
