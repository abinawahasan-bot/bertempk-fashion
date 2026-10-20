# ARCHITECTURE

> Project Brain file · Document the ACTUAL architecture. If the code contradicts this file, the code wins — update this file.
> Confidence markers apply per section. Initialized 2026-10-13.

## Conceptual layers (top → bottom) — CONFIRMED

```
Presentation (pages + components, React + motion)
→ Routing (react-router-dom BrowserRouter, App.tsx — 9 routes)
→ State (zustand stores: cart, wishlist, ui, fitting, auth)
→ Domain/commerce (lib/orders, lib/payments, lib/lead, lib/money, constants/commerce)
→ Auth (Supabase hosted BaaS — session persistence, OAuth, email/password)
→ Data (static module: constants/products.ts, constants/fit.ts)
→ Persistence (Supabase PostgREST table `orders`; `contact_messages` +
              `newsletter_subscribers` pending migration) + localStorage fallback
→ Assets (local /public media; external Pexels images + Google Fonts + Supabase)
```

Client-only SPA with **no first-party server tier**. The backend is entirely hosted:
Supabase Auth + PostgREST. **All business logic — including price computation — runs in
the browser**, which is the central architectural risk (SECURITY SEC-001).

## Modules & boundaries

| Module | Responsibility | Key files | Confidence |
|--------|----------------|-----------|------------|
| App shell / routing | Routes `/`, `/shop`, `/product/:id`, `/wishlist`, `/outfit`, `/checkout`, `/orders`, `/orders/:id`, `/size-guide`, `*`→`/` (**9**); calls `useAuthStore.initialize()` on mount | `src/App.tsx`, `src/main.tsx` | CONFIRMED |
| Layout | Chrome: Navbar, Footer, CartDrawer, FittingRoom, AuthModal, Toaster (sonner), `ScrollToHash` (hash-scroll effect) | `src/components/Layout.tsx` | CONFIRMED |
| Pages | Home, Shop, ProductDetail, Wishlist, OutfitBuilder (`/outfit`), **Checkout**, **Orders**, **OrderConfirmation**, **SizeGuide** | `src/pages/*.tsx` | CONFIRMED |
| **Cart variants** | `lineIdOf()` (`${id}::${size??"?"}::${colorway??"?"}`); `CartItem extends Product, ProductVariant`; persist `version: 2` + coercing `migrate` (merges duplicate `lineId` rows, never invents a size) | `src/types/index.ts`, `src/store/cart.ts` | CONFIRMED |
| **Money** | `formatIDR` / `toRupiah` / `normalizeIDR` (whole rupiah, U+00A0-safe) | `src/lib/money.ts` | CONFIRMED |
| **Commerce constants** | `CURRENCY`, `FREE_SHIPPING_THRESHOLD = 1_500_000`, `SHIPPING_METHODS` (Reguler 25.000 free-eligible / Ekspres 45.000), `shippingCostFor`, `freeShippingHint`, env-driven `CONTACT` | `src/constants/commerce.ts` | CONFIRMED |
| **Orders** | `createOrder` → discriminated `CreateOrderResult`; `generateOrderNumber` (`BTPK-YYMMDD-XXXXXX`, retries on `23505`); read normalisation of unknown rows; `getOrder`/`listOrders`/`hasUnSizedLines`; Supabase `orders` when signed in + configured, else `localStorage` `bato-orders` | `src/lib/orders.ts`, `supabase/migrations/20261018_orders.sql` | CONFIRMED |
| **Payments** | `providers()` / `availableProviders()` / `providerFor()`; manual transfer gated on 3 env vars; Midtrans registered but `available:false` (Wave 1) | `src/lib/payments.ts` | CONFIRMED |
| **Leads** | `submitContactMessage`, `subscribeNewsletter` → `LeadResult` (never reports success for a write that did not happen); tables `contact_messages` / `newsletter_subscribers` (**migration never applied**) | `src/lib/lead.ts`, `supabase/migrations/20261019_leads.sql` | CONFIRMED |
| **Env helpers** | `hasValue` (placeholder sweep), `isSupabaseConfiguredForWrites` | `src/lib/env.ts` | CONFIRMED |
| Hero | Video garment hero; lazy 3D turntable behind `GARMENT_MODE` flag (`"video"` default) | `src/components/Hero.tsx`, `VideoGarment.tsx`, `GarmentTurntable.tsx`, `HoodieModel.tsx` | CONFIRMED |
| Fitting room | Layered try-on drawer + colour/size model | `src/components/{FittingRoom,HangerButton,HangerIcon}.tsx`, `src/constants/fit.ts`, `src/store/fitting.ts` | CONFIRMED |
| Fitting-room mannequin | **Default:** React-Three-Fiber 3D stage — rigged GLB body (male/female, realistic skin) + garments built as offset shells of the measured skinned surface (`lib/avatar.ts`, bone-driven landmarks). **Fallback:** flat SVG. Wrapper handles lazy-load, error boundary, WebGL gate, a11y label | `src/components/Mannequin.tsx` (wrapper), `Mannequin3D.tsx`, `MannequinSvg.tsx`, `src/lib/avatar.ts` | CONFIRMED |
| Catalogue data | Static product list `p1`–`p6` with Pexels image URLs, **whole-rupiah prices** | `src/constants/products.ts` | CONFIRMED |
| State | zustand stores (persist keys `bato-cart`, `bato-wishlist`, `bato-fitting`, `bato-auth`, `bato-orders`; `ui` non-persisted) — all still on the legacy brand prefix | `src/store/*.ts`, `src/lib/orders.ts` | CONFIRMED |
| Auth | Supabase client (`@supabase/supabase-js` v2) — session auto-persisted with refresh token; OAuth (Google, GitHub) + email/password sign-in/up | `src/lib/supabase.ts`, `src/store/auth.ts`, `src/components/AuthModal.tsx` | CONFIRMED |
| Shared libs | `cn()` class merge; motion tokens/variants; reduced-motion hook | `src/lib/utils.ts`, `src/lib/motion.ts`, `src/lib/useReducedMotion.ts` | CONFIRMED |
| Types | `Product`, `ProductVariant`, `CartItem`, `Order`/`OrderItem`/`OrderStatus`/`PaymentMethod`/`ShippingAddress`, `lineIdOf`, `Gender`, `MannequinProps` | `src/types/index.ts` | CONFIRMED |

