# DECISIONS

> Project Brain file · Significant architectural/design decisions ONLY. ADR-style.
> Confidence: CONFIRMED (decided/documented in code), INFERRED, UNKNOWN.

## Decision index

| Date | Decision summary | Ref | Status |
|------|------------------|-----|--------|
| 2026-10-13 | Hero garment is a DERIVED local video (red colour-toned), not raw reference photos or 3D by default | D-001 | Decided |
| 2026-10-13 | VideoGarment stacking rule: never add z-index/opacity to the media layer | D-002 | Decided |
| 2026-10-13 | Fitting-room model: slot layering + per-piece colourways + size row + most-recent-pick target | D-003 | Decided |
| 2026-10-13 | Reference material is STUDY-ONLY and must never enter the site | D-004 | Decided |
| 2026-10-13 | Tailwind v4 CSS-first tokens via `@theme` (no tailwind.config.js) | D-005 | Decided |
| 2026-10-13 | Custom `HangerIcon` because lucide has no hanger | D-006 | Decided |
| 2026-10-13 | Shared motion variants live in a non-component module (`lib/motion.ts`) | D-007 | Decided |
| 2026-10-13 | Fitting-room mannequin is a procedural 3D stage by default, with the flat SVG as fallback | D-008 | Decided |
| 2026-10-13 | 3D garment geometry & motion rules: per-layer inflation, width-only sizing, resting-pose snap | D-009 | Decided |
| 2026-10-13 | Tier B: rigged GLB body in its authored A-pose, garments refit analytically, gender selector | D-010 | Superseded by D-011 |
| 2026-10-14 | Tier C: realistic rigged avatars (cogan/cecan), garments = bone-driven offset shells of the measured skinned surface | D-011 | Decided |
| 2026-10-14 | Hash navigation handled centrally by `ScrollToHash`; Contact is a Home **section**, not a route | D-012 | Decided |
| 2026-10-17 | Auth via hosted Supabase (not self-hosted) — session recovery + OAuth | D-013 | Decided |
| 2026-10-17 | Outfit Builder as a dedicated `/outfit` route reusing the catalogue + fit constants | D-014 | Decided |
| 2026-10-18 | A cart line is keyed by **variant** (`lineId`), not product id; the same garment in M and L is two lines | D-015 | Decided |
| 2026-10-18 | A legacy cart row keeps `size: null` — **never invent a "M"**; the PDP is where a size is chosen | D-016 | Decided |
| 2026-10-18 | ProductDetail requires an **explicit** size; grid/wishlist quick-add is replaced by a "Pilih ukuran" link to the PDP | D-017 | Decided |
| 2026-10-18 | Money is whole Indonesian rupiah via one module (`lib/money.ts` + `constants/commerce.ts`); free shipping on **Reguler only** at Rp 1.500.000 | D-018 | Decided |
| 2026-10-18 | Dead footer links are **deleted, not stubbed**; social/legal content is env-driven and hidden until configured | D-019 | Decided |
| 2026-10-18 | Manual transfer is gated on three env vars with **no fallback**, and Checkout hard-refuses when zero payment providers are live | D-020 | Decided |
| 2026-10-18 | A write that did not happen is never reported as success (`CreateOrderResult`, `LeadResult`) | D-021 | Decided |

## Decision entries

### D-001 · Hero garment source = derived local video
- **Decision:** The hero shows `VideoGarment` by default (local `hoodie.webm`/`hoodie.mp4`/`hoodie-poster.png`), with the three.js `GarmentTurntable` available behind `GARMENT_MODE`.
- **Context:** The brand reference (`Bajuku.mp4`) shows a moving hoodie; no CC0 standalone hoodie GLB exists.
- **Alternatives:** (a) use the raw reference photos — rejected (must not ship study material); (b) ship the pure 3D turntable — kept as an opt-in mode.
- **Reason:** Real, performant garment on first paint without shipping reference material — CONFIRMED (`Hero.tsx`, `VideoGarment.tsx`).
- **Consequences:** Hero depends on a production-recoloured asset (blue→black, lit→grey) and the stacking rule D-002. Colour-treatment mechanism (tonal curve on luma) is **INFERRED** — not reproducible from repo code.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED (decision), INFERRED (asset-production mechanism).

