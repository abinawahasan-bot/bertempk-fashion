# CHANGE_HISTORY

> Project Brain file · Concise log of significant engineering changes. NOT an exhaustive commit log.
> Evidence: file mtimes cluster on 2026-10-12 → 2026-10-13. Repo is not under git, so this is reconstructed from files + the dev log.

## Changelog

### 2026-10-18 — "Wave 0": commerce layer, variants, IDR money, honesty gates
#### Implemented
- **Variant plumbing** — `ProductVariant{size, colorway}` + `lineIdOf()`; `CartItem extends Product, ProductVariant`; `OrderItem` carries `size`/`colorway`/`line_id`. `store/cart.ts` rewritten to key on `lineId` with zustand `persist` **version 2** + a coercing `migrate` (merges duplicate `lineId` rows by summing quantity; **never invents a size**).
- **Size enforced end-to-end** — `ProductDetail` requires an explicit size (no "M" default); `ProductCard`/`Wishlist` quick-add replaced by a "Pilih ukuran" PDP link; `OutfitBuilder` passes a per-slot size; `CartDrawer` shows size + free-shipping hint; **Checkout refuses to create an order** when any line lacks a size, validated against `SIZES`.
- **IDR money** — new `src/lib/money.ts` (`formatIDR`, `toRupiah`, `normalizeIDR` for the ICU U+00A0) and `src/constants/commerce.ts` (`CURRENCY`, `FREE_SHIPPING_THRESHOLD = 1_500_000`, `SHIPPING_METHODS` Reguler 25.000 free-eligible / Ekspres 45.000, `shippingCostFor`, `freeShippingHint`, env-driven `CONTACT`). Catalogue prices converted to whole rupiah. **Every `.toFixed(2)` and `$` price removed from `src/`.**
- **Honesty gates** — the hardcoded placeholder bank name + account number + account holder (a fake BCA account, digits deliberately not reproduced here) was **deleted**; manual transfer is env-driven behind `hasValue` + `availableProviders()`; Midtrans registered but `available: false` (`// Wave 1`); Checkout shows "Belum ada metode pembayaran yang aktif" and disables Place order when zero providers are live.
- **Failed writes are no longer successes** — `createOrder` returns a discriminated `CreateOrderResult`; a Supabase failure while configured produces a warning, keeps the bag and does not navigate. `generateOrderNumber` → `BTPK-YYMMDD-XXXXXX` (6 chars) with `23505` retries.
- **Leads** — new `src/lib/lead.ts` (`submitContactMessage`, `subscribeNewsletter`, `LeadResult`) + `supabase/migrations/20261019_leads.sql` (`contact_messages`, `newsletter_subscribers`, RLS forced, INSERT-only, explicit `revoke select, update, delete`, email bounds). **The migration has never been applied** — both forms honestly degrade to "not active".
- **No dead links** — `grep 'href="#"' src/` = 0. Footer: Best sellers / Archive sale / Gift cards / Shipping / Returns / Discord deleted; social channels env-driven and hidden when unset; legal row only when all three `VITE_POLICY_*_URL` are set; new `/size-guide` route ("Size guide") and "Track order" → `/orders`.
- **Mobile nav** — hamburger now exposes Search, Wishlist, Orders, Account (mobile previously could not reach `/wishlist` or `/orders` at all). Navbar search is a real form → `/shop?q=`; `Shop` treats `?q` as the single source of truth.
- **Accessibility** — new `SizeGuide` dialog (`role="dialog"`, `aria-modal`, labelled, Escape, focus in/restore, Tab trap, reduced-motion aware) sharing `SizeGuideContent.tsx`; new `components/LineImage.tsx` renders an accessible placeholder instead of `<img src="">`.
- **Repo hygiene** — `.gitignore` now excludes `.env` / `.env.*` with `!.env.example`; `.env.example` gained 12 placeholder-only variable names (14 total).
#### Added
- `supabase/migrations/20261018_orders.sql` (`public.orders` + RLS select/insert own rows) and `20261019_leads.sql`.
- **9 test files / 141 tests** (`vitest` + Testing Library + jsdom) covering the cart migration, IDR formatting, shipping rules, payment gating, honest write failures and the checkout gates.
#### Verified
- `npx tsc -b` exit 0 · `npx oxlint` exit 0 (1 pre-existing warning `AuthModal.tsx:35`) · `npx vitest run` **141 passed / 9 files** · `npx vite build` exit 0 (13.72 s). Browser (Chromium, `:5200`): 7 routes render with **0 console errors**; a seeded legacy v1 cart migrates to v2 with `size:null` (2 placeholders, 0 broken images); size gate blocks unsized checkout; payment gate blocks placement with `bato-orders` left `null`; 3D fitting room intact.
#### Known problems introduced / discovered
- **SEC-001 (CRITICAL)** — order prices and `status` are client-chosen; a signed-in user can insert `status:'paid', total:1`. Needs a Supabase Edge Function before any real payment.
- SEC-002 Midtrans stub still posts the client-computed `amount`/`items[].price` (unreachable today).
- SEC-003/004/005/006 — open anon lead endpoints with no rate limiting; duplicate-email UX; guest PII in `localStorage` never cleared on sign-out; no privacy notice/consent/retention.
- ISSUE-015 the two Supabase "is configured" predicates disagree · ISSUE-016 "built in Berlin" vs Indonesian commerce · ISSUE-017 dead `?look=` share link + dead `/outfit` colourway picker · ISSUE-018 a QA auth user row (`qa.mobilenav.verify@example.com`) needs manual deletion · ISSUE-019 `VITE_PAYMENT_ENDPOINT` missing from `.env.example`.
- Main bundle grew ~531 kB → ~820 kB (Supabase in the main chunk; cause INFERRED).
#### Decisions touched
- **D-015** variant `lineId` cart key · **D-016** legacy row keeps `size:null` · **D-017** explicit size required, quick-add removed · **D-018** whole-rupiah money, free shipping on Reguler only at Rp 1.500.000 · **D-019** dead links deleted, not stubbed · **D-020** manual transfer env-gated with a hard checkout refusal · **D-021** failed writes never reported as success.
#### Documentation sync
- **Full Project Brain re-sync** (code is the authority): SECURITY, CURRENT_STATE, REQUIREMENTS, KNOWN_ISSUES, TECHNICAL_DEBT, TESTING, ARCHITECTURE, DEPLOYMENT, DECISIONS, STACK, CONVENTIONS, PROJECT, DEPENDENCIES, PROJECT_HEALTH, BRAIN_AUDIT, ARCHITECTURE_DRIFT, INDEX + new `tasks/TASK-008.md`. See tasks/TASK-008.md.

