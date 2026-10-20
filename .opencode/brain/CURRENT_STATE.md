# CURRENT_STATE

> Project Brain file · Current condition. Confidence: CONFIRMED (observed), INFERRED, UNKNOWN.
> Initialized 2026-10-13 · **Re-synced 2026-10-18 after "Wave 0" (session: BERTEMPK live + Wave 0).**
> The Checkout/backend/tests rows written before 2026-10-18 were **stale** — code won.

## Feature status

| Feature | Status | Notes |
|---------|--------|-------|
| Routing / app shell | DONE | BrowserRouter, **9 routes** + redirect — CONFIRMED (`App.tsx`) |
| Home (hero, drop grid, statement, story, marquee, contact) | DONE | Sections Hero → NewArrivals → Statement → Marquee → Story → Marquee → **Contact** — CONFIRMED |
| Navigation — hash anchors (Story / Contact) | DONE | `ScrollToHash` scrolls to `#hash` on route/hash change; sections carry `scroll-mt-20` — CONFIRMED (tasks/TASK-007.md) |
| Contact section (Home) | DONE | `id="contact"`, form → `submitContactMessage` → honest result (success **only** on a real insert) — CONFIRMED (Wave 0) |
| Contact + newsletter **persistence** | **LIVE (2026-10-19)** | `lib/lead.ts` + `supabase/migrations/20261019_leads.sql` applied via `supabase db push` → `contact_messages` / `newsletter_subscribers` tables exist with RLS. Forms now write real rows. Abuse controls still missing (ISSUE-013) — CONFIRMED |
| Footer links | DONE (Wave 0) | `grep 'href="#"' src/` = **0 matches**. `All products → /shop`, `New drop → /shop?sort=new`, `Size guide → /size-guide`, `Track order → /orders`, `Contact → /#contact`. Best sellers / Archive sale / Gift cards / Shipping / Returns / Discord **deleted**; social channels env-driven and hidden when unset; legal row renders only when all three `VITE_POLICY_*_URL` are set — CONFIRMED |
| Video hero garment | DONE | `GARMENT_MODE="video"` default; stacking rule in force (ISSUE-001) — CONFIRMED |
| 3D turntable hero (opt-in) | DONE (inactive) | `USE_GLB=false`, procedural `HoodieModel`; lazy chunk — CONFIRMED |
| Shop (filter + search) | DONE | `?category`, `?sort=new`, and **`?q` is the single source of truth** for search (Navbar submits a real form to `/shop?q=`) — CONFIRMED (Wave 0) |
| Product detail (size/qty/add) | DONE | **Explicit size required** before "Add to bag" enables; no "M" default; no colour selector — CONFIRMED (Wave 0) |
| Product detail — stacked image gallery | DONE | `ProductImageStack`; `images ?? [image]` fallback — CONFIRMED (tasks/TASK-004/005.md) |
| Cart drawer | DONE | Persisted `bato-cart`, **variant-keyed**, v2 schema; shows size + free-shipping hint — CONFIRMED (Wave 0) |
| Wishlist page | DONE | Persisted `bato-wishlist`; quick-add replaced by a "Pilih ukuran" link to the PDP — CONFIRMED (Wave 0) |
| Fitting room (layering, colour, size, start over) | DONE | Persisted `bato-fitting` — CONFIRMED (tasks/TASK-001.md) |
| Fitting room — rigged GLB body + garments (Tier B/C) | DONE | `cogan.glb`/`cecan.glb`, bone-driven garments (`lib/avatar.ts`), both genders — CONFIRMED (session 7) |
| **Cart variants (size/colorway)** | **DONE (Wave 0)** | `lineIdOf()` = `` `${id}::${size??"?"}::${colorway??"?"}` ``; `CartItem extends Product, ProductVariant`; zustand `persist` **version 2** + `migrate` that sanitises hostile storage, merges duplicate `lineId` rows by summing quantity, and **never invents a size** (legacy rows → `size:null`, `p2::?::?`) — CONFIRMED |
| **IDR money layer** | **DONE (Wave 0)** | `src/lib/money.ts` (`formatIDR`, `toRupiah` with a `Number.isFinite` guard, `normalizeIDR` for the ICU U+00A0) + `src/constants/commerce.ts` (`CURRENCY`, `FREE_SHIPPING_THRESHOLD = 1_500_000`, `SHIPPING_METHODS` Reguler 25.000 / Ekspres 45.000 with free shipping on **Reguler only**, `shippingCostFor`, `freeShippingHint`, env-driven `CONTACT`). **No `.toFixed(2)` price and no `$` price remains in `src/`** — CONFIRMED (verified by grep) |
| **Checkout** | **DONE (Wave 0)** — was "toast placeholder" | `src/pages/Checkout.tsx`: address form, shipping method selection, payment selection, order summary. **Gate 1 (payment):** refuses to create an order when `availableProviders()` is empty and renders "Belum ada metode pembayaran yang aktif". **Gate 2 (size):** refuses to create an order when any line lacks a size, validated against `SIZES` (not merely non-null) — CONFIRMED |
| **Orders / order confirmation** | **DONE (Wave 0)** | `/orders` + `/orders/:id`; `src/lib/orders.ts` with read normalisation, `getOrder`/`listOrders`/`hasUnSizedLines`; `OrderConfirmation` — CONFIRMED |
| **Order persistence** | **DONE (Phase 1, 2026-10-19)** | Signed-in + Supabase configured → `create-order` Edge Function owns price authority (DB-backed catalogue, JWT verification, retries, stock decrement). Guest → localStorage. Midtrans webhook updates status to `paid`/`cancelled`/`refunded`. — CONFIRMED
| **Honest write results** | **DONE (Wave 0)** | `createOrder` returns a discriminated `CreateOrderResult`; on a Supabase persist failure while Supabase **is** configured it returns `ok:false` and Checkout shows a warning, does **not** clear the bag and does **not** navigate. `generateOrderNumber` → `BTPK-YYMMDD-XXXXXX` (6 chars, 32-symbol alphabet) and retries up to 3× on Postgres `23505` — CONFIRMED |
| **Payments (Midtrans)** | **DONE (Phase 1, 2026-10-19)** | `create-payment` Edge Function mints Snap token server-side; `midtrans-webhook` verifies signature, maps status, checks amount, idempotent. Frontend `payments.ts` invokes via `VITE_PAYMENT_ENDPOINT`. Redirect flow (no client key needed). Sandbox key active. End-to-end tested: order → payment → webhook → `paid`. — CONFIRMED
| Sign in / auth | DONE | Supabase Auth (email/password + Google/GitHub OAuth) via `store/auth.ts` + `AuthModal` — CONFIRMED |
| Outfit Builder (`/outfit`) | DONE | Slot-based selection, gender toggle, per-slot size, "Shop this look" → cart (size-gated). Share link restores on mount (`?look=` reader added). Dead `colors` state removed; mannequin receives `{}`. — CONFIRMED
| **Size guide** | **DONE (Wave 0)** | New route `/size-guide` (`src/pages/SizeGuide.tsx` + shared `src/components/SizeGuideContent.tsx`); accessible dialog (`role="dialog"`, `aria-modal`, labelled, Escape, focus in/restore, Tab trap, reduced-motion aware) — CONFIRMED |
| **Mobile nav reachability** | **DONE (Wave 0)** | Hamburger now exposes Search, Wishlist, Orders and Account; `/wishlist` and `/orders` were previously **unreachable on mobile** — CONFIRMED |
| **Accessible line thumbnails** | **DONE (Wave 0)** | `src/components/LineImage.tsx` renders an accessible placeholder instead of `<img src="">` for pre-Wave-0 cart rows — CONFIRMED |
| **Automated tests** | **DONE (Wave 0 + Phase 1)** | **10 test files / 148 tests** (`vitest run`, jsdom + Testing Library) — CONFIRMED (re-run 2026-10-19) |

