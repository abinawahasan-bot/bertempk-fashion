import type { Order, PaymentMethod } from "../types";
import { hasValue } from "./env";

export interface PaymentResult {
  ok: boolean;
  message: string;
}

export interface PaymentProvider {
  id: PaymentMethod;
  label: string;
  blurb: string;
  available: boolean;
  pay: (order: Order) => Promise<PaymentResult>;
}

/**
 * Manual bank transfer details — env-driven, with no fallback.
 */
export const MANUAL_TRANSFER = {
  bank: String(import.meta.env.VITE_PAYMENT_BANK_NAME ?? "").trim(),
  accountNumber: String(
    import.meta.env.VITE_PAYMENT_ACCOUNT_NUMBER ?? ""
  ).trim(),
  accountName: String(import.meta.env.VITE_PAYMENT_ACCOUNT_NAME ?? "").trim(),
};

export const manualTransferAvailable =
  hasValue(MANUAL_TRANSFER.bank) &&
  hasValue(MANUAL_TRANSFER.accountNumber) &&
  hasValue(MANUAL_TRANSFER.accountName);

const midtransProvider: PaymentProvider = {
  id: "midtrans",
  label: "QRIS · E-wallet · VA · Card",
  blurb: "Pay securely via Midtrans.",
  available: hasValue(import.meta.env.VITE_PAYMENT_ENDPOINT),
  pay: async (order) => {
    const endpoint = import.meta.env.VITE_PAYMENT_ENDPOINT;
    if (!endpoint) {
      return { ok: false, message: "Payment endpoint is not configured." };
    }
    const isSupabaseFn = /\/functions\/v1\//.test(endpoint);
    try {
      let data: { redirect_url?: string; token?: string; error?: string } = {};
      if (isSupabaseFn) {
        const { getSupabase } = await import("./supabase");
        const supabase = await getSupabase();
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          "create-payment",
          { body: { order_id: order.order_number } }
        );
        if (fnError) {
          return { ok: false, message: fnError.message ?? "Payment failed." };
        }
        data = (fnData ?? {}) as typeof data;
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: order.order_number }),
        });
        if (!response.ok) {
          return {
            ok: false,
            message: `Payment server returned ${response.status}.`,
          };
        }
        data = (await response.json().catch(() => ({}))) as typeof data;
      }
      if (data.error) {
        return { ok: false, message: `Payment not available: ${data.error}.` };
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return { ok: true, message: "Redirecting to payment…" };
      }
      return {
        ok: false,
        message: "Payment server did not return a redirect URL.",
      };
    } catch {
      return { ok: false, message: "Could not reach the payment server." };
    }
  },
};

const manualTransferProvider: PaymentProvider = {
  id: "manual_transfer",
  label: "Manual bank transfer",
  blurb: "Transfer, then send the proof. We ship after verification.",
  available: manualTransferAvailable,
  pay: async () =>
    manualTransferAvailable
      ? {
          ok: true,
          message: "Order placed. Transfer the total, then send the proof.",
        }
      : {
          ok: false,
          message:
            "Manual transfer is not configured — no bank account is published.",
        },
};

export function providers(): PaymentProvider[] {
  return [midtransProvider, manualTransferProvider];
}

export function availableProviders(): PaymentProvider[] {
  return providers().filter((p) => p.available);
}

export function providerFor(id: PaymentMethod): PaymentProvider {
  return providers().find((p) => p.id === id) ?? manualTransferProvider;
}