### 2026-10-17 — Auth + Outfit Builder (post-brain sync)
#### Implemented (already in code, was stale in brain docs)
- **Supabase Auth** — `src/lib/supabase.ts` (client), `src/store/auth.ts` (zustand persist store `bato-auth` with session recovery + `onAuthStateChange`), `src/components/AuthModal.tsx` (sign in / create account, Google + GitHub OAuth, email/password, error/success banners). Wired into `Layout.tsx`, `Navbar.tsx` (Sign In/Sign Out/User display), and `App.tsx` (`useAuthStore.initialize()` on mount). Env vars in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Outfit Builder** — `src/pages/OutfitBuilder.tsx` at route `/outfit`. Slot-based (bottom/top/outer) product selection from the 6-product catalogue, gender toggle (male/female reuse), size + colour pickers, real-time price/savings calc, share-link (base64-encoded look state), "Shop this look" (adds all selected → cart), "Start over". Reuses `constants/fit.ts` (`SLOT_ORDER`, `SLOT_LABEL`, `SIZES`, `fitFor`) and `Mannequin` for 3D preview. Navbar link added ("Outfit Builder").
#### Added
- `.env.example` — template for Supabase env vars (auth placeholders only, no secrets).
#### Verified
- `tsc -b` exit 0 · `oxlint src` exit 0 (3 warnings in AuthModal.tsx: unused `user`/`openAuthModal` destructures + set-state-in-effect).
#### Documentation sync
- ARCHITECTURE.md: added Auth tier to conceptual layers, Auth + Outfit Builder to modules table, auth data flow, Supabase to external services, `/outfit` to routes.
- CURRENT_STATE.md: auth → DONE, Outfit Builder → DONE, routing → 5 routes, architecture status re-synced.
- KNOWN_ISSUES.md ISSUE-003: auth resolved; checkout only.
- TECHNICAL_DEBT.md: "Unimplemented checkout / auth" → "Unimplemented checkout" (auth done).