## Dependencies between modules

- Pages → components → stores/constants/lib.
- `Checkout` → `store/{cart,auth,ui}`, `lib/orders` (`createOrder`), `lib/payments` (`availableProviders`/`providerFor`), `lib/money`, `constants/{commerce,fit}`, `components/LineImage`.
- `Orders`/`OrderConfirmation` → `lib/orders` (`listOrders`/`getOrder`) + `store/auth`.
- `Footer`/`Contact` → `lib/lead` → `lib/env` → `lib/supabase`.
- `FittingRoom` → `store/fitting`, `constants/fit`, `Mannequin`, `HangerIcon`.
- `HangerButton` (used by `ProductCard`, `ProductDetail`, `Mannequin`-adjacent UI) → `store/fitting`, `HangerIcon`, `sonner`.
- Navbar → `store/{cart,wishlist,ui,fitting,auth}` + `react-router` navigation for search (`/shop?q=`).
- App shell → calls `useAuthStore.initialize()` on mount (Supabase session recovery); auth state drives Navbar Sign In/Sign Out + AuthModal.
- `Mannequin` (wrapper) → `Mannequin3D` (lazy default) / `MannequinSvg` (fallback); both consume `constants/fit` (`layerOrder`, `resolveFit`, `wornLabel`) and the `fitting` store picks/colors/sizes (via props).
- No circular dependencies observed — INFERRED (not formally tooled).

## Data flow

- Representative operation (wear a piece): user taps `HangerButton` → `useFittingStore.togglePick(product)` → `picks` updated and `status="dressing"`, `open=true` → `FittingRoom` opens (left drawer) → after `DRESSING_MS` (1500 ms) `settle()` → `Mannequin` re-renders pieces ordered by `layerOrder()` (slot order: bottom → top → outer → accessory) with colour resolution via `resolveFit()` — CONFIRMED.
- **Auth init flow:** App mount → `useAuthStore.initialize()` → `supabase.auth.getSession()` → restore `user` in Zustand (persisted `bato-auth`) + register `onAuthStateChange` listener. — CONFIRMED.
- Cart: `ProductDetail`/`OutfitBuilder` (explicit size required) → `useCartStore.addItem(product, {size, colorway})` → merged on `lineId` → persisted to `localStorage` (`bato-cart`, schema v2) → `CartDrawer` + Navbar badge. — CONFIRMED
- **Order placement:** `Checkout` validates the address plus two gates (≥1 live payment provider; every line sized and known to `SIZES`) → `createOrder` builds the `Order` (`BTPK-YYMMDD-XXXXXX`) → if signed in **and** `isSupabaseConfigured`: `supabase.from("orders").insert(...)`, retrying on `23505`; **any other error returns `ok:false` and nothing is written anywhere**. Otherwise (guest / no Supabase) the order goes to `localStorage` `bato-orders`. On `ok:true` the bag is cleared and the app navigates to `/orders/:id?placed=1` (plus `&local=1` for a local order). — CONFIRMED
- **Lead capture:** `Contact`/`Footer` → `lib/lead` → `isSupabaseConfiguredForWrites()` gate → `supabase.from("contact_messages" | "newsletter_subscribers").insert(...)` → `LeadResult`. Success is announced only on a real insert; the field is cleared only on success. — CONFIRMED

