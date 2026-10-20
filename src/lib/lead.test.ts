import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Lead capture must never report success for a write that did not happen, so
 * every test here asserts on the returned `LeadResult`, not on a toast.
 */
const h = vi.hoisted(() => ({
  supabaseConfigured: true,
  insertError: null as { message: string } | null,
  insertThrows: false,
  calls: [] as { table: string; row: Record<string, string> }[],
}));

vi.mock("./supabase", () => ({
  get isSupabaseConfigured() {
    return h.supabaseConfigured;
  },
  getSupabase: () =>
    Promise.resolve({
      from: (table: string) => ({
        insert: async (row: Record<string, string>) => {
          h.calls.push({ table, row });
          if (h.insertThrows) throw new Error("network down");
          return { error: h.insertError };
        },
      }),
    }),
}));

import {
  submitContactMessage,
  subscribeNewsletter,
} from "./lead";

const MESSAGE = { name: "Aiman", email: "aiman@example.com", message: "Halo." };

beforeEach(() => {
  // Real-looking credentials, so `isSupabaseConfiguredForWrites()` is true.
  vi.stubEnv("VITE_SUPABASE_URL", "https://stub.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "stub-anon-key");
  // Exercise the direct-insert path (Edge Function path is tested separately).
  vi.stubEnv("VITE_LEAD_ENDPOINT", "");
  h.supabaseConfigured = true;
  h.insertError = null;
  h.insertThrows = false;
  h.calls = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("submitContactMessage", () => {
  it("writes the row and reports success", async () => {
    await expect(submitContactMessage(MESSAGE)).resolves.toEqual({ ok: true });
    expect(h.calls).toHaveLength(1);
    expect(h.calls[0]!.table).toBe("contact_messages");
    expect(h.calls[0]!.row).toEqual({
      name: "Aiman",
      email: "aiman@example.com",
      message: "Halo.",
    });
  });

  it("trims input and lowercases the email before storing", async () => {
    await submitContactMessage({
      name: "  Aiman  ",
      email: "  AIMAN@Example.COM ",
      message: "  Halo.  ",
    });
    expect(h.calls[0]!.row).toEqual({
      name: "Aiman",
      email: "aiman@example.com",
      message: "Halo.",
    });
  });

  it("reports not-configured when Supabase has no credentials", async () => {
    h.supabaseConfigured = false;
    await expect(submitContactMessage(MESSAGE)).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    });
    expect(h.calls).toHaveLength(0);
  });

  it("reports not-configured when the env still holds placeholders", async () => {
    // This is the default in `vitest.config.ts` — the real repo .env may hold
    // live credentials, so the suite must not depend on them.
    vi.stubEnv("VITE_SUPABASE_URL", "https://placeholder.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "placeholder-key");
    await expect(submitContactMessage(MESSAGE)).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    });
    expect(h.calls).toHaveLength(0);
  });

  it("reports error when the insert is rejected", async () => {
    h.insertError = { message: 'relation "contact_messages" does not exist' };
    await expect(submitContactMessage(MESSAGE)).resolves.toEqual({
      ok: false,
      reason: "error",
    });
  });

  it("reports error when the insert throws", async () => {
    h.insertThrows = true;
    await expect(submitContactMessage(MESSAGE)).resolves.toEqual({
      ok: false,
      reason: "error",
    });
  });

  it("rejects invalid input before touching the network", async () => {
    await expect(
      submitContactMessage({ name: "", email: "a@b.co", message: "hi" })
    ).resolves.toMatchObject({ ok: false });
    await expect(
      submitContactMessage({
        name: "Aiman",
        email: "not-an-email",
        message: "hi",
      })
    ).resolves.toMatchObject({ ok: false });
    await expect(
      submitContactMessage({
        name: "Aiman",
        email: "a@b.co",
        message: "x".repeat(4001),
      })
    ).resolves.toMatchObject({ ok: false });
    expect(h.calls).toHaveLength(0);
  });
});

describe("subscribeNewsletter", () => {
  it("stores a lowercased address", async () => {
    await expect(
      subscribeNewsletter("  Sinyal@Example.COM ")
    ).resolves.toEqual({ ok: true });
    expect(h.calls[0]!.table).toBe("newsletter_subscribers");
    expect(h.calls[0]!.row).toEqual({ email: "sinyal@example.com" });
  });

  it("reports not-configured without writing", async () => {
    h.supabaseConfigured = false;
    await expect(subscribeNewsletter("a@b.co")).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    });
    expect(h.calls).toHaveLength(0);
  });

  it("reports error on a rejected insert (e.g. duplicate email)", async () => {
    h.insertError = { message: "duplicate key value violates unique constraint" };
    await expect(subscribeNewsletter("a@b.co")).resolves.toEqual({
      ok: false,
      reason: "error",
    });
  });
});
