# TECHNICAL_DEBT

> Project Brain file · Tracked debt only; each item with impact and recommended solution. Confidence markers apply.
> **Re-synced 2026-10-18 (Wave 0).** "No automated tests" and "Unimplemented checkout" were
> **retracted** — both are now false. Risk items live in KNOWN_ISSUES / SECURITY; the entries
> below are structural debt only.

## Debt items

### Oversized production JS chunks (>500 kB)
- **Description:** `npm run build` emits "Some chunks are larger than 500 kB after minification". Current artifact (rebuilt 2026-10-18): `ContactShadows-*.js` = **931 055 B (~931 kB)** and `index-*.js` = **820 060 B (~820 kB)**; `Mannequin3D-*.js` 77 718 B and `GarmentTurntable-*.js` 3 778 B are lazy. The `ContactShadows` chunk is the shared three/R3F/drei vendor code (Vite names it after the last split module). **The main chunk grew from ~531 kB (2026-10-14) to ~820 kB when `@supabase/supabase-js` was pulled into it** — the cause is INFERRED from the dependency change (not bundle-analysed). — CONFIRMED (sizes), INFERRED (cause)
- **Impact:** Slower parse/load on low-end devices; two chunks above the warning threshold. — CONFIRMED.
- **Priority:** MEDIUM.
- **Estimated complexity:** M.
- **Recommended solution:** add `build.rollupOptions.output.manualChunks` (separate `three`/R3F/drei and `supabase` from app code) — `vite.config.ts` has **no `manualChunks` today** — or raise `chunkSizeWarningLimit` with justification. Route-level code-splitting for `/checkout`, `/orders` and `/outfit` is a further option. — INFERRED.
- **Also (review finding M4):** `ContactShadows` pulls a large share of that vendor chunk even though the stage uses only a few lights; consider a lighter shadow approach. — INFERRED.
- **Status:** PARTIALLY ADDRESSED (2026-10-19) — added `manualChunks` for three/R3F/drei, supabase, and motion. Main chunk reduced from ~820 kB to ~285 kB; supabase ~225 kB; three-vendor ~1.2 MB (inherent to three.js).

### Unused/un-capped lathe shells and `DoubleSide` materials (review M1)
- **Description:** The 3D garment shells are open lathes rendered `DoubleSide`, so back faces are drawn and draw calls are somewhat wasteful; true "thickness" is faked by the `pad` offset (F-005). — CONFIRMED (code + review finding M1).
- **Impact:** Minor GPU/render cost and a slightly flat read on close silhouettes; no correctness bug now that layers are separated. — INFERRED.
- **Priority:** LOW.
- **Estimated complexity:** S–M (cap the lathes / single-side where safe).
- **Recommended solution:** cap shell lathes and drop `DoubleSide` where the camera never sees the interior; re-verify layering and the fallback. — INFERRED.
- **Status:** OPEN (deferred by decision 2026-10-13).

### 3D stage rotation is pointer-drag only (review M3)
- **Description:** The mannequin rotates via `OrbitControls` drag; there is no keyboard path to rotate. The stage is exposed as `role="img"` with a text label shared with the SVG (`wornLabel()`), so it is at least announced. — CONFIRMED (review finding M3; still true 2026-10-18).
- **Impact:** A keyboard-only user cannot rotate the figure (they can still read the label and use every non-3D control). — CONFIRMED.
- **Priority:** LOW–MEDIUM (accessibility).
- **Estimated complexity:** S (native arrow-key handling on the stage) — but any change must keep the `role="img"`/label parity verified.
- **Recommended solution:** add arrow-key rotation with a visible focus ring, or document the stage as decorative and keep the label; decide with an accessibility check (no formal a11y audit exists — REQUIREMENTS). — INFERRED.
- **Status:** OPEN (deferred by decision 2026-10-13).

### THREE.Clock deprecation warning
- **Description:** Installed `three@0.186.1` ships `warn('Clock: This module has been deprecated. Please use THREE.Timer instead.'); // @deprecated, r183` (`node_modules/three/build/three.core.js`). The project's own `src` does not instantiate `THREE.Clock`; the warning surfaces at runtime via `@react-three/fiber`. — CONFIRMED (deprecation text) / INFERRED (runtime source).
- **Impact:** Console noise; future three.js removal risk. — INFERRED.
- **Priority:** LOW.
- **Estimated complexity:** S (track upstream).
- **Recommended solution:** Upgrade `@react-three/fiber`/`drei` when they migrate to `THREE.Timer`; do not patch three locally. — INFERRED.
- **Status:** OPEN.