### 2026-10-14 (session 8) — Story & Contact navigation + a real Contact section

#### Added
- **`src/components/ScrollToHash.tsx`** — route/hash scroll effect keyed on `useLocation()` (`pathname`, `hash`, `key`): `getElementById(hash)` → `scrollIntoView`, else scroll to top; reduced-motion aware (`"auto"`); keyed on `location.key` so a repeat click re-scrolls.
- **`src/components/Contact.tsx`** — Home section `id="contact"` (`scroll-mt-20 border-b border-steel/40 bg-coal`): intro + `EMAIL`/`STUDIO` details (`mailto:`) and a working `name`/`email`/`message` form → `toast.success` + reset. Placeholder `studio@bertempk.com` / `Berlin, Germany` (marked for replacement).

#### Changed
- `src/components/Layout.tsx` — renders `<ScrollToHash />` as the first child.
- `src/pages/Home.tsx` — renders `<Contact />` after the final `Marquee`.
- `src/components/Navbar.tsx` — `Contact` link `/#signal` → `/#contact` (Story stays `/#story`).
- `src/components/Footer.tsx` — added `Link` + `footerTargets`: `All products → /shop`, `New drop → /shop?sort=new`, `Contact → /#contact`; genuinely-missing Help/Social items stay inert.

#### Fixed
- **ISSUE-008** — React Router does not scroll to a `#hash`, so the **Story** menu item set `/#story` but never moved (`scrollY` stayed 0; section at top ≈2554 px). Fixed centrally by `ScrollToHash`.
- **Contact menu pointed at the wrong target** — `/#signal` is the footer **newsletter**, not a contact block. Repointed to the new `/#contact` section.

#### Verified
- `tsc -b --force` 0 · `oxlint src` 0 · `vite build` 0 (`index` 531.32 kB).
- Browser (Playwright 1440×1000): Story → scrollY 2474 / top 80 px; Contact (navbar) → scrollY 3428 / top 80 px; **form submit → toast in 62 ms + form cleared**; fresh `/#contact` load scrolls; **footer Contact** from `/shop` scrolls; regression: scrolled `/#contact` → **Shop** lands at `scrollY 0`; **0 console errors**.
- METHOD NOTE: sonner toasts auto-dismiss (~4 s) — poll in-page for `[data-sonner-toast]` rather than probing in a later tool call.

#### Open (needs user)
- Real contact email / studio address to replace placeholders; destinations for the remaining Help/Social footer links.

### 2026-10-14 (session 7) — garments on the rigged avatar (bone-driven rebuild)

#### Changed
- `src/lib/avatar.ts` — rebuilt bone-driven: `bonePoints`/`normalise`/`landmarkY` read hip/neck/shoulder/wrist/knee/ankle off the rig (with stature-fraction fallbacks); `extractBody` measures the **skinned** surface in group space; `buildGarment` offsets it into a cloth layer.
- `src/components/Mannequin3D.tsx` — worn pieces now render on both genders in the avatars' **realistic skin** (monochrome repaint dropped); dev probe `window.__avatarFit` extended (landmarks, `centerX`, per-layer bboxes over indexed vertices, `outwardXZ`, `bones`).

#### Fixed
- **ISSUE-007 item 3** — the 3D stage rendered body-only; the worn pieces now render on the WebGL path.
- Avatar GLB is authored **inside-out** (winding + authored normals both facing inward) → cloth offset sank into the skin → garments invisible. Fixed with a signed-volume normal flip in `extractBody` (`outwardXZ.dot` −0.369 → +0.369).
- Width profile was measured from the world origin, not the body mid-line. Fixed with `centerX`.
- Low-poly shin bins read as zero half-width → female trousers stopped at mid-calf. Fixed by interpolating empty `halfX` bins.

#### Verified
- `tsc -b --force` 0 · `oxlint src` 0 · `vite build` 0.
- Browser both genders: 0 console errors; trousers reach the ankle (`y` min ≈ ankle) and sleeves reach the wrist; vision confirms head bare, torso covered, no floating cloth.