### D-002 · VideoGarment stacking rule
- **Decision:** Do **not** add `z-index` or `opacity` to the `VideoGarment` media layer. Use `position: relative` (z-index auto) and let the hero `<section>`'s `isolate` provide the blend group.
- **Context:** Debugging showed the garment rendered as a black box when the media layer created a nested stacking context.
- **Reason:** The webm carries a real alpha channel and must composite normally, over the halo, in the hero's blend group — CONFIRMED (`VideoGarment.tsx` doc comment; `Hero.tsx` `isolate`).
- **Consequences:** Any change adding z-index/opacity regresses the hero. Runtime alpha probe enables a `mix-blend-screen` fallback only when the source lacks usable alpha.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-003 · Fitting-room model
- **Decision:** Pieces are described by `slot` (bottom/top/outer/accessory) + `shape`; painting order follows `SLOT_ORDER`. Colourways per piece are `["As shown", ...NEUTRALS]` (Jet/Slate/Bone/Clay). Sizes are `["XS","S","M","L","XL"]` (mirrors ProductDetail). Size/colour rows target the **most recently added pick** (`picks[picks.length-1]`). "Start over" clears picks, colours, sizes.
- **Context:** Reference clip `fiturku.mp4` — a left "fitting room" panel where tapping a hanger wears a piece and each new piece layers on top.
- **Alternatives:** per-product colour state on ProductDetail — rejected (colour lives only in the fitting room).
- **Reason:** Single greyscale editorial shot; deterministic layering — CONFIRMED (`constants/fit.ts`, `store/fitting.ts`, `FittingRoom.tsx`, `Mannequin.tsx`).
- **Consequences:** Adding categories requires a `BY_CATEGORY` entry; `p4` has a `BY_ID` shape override (vest). Fitting state persists under `localStorage` key `bato-fitting`.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-004 · Reference material is study-only
- **Decision:** `/home/corvusjet/Bajuku.mp4`, `bajuku 1.webp` (1024×1087), `bajuku 2.webp` (640×993, alpha), and `fiturku.mp4` (736×414, 30 fps, 209 frames, ≈6.97 s) are STUDY-ONLY and MUST NEVER be placed into the site.
- **Reason:** Brand/motion reference, not licensed shippable assets — CONFIRMED (explicit constraint; `Hero.tsx` comment).
- **Consequences:** All hero/presentation media must be derived assets (D-001) or externally hosted (Pexels). Enforced in CONVENTIONS "Explicitly forbidden".
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-005 · Tailwind v4 CSS-first tokens
- **Decision:** Use Tailwind v4 via `@tailwindcss/vite`; define palette/fonts in `src/index.css` `@theme`. No `tailwind.config.js`.
- **Reason:** Tailwind v4 default approach; keeps tokens colocated with base styles — CONFIRMED (`index.css`, `vite.config.ts`).
- **Consequences:** Tokens are CSS variables (`--color-ink`, `--font-display`, …); the `.font-display` utility is re-declared in `@layer utilities`.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-006 · Custom HangerIcon
- **Decision:** Ship `HangerIcon.tsx` (3 SVG paths) instead of a lucide icon.
- **Reason:** `lucide-react@1.55.0` has no `Hanger` icon (and dropped brand icons) — CONFIRMED (`HangerIcon.tsx` comment).
- **Consequences:** The fitting-room affordance is a local component; related: inline social icons in `Footer.tsx`.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-007 · Shared motion variants in a non-component module
- **Decision:** Put shared `Variants`/easing (`EASE_OUT`, `staggerContainer`, `staggerItem`) in `src/lib/motion.ts`, not in component files.
- **Reason:** The `react/only-export-components` (fast-refresh) lint rule; non-component modules may export constants — CONFIRMED (`.oxlintrc.json`, `lib/motion.ts` comment).
- **Consequences:** New shared animation constants go in `lib/motion.ts` (or another non-component module), not alongside components.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-008 · 3D fitting-room mannequin with SVG fallback
- **Decision:** The fitting room renders a **procedural React-Three-Fiber mannequin** (`Mannequin3D.tsx`) by default. The previous flat SVG (`MannequinSvg.tsx`) is retained as the fallback when WebGL is unavailable or the 3D module throws. `Mannequin.tsx` is a wrapper (lazy import + `Suspense` + error boundary + `hasWebGL()` gate) and the stage is exposed as `role="img"` with a text label identical to the SVG's.
- **Context:** The user approved replacing the flat illustration with a real 3D figure ("Tier A"). No downloadable mannequin model is licensed/available, and the brand's own reference media is study-only (D-004).
- **Alternatives:** (a) a downloaded body GLB — rejected for now (no licensed asset; user will supply one later); (b) drei `Environment`/HDR — rejected (extra CDN fetch); (c) keep SVG only — rejected (user wants a real 3D figure).
- **Reason:** A believable 3D try-on from zero external assets, degrading safely — CONFIRMED (`Mannequin3D.tsx`, `Mannequin.tsx`, `MannequinSvg.tsx`).
- **Consequences:** The stage depends on WebGL (fallback covered). A `public/model/mannequin.glb` swap hook is kept ready for the promised asset (Tier B, currently blocked). Any new garment must follow the layering rule in D-009 or z-fighting returns (F-005).
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED.