## API flow

- **Supabase PostgREST/Auth** — the only application API surface: `auth.*` (session, OAuth) and `select`/`insert` on `public.orders`, `public.contact_messages`, `public.newsletter_subscribers` — CONFIRMED.
- Inert: `VITE_PAYMENT_ENDPOINT` (Midtrans, `available: false`) — CONFIRMED.
- Non-API outbound: `images.pexels.com` and Google Fonts — CONFIRMED.

## Database flow

- **Postgres via Supabase, RLS-enforced** — CONFIRMED:
  - `public.orders` — `supabase/migrations/20261018_orders.sql`. `order_number text not null unique`, `user_id uuid default auth.uid() references auth.users on delete cascade`, `status`/`payment_method` check constraints, `items jsonb`, `address jsonb`, `subtotal`/`shipping_cost`/`total numeric(10,2) check (>= 0)`, index `(user_id, created_at desc)`. RLS: `select` own rows, `insert` own rows (`with check (auth.uid() = user_id)`); **no update/delete policy**.
  - `public.contact_messages`, `public.newsletter_subscribers` — `supabase/migrations/20261019_leads.sql`. RLS enabled **and forced**; `insert` open to `anon, authenticated`; `select, update, delete` revoked from both roles; unique index on `lower(email)`; length + regex bounds inside the `create table` statements. **Migration never applied to the live project.**
- **Local fallback:** zustand `persist` (`bato-cart`, `bato-wishlist`, `bato-fitting`, `bato-auth`) and raw `localStorage` `bato-orders` — CONFIRMED.
- Reads of unknown rows (stored or remote) are **normalised, never rewritten** (`normaliseOrder`/`normaliseItem`/`normaliseAddress`) — CONFIRMED.
- **Trust boundary:** every monetary value originates in the browser; there is no server-side recomputation — CONFIRMED (SECURITY SEC-001).

## Authentication flow — CONFIRMED (implemented)
- **Supabase Auth** (`src/lib/supabase.ts` → `createClient` with env vars; `src/store/auth.ts` zustand persist store under key `bato-auth`):
  - **Session recovery:** App mount → `initialize()` → `supabase.auth.getSession()` → restores `user` + registers `onAuthStateChange` listener (reacts to OAuth redirects via `detectSessionInUrl`).
  - **Email/password:** `signIn` / `signUp` (signUp triggers email confirmation).
  - **OAuth:** `signInWithProvider("google" | "github")` → `redirectTo: window.location.origin`.
  - **Sign out:** `supabase.auth.signOut()` + clears Zustand `user`.
- **UI:** `AuthModal.tsx` (sign in / create account toggle, Google + GitHub buttons, error/success banners, Escape-to-close, autofocus). Mounted in `Layout.tsx` inside `AnimatePresence`. Toggled via `ui.openAuthModal`. Navbar shows the active user (name/email or avatar) + Sign Out button when authed; Sign In button when signed out.
- **Env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (host: `<SUPABASE_PROJECT_REF>.supabase.co`). See SECURITY.md.

## External services & integration points

| Service | Purpose | Interface | Confidence |
|---------|---------|-----------|------------|
| Pexels (`images.pexels.com`) | Product + hero/story imagery | `<img src>` HTTPS URLs | CONFIRMED |
| Google Fonts (`fonts.googleapis.com`) | Anton + Space Grotesk webfonts | CSS `@import` | CONFIRMED |
| Supabase (`<SUPABASE_PROJECT_REF>.supabase.co`) | Hosted BaaS — authentication/sessions **+ Postgres tables** (`orders` live; `contact_messages`/`newsletter_subscribers` migration pending) | JS client (`@supabase/supabase-js`) via `src/lib/supabase.ts` | CONFIRMED |
| Local static assets (`/public`, `/src/assets`) | Hero video/poster, GLB, favicon, icons | same-origin | CONFIRMED |

## Hero rendering detail (CONFIRMED)

