import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/**
 * The manual-transfer provider must be driven purely by env. Each case
 * re-imports the module so the top-level `MANUAL_TRANSFER` object is rebuilt
 * against the stubbed values.
 */
async function loadPayments() {
  vi.resetModules();
  return await import("./payments");
}

const UNSET = {
  VITE_PAYMENT_BANK_NAME: "",
  VITE_PAYMENT_ACCOUNT_NUMBER: "",
  VITE_PAYMENT_ACCOUNT_NAME: "",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("payments — manual transfer", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PAYMENT_ENDPOINT", "");
  });

  it("is unavailable and publishes nothing when the env is unset", async () => {
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", UNSET.VITE_PAYMENT_BANK_NAME);
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", UNSET.VITE_PAYMENT_ACCOUNT_NUMBER);
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", UNSET.VITE_PAYMENT_ACCOUNT_NAME);

    const payments = await loadPayments();

    expect(payments.manualTransferAvailable).toBe(false);
    expect(payments.MANUAL_TRANSFER).toEqual({
      bank: "",
      accountNumber: "",
      accountName: "",
    });
    // No bank name, no digits — nothing that could look payable.
    expect(JSON.stringify(payments.MANUAL_TRANSFER)).not.toMatch(/\d/);
    expect(payments.availableProviders()).toEqual([]);
  });

  it("stays unavailable on a partial config", async () => {
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", "Bank Uji");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", "");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", "BERTEMPK Uji");

    const payments = await loadPayments();

    expect(payments.manualTransferAvailable).toBe(false);
    expect(payments.availableProviders()).toEqual([]);
  });

  it("rejects copy-pasted placeholder values", async () => {
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", "your-bank-name");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", "changeme");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", "Your Legal Name");

    const payments = await loadPayments();

    expect(payments.manualTransferAvailable).toBe(false);
    expect(payments.availableProviders()).toEqual([]);
  });

  it("is available when bank, number and name are all real values", async () => {
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", "Bank Uji");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", "0000-0000-0000");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", "BERTEMPK Uji");

    const payments = await loadPayments();

    expect(payments.manualTransferAvailable).toBe(true);
    expect(payments.MANUAL_TRANSFER.accountNumber).toBe("0000-0000-0000");
    expect(payments.availableProviders().map((p) => p.id)).toEqual([
      "manual_transfer",
    ]);
  });

  it("trims surrounding whitespace out of the account fields", async () => {
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", "  Bank Uji  ");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", "  0000-0000-0000 ");
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", " BERTEMPK Uji  ");

    const payments = await loadPayments();

    expect(payments.MANUAL_TRANSFER).toEqual({
      bank: "Bank Uji",
      accountNumber: "0000-0000-0000",
      accountName: "BERTEMPK Uji",
    });
  });
});

describe("payments — provider registry", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PAYMENT_ENDPOINT", "");
  });

  it("keeps Midtrans registered but inactive when the endpoint is unset", async () => {
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", UNSET.VITE_PAYMENT_BANK_NAME);
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", UNSET.VITE_PAYMENT_ACCOUNT_NUMBER);
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", UNSET.VITE_PAYMENT_ACCOUNT_NAME);

    const payments = await loadPayments();

    expect(payments.providers().map((p) => p.id)).toEqual([
      "midtrans",
      "manual_transfer",
    ]);
    expect(
      payments.providers().find((p) => p.id === "midtrans")?.available
    ).toBe(false);
  });

  it("activates Midtrans when VITE_PAYMENT_ENDPOINT is set", async () => {
    vi.stubEnv("VITE_PAYMENT_ENDPOINT", "https://stub.supabase.co/functions/v1/create-payment");
    vi.stubEnv("VITE_PAYMENT_BANK_NAME", UNSET.VITE_PAYMENT_BANK_NAME);
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NUMBER", UNSET.VITE_PAYMENT_ACCOUNT_NUMBER);
    vi.stubEnv("VITE_PAYMENT_ACCOUNT_NAME", UNSET.VITE_PAYMENT_ACCOUNT_NAME);

    const payments = await loadPayments();

    expect(
      payments.providers().find((p) => p.id === "midtrans")?.available
    ).toBe(true);
  });

  it("resolves both known method ids through providerFor", async () => {
    const payments = await loadPayments();
    expect(payments.providerFor("midtrans").id).toBe("midtrans");
    expect(payments.providerFor("manual_transfer").id).toBe("manual_transfer");
  });
});
