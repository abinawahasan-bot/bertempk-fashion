# TASK-005 · PDP gallery image mismatch fix (p2 / p4 / p5)

> Task record. Confidence markers apply (CONFIRMED / INFERRED / UNKNOWN).
> Session: 2026-10-14 (session 5, follow-up). Related: TASK-004 (gallery component).

## Goal

The stacked gallery component (TASK-004) worked, but the **image data** behind
three products was wrong: as the user swiped, views did not match the garment
on the card/hero. User report: *"masih melihat ada foto atau gambar yang ketika
saya geser tidak sesuai dengan foto atau model yang terpampang."*

Root cause: the `images[]` arrays in `src/constants/products.ts` had been filled
with **guessed sequential Pexels IDs** (hero id + 1, +2, +3). Sequential IDs are
not guaranteed to be the same shoot — or even the same subject.

## Findings (evidence)

Downloaded each candidate at `?w=1600&h=2000` and checked HTTP status + md5 +
content (vision model, port 1235):

- **p2** `28701960–63`: view 3,4 = **beige hoodie** while view 1,2 + hero = **black hoodie** → swipe showed a different hoodie. — CONFIRMED (vision)
- **p4** `8863913–16`: view 2,3 = **abstract paintings (not clothing)**, view 4 = **white dress** → wrong garment. — CONFIRMED (vision)
- **p5** `12061090–93`: view 2 `12061091` = **"Nature Sky Tree"** (not clothing); view 3,4 `12061092/93` = **HTTP 404** (`"Source is unreachable"`, 21 B, identical). — CONFIRMED (curl + page title)
- All other gallery IDs (p1, p3, p6, remainder of p2/p4) returned HTTP 200 with
  distinct sizes → they existed; only the above were broken.

## Method (how the correct images were found)

Pexels `curl` is blocked by Cloudflare, so Playwright was used:
1. Open the product's **hero** photo page `https://www.pexels.com/photo/<id>/`.
2. Read the page title (the shoot description) and extract the **"More like
   this"** anchors (`a[href*="/photo/"]` → id + `img[alt]`).
3. A same-shoot cluster shows near-identical alt text with a small run of IDs.

Clusters chosen (all verified **HTTP 200, valid JPEG, distinct md5**):

| Product | New `image` (hero) | New `images[]` | Shoot evidence |
|---|---|---|---|
| p2 Static Hoodie | 28701960 (kept) | 28701960, 28701951, 28701965, 28701952 | "black hoodie / gray background" run |
| p4 Multi-pocket Vest | **14437343** (was 8863913) | 14437343, 14437345, 14437346, 14437348 | "man, black vest + white pants, city street" run 14437342–351 |
| p5 Signal Crop | **5443935** (was 12061090) | 5443935, 5443934, 5443936, 5443932 | "woman in black crop top" studio run 5443932–936 |

Vision-model confirmation of each 4-photo montage (same person + same outfit in
all four): p2 = black hoodie + jeans; p4 = vest + white pants; p5 = black top +
jeans. — CONFIRMED.

## Changes

- `src/constants/products.ts` — replaced `image` + `images[]` for **p2, p4, p5**
  only. p1/p3/p6 untouched. (p4/p5 `image` hero also changed so the shop-card
  thumbnail and the gallery belong to the same shoot.)

## Validation

- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npx vite build` exit 0.
- Served module (dev :5200) contains all 12 new IDs; **zero** references to the
  retired IDs (`28701961/2/3`, `8863914/5/6`, `12061091/2/3`).
- Browser (Playwright) on `/product/p2|p4|p5`: each view advanced through all 4
  images in order, every image `naturalWidth = 1600` (loaded), correct IDs, **0
  console errors**.
- `/shop` grid: all 6 thumbnails load (p1 29900469 · p2 28701960 · p3 36611867 ·
  p4 14437343 · p5 5443935 · p6 17908419).

## Notes / method corrections

- **Retired method:** `curl images.pexels.com/photos/<id>/...` → use the exact
  `.../pexels-photo-<id>.jpeg` path; a 21-byte `"Source is unreachable"` = 404.
- **Unreliable signal:** Pexels **search-result alt text** is generic and was
  misleading (e.g. an id whose alt said "black crop top" was actually a pregnant
  woman). Trust the **photo page title** + the hero's "More like this", not the
  search thumbnail alt.
- Vision model is a 3B CPU model (port 1235): reliable enough to compare
  *within a montage* (same/not-same outfit) but may misname colors (it called
  p4's dark vest "green"). Used only for consistency, not color naming.

## Result

DONE / VERIFIED (2026-10-14). Pending: user visual sign-off that the galleries
now look consistent when swiped.

## Lessons

- Never populate `images[]` with sequential IDs; source each product's gallery
  from a single verified shoot (hero page → "More like this").
- Verify image URLs **and** content — existence alone does not mean it is the
  right garment.
