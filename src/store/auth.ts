import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";
import { clearLocalOrders } from "../lib/orders";

/**
 * A failed lazy import has no Supabase error message, but the modal must never
 * be left waiting: report it with the same `{ error }` shape the SDK returns.
 */
function message(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithProvider: (provider: "google" | "github") => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      initialized: false,

      /*
       * `getSupabase()` loads the SDK on demand (see `lib/supabase.ts`). Every
       * path below must therefore treat it as a first await: a rejected import
       * is caught, and nothing here clears `user` before the client resolves, so
       * a returning shopper never sees the signed-in navbar flash to "Sign in".
       */

      initialize: async () => {
        if (get().initialized) return;

        try {
          const supabase = await getSupabase();
          const { data } = await supabase.auth.getSession();
          set({ user: data.session?.user ?? null, initialized: true });

          supabase.auth.onAuthStateChange((_event, session) => {
            set({ user: session?.user ?? null });
          });
        } catch {
          set({ initialized: true });
        }
      },

      signIn: async (email, password) => {
        set({ loading: true });
        try {
          const supabase = await getSupabase();
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          return { error: error?.message ?? null };
        } catch (err) {
          return { error: message(err) };
        } finally {
          set({ loading: false });
        }
      },

      signUp: async (email, password, name) => {
        set({ loading: true });
        try {
          const supabase = await getSupabase();
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
            },
          });
          return { error: error?.message ?? null };
        } catch (err) {
          return { error: message(err) };
        } finally {
          set({ loading: false });
        }
      },

      signInWithProvider: async (provider) => {
        set({ loading: true });
        try {
          const supabase = await getSupabase();
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: window.location.origin,
            },
          });
          return { error: error?.message ?? null };
        } catch (err) {
          return { error: message(err) };
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        // A failed sign-out must not strand the shopper: clear locally anyway.
        try {
          const supabase = await getSupabase();
          await supabase.auth.signOut();
        } catch (err) {
          console.warn("[auth] sign-out failed, clearing the local session:", err);
        }
        // Clear guest order data on sign-out (privacy / shared-device hygiene).
        clearLocalOrders();
        set({ user: null });
      },
    }),
    {
      name: "bato-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