- Default hero garment = `VideoGarment` (local `hoodie.webm` VP9 w/ alpha → `hoodie.mp4` fallback → `hoodie-poster.png` still). Recoloured to the BERTEMPK greyscale by the source asset (blue→black, lit→grey).
- Alternative path = lazy-loaded `GarmentTurntable` (three.js) with a procedural `HoodieModel` (`USE_GLB = false`; real GLB slot at `/public/model/garment.glb`).
- The hero `<section>` uses `relative isolate` to form the blend group; see DECISIONS D-002 for the stacking rule.

## Fitting-room 3D stage detail (CONFIRMED — updated 2026-10-14, session 7)

- **Composition:** `Mannequin.tsx` is a wrapper — `lazy(() => import("./Mannequin3D"))` under `Suspense` (SVG fallback) and a `StageBoundary` error boundary, gated by `hasWebGL()` (tries `webgl2` then `webgl`; the probe is cached in a module variable; failures are logged). The stage is therefore never blank.
- **Body:** `GlbBody` (`Mannequin3D.tsx`) loads `BODY_URL = {male:"/model/cogan.glb", female:"/model/cecan.glb"}` via `useGLTF` (both preloaded). The scene is **auto-fit** from its measured bounding box: scale to `TARGET_HEIGHT = 1.9`, centre X/Z, feet on `FLOOR_Y = -0.95`; `frustumCulled={false}`. The rigs are **Y-up**. Skin is the avatars' **realistic** material (the old monochrome `#c9c5bc` repaint was dropped). No `Environment`/HDR (avoids a CDN fetch); lights = ambient + hemisphere + 2 directional + 2 point, plus `ContactShadows`.
- **Garments (`src/lib/avatar.ts`, bone-driven):** `bonePoints()` reads every joint in `<group>` space; `normalise()` de-punctuates glTF names (`spine.005`→`spine005`, `shoulder.L`→`shoulderL`). `measureFit()` derives hip (`pelvis*`), neck base (`spine005`), shoulder (`upper_arm*`), wrist (`hand*`), knee (`shin*`), ankle (`foot*`) — each with a stature-fraction fallback — plus a per-bin half-width profile measured from the body **mid-line** (`centerX`) and gap-interpolated. `extractBody()` measures the **skinned** surface (`SkinnedMesh.applyBoneTransform` → group space). `buildGarment()` duplicates that surface, offsets each vertex along its **outward** normal by `pad`, and keeps the faces a shape covers (torso/arm split + leg band). Materials cached per tone (`MeshStandardMaterial`, `DoubleSide`, `polygonOffset`).
- **Layering / sizing:** `pad = (CLOTH + layer * CLOTH_STEP) * SIZE_SCALE[size]` (`CLOTH = CLOTH_STEP = 0.011`; sizes XS 0.82 … XL 1.18), where `layer` is the worn-array index (so duplicate slots also separate) — generalises D-009.
- **Orientation bug (fixed, s7):** the avatar GLB is authored **inside-out** — winding *and* authored normals both face the interior (mirror-scaled root node). `extractBody()` runs a **signed-volume** test and negates the normals when negative, so the cloth grows outward. Evidence: `outwardXZ.dot` −0.369 → +0.369.
- **Body assets & gender (D-010):** `public/model/cogan.glb` (male) / `cecan.glb` (female). The **Model** toggle in `FittingRoom` writes `bato-fitting.gender`, which flows through `Mannequin` → `Mannequin3D`/`MannequinSvg` and the `wornLabel` a11y text. `src/constants/body.ts` (the old Tier B analytic refit) is **superseded / orphaned** after the swap — debt to delete.

## Navigation & anchor detail (CONFIRMED — re-synced 2026-10-18)

