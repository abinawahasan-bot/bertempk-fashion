/**
 * Money layer — Indonesian rupiah, whole numbers, no cents.
 *
 * IDR has no minor unit in practice: every amount is a whole number of rupiah,
 * so nothing here ever produces decimals or a `.toFixed(2)` tail.
 *
 * NOTE: the ICU output contains U+00A0 (non-breaking space) after "Rp" — e.g.
 * `"Rp\u00a01.290.000"`. Anything that compares these strings must normalise
 * whitespace first (see `normalizeIDR`).
 */

const NF = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Clamp to a non-negative whole rupiah amount.
 *
 * Anything that is not a finite number (`NaN`, `Infinity`, `-Infinity`, a
 * string) collapses to 0 — the same answer a zero amount gives. Never returns
 * `NaN`, so a poisoned total can never reach `formatIDR` as "Rp NaN".
 */
export const toRupiah = (n: number): number =>
  Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;

/** `1290000` → `"Rp 1.290.000"` (nbsp-normalised via `normalizeIDR` when compared). */
export const formatIDR = (n: number): string => NF.format(toRupiah(n));

/** Replaces the ICU non-breaking space with a plain space for comparisons. */
export const normalizeIDR = (s: string): string =>
  s.replace(/[\u00a0\u202f]/g, " ");