### 2026-10-14 (session 6) — fitting-room avatar swap (cogan/cecan): loading fix + orientation

#### Changed
- `public/model/` — renamed `male.glb → cogan.glb` and `female.glb → cecan.glb` (they were md5-identical to `cogan.glb`/`cecan.glb`); `BODY_URL` unchanged.
- `public/model/` — **swapped `cogan.glb` ↔ `cecan.glb` contents** (user-confirmed: `cogan` = male, `cecan` = female; the files were inverted). `BODY_URL` (`male→cogan.glb`, `female→cecan.glb`) now resolves correctly.
- `src/components/Mannequin3D.tsx` — `GlbBody` **auto-fits** from the loaded bounding box (scale to `TARGET_HEIGHT = 1.9`, centre X/Z, feet on `FLOOR_Y = -0.95`); removed the Z-up `-π/2` rotation and the now-unused `bodyMetrics` import; added a `MONOCHROME` switch (default `true`, keeps the D-010 `#c9c5bc` repaint).

#### Fixed
- **ISSUE-007** — the 3D stage pointed at `/model/cogan.glb|/model/cecan.glb`, which **did not exist**, so every load threw and silently fell back to the flat SVG (the avatar never rendered). Files now exist under those names.
- The `GlbBody` transform was authored for the old Z-up primitive; the real avatars are **Y-up** (feet at y≈0), so the old `-π/2` rotation laid them flat. Replaced with a measured auto-fit.

#### Verified
- `tsc -b` exit 0 · `oxlint src` exit 0 · `vite build` exit 0 (`Mannequin3D` 72.50 kB).
- Dev :5200 → `/model/cogan.glb` HTTP 200 (3 563 512 B), `/model/cecan.glb` 200 (4 552 360 B).
- Browser (Playwright, 1440×1000): fitting room opens with **0 console errors**; canvas fills its 290×540 container; both slots render a full-body, upright, viewer-facing monochrome figure (vision model).
- METHOD NOTE: at a short viewport (933×331) the stage `flex-1` collapses to 0 px and R3F renders a 300×150 canvas — a harness artifact; size the viewport first.

#### Open (needs user direction)
- The current `Mannequin3D.tsx` renders **body only — garments are gone** from the 3D stage (only the SVG fallback shows clothes). `constants/body.ts` analytic refit is orphaned. Tier B's documented state (CURRENT_STATE) therefore has **drift**.
- Monochrome repaint vs the avatars' realistic skin.

### 2026-10-14 (session 5, follow-up) — PDP gallery image mismatch fix (p2 / p4 / p5)

#### Changed
- `src/constants/products.ts` — `image` + `images[]` corrected for **p2, p4, p5** only (p1/p3/p6 untouched):
  - p2 `images` → 28701960, 28701951, 28701965, 28701952 (hero kept)
  - p4 `image` → 14437343; `images` → 14437343, 14437345, 14437346, 14437348
  - p5 `image` → 5443935; `images` → 5443935, 5443934, 5443936, 5443932

#### Fixed
- **ISSUE-006** — gallery arrays had been filled with *guessed sequential* Pexels IDs, so swiped views showed the wrong garment (p2 view 3/4 = beige hoodie; p4 view 2/3 = abstract paintings, view 4 = white dress; p5 view 2 = a nature photo, view 3/4 = HTTP 404). Re-sourced each product's gallery from a single verified shoot (photo-page "More like this").

#### Verified
- `tsc -b` exit 0 · `oxlint src` exit 0 · `npx vite build` exit 0.
- All 12 new image URLs HTTP 200, valid JPEG, distinct md5; vision model confirms each product's 4 photos are the same person + same outfit.
- Served module (:5200) has the 12 new IDs and 0 retired IDs.
- Browser (Playwright) `/product/p2|p4|p5`: 4 views each advance in order, all loaded (`naturalWidth 1600`), 0 console errors. `/shop` grid: 6 thumbnails load.
- METHOD NOTE: Pexels `curl` is Cloudflare-blocked → use Playwright; Pexels **search alt text is unreliable** → trust photo-page title + "More like this". A 21-byte `"Source is unreachable"` body = 404.