### Routing table (authoritative — `src/App.tsx`)

| Route | Component |
|---|---|
| `/` | `Home` |
| `/shop` | `Shop` (reads `?category`, `?sort=new`, `?q`) |
| `/product/:id` | `ProductDetail` |
| `/wishlist` | `Wishlist` |
| `/outfit` | `OutfitBuilder` |
| `/checkout` | `Checkout` |
| `/orders` | `Orders` |
| `/orders/:id` | `OrderConfirmation` |
| `/size-guide` | `SizeGuide` |
| `/privacy` | `Privacy` |
| `/terms` | `Terms` |
| `*` | `Navigate → /` |

The pre-Wave-0 rows saying "5 routes" were **stale** — CONFIRMED (code).

## Active development

- **Wave 0 — commerce, variants, money, honesty (2026-10-18) — COMPLETE and verified.**
- **Phase 1 — production readiness (2026-10-19) — COMPLETE.**
  Built: `create-order` Edge Function (DB-backed price authority, JWT, retries, stock
  decrement) · `create-payment` (Midtrans Snap token) · `midtrans-webhook` (signature
  verification, status mapping, amount check, idempotency, best-effort email) ·
  `admin-orders` (list + update_status, gated by `ADMIN_EMAILS`) · `submit-lead`
  (honeypot, IP/email rate limiting, validation) · `send-email` (Resend, gated) ·
  migrations applied (orders, leads, lead_rate_limits, products, product_stock) ·
  frontend wired (orders.ts, payments.ts, lead.ts, Checkout.tsx, Admin.tsx) ·
  Privacy.tsx / Terms.tsx · SEO meta (OG/Twitter) · Outfit Builder share-link restore +
  dead `colors` removed · brand consistency (Berlin → Indonesia) · inventory/stock
  tracking · Playwright E2E smoke tests (26 tests, desktop + mobile) · 148 unit tests.
  **Open:** Resend API key, admin email, Turnstile keys (all free, user-provided);
  E2E tests for full checkout flow (auth-gated, needs test credentials).
- **Next (Tier 3):** Playwright E2E for full checkout → confirmation flow · Turnstile
  integration · full Indonesian legal pages · stock "out of stock" UI. — INFERRED priority.

## Blocked work

- **Real payments are blocked** on a server-side price authority (SEC-001). A client-only
  fix is not available; it needs an Edge Function + owner decision — CONFIRMED.