- **Routes** (`App.tsx`, 9): `/` (Home), `/shop`, `/product/:id`, `/wishlist`, `/outfit` (OutfitBuilder), `/checkout` (Checkout), `/orders` (Orders), `/orders/:id` (OrderConfirmation), `/size-guide` (SizeGuide), `*`→`/`. There is **no** `/story` or `/contact` route — those are **in-page anchors** on Home.
- **Page structure (Home):** Hero → NewArrivals → Statement → Marquee (signal) → Story (`#story`) → Marquee (ink) → **Contact (`#contact`)**.
- **Hash scrolling:** React Router does **not** scroll to the URL hash, so `ScrollToHash` (`Layout.tsx`) watches `useLocation()` (`pathname`/`hash`/`key`) and scrolls the element named by the hash into view (fallback: top). Anchored sections carry **`scroll-mt-20`** (80 px) so the scroll clears the sticky navbar; keying on `location.key` makes a **repeat click of the same hash re-scroll**. See DECISIONS D-012.
- **Search:** the Navbar has a real `role="search"` form (desktop + mobile) that navigates to `/shop?q=<term>`; `Shop` reads `?q` as the single source of truth (it also honours `?category` and `?sort=new`).
- **Mobile nav:** the hamburger panel repeats the nav links plus Search, **Wishlist**, **Orders** and (when signed in) **Account** — before Wave 0 `/wishlist` and `/orders` were desktop-only and unreachable on mobile.
- **Contact section** (`Contact.tsx`): `id="contact"`; left column = intro + `EMAIL` (`mailto:`) / `STUDIO`, both from `constants/commerce.ts` `CONTACT` (env-driven, with the variable name shown when unset); right column = a `name`/`email`/`message` form → `submitContactMessage` → success toast only on a real insert, honest failure otherwise.
- **Footer** (`Footer.tsx`): `FOOTER_TARGETS` maps every entry to a page that exists (`All products → /shop`, `New drop → /shop?sort=new`, `Size guide → /size-guide`, `Track order → /orders`, `Contact → /#contact`). Entries for unbuilt features were **deleted, not stubbed**; `href="#"` no longer occurs in `src/`. Social channels are filtered out when their `VITE_SOCIAL_*` value is blank; the legal row renders only when all three `VITE_POLICY_*_URL` are set. See DECISIONS D-019.

## Commerce layer detail (CONFIRMED — added 2026-10-18, Wave 0)

- **Variant plumbing** (`types/index.ts`, `store/cart.ts`): `ProductVariant{size, colorway}` with `null` meaning "not chosen"; `lineIdOf()` builds `` `${id}::${size??"?"}::${colorway??"?"}` ``; `CartItem extends Product, ProductVariant` and adds `quantity` + `lineId`; `OrderItem` carries `size`/`colorway`/`line_id`. Persist schema `version: 2` with a sanitising `migrate` (see D-015/D-016).
- **Size enforcement** (`SIZES` in `constants/fit.ts` is the single authority): `ProductDetail` blocks "Add to bag" until a size is chosen; `ProductCard`/`Wishlist` render a "Pilih ukuran" link to the PDP; `OutfitBuilder` passes a per-slot size and refuses "Shop this look" if any piece is unsized; `CartDrawer` shows the size (or a "Choose size" link); **Checkout refuses to create an order** when any line lacks a size **or** carries a size outside `SIZES`. See D-017.
- **Money** (`lib/money.ts`, `constants/commerce.ts`): whole rupiah everywhere, `id-ID` grouping, `toRupiah` guards non-finite input, `normalizeIDR` handles the ICU U+00A0. Free shipping at ≥ Rp 1.500.000 applies to **Reguler only**; Ekspres is a flat Rp 45.000. See D-018.
- **Payments** (`lib/payments.ts`): `availableProviders()` is the only source of the checkout payment list. Manual transfer requires all three `VITE_PAYMENT_*` values; Midtrans is `available: false` (Wave 1) and its stub still posts client-computed amounts (SEC-002). See D-020.
- **Orders** (`lib/orders.ts`): `createOrder` → `CreateOrderResult`; `23505` retry × 3 with a fresh `BTPK-YYMMDD-XXXXXX`; Supabase for signed-in + configured builds, `localStorage` for guests; **no silent downgrade to a local row on a Supabase failure**. See D-021.
- **Leads** (`lib/lead.ts`): bounded input mirroring the migration's `check` constraints, gated by `isSupabaseConfiguredForWrites`, returning `LeadResult`. `contact_messages`/`newsletter_subscribers` are INSERT-only for `anon` with **no rate limiting** (SEC-003).
- **Accessibility additions:** `SizeGuide.tsx` is a focus-trapped `role="dialog"` with `aria-modal`, Escape-to-close, focus restore and reduced-motion awareness, sharing `SizeGuideContent.tsx` with the PDP; `LineImage.tsx` renders a labelled placeholder instead of `<img src="">` for legacy rows.

## Drift watch

- When code diverges from this file, log a section in ARCHITECTURE_DRIFT.md.
- **2026-10-18 (Wave 0):** a whole commerce layer existed with no architecture entry (Checkout/Orders were documented as placeholders). Logged as **commerce-layer drift** in ARCHITECTURE_DRIFT.md and **RESOLVED** by this re-sync.
- Residual accepted drift: orphaned `src/constants/body.ts`, `ProductImageStack.tsx.bak`, `ProductImageStackComp.tsx` (dead files, documented in TECHNICAL_DEBT).
