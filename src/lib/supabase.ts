import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const PLACEHOLDER = /placeholder|your-|changeme|example/i;
/** True only when real credentials exist (guards feature gating, not security). */
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !PLACEHOLDER.test(String(import.meta.env.VITE_SUPABASE_URL)) &&
    !PLACEHOLDER.test(String(import.meta.env.VITE_SUPABASE_ANON_KEY))
);

/**
 * The client is created on first use, never at import time.
 *
 * The SDK (plus `@supabase/realtime-js` and `@supabase/phoenix`, which this app
 * never touches) is ~800 kB of JavaScript. It used to be pulled into the entry
 * chunk by this module, so every visitor parsed and executed it before the page
 * could paint — even though nothing here runs until `initialize()` fires from an
 * effect after mount. A dynamic import moves that cost into its own chunk that
 * the browser fetches after first paint.
 *
 * The promise is memoised, so exactly one client is created per session and the
 * chunk is fetched at most once. A failed import or construction clears the
 * cache, so a later call retries instead of reusing a rejected promise.
 */
let client: Promise<SupabaseClient> | null = null;

/** The shared Supabase client. Callers must `await` it before the first query. */
export function getSupabase(): Promise<SupabaseClient> {
  if (!client) {
    client = import("@supabase/supabase-js")
      .then(({ createClient }) => {
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn(
            "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
              "Add them to .env to enable authentication."
          );
        }
        return createClient(
          supabaseUrl || "https://placeholder.supabase.co",
          supabaseAnonKey || "placeholder-key",
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storage: window.localStorage,
              storageKey: "bato-supabase-auth",
            },
          },
        );
      })
      .catch((error: unknown) => {
        client = null;
        throw error;
      });
  }
  return client;
}