- **Enabling leads is blocked** on applying `20261019_leads.sql` **and** first adding spam
  protection (honeypot / rate limit / Turnstile) — CONFIRMED.
- "Is the reference `fiturku.mp4` mannequin photoreal or illustrated?" — UNKNOWN (no longer
  gates anything).

## Known limitations

- **Every price/total is client-computed and untrusted** until the edge function exists —
  CONFIRMED (SECURITY SEC-001). A signed-in user can insert `status:'paid', total:1`.
- **Guest orders put a full shipping address in `localStorage` under `bato-orders` forever
  and are never cleared on sign-out** — CONFIRMED (SEC-005). Shared-device exposure.
- **No privacy notice, consent capture or retention rule** for any personal data; the
  legal footer row is hidden while `VITE_POLICY_*` are unset — CONFIRMED (SEC-006;
  UU PDP 27/2022 precondition).
- **`contact_messages` / `newsletter_subscribers` are open anon write endpoints** with no
  rate limiting — CONFIRMED (SEC-003).
- **The leads migration was applied 2026-10-19** (`supabase db push`), so the contact form
  and newsletter now write real rows — CONFIRMED. Abuse controls (ISSUE-013) remain open.
- `isSupabaseConfigured` and `isSupabaseConfiguredForWrites` disagree on what counts as
  configured (a copy-pasted `.env.example` passes one and fails the other) — CONFIRMED.
- **Brand contradiction:** `index.html` meta and `Footer.tsx` say "built in Berlin" while
  prices are IDR, checkout copy is Indonesian and `CONTACT.origin` defaults to
  `Indonesia` — CONFIRMED. **Owner decision required.**
- Outfit Builder's Share link generates `?look=<base64>` that **nothing reads** (no
  `useSearchParams` consumer in that page) and `btoa` throws on non-Latin1 ids; its
  `colors` state is only ever *deleted* / reset, never set, so the mannequin colourway
  picker is dead there — CONFIRMED.
- Oversized JS chunks (see TECHNICAL_DEBT).
- The 3D mannequin rotates by pointer drag only (no keyboard path); `role="img"` + text
  label; the **Model** toggle is a real keyboard-reachable `aria-pressed` control —
  CONFIRMED.
- The 3D stage requires WebGL; without it the flat SVG fallback renders — CONFIRMED.
- Worn pieces are **offset shells of the measured skinned surface**, not simulated cloth —
  CONFIRMED.

## Architecture status

- **ARCHITECTURE.md re-synced 2026-10-18** for the commerce layer: new modules
  (`lib/money`, `lib/orders`, `lib/payments`, `lib/lead`, `lib/env`, `constants/commerce`),
  the `public.orders` / leads tables, the `/checkout` `/orders` `/orders/:id` `/size-guide`
  routes, and the variant-aware cart. Drift recorded in ARCHITECTURE_DRIFT.md.
- Residual debt: orphaned `src/constants/body.ts`, `ProductImageStack.tsx.bak`,
  `ProductImageStackComp.tsx` — CONFIRMED.

## Deployment status

- Static Vite build in `dist/`, rebuilt **2026-10-18** (`npx vite build`, exit 0, 13.72 s)
  — CONFIRMED (session report). Artifact sizes currently on disk: `index-*.js` 820 060 B,
  `ContactShadows-*.js` 931 055 B, `Mannequin3D-*.js` 77 718 B, `GarmentTurntable-*.js`
  3 778 B, `index-*.css` 50 730 B, `index.html` 1 001 B — CONFIRMED (observed in `dist/`;
  content hashes not pinned). The main chunk grew from ~531 kB to ~820 kB as
  `@supabase/supabase-js` was pulled into it — INFERRED (cause from the dependency change;
  not bundle-analysed).
- **Hosted on Vercel (free tier)** — auto-deploy from GitHub master branch. Live URL:
  https://fashion-ecom-eight.vercel.app. SPA fallback via vercel.json. Env vars configured
  (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PAYMENT_ENDPOINT, VITE_LEAD_ENDPOINT,
  VITE_TURNSTILE_SITE_KEY). — CONFIRMED (2026-10-20).
- **Git repository** — initialized and pushed to https://github.com/abinawahasan-bot/bertempk-fashion
  (branch: master). Full commit history available. — CONFIRMED (2026-10-20).
- **Midtrans sandbox** — `MIDTRANS_IS_PRODUCTION=false`; sandbox key active. Production
  key not yet registered (business verification pending). — CONFIRMED.

## Branch / version (if versioned)

- Current branch: `master` — CONFIRMED (git repo initialized 2026-10-20).
- Package version: `0.0.0` (`package.json`) — CONFIRMED.
- Deployment: Vercel (free tier) — auto-deploy from GitHub master.
- Live URL: https://fashion-ecom-eight.vercel.app

## Snapshot pointer

- Latest snapshot: `snapshots/snapshot-2026-10-13-tierA.md` (Tier A milestone);
  baseline `snapshots/snapshot-2026-10-13.md`. **No snapshot covers Wave 0** — the next
  release snapshot must.