### D-009 · 3D geometry & motion rules (layer inflation, width-only sizing, resting snap)
- **Decision:** Three invariants for the 3D stage: (1) each worn piece is inflated outward by `pad = layer * LAYER_STEP` (**`LAYER_STEP = 0.014`**) using the **worn-array index** as `layer`; (2) size scales **width only** — `sizeScale()` returns `[k, 1, k]`; (3) whenever motion is suspended, the `Pop` animation **snaps** to the resting pose (scale 1, y 0) via an effect, and `useReducedMotion` reads `matchMedia` synchronously so the first commit is already correct.
- **Context:** An independent code review found three blockers: coincident/identical surfaces between layers (z-fighting, C1), uniform `sizeScale` pivoting on the world origin so XL hems sank below the floor and XS collars sank into the torso (H1), and a reduced-motion first frame stranded mid-animation because `useReducedMotion` initialised to `false` (H2). See FAILURES F-005/F-006/F-007.
- **Reason:** Layers must be visibly stacked and never co-planar; a figure must keep its feet on the ground at every size; a frozen frame must show the finished outfit — CONFIRMED (`Mannequin3D.tsx`, `useReducedMotion.ts`).
- **Consequences:** `0.014` world units ≈ 1200× the depth-buffer ULP at this camera distance (verified no speckle). Adding a garment means threading `pad` through its geometry. Sizing must stay width-only. Any new motion needs its own snap path.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED (rules), CONFIRMED (z-fighting/size/frame fixes re-verified by pixel probe — see TASK-002).

### D-010 · Tier B — rigged GLB body in authored A-pose, garments refit analytically, explicit gender selector
- **Decision:** The 3D fitting stage renders the user's **rigged humanoid GLB** (`mannequin-{male,female}.glb`) **verbatim in its authored A-pose** (option a — no re-posing, no IK), repainted monochrome `#c9c5bc`. The procedural garments are **refit analytically** to the broader A-posed body via `constants/body.ts` (`bodyMetrics`/`bodySection`/`torsoShellProfile` + a custom elliptical lathe), not rescaled. A **Model** toggle (`male`/`female`) selects the body; the choice is persisted (`bato-fitting.gender`).
- **Context:** The GLB body is ~1.7× broader than the old stylized-slim procedural body (chest half-width 0.34 m vs torso radius ~0.19 m), so no uniform scale fits the existing clothes. The A-pose (arms ~40° down-out) means sleeves must follow the arm axis. Skinning was verified to be **identity** (bind pose = rest pose), so no re-posing is needed to place the body.
- **Reason:** Fidelity without a rigging/posing pipeline; keep the garments' proven layering (D-009) intact while adapting their cross-sections to a real body. — CONFIRMED.
- **Consequences:** Any future garment must be authored from `body.ts` metrics (per-slice `[y, rx, rz]`), not from fixed radii. The body must stay in its authored pose unless a posing step is added. `HEM_BOTTOM = −0.85` must not rise above the bare feet (y ≈ −0.88). Body is not silhouette-friendly to a luma probe while clothed — validate on the bare body.
- **Date:** 2026-10-13 · **Confidence:** CONFIRMED (body mapping + pixel-probe geometry + persistence verified; see tasks/TASK-003.md).

