import { isSupabaseConfigured } from "./supabase";

/**
 * Env-var helpers.
 *
 * Vite inlines `import.meta.env.*` at build time and missing keys come through
 * as `undefined`, empty strings, or the copy-pasted placeholders that live in
 * `.env.example`. Anything that reads configuration must go through
 * `hasValue` so a placeholder never renders as real data.
 */

/** Placeholder copy that ships in `.env.example` and must not reach the UI. */
const PLACEHOLDER = /placeholder|your-|changeme|example/i;

/** True when `v` is a non-blank, non-placeholder value. */
export function hasValue(v?: string): boolean {
  return Boolean(v && v.trim() && !PLACEHOLDER.test(v));
}

/**
 * True when Supabase is configured well enough to attempt a write.
 *
 * Mirrors `isSupabaseConfigured` from `lib/supabase.ts` (the single source of
 * truth for credential detection) and adds the broader placeholder sweep, so a
 * half-filled `.env` degrades to the localStorage fallback instead of sending
 * doomed requests.
 */
export function isSupabaseConfiguredForWrites(): boolean {
  if (!isSupabaseConfigured) return false;
  return hasValue(String(import.meta.env.VITE_SUPABASE_URL ?? "")) &&
    hasValue(String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""));
}