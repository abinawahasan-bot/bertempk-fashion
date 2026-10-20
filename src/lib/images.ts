/**
 * Pexels image helpers.
 *
 * Every catalogue image is hotlinked from images.pexels.com with
 * `?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop`, so one product shot costs
 * ~173 kB no matter how small the box it lands in — about 1.73 MB of images for
 * the four cards on Home. The CDN also serves a resize ladder (measured on the
 * catalogue photo 29900469: `w=320` 13 kB, `w=640` 36 kB, `w=960` 69 kB,
 * `w=1600` 173 kB) and honours `srcset`/`sizes`, so each component asks for the
 * width it actually paints and keeps the 1600 px master reachable as the `src`
 * fallback for browsers that ignore `srcset`.
 *
 * Anything that is not a Pexels URL (local posters, a future self-hosted asset)
 * is returned untouched — this helper must never rewrite an unknown asset.
 */

const PEXELS_HOST = "images.pexels.com";

/** True for a Pexels photo URL we know how to re-parameterise. */
export function isPexelsImage(src: string): boolean {
  try {
    return new URL(src).hostname === PEXELS_HOST;
  } catch {
    return false;
  }
}

/**
 * Widths offered in a `srcset`, ascending. The middle of the ladder is the
 * 1x/2x answer for every image box in this storefront, so no component needs a
 * ladder of its own.
 */
export const IMAGE_LADDER = [320, 480, 640, 960, 1280, 1600] as const;

/** `IMAGE_LADDER` capped at `max` — keeps small boxes from advertising 1600 px. */
export function ladderUpTo(max: number): number[] {
  return IMAGE_LADDER.filter((w) => w <= max);
}

/**
 * A Pexels URL at exactly `width` (and `height`, when given).
 *
 * Existing query params are preserved, `w`/`h`/`fit` are overridden, and
 * `auto=compress&cs=tinysrgb` is always kept so the CDN stays on the same
 * encoder. Omitting `height` keeps the source aspect ratio — right for the hero
 * backdrop, which is cropped by CSS (`object-cover`) rather than by the CDN.
 */
export function imageUrl(src: string, width: number, height?: number): string {
  if (!isPexelsImage(src)) return src;

  const [base, query = ""] = splitQuery(src);
  const params = new URLSearchParams(query);
  params.set("auto", "compress");
  params.set("cs", "tinysrgb");
  params.set("w", String(width));

  if (height === undefined) {
    // A width-only resize must not inherit a stale crop from the master URL.
    params.delete("h");
    params.delete("fit");
  } else {
    params.set("h", String(height));
    params.set("fit", "crop");
  }

  return `${base}?${params.toString()}`;
}

/**
 * A full `srcset` for a Pexels URL.
 *
 * `ratio` is height ÷ width. Pass it when the box has a fixed aspect (the
 * catalogue is 4:5, the story plate 7:9) so every candidate is cropped to the
 * shape it will be painted into; omit it for a width-only resize.
 */
export function imageSrcSet(
  src: string,
  widths: readonly number[],
  ratio?: number,
): string {
  if (!isPexelsImage(src) || widths.length === 0) return "";
  return widths
    .map((w) => `${imageUrl(src, w, heightFor(w, ratio))} ${w}w`)
    .join(", ");
}

/** Catalogue photography is cropped 1600×2000, and every card/gallery box is 4:5. */
export const PRODUCT_RATIO = 2000 / 1600;

/**
 * The story plate's box is `aspect-[3/4]`. Asking the CDN for 4:3 crops once,
 * in the shape the element will paint into; the master is 1400×1800 (7:9) and
 * `object-cover` would shave the same few percent anyway.
 */
export const STORY_RATIO = 4 / 3;

function heightFor(width: number, ratio?: number): number | undefined {
  return ratio === undefined ? undefined : Math.round(width * ratio);
}

/** Split once on `?` — a URL, not a free-form string. */
function splitQuery(src: string): [string, string?] {
  const at = src.indexOf("?");
  return at === -1 ? [src] : [src.slice(0, at), src.slice(at + 1)];
}