### D-011 · Tier C — realistic rigged avatars + bone-driven offset-shell garments
- **Decision:** The fitting stage renders the **realistic** rigged avatars `cogan.glb` (male) / `cecan.glb` (female) in their real skin (no monochrome repaint), **auto-fit** from their measured bounding box (`TARGET_HEIGHT = 1.9`, `FLOOR_Y = -0.95`, Y-up). Worn pieces are generated in `src/lib/avatar.ts` as an **offset copy of the measured skinned surface**: `bonePoints()` reads hip/neck/shoulder/wrist/knee/ankle off the rig (with stature-fraction fallbacks), `extractBody()` measures the skinned surface in `<group>` space, and `buildGarment()` offsets each vertex along the **outward** normal by `pad = (CLOTH + layer*CLOTH_STEP) * SIZE_SCALE[size]` (`CLOTH = CLOTH_STEP = 0.011`).
- **Context:** Supersedes Tier B (D-010). The user swapped in the realistic avatars (generator "Virtual Try-On Avatar Enhancement Pipeline 2.0"; 1 skinned mesh, 152 joints), asked for realistic skin, and for the worn pieces to appear on them.
- **Alternatives:** re-embed the author's `garment.glb` — rejected (not the worn pieces / no colour model); keep the analytic `constants/body.ts` shells — rejected (authored for the old stylized body; now orphaned).
- **Reason:** Worn pieces visibly fit any rigged body without a garment library, and realistic skin comes free from the asset — CONFIRMED (`lib/avatar.ts`, `Mannequin3D.tsx`).
- **Consequences:** the avatar GLB is authored **inside-out** (winding + normals inward) → `extractBody()` applies a **signed-volume normal flip**; the width profile is measured from the body **mid-line** (`centerX`), not x=0; empty `halfX` bins are gap-interpolated (low-poly shins). `constants/body.ts` is superseded/orphaned — delete. `three.js` sanitises glTF bone names (drops dots): `spine.005`→`spine005`, `shoulder.L`→`shoulderL`.
- **Date:** 2026-10-14 · **Confidence:** CONFIRMED (browser probe + vision, both genders; see tasks/TASK-006.md).

### D-012 · Hash navigation handled centrally by `ScrollToHash`; Contact is a Home section, not a route
- **Decision:** In-app anchor navigation (`/#story`, `/#contact`) is handled by one mounted component, **`ScrollToHash`** (`Layout.tsx`), which watches `useLocation()` (`pathname`/`hash`/`key`) and scrolls to `document.getElementById(hash)` via `scrollIntoView`, falling back to the top. The **Contact** content is a **section on Home** (`id="contact"`, `Contact.tsx`), reached by anchor — **not** a dedicated `/contact` route.
- **Context:** The Story menu set `/#story` but the page never moved (React Router does not implement hash scrolling; `scrollY` stayed 0 while the section sat ≈2554 px down). Contact had **no content at all** — its menu pointed at the footer newsletter (`#signal`). The user approved "Opsi A": fix the scroll and add a Contact section.
- **Alternatives:** (a) dedicated `/story` + `/contact` routes — rejected (heavier; the brand is a single scrolled Home); (b) per-link `onClick` scroll handlers — rejected (scattered; misses direct hash loads and repeat clicks).
- **Reason:** One central effect covers all anchors — navbar, footer, and fresh direct loads of a `#hash` URL — and re-scrolls on a repeat click of the same hash via `location.key`. — CONFIRMED (`ScrollToHash.tsx`, browser-verified 2026-10-14).
- **Consequences:** Anchored sections must carry `scroll-mt-20` (80 px) so the scroll clears the sticky navbar; new in-page anchors (e.g. footer Help/Social) should use `ScrollToHash`'s target instead of `href="#"`. The Contact details were **placeholders** at the time of this decision (— superseded 2026-10-18: `Contact.tsx` now reads `CONTACT` from `constants/commerce.ts`, which is env-driven — see D-019/D-020; the Berlin-vs-Indonesia origin question is still open, ISSUE-016).
- **Date:** 2026-10-14 · **Confidence:** CONFIRMED (browser: navbar + footer + fresh load + repeat click; 0 console errors; see tasks/TASK-007.md).

