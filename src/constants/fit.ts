import type { Gender, Product } from "../types";

/**
 * Fitting room — garment metadata.
 *
 * Modelled on the reference clip "fiturku.mp4": a left-hand "Fitting room"
 * panel where you tap the hanger on any product to wear it, and each new
 * piece layers on top of the last one.
 *
 * A piece is described by WHERE it sits on the body (`slot`, which also drives
 * the paint order) and WHICH silhouette to draw (`shape`). Tones stay inside
 * the BERTEMPK greyscale so the dressed model reads as one editorial shot.
 */

export type FitSlot = "bottom" | "top" | "outer" | "accessory";

export type FitShape =
  | "trousers"
  | "tee"
  | "crop"
  | "hoodie"
  | "jacket"
  | "vest";

export interface FitSpec {
  slot: FitSlot;
  shape: FitShape;
  /** Primary fill of the garment layer. */
  tone: string;
  /** Edge / seam colour, slightly darker than `tone`. */
  shade: string;
  /** Short material note shown in the pick list. */
  note: string;
}

/** Bottom-most layer first — later slots are painted on top. */
export const SLOT_ORDER: FitSlot[] = ["bottom", "top", "outer", "accessory"];

export const SLOT_LABEL: Record<FitSlot, string> = {
  bottom: "Base",
  top: "Top",
  outer: "Outer",
  accessory: "Extra",
};

const BY_CATEGORY: Record<string, FitSpec> = {
  Outerwear: {
    slot: "outer",
    shape: "jacket",
    tone: "#3a3a3a",
    shade: "#1b1b1b",
    note: "Boxy outer layer",
  },
  Hoodie: {
    slot: "top",
    shape: "hoodie",
    tone: "#2e2e2e",
    shade: "#161616",
    note: "Heavyweight fleece",
  },
  Trousers: {
    slot: "bottom",
    shape: "trousers",
    tone: "#262626",
    shade: "#121212",
    note: "Wide leg, full break",
  },
  "New Crop": {
    slot: "top",
    shape: "crop",
    tone: "#6c6c6c",
    shade: "#3a3a3a",
    note: "Cropped, raw hem",
  },
  Vest: {
    slot: "outer",
    shape: "vest",
    tone: "#444444",
    shade: "#202020",
    note: "Sleeveless, multi-pocket",
  },
};

/** Per-piece overrides — keeps the silhouette honest when a name disagrees. */
const BY_ID: Record<string, Partial<FitSpec>> = {
  p4: { shape: "vest", note: "Multi-pocket, sleeveless" },
};

export interface FitColor {
  name: string;
  tone: string;
  shade: string;
}

/** Alternates offered inside the fitting room. Sampled from the reference
 *  clip's swatch row (cool greys + one warm taupe), kept well clear of the
 *  per-category tones above so every swatch actually reads as a change. */
const NEUTRALS: FitColor[] = [
  { name: "Jet", tone: "#0f0f0f", shade: "#000000" },
  { name: "Slate", tone: "#5a5a5a", shade: "#2e2e2e" },
  { name: "Bone", tone: "#c9c9c4", shade: "#8f8f89" },
  { name: "Clay", tone: "#b28973", shade: "#6f5343" },
];

/** Sizes offered in the fitting room — mirrors `ProductDetail`. */
export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type FitSize = (typeof SIZES)[number];

/**
 * Garment measurements in cm used by the size-guide dialog. Streetwear blocks:
 * relaxed, heavy, dropped shoulder. Measure a piece you already like and take
 * the row that matches — everything here is a flat-lay measurement.
 */
export interface SizeChartRow {
  /** Measurement name, shown in the first column. */
  label: string;
  /** Centimetres per size, in `SIZES` order. */
  cm: Record<FitSize, number>;
}

export interface SizeChartGarment {
  id: string;
  /** Which pieces this block applies to. */
  appliesTo: string;
  /** Short note under the block title. */
  note: string;
  rows: SizeChartRow[];
}