### 2026-10-14 (session 5) — PDP stacked image gallery

#### Added
- **`src/components/ProductImageStack.tsx`** — stacked focus gallery on the product detail page using `motion` + CSS `filter: blur()`. Click / dots advance; incoming image grows from the right (`x:"26%" → 0`, `scale:1.28 → 1`, `blur 6px → 0`), leaving image recedes left (`x:"-14%"`, `scale:0.88`, `blur 12px`); ease `[0.67,-0.03,0.27,1.01]`, 1.2 s; `AnimatePresence mode="popLayout"`; reduced-motion path = opacity-only 0.25 s.
- **`images?: string[]`** on `Product` (`src/types/index.ts`), backward-compatible: PDP renders `product.images ?? [product.image]`.

#### Changed
- `src/constants/products.ts` — p1–p6 each gain a 4-image `images` array.
- `src/pages/ProductDetail.tsx` — single hero `<img>` replaced by `<ProductImageStack>`.

#### Verified
- `tsc -b` exit 0 · `oxlint src` exit 0 · `npm run build` exit 0.
- Browser (Playwright against dev server :5200): `img "Product view 1"` renders; click advances to `"Product view 2"`; **0 console errors**.
- METHOD NOTE: grepping the SPA route HTML for component text is invalid — `/product/:id` serves `index.html` only; the DOM is client-rendered. Verify via browser/DOM, not `curl | grep`.

### 2026-10-13 (session 4) — Tier B: rigged GLB body + gender selector + analytic garment refit

#### Added
- **Rigged GLB body** for the 3D stage: `public/model/mannequin-{male,female}.glb`, rendered in its authored A-pose as a monochrome mannequin (`#c9c5bc`).
- **`src/constants/body.ts`** — analytic model of the GLB bodies (`K = 1.9/1.992`, `bodyMetrics`, `bodySection`, `torsoShellProfile`) so garments refit to the broader A-posed body.
- **Gender selector** in the fitting room ("Model": `male` / `female`) + gender-aware stage label.

#### Changed
- `src/components/Mannequin3D.tsx` — body is now `GlbBody` (`useGLTF`, `computeVertexNormals`, `frustumCulled={false}`); garments refit via a custom elliptical lathe; `HEM_BOTTOM −0.9 → −0.85`.
- `src/types/index.ts` (`Gender`, `MannequinProps.gender`), `src/constants/fit.ts` (`wornLabel(picks, gender)`), `src/store/fitting.ts` (`gender` + `setGender` + `partialize`), `src/components/FittingRoom.tsx`, `src/components/MannequinSvg.tsx`.

#### Fixed
- **ISSUE-005 / F-008** — stale Vite dev-server transform (served `partialize` without `gender`); resolved by re-triggering the watcher (`touch`). Lesson: verify the *served* module, not just disk.

#### Verified
- `tsc -b` exit 0 · `oxlint src` exit 0 · `npm run build` exit 0 (2939 modules).
- Rendered-body pixel probe matches geometry (head Ø 0.276 m, arm reach 0.653 m, legs 0.26 m, height 1.9 m, centred), both genders; gender persists across reload; reduced-motion renders; WebGL-off → SVG fallback with intact label; 0 console errors.

#### Decisions touched
- **D-010** (rigged GLB body + analytic refit + gender selector). See tasks/TASK-003.md.

### 2026-10-13 (session 3) — rebrand: OFFCANON → BERTEMPK

#### Changed
- Brand renamed **OFFCANON → BERTEMPK** across UI + metadata (12 occurrences, 7 files): `index.html` (`<title>`, meta description, `og:title`), `Navbar.tsx` + `Footer.tsx` wordmarks, `Footer` copyright line, `Hero.tsx` hero wordmark, `Story.tsx` body copy + image `alt`, `Home.tsx` marquee ticker ("BERTEMPK — SS26"), and the `index.css` / `fit.ts` code comments.
- Wordmark design preserved: the acid accent dot is kept (Hero and Footer now read "BERTEMPK."). `BERTEMPK` is 8 characters like `OFFCANON`/`Offcanon`, so layout is unchanged. Hero markup: `BERTEMPK<span className="text-acid">.</span>`.