## Maintenance

- Add entries whenever a decision affects future work. Update an entry when the decision changes (preserve history).
- No `docs/adr/` directory exists in this repo — decisions are kept here.

### D-013 · Authentication via hosted Supabase
- **Decision:** Use Supabase Auth (hosted BaaS) for authentication — not a self-hosted solution. Session recovery on mount (`useAuthStore.initialize()` → `supabase.auth.getSession()`), OAuth redirect handling (`detectSessionInUrl`), and `onAuthStateChange` for live session updates. Zustand persist store `bato-auth` caches `user`.
- **Context:** The project needs auth for Sign In/Sign Up but has no backend infrastructure. The `.env` already contained a Supabase project (`<SUPABASE_PROJECT_REF>`). The auth store and AuthModal were already built (Oct 2026) but undocumented in brain.
- **Reason:** Zero-infra auth with managed email verification + OAuth providers out of the box; Supabase JS client already in `package.json`. Future DB/storage can reuse the same project.
- **Consequences:** Auth state is client-side; no server-side auth guard (SPA-only). Env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` required. See SECURITY.md.
- **Date:** 2026-10-17 · **Confidence:** CONFIRMED (code inspected; `.env` contains live project).

### D-014 · Outfit Builder as a dedicated route
- **Decision:** The Outfit Builder is a dedicated page at `/outfit`, not a section of Shop or the fitting room. It reuses `constants/products.ts`, `constants/fit.ts` (`SLOT_ORDER`, `SLOT_LABEL`, `SIZES`, `fitFor`), `store/cart.ts` (Shop this look → addItem), and the `Mannequin` component for 3D preview.
- **Context:** The Outfit Builder was already built (Oct 2026) — a slot-based look-composer with gender toggle, size/colour pickers, real-time pricing, share-link, and "Shop this look". It is linked from the Navbar and registered in App.tsx but was undocumented in brain.
- **Reason:** A standalone route gives the builder its own URL/shareability and keeps the fitting room (drawer) interaction separate from the full-screen composer.
- **Consequences:** New route added to the routing table; reuses existing fit/catalogue data so no duplication.
- **Date:** 2026-10-17 · **Confidence:** CONFIRMED (code inspected; browser gates green).
### D-015 · A cart line is keyed by variant (`lineId`), not product id
- **Decision:** Cart identity is `` `${productId}::${size ?? "?"}::${colorway ?? "?"}` `` (`lineIdOf` in `src/types/index.ts`). `CartItem extends Product, ProductVariant` and carries `quantity` + `lineId`; `addItem`/`removeItem`/`updateQuantity` all take a `lineId`. Persistence moves to zustand `persist` **`version: 2`** with a `migrate` that coerces hostile stored rows, merges duplicate `lineId` rows by summing quantity, and normalises non-arrays instead of throwing.
- **Context:** Pre-Wave-0 the cart was keyed on product id, so the same hoodie in two sizes was one row. The migrator also had to handle the fact that two legacy rows for the same product both normalise to `p2::?::?` — without merging, `addItem` would bump only the first, `updateQuantity` would write to both and `subtotal` would double-charge.
- **Alternatives:** (a) nested `items[].variants[]` — rejected (every reader had to change); (b) throw away unknown legacy carts — rejected (destroys a real shopper's bag).
- **Reason:** A line must be able to hold two sizes of one product, and the migration must not throw on storage a user (or a previous build) wrote. — CONFIRMED (`types/index.ts`, `store/cart.ts`, `store/cart.test.ts`)
- **Consequences:** Any component mutating the cart must thread `lineId`. `safeQuantity`/`safeText` are the single sanitising boundary; nothing downstream may trust persisted numbers (`Infinity`/`NaN` are coerced so `subtotal()` cannot be poisoned).
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED

### D-016 · A legacy cart row keeps `size: null` — never invent an "M"
- **Decision:** Rows persisted before Wave 0 have no variant; they migrate to `size: null`, `colorway: null`, `lineId: p2::?::?`. No default size is assigned anywhere.
- **Context:** The obvious shortcut was to fill in the middle size so the bag "looked complete". That silently promises a garment the customer never chose, and the order would ship the wrong size.
- **Alternatives:** (a) default to `"M"` — rejected (fabricates a customer decision); (b) drop the rows — rejected (loses the bag).
- **Reason:** An unknown size is a real state that the UI must handle honestly; the PDP is the only place a size is chosen. — CONFIRMED (`store/cart.ts` `coerceItem`, `CartDrawer.tsx` "Choose size", browser-verified migration of a seeded v1 cart)
- **Consequences:** `size: null` is legal in the bag and **illegal at checkout** — Checkout blocks it and validates against `SIZES`, not merely against non-null, so a hand-edited `"XXXL"` is also refused. Every downstream type models `size: string | null`.
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED

### D-017 · ProductDetail requires an explicit size; grid/wishlist quick-add becomes a PDP link
- **Decision:** `ProductDetail` starts with `size = null` and keeps "Add to bag" disabled until the shopper picks one (with an `aria-describedby` hint). `ProductCard` and the Wishlist row no longer quick-add; they render a **"Pilih ukuran" link to the product page**. `OutfitBuilder` passes a per-slot size, and "Shop this look" refuses the whole look if any piece is unsized.
- **Context:** Quick-add from a grid cannot ask for a size, so it could only either guess one or bypass the requirement. Both were worse than an extra click.
- **Reason:** The size gate is only trustworthy if **every** path into the cart goes through it. — CONFIRMED (`ProductDetail.tsx`, `ProductCard.tsx`, `Wishlist.tsx`, `OutfitBuilder.tsx`, `Checkout.tsx`)
- **Consequences:** Conversion cost rises by one click per add; the bag can still contain legacy `null` rows from before the change (D-016 handles them). Removing quick-add means card CTAs must read as navigation, not as an action.
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED

### D-018 · Money is whole Indonesian rupiah in one module; free shipping on Reguler only
- **Decision:** All money goes through `src/lib/money.ts` (`formatIDR`, `toRupiah`, `normalizeIDR`) and `src/constants/commerce.ts` (`CURRENCY`, `FREE_SHIPPING_THRESHOLD = 1_500_000`, `SHIPPING_METHODS` = Reguler 25.000 / 3–5 hari kerja / `freeEligible: true`, Ekspres 45.000 / 1–2 hari kerja / `freeEligible: false`, plus `shippingCostFor`, `freeShippingHint`, `FREE_SHIPPING_LABEL` and env-driven `CONTACT`). Catalogue prices became whole rupiah. No `.toFixed(2)` and no `$` price remains anywhere in `src/`.
- **Context:** IDR has no minor unit in practice; the previous model carried `numeric(10,2)` columns and a cents-formatted UI, which is both wrong for the market and a source of rounding noise. `normalizeIDR` exists because ICU emits `U+00A0` after "Rp", so any string comparison of formatted money fails without it.
- **Alternatives:** keep cents — rejected (no cents exist in the currency); a separate money lib — rejected (three functions are enough).
- **Reason:** One authority for currency, grouping, shipping and contact details, so no page can invent a price format. — CONFIRMED (`lib/money.ts`, `constants/commerce.ts`, `constants/products.ts`, `constants/commerce.test.ts`, `lib/money.test.ts`)
- **Consequences:** Free shipping is **Reguler-only** — an Ekspres order at any subtotal still costs 45.000; the cart drawer and checkout both show the "add Rp X more" hint. `toRupiah` clamps non-finite/negative input to 0, so a poisoned stored number can never render as "Rp NaN". The Postgres money columns remain `numeric(10,2)` — harmless at zero decimals, but a schema mismatch to revisit when the server owns prices.
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED

### D-019 · Dead footer links are deleted, not stubbed; social/legal content is env-driven
- **Decision:** Best sellers, Archive sale, Gift cards, Shipping, Returns and Discord were **removed** from the footer. "Size guide" became a real `/size-guide` route and "Track order" points at `/orders`. Social channels read `VITE_SOCIAL_{INSTAGRAM,TIKTOK,X}` and are filtered out entirely when blank; the Privacy/Terms/Cookies row renders only when **all three** `VITE_POLICY_*_URL` are set. `grep 'href="#"' src/` is empty.
- **Context:** The previous footer pointed at features the studio has not built (shipping policy, returns policy, gift cards). Inventing policy copy would be worse than an honest absence; leaving `href="#"` was a dead end dressed as a link.
- **Alternatives:** (a) keep the items with `href="#"` — rejected (dead ends); (b) invent placeholder policy text — rejected (fabricated legal claims).
- **Reason:** Absence is honest; a link that goes nowhere is not. — CONFIRMED (`components/Footer.tsx`, `pages/SizeGuide.tsx`, `components/SizeGuideContent.tsx`)
- **Consequences:** A future shipping/returns policy is added as a **page plus env var**, not as a link. Hiding the legal row while `VITE_POLICY_*` are unset means the site currently has **no reachable privacy policy** (SEC-006 / ISSUE-012).
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED

### D-020 · Manual transfer is gated on three env vars with no fallback; Checkout refuses when nothing is payable
- **Decision:** The hardcoded placeholder bank details (bank name, account number and account holder — a fabricated BCA account) were **deleted**. Manual transfer is published only when `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER` and `VITE_PAYMENT_ACCOUNT_NAME` all pass `hasValue`. The Midtrans provider is registered but permanently `available: false` (`// Wave 1`). `availableProviders()` drives the UI, and Checkout shows "Belum ada metode pembayaran yang aktif" and **refuses to create an order** when the list is empty.
- **Context:** A plausible-looking bank account in the source is indistinguishable from a real one at a glance, and a customer would transfer money to it. Half a bank account is equally unpayable, hence the all-three requirement.
- **Reason:** An unconfigured build must render "no payment method is live", never a placeholder that could swallow money. — CONFIRMED (`lib/payments.ts`, `Checkout.tsx`, `lib/payments.test.ts`; browser-verified: the gate blocks placement with `bato-orders` left `null`)
- **Consequences:** The Wave 0 checkout is **functionally complete but not payable by default**. Enabling it is a configuration decision by the owner. The inactive Midtrans stub still posts the client-computed `amount`/`items[].price` and must be rewritten server-side before it is ever switched on (SEC-002 / ISSUE-010).
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED

