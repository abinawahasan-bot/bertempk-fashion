import { describe, it, expect } from "vitest";
import { formatIDR, normalizeIDR, toRupiah } from "./money";

/** ICU emits U+00A0 after "Rp" — normalise before comparing strings. */
const idr = (n: number) => normalizeIDR(formatIDR(n));

describe("toRupiah", () => {
  it("keeps whole rupiah", () => {
    expect(toRupiah(989_000)).toBe(989_000);
  });

  it("rounds to the nearest whole rupiah", () => {
    expect(toRupiah(1_234.4)).toBe(1_234);
    expect(toRupiah(1_234.5)).toBe(1_235);
  });

  it("clamps negatives to zero", () => {
    expect(toRupiah(-500)).toBe(0);
  });

  it("collapses a non-finite amount to zero, never NaN", () => {
    expect(toRupiah(Number.NaN)).toBe(0);
    expect(toRupiah(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toRupiah(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(Number.isFinite(toRupiah(Number.NaN))).toBe(true);
  });
});

describe("formatIDR", () => {
  it("formats rupiah with Indonesian grouping and no decimals", () => {
    expect(idr(1_290_000)).toBe("Rp 1.290.000");
  });

  it("formats zero", () => {
    expect(idr(0)).toBe("Rp 0");
  });

  it("rounds before formatting", () => {
    expect(idr(1_234.56)).toBe("Rp 1.235");
  });

  it("clamps a negative amount to zero", () => {
    expect(idr(-9_999)).toBe("Rp 0");
  });

  it("never emits a fractional part", () => {
    expect(idr(25_000)).toBe("Rp 25.000");
    expect(formatIDR(750_000)).not.toMatch(/[.,]\d{2}$/);
  });

  it("never renders NaN or Infinity as a price", () => {
    expect(idr(Number.NaN)).toBe("Rp 0");
    expect(idr(Number.POSITIVE_INFINITY)).toBe("Rp 0");
    expect(formatIDR(Number.NaN)).not.toMatch(/NaN|Infinity/);
  });
});