### Static Pexels image URLs, no local optimisation
- **Description:** Product/hero/story images are hotlinked from `images.pexels.com` with query params; no local caching, `srcset`, or `<picture>` variants. — CONFIRMED.
- **Impact:** Third-party dependency, uncontrolled LCP, layout risk if URLs change. — INFERRED.
- **Priority:** LOW–MEDIUM.
- **Estimated complexity:** M.
- **Recommended solution:** Download/vendor optimised local assets or add responsive image variants. — INFERRED.
- **Status:** OPEN.

### No server-side price authority (Wave 0 consequence)
- **Description:** The commerce layer exists entirely in the browser. `createOrder` computes and inserts `subtotal`/`shipping_cost`/`total`/`items`/`address`/`payment_method`/`status`; `public.orders` RLS constrains row ownership only. No Edge Function, no server-side recomputation, no price catalogue outside `src/constants/products.ts`. — CONFIRMED
- **Impact:** Financial integrity cannot be guaranteed; a signed-in user can write any `total` or a `paid` status. This is a **release blocker**, tracked as ISSUE-009 / SECURITY SEC-001. — CONFIRMED
- **Priority:** **HIGH.**
- **Estimated complexity:** L (Edge Function + server-side catalogue + tests).
- **Recommended solution:** move order creation to a service-role Edge Function that recomputes totals from its own catalogue; only then narrow the insert grant. — INFERRED
- **Status:** RESOLVED (Phase 1, 2026-10-19) — moved to `create-order` Edge Function.

### `localStorage` keys still use the legacy brand name
- **Description:** Every persisted key predates the BERTEMPK rename: `bato-cart`, `bato-wishlist`, `bato-fitting`, `bato-orders`, `bato-auth`. Renaming would orphan every existing shopper's bag, wishlist and guest orders. — CONFIRMED (all five keys read 2026-10-18).
- **Impact:** Brand inconsistency in developer tooling and storage inspection; no user-visible defect. — CONFIRMED
- **Priority:** LOW.
- **Estimated complexity:** S (rename + a one-shot migration that reads the old key).
- **Recommended solution:** migrate on next major release, or accept permanently and document. — INFERRED
- **Status:** OPEN (carried over from 2026-10-13, now enumerated).

### `VITE_PAYMENT_ENDPOINT` used but undocumented in `.env.example`
- **Description:** `src/lib/payments.ts` reads `VITE_PAYMENT_ENDPOINT`; `.env.example` lists 14 variable names and omits it. — CONFIRMED (2026-10-18).
- **Impact:** A Wave 1 developer has no documented contract for the payment endpoint. — INFERRED
- **Priority:** LOW.
- **Estimated complexity:** S (add a commented entry).
- **Recommended solution:** add the variable (and its "secret key must stay server-side" note) to `.env.example`. — INFERRED
- **Status:** OPEN (ISSUE-019).

### Orphaned and duplicate source files
- **Description:** `src/constants/body.ts` has **zero importers** after the Tier C bone-driven swap (D-011); `src/components/ProductImageStack.tsx.bak` and `src/components/ProductImageStackComp.tsx` are unused. — CONFIRMED (2026-10-18)
- **Impact:** Dead code / misleading second sources of truth. — INFERRED
- **Priority:** LOW.
- **Estimated complexity:** S (verify zero references, delete).
- **Recommended solution:** delete all three; ARCHITECTURE.md/DECISIONS.md already mark `body.ts` superseded. — INFERRED
- **Status:** OPEN.