### D-021 · A write that did not happen is never reported as success
- **Decision:** Two results types make the outcome of a write explicit: `createOrder` returns a discriminated `CreateOrderResult` (`ok:true` + `storage: "supabase" | "local"`, or `ok:false` + `reason: "persist-failed" | "invalid-items"` + `storage: "none"`), and `lib/lead.ts` returns `LeadResult{ok, reason?}`. On a Supabase failure while Supabase **is** configured, Checkout warns, **keeps the bag** and **does not navigate**. A newsletter or contact form clears its field only on a real insert.
- **Context:** The prior behaviour reported success for a write that never landed (and, for leads, for a write that never left the browser). "Order placed" for an order the studio cannot see is worse than an error.
- **Alternatives:** silently falling back to `localStorage` on a Supabase failure — rejected (it would put a phantom order on `/orders` that the studio never received).
- **Reason:** The customer's retry must be possible and the studio's record must match the customer's belief. — CONFIRMED (`lib/orders.ts`, `lib/lead.ts`, `Checkout.tsx`, `Footer.tsx`, `Contact.tsx`, `lib/orders.persist.test.ts`)
- **Consequences:** `storage` is surfaced to the confirmation page via `&local=1` so a guest order is described honestly. `generateOrderNumber` grew to `BTPK-YYMMDD-XXXXXX` (6 chars from a 32-symbol alphabet, ~10^9 ids/day) and `createOrder` retries up to 3× on Postgres `23505`, since `order_number` is `unique`. Honesty about **writes** is not the same as integrity of **values** — prices are still client-computed (SEC-001).
- **Date:** 2026-10-18 · **Confidence:** CONFIRMED
