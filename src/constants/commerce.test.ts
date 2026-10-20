import { describe, it, expect } from "vitest";
import {
  FREE_SHIPPING_LABEL,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_METHODS,
  freeShippingHint,
  shippingCostFor,
} from "./commerce";
import { normalizeIDR } from "../lib/money";

describe("SHIPPING_METHODS", () => {
  it("exposes reguler (free-eligible) and ekspres (never free)", () => {
    const reguler = SHIPPING_METHODS.find((m) => m.id === "standard");
    const ekspres = SHIPPING_METHODS.find((m) => m.id === "express");
    expect(reguler?.freeEligible).toBe(true);
    expect(ekspres?.freeEligible).toBe(false);
  });
});

describe("shippingCostFor", () => {
  it("charges the flat rate below the free-shipping threshold", () => {
    expect(shippingCostFor(500_000, "standard")).toBe(25_000);
    expect(shippingCostFor(500_000, "express")).toBe(45_000);
  });

  it("is free for reguler exactly at the threshold", () => {
    expect(shippingCostFor(FREE_SHIPPING_THRESHOLD, "standard")).toBe(0);
    expect(shippingCostFor(FREE_SHIPPING_THRESHOLD - 1, "standard")).toBe(25_000);
  });

  it("never makes ekspres free", () => {
    expect(shippingCostFor(FREE_SHIPPING_THRESHOLD + 10_000_000, "express")).toBe(
      45_000
    );
  });

  it("costs nothing for an unknown method", () => {
    expect(shippingCostFor(900_000, "drone")).toBe(0);
  });
});

describe("freeShippingHint", () => {
  it("reports what is still missing", () => {
    expect(freeShippingHint(500_000)).toEqual({
      qualified: false,
      remaining: 1_000_000,
    });
  });

  it("reports qualified at and above the threshold", () => {
    expect(freeShippingHint(FREE_SHIPPING_THRESHOLD)).toEqual({
      qualified: true,
      remaining: 0,
    });
    expect(freeShippingHint(9_000_000).remaining).toBe(0);
  });

  it("never returns a negative remainder", () => {
    expect(freeShippingHint(2_000_000).remaining).toBe(0);
  });
});

describe("FREE_SHIPPING_LABEL", () => {
  it("quotes the threshold in whole rupiah", () => {
    expect(normalizeIDR(FREE_SHIPPING_LABEL)).toBe(
      "Gratis ongkir di atas Rp 1.500.000"
    );
  });
});