#### Verified
- `tsc -b` exit 0 · `oxlint src` exit 0 · `npm run build` exit 0 (12.65 s, 2938 modules).
- Live browser check (dev server 5200): `<title>`, header wordmark, hero `h1` ("BERTEMPK."), footer giant wordmark ("BERTEMPK."), Story copy, ticker and image `alt` all show the new name; **0 occurrences of the old name remain**; 0 console errors.

### 2026-10-13 (session 2) — 3D fitting-room mannequin (Tier A) + review fixes

#### Added
- **3D mannequin stage**: `src/components/Mannequin3D.tsx` (procedural R3F body + 6 garment shells, `Pop` motion, `OrbitControls`, `ContactShadows`, `.glb` swap hook) and `src/components/MannequinSvg.tsx` (flat SVG, preserved as fallback).
- Shared non-component helpers: `MannequinProps` (`src/types/index.ts`), `wornLabel()` (`src/constants/fit.ts`).

#### Changed
- `src/components/Mannequin.tsx` rewritten as a wrapper: `lazy` 3D + `Suspense` + error boundary + cached `hasWebGL()` gate.
- `src/lib/useReducedMotion.ts`: `useState` seeded from a **synchronous** `matchMedia` read so the first commit already honours reduced motion.
- `src/components/FittingRoom.tsx` passes `sizes` to the mannequin.

#### Fixed
- Code-review blockers: **C1** z-fighting on layered garments (`LAYER_STEP = 0.014` layer inflation through `Shell`/`Sleeves`/all garments), **H1** `sizeScale` pivoting on the world origin (now width-only: `[k, 1, k]`), **H2** reduced-motion first frame (`Pop` snap effect + `!active` guard). Plus M2 (cached WebGL probe), M5 (error boundary now logs), L1 (short-sleeve cuff position), L3 (unused local).
- Re-verified: `tsc -b` exit 0 · `oxlint src` exit 0 · `npm run build` exit 0 (15.97 s) · pixel-probe QA (hem row 281 = 281 reduced/normal; base row 457 identical XS/XL with width 89→97 px; layered-torso speckle 0.002%).

#### Decisions touched
- **D-008** (3D default + SVG fallback), **D-009** (3D geometry/motion rules). See tasks/TASK-002.md, FAILURES F-005/F-006/F-007.

### 2026-10-13 (session 1) — fitting room

#### Added
- **Fitting room**: `src/components/FittingRoom.tsx`, `Mannequin.tsx`, `HangerIcon.tsx`, `HangerButton.tsx`; `src/constants/fit.ts`; `src/store/fitting.ts` (persist key `bato-fitting`); `.studio-grid` utility in `src/index.css`.
- Wired the fitting room into `Layout.tsx`, `Navbar.tsx`, `ProductCard.tsx`, `ProductDetail.tsx`.

#### Changed
- Hero garment assets refreshed in `public/` (`hoodie.webm`, `hoodie.mp4`, `hoodie-poster.png`).
- Verified green: `tsc -b`, `oxlint src`, `npm run build` (11.28 s).

#### Fixed
- Historical duplicate-identifier error (`useReducedMotion` declared twice in `GarmentTurntable.tsx`) — resolved (see KNOWN_ISSUES ISSUE-HIST-001).

#### Decisions touched
- D-003 (fitting-room model), D-002 (VideoGarment stacking), D-006 (HangerIcon).

### 2026-10-12 (reconstructed)

#### Added
- Initial storefront: Home/Hero, Shop, ProductDetail, Wishlist, CartDrawer, Footer, Statement, Story, Marquee, NewArrivals, ScrollReveal, TextReveal.
- Zustand stores `cart` (`bato-cart`), `wishlist` (`bato-wishlist`), `ui`; static catalogue `constants/products.ts`.
- 3D hero turntable scaffold (`GarmentTurntable.tsx`, `HoodieModel.tsx`).
- OFFCANON palette + fonts in `src/index.css` `@theme`.

#### Decisions touched
- D-005 (Tailwind v4 tokens), D-007 (motion variants module).

## Rules

- One block per meaningful work session; keep entries short. Prefer linking to tasks/ records.
- Do not grow unboundedly — archive old sections into snapshots when large.
