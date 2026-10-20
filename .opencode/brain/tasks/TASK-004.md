# TASK-004 · PDP stacked image gallery

> Task record. Confidence markers apply (CONFIRMED / INFERRED / UNKNOWN).
> Session: 2026-10-14 (session 5).

## Goal

Add a stacked image gallery to the product detail page (PDP), replicating the
interaction pattern from the study-only reference `/home/corvusjet/fitur baru.mp4`
(a Figma Smart-Animate tutorial): clicking advances to the next image, which
**grows into focus** while the leaving image recedes and blurs. Replicate the
pattern; never ship the reference assets (D-004).

### Added
- **`src/components/ProductImageStack.tsx`** — gallery using `motion` +
  CSS `filter: blur()` + `AnimatePresence`.
  - Incoming: `x "26%" → 0`, `scale 1.28 → 1`, `blur(6px) → 0`, opacity 0 → 1.
  - Leaving: `x:"-14%"`, `scale 0.88`, `blur(12px)`, opacity 0.4, under `mode="popLayout"`.
  - Ease `[0.67, −0.03, 0.27, 1.01]`, duration 1.2 s.
  - Interaction: click advances (wrap); dots select directly.
  - `reducedMotion` → opacity-only, 0.25 s ease-out.
- `Product.images?: string[]` in `src/types/index.ts` (backward-compatible).

### Changed
- `src/constants/products.ts` — 4-image `images` array per product (p1–p6).
- `src/pages/ProductDetail.tsx` — single hero `<img>` → `<ProductImageStack images={product.images ?? [product.image]} />`.

## Validation

- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` exit 0.
- Browser (Playwright vs dev server :5200): `img "Product view 1"` renders;
  click → `img "Product view 2"`; **0 console errors**.
- Reduced-motion branch preserved (opacity-only).

## Notes / method corrections

- **Retired method:** `curl <spa-route> | grep` is invalid (client-rendered).
  Verify SPAs in a browser/DOM. See EVENT-003.

## Result

DONE / VERIFIED (code + gates). Pending: user visual sign-off of the motion.