### No `strict` in any tsconfig
- **Description:** `tsconfig.app.json` / `tsconfig.node.json` set `noUnusedLocals`, `noUnusedParameters` and `erasableSyntaxOnly`, but **not `strict`**. `tsc -b` exits 0 under these settings only. — CONFIRMED (2026-10-18)
- **Impact:** `null`/`undefined` mistakes are not caught at compile time — directly relevant to the variant/legacy-cart work, where `size: string | null` is a first-class state. — INFERRED
- **Priority:** MEDIUM.
- **Estimated complexity:** M (the Wave 0 modules are already null-safe; older 3D code may not be).
- **Recommended solution:** enable `strict` (start with `strictNullChecks`) on a branch and fix fallout incrementally. — INFERRED
- **Status:** OPEN.

### Duplicate/unused config predicates (`isSupabaseConfigured` vs `isSupabaseConfiguredForWrites`)
- **Description:** Two functions answer "is Supabase configured?" and disagree — see ISSUE-015. — CONFIRMED
- **Impact:** Misleading feature gating: a half-filled `.env` can pass one and fail the other. — CONFIRMED
- **Priority:** LOW–MEDIUM.
- **Estimated complexity:** S.
- **Recommended solution:** keep `hasValue` in `lib/env.ts` as the single source of truth and have `lib/supabase.ts` delegate. — INFERRED
- **Status:** OPEN.

### AnimatePresence `mode="wait"` warnings on `/outfit`
- **Description:** `motion` logged `mode="wait"` transition warnings while navigating the Outfit Builder (multiple children inside `AnimatePresence mode="wait"`). — CONFIRMED (session report 2026-10-18).
- **Impact:** Console noise only; no functional defect observed. — INFERRED
- **Priority:** LOW.
- **Estimated complexity:** S.
- **Recommended solution:** align exit/enter timings so `mode="wait"` has nothing to wait for, or drop `mode="wait"` where the overlap is acceptable. — INFERRED
- **Status:** RESOLVED 2026-10-19 — changed `mode="wait"` to `mode="sync"` in `src/pages/OutfitBuilder.tsx` (products grid). Only the `THREE.Clock` deprecation (library-level, three.js) remains.

### Placeholder Contact details (partially resolved in Wave 0)
- **Description:** `Contact.tsx` no longer hardcodes `studio@bertempk.com` / `Berlin, Germany`; it reads `CONTACT` from `constants/commerce.ts`, which is env-driven (`VITE_CONTACT_EMAIL`, `VITE_BRAND_ORIGIN`) and **renders the variable name as guidance when unset**. What remains unresolved is the **brand origin contradiction** ("built in Berlin" in `index.html`/`Footer.tsx` vs `Indonesia` default) — ISSUE-016. — CONFIRMED (2026-10-18)
- **Impact:** The page is honest but incomplete without real values. — CONFIRMED
- **Priority:** LOW–MEDIUM (content/owner decision, not code).
- **Estimated complexity:** S (set the env vars; decide the origin).
- **Recommended solution:** owner sets `VITE_CONTACT_EMAIL` / `VITE_BRAND_ORIGIN` and settles the Berlin-vs-Indonesia copy. — INFERRED
- **Status:** PARTIALLY ADDRESSED (see ISSUE-016).

### README is still the generic Vite template
- **Description:** `README.md` contains the default Vite + React + TS template text; it does not mention BERTEMPK, the fitting room, the commerce layer or the asset pipeline. — CONFIRMED (2026-10-18)
- **Impact:** A new contributor starts with no orientation. — INFERRED
- **Priority:** LOW–MEDIUM.
- **Estimated complexity:** S–M.
- **Recommended solution:** write a real README (dev server, `npm run build`, env vars, test/lint commands, asset constraints from D-004). — INFERRED
- **Status:** OPEN (carried over).

## Retired debt items

- **"No automated tests"** — RETRACTED 2026-10-18. `vitest` 5.0.5 + Testing Library + jsdom are installed; **9 test files / 141 tests**, all passing. See TESTING.md.
- **"Unimplemented checkout"** — RETRACTED 2026-10-18. A real checkout, order list, order confirmation and order persistence exist. The residual concern is **not** absence but the client-side price authority (tracked above as ISSUE-009 / SEC-001).
- **"Inert footer links (`href="#"`)"** — ADDRESSED 2026-10-18. `href="#"` is gone from `src/`; dead entries were deleted, not stubbed (ISSUE-020).

## Maintenance

- Prune items no longer valid; mark ADDRESSED with a pointer to the change. Do not delete history silently.