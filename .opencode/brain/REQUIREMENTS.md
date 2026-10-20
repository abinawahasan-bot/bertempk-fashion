# REQUIREMENTS

> Project Brain file · Functional AND non-functional requirements and constraints. Confidence: CONFIRMED (from repo behavior), INFERRED, UNKNOWN.
> Origin: derived from actual implementation (no external spec found). Requirements below describe what the app DOES/MUST do.
> **Re-synced 2026-10-18 (Wave 0).** FR-9 ("Checkout is a placeholder") was **retracted** —
> the code is authoritative.

## Functional Requirements

- FR-1 (CONFIRMED): Render a storefront SPA with routes `/` (Home), `/shop`, `/product/:id`, `/wishlist`, `/outfit`, `/checkout`, `/orders`, `/orders/:id`, `/size-guide`; unknown paths redirect to `/`. *(Was 4–5 routes pre-Wave-0 — retracted.)*
- FR-2 (CONFIRMED): Home page shows a hero with a moving garment, a "latest" product grid (first 4), a brand statement, and story + marquee + Contact sections.
- FR-3 (CONFIRMED): Shop lists 6 products (`p1`–`p6`), filterable by category (All, New Crop, Hoodie, Trousers, Outerwear) and searchable by name/category; supports `?sort=new` and **`?q` (the single source of truth for the search term)**.
- FR-4 (CONFIRMED): Product detail shows image, name, category, price/compare-at price, description, size selection `["XS","S","M","L","XL"]`, quantity, add-to-cart, wishlist toggle. **No colour selector on ProductDetail** (colours exist only in the fitting room). **A size must be explicitly chosen — there is no default size and "Add to bag" stays disabled until one is picked.**
- FR-5 (CONFIRMED): Cart drawer with quantity update/remove, subtotal, per-line **size/colourway display**, and a free-shipping hint; badges in Navbar.
- FR-6 (CONFIRMED): Wishlist page with remove and a **"Pilih ukuran" link to the product page** (quick-add from a card/grid without a size is deliberately not offered).
- FR-7 (CONFIRMED): **Fitting room** — tapping a hanger on a product wears it on a **3D mannequin** (React-Three-Fiber stage; flat SVG fallback when WebGL is unavailable or the 3D module errors); a left drawer opens; pieces layer by slot (bottom → top → outer → accessory); panel offers "Choose a Size" (XS S M L XL, changes the figure's **width** only) and "Choose a Color" (As shown / Jet / Slate / Bone / Clay); "Start over" clears picks, colours, sizes.
- FR-8 (CONFIRMED): Cart, wishlist, and fitting selections persist across reloads (`localStorage`), and a **pre-Wave-0 cart is migrated, not discarded**.
- FR-9 (CONFIRMED): **Sign In / Sign Up / Sign Out work** via Supabase Auth (email/password + Google/GitHub OAuth) with session recovery on mount.
- FR-10 (CONFIRMED): **Checkout** — contact & shipping form, shipping-method choice, payment-method choice, order summary with subtotal / shipping / total; guest and signed-in both supported; order persisted (Supabase for signed-in, `localStorage` for guests); navigates to `/orders/:id?placed=1` (`&local=1` for guest orders).
- FR-11 (CONFIRMED): **Order history and confirmation** — `/orders` lists the signed-in user's orders (Supabase) or local orders (guests); `/orders/:id` shows the full line-item/address/total detail.
- FR-12 (CONFIRMED): **Size is enforced end-to-end.** `ProductDetail` requires an explicit size; `ProductCard`/`Wishlist` quick-add is a link to the PDP; `OutfitBuilder` passes a per-slot size; `CartDrawer` shows the size; **Checkout refuses to create an order when any line lacks a size, validated against `SIZES` (not merely non-null)**.
- FR-13 (CONFIRMED): **Cart lines are variant-aware.** A line's identity is `lineId = `${id}::${size??"?"}::${colorway??"?"}`; the same hoodie in M and in L are two lines. Persistence schema is `version: 2` with a `migrate` that coerces hostile stored data, merges duplicate `lineId` rows by summing quantity, and **never invents a size** (a legacy row becomes `size:null`).
- FR-14 (CONFIRMED): **All money is Indonesian rupiah**, whole numbers, no cents. `formatIDR` renders `id-ID` grouping; `toRupiah` clamps non-finite/negative values to 0; `normalizeIDR` handles the ICU non-breaking space when comparing strings. **No price anywhere in `src/` uses `.toFixed(2)` or a `$` symbol.**
- FR-15 (CONFIRMED): **Shipping rules** live in `constants/commerce.ts`: `FREE_SHIPPING_THRESHOLD = 1_500_000`; Reguler 25.000 (3–5 hari kerja, free-eligible) and Ekspres 45.000 (1–2 hari kerja, never free); `shippingCostFor` / `freeShippingHint` drive both the checkout and the cart drawer.
- FR-16 (CONFIRMED): **Payment honesty.** Manual bank transfer is published **only** when `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER` and `VITE_PAYMENT_ACCOUNT_NAME` all hold real (non-placeholder) values; Midtrans is registered but **permanently unavailable (Wave 1)**. When zero providers are available, Checkout shows "Belum ada metode pembayaran yang aktif" and **refuses to place an order**.
- FR-17 (CONFIRMED): **A failed write is never reported as a success.** `createOrder` returns a discriminated `CreateOrderResult`; a Supabase persist failure while Supabase is configured yields `ok:false` → Checkout warns, **does not clear the bag and does not navigate**. `generateOrderNumber` emits `BTPK-YYMMDD-XXXXXX` and retries on `23505`.
- FR-18 (CONFIRMED): **Lead capture** — contact form and footer newsletter call `lib/lead.ts`, which returns `LeadResult` and **never reports success for a write that did not happen**. Until `supabase/migrations/20261019_leads.sql` is applied, both degrade to an honest "not active" message.
- FR-19 (CONFIRMED): **No dead links.** `href="#"` does not occur in `src/`. Footer entries that describe unbuilt features were **deleted rather than stubbed**; social channels and the legal row are env-driven and hidden unless configured.
- FR-20 (CONFIRMED): **Reachability** — mobile navigation exposes Search, Wishlist, Orders and Account; navbar search is a real form submitting to `/shop?q=`.
- FR-21 (CONFIRMED): **Size guide** is a real route (`/size-guide`) rendered as an accessible dialog (`role="dialog"`, `aria-modal`, labelled, Escape to close, focus moved in and restored, Tab trapped, reduced-motion aware), sharing one content component with the PDP.

## Non-Functional Requirements

- **Performance (CONFIRMED / partial):** The 3D turntable is lazy-loaded as its own chunk. Build emits >500 kB chunk warnings (see TECHNICAL_DEBT); the main chunk grew to ~820 kB when Supabase landed in it. Hero video preloads `auto`.
- **Security:** **The client is the price authority** for orders — a signed-in user can insert arbitrary `total`, `subtotal`, `items`, `address`, `payment_method` and **`status`**. Server-side recomputation does not exist. RLS scopes reads to own rows; the leads tables are INSERT-only for `anon`. Guest orders persist a full address in `localStorage` forever. See SECURITY.md (SEC-001…SEC-010) — **not payment-safe**.
- **Privacy / compliance:** No privacy notice, consent capture or retention rule exists for the personal data collected (address, email, phone, contact messages, newsletter emails). Under UU PDP 27/2022 these are preconditions before enabling the leads migration or a live checkout. — CONFIRMED (gap), INFERRED (applicability)
- **Accessibility (CONFIRMED / partial):** `aria-label`/`aria-pressed`/`role="dialog"`/`aria-modal`/focus-trap used; `prefers-reduced-motion` respected by animations, the hero, the 3D stage and the new SizeGuide dialog; the mannequin stage is `role="img"` with a text label shared with the SVG fallback; `LineImage` gives an accessible placeholder where an image is missing. **Known gaps:** 3D rotation is pointer-drag only (no keyboard path); no formal a11y audit performed — UNKNOWN conformance level.
- **Scalability:** Static SPA + managed Supabase; capacity is provider-bound — INFERRED.
- **Reliability (CONFIRMED):** Reads of unknown stored/remote rows are normalised before they reach the UI; cart `migrate` tolerates corrupt storage; `toRupiah` guarantees a poisoned number cannot render as "Rp NaN".
- **Maintainability (INFERRED):** Small, well-factored modules; TS project references (`tsc -b`); linted with oxlint; **no `strict` flag in any tsconfig** (debt).

## Constraints

- **Supported platforms:** Modern browsers (WebP, WebM/VP9, WebGL for the 3D path) — INFERRED.
- **Package restrictions:** Tailwind v4 CSS-first (no JS config) — CONFIRMED.
- **Compatibility:** React 19 + react-router 7 + motion 14 + three 0.186 — CONFIRMED.
- **Infrastructure limits:** Static hosting only; host not chosen — UNKNOWN. A Supabase Edge Function will be required for safe order creation.
- **Legal:** Product imagery loaded from Pexels; brand/reference media are study-only and must not ship — CONFIRMED. Pexels licensing terms not recorded — UNKNOWN. **Brand origin is contradictory** ("built in Berlin" vs IDR/Indonesian commerce) — owner decision.
- **Test isolation:** `vitest.config.ts` pins Supabase/payment/social/policy env vars to placeholders so no test can touch a real project or make a provider look available — CONFIRMED.

## Origin

- All FRs derived from actual code behavior (no separate spec document exists in the repo).

## Change rules

- Update when requirements change; cross-ref DECISIONS.md and CURRENT_STATE.md when decisions affect requirements.
- **FR-9 was retracted on 2026-10-18** (Checkout was a placeholder; it is a real flow). Do not re-add claims that contradict `src/pages/Checkout.tsx`.