export const SIZE_CHART: SizeChartGarment[] = [
  {
    id: "tops",
    appliesTo: "Hoodie & kaus",
    note: "Diukur datar dengan selisih toleransi ±2 cm.",
    rows: [
      { label: "Lebar dada", cm: { XS: 52, S: 55, M: 58, L: 61, XL: 64 } },
      {
        label: "Panjang badan",
        cm: { XS: 64, S: 66, M: 68, L: 70, XL: 72 },
      },
      { label: "Lebar bahu", cm: { XS: 46, S: 48, M: 50, L: 52, XL: 54 } },
      {
        label: "Panjang lengan",
        cm: { XS: 58, S: 59, M: 60, L: 61, XL: 62 },
      },
    ],
  },
  {
    id: "crop",
    appliesTo: "New Crop",
    note: "Potong pendek di pinggang — panjang diukur dari bahu ke hem bawah.",
    rows: [
      { label: "Lebar dada", cm: { XS: 44, S: 47, M: 50, L: 53, XL: 56 } },
      { label: "Panjang badan", cm: { XS: 42, S: 44, M: 46, L: 48, XL: 50 } },
      { label: "Lebar bahu", cm: { XS: 38, S: 40, M: 42, L: 44, XL: 46 } },
    ],
  },
  {
    id: "outerwear",
    appliesTo: "Outerwear & vest",
    note: "Potongan boxy, sengaja oversized. Kalau di M masih longgar, ambil XS.",
    rows: [
      { label: "Lebar dada", cm: { XS: 50, S: 53, M: 56, L: 59, XL: 62 } },
      { label: "Panjang badan", cm: { XS: 66, S: 68, M: 70, L: 72, XL: 74 } },
      { label: "Lebar bahu", cm: { XS: 45, S: 47, M: 49, L: 51, XL: 53 } },
      {
        label: "Panjang lengan",
        cm: { XS: 59, S: 60, M: 61, L: 62, XL: 63 },
      },
    ],
  },
  {
    id: "bottoms",
    appliesTo: "Celana panjang",
    note: "Pengukuran dalam dihitung dari pinggang sampai panjang dalam kaki.",
    rows: [
      { label: "Lingkar pinggang", cm: { XS: 30, S: 33, M: 36, L: 39, XL: 42 } },
      { label: "Lingkar pinggul", cm: { XS: 44, S: 47, M: 50, L: 53, XL: 56 } },
      { label: "Panjang luar", cm: { XS: 98, S: 100, M: 102, L: 104, XL: 106 } },
      { label: "Panjang dalam", cm: { XS: 70, S: 72, M: 74, L: 76, XL: 78 } },
      { label: "Lebar kaki", cm: { XS: 20, S: 21, M: 22, L: 23, XL: 24 } },
    ],
  },
];

/**
 * Colourways offered for a piece: the piece's own tone first ("As shown"),
 * followed by the neutral alternates. Mirrors the reference clip's row of
 * small squares under the picks list.
 */
export function colorsFor(
  product: Pick<Product, "id" | "category">
): FitColor[] {
  const fit = fitFor(product);
  return [{ name: "As shown", tone: fit.tone, shade: fit.shade }, ...NEUTRALS];
}

/** `fitFor` with the chosen colourway applied. */
export function resolveFit(
  product: Pick<Product, "id" | "category">,
  colorIndex = 0
): FitSpec {
  const base = fitFor(product);
  const colors = colorsFor(product);
  const chosen =
    colors[colorIndex] ?? colors[0] ?? { name: "As shown", tone: base.tone, shade: base.shade };
  return { ...base, tone: chosen.tone, shade: chosen.shade };
}

const DEFAULT_FIT: FitSpec = {
  slot: "top",
  shape: "tee",
  tone: "#4a4a4a",
  shade: "#232323",
  note: "Standard fit",
};

export function fitFor(product: Pick<Product, "id" | "category">): FitSpec {
  const base = BY_CATEGORY[product.category] ?? DEFAULT_FIT;
  const override = BY_ID[product.id];
  return override ? { ...base, ...override } : base;
}

/** Returns the picks re-ordered so base layers are painted first. */
export function layerOrder<T extends Pick<Product, "id" | "category">>(
  picks: T[]
): T[] {
  return [...picks].sort(
    (a, b) =>
      SLOT_ORDER.indexOf(fitFor(a).slot) - SLOT_ORDER.indexOf(fitFor(b).slot)
  );
}

/** Accessible label shared by the 2D and 3D mannequins. */
export function wornLabel(
  picks: Pick<Product, "name">[],
  gender: Gender = "male"
): string {
  const who = gender === "female" ? "female model" : "male model";
  return picks.length
    ? `${who} wearing ${picks.map((p) => p.name).join(", ")}`
    : `Fitting room ${who}`;
}
