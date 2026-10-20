# TASK-008 · Wave 0 — commerce, variants, IDR money, honesty gates (+ brain re-sync)

> Task record. Confidence markers apply (CONFIRMED / INFERRED / UNKNOWN).
> Session: **2026-10-18** — *"BERTEMPK live + Wave 0"*. This record covers the implementation
> **and** the Project Brain re-sync performed afterwards, because the brain had drifted to
> actively misleading claims.

## Goal

Turn a front-end demo into something that can take an order **honestly**, without
pretending to things it cannot do:

1. A cart that knows about **variants** (size), because apparel sold by size with a
   product-id-keyed cart will ship the wrong garment.
2. **Indonesian rupiah** as the only money representation.
3. **No dead links**, no placeholder payment details, no unreachable mobile destinations.
4. **Honest writes**: never report success for something that was not stored.
5. Keep the customer from being able to buy the wrong thing (size gate) or something
   nobody can pay for (payment gate).

Explicitly **out of scope for Wave 0**: a real payment gateway, a server-side price
authority, and applying the leads migration.

## What changed

### 1. Variant plumbing — `types/index.ts`, `store/cart.ts`
- `ProductVariant{size, colorway}` (both `string | null`; null = not chosen / legacy).
- `lineIdOf(p, v)` → `` `${id}::${size??"?"}::${colorway??"?"}` `` — a null-aware stable key.
- `CartItem extends Product, ProductVariant` + `quantity` + `lineId`; `OrderItem` gains
  `size`, `colorway`, `line_id`.
- `store/cart.ts` rewritten: keyed on `lineId`, zustand persist **`version: 2`** with a
  `migrate` that tolerates non-arrays/junk rows, sanitises via `safeQuantity`/`safeText`,
  **merges duplicate `lineId` rows by summing quantity**, and **never invents a size**.
- Decisions: **D-015** (variant keying), **D-016** (legacy → `size:null`, not "M").

### 2. Size enforced end-to-end
- `ProductDetail`: `size` starts `null`, "Add to bag" disabled until chosen
  (`aria-describedby` hint), no "M" default.
- `ProductCard` / `Wishlist`: quick-add replaced by a **"Pilih ukuran" link to the PDP**.
- `OutfitBuilder`: per-slot size; "Shop this look" refuses an unsized look.
- `CartDrawer`: shows the size (or a "Choose size" link) + free-shipping hint.
- `Checkout`: **Gate 2** — refuses to create an order when any line lacks a size,
  validated against `SIZES` (so a hand-edited `"XXXL"` is refused too).
- Decision: **D-017**.

### 3. IDR money — `src/lib/money.ts`, `src/constants/commerce.ts`
- `formatIDR`, `toRupiah` (`Number.isFinite` guard, clamp ≥ 0), `normalizeIDR` (ICU U+00A0).
- `CURRENCY`, `FREE_SHIPPING_THRESHOLD = 1_500_000`, `SHIPPING_METHODS` (Reguler 25.000 /
  3–5 hari kerja / free-eligible; Ekspres 45.000 / 1–2 hari kerja / never free),
  `shippingCostFor`, `freeShippingHint`, `FREE_SHIPPING_LABEL`, env-driven `CONTACT`.
- `constants/products.ts` prices are now whole rupiah (p1 1.290.000 · p2 989.000 ·
  p3 1.190.000 · p4 1.590.000 · p5 749.000 · p6 1.190.000).
- **Every `.toFixed(2)` and every `$` price in `src/` is gone** — CONFIRMED (grep).
- Decision: **D-018**.

### 4. Honesty gates — `src/lib/payments.ts`, `src/pages/Checkout.tsx`
- The hardcoded placeholder bank details were **deleted**.
  Manual transfer is now env-driven (`VITE_PAYMENT_BANK_NAME` / `_ACCOUNT_NUMBER` /
  `_ACCOUNT_NAME`) behind `hasValue`; partial configs stay unavailable.
- Midtrans is registered but permanently `available: false` (`// Wave 1`).
- Checkout shows "Belum ada metode pembayaran yang aktif" and **disables Place order** when
  `availableProviders()` is empty.
- Decisions: **D-020**, **D-021**.

### 5. Failed writes are no longer successes — `src/lib/orders.ts`
- `createOrder` returns a discriminated `CreateOrderResult`
  (`ok:true` + `storage:"supabase"|"local"` | `ok:false` + `reason:"persist-failed"|"invalid-items"`
  + `storage:"none"`). On a Supabase failure **while Supabase is configured**, Checkout warns,
  **does not clear the bag** and **does not navigate** — the order exists nowhere.
- `generateOrderNumber` → `BTPK-YYMMDD-XXXXXX` (6 chars from a 32-symbol alphabet, no
  I/O/0/1), retry ×3 on Postgres `23505`.

### 6. Leads — `src/lib/lead.ts`, `supabase/migrations/20261019_leads.sql`
- `submitContactMessage`, `subscribeNewsletter`, `LeadResult` — never reports success for a
  write that did not happen. Client-side bounds mirror the migration's `check` constraints.
- Migration: `contact_messages` + `newsletter_subscribers`, RLS **enabled and forced**,
  `insert` for `anon, authenticated`, **explicit `revoke select, update, delete`**, unique
  index on `lower(email)`, email length + regex bounds.
- **The migration has NEVER been executed against the live project** — until it is, both
  forms honestly report "not active". `Contact.tsx` and the footer newsletter are wired.
- Risk recorded: this is an **open anon write endpoint with no rate limiting** (SEC-003).

### 7. No dead links, mobile reachability, accessibility
- `grep 'href="#"' src/` → **0 matches**. Best sellers / Archive sale / Gift cards /
  Shipping / Returns / Discord **deleted**; social channels env-driven and hidden when
  unset; legal row only when all three `VITE_POLICY_*_URL` are set; "Size guide" → new
  `/size-guide` route; "Track order" → `/orders`. Decision: **D-019**.
- Hamburger now exposes Search, Wishlist, Orders and Account (mobile previously **could
  not reach** `/wishlist` or `/orders` at all). Navbar search is a real form → `/shop?q=`;
  `Shop` treats `?q` as the single source of truth.
- New `SizeGuide` dialog: `role="dialog"`, `aria-modal`, labelled, Escape, focus in/restore,
  Tab trap, reduced-motion aware, sharing `SizeGuideContent.tsx` with the PDP.
- New `components/LineImage.tsx`: accessible placeholder instead of `<img src="">`.

### 8. Repo hygiene
- `.gitignore` now excludes `.env` / `.env.*` with `!.env.example`.
- `.env.example` gained 12 placeholder-only variable names (14 total).
- `supabase/migrations/20261018_orders.sql` (orders table + RLS select/insert) added.

## Validation (the session's evidence)

- `npx tsc -b` → **exit 0**
- `npx oxlint` → **exit 0**, 1 pre-existing warning
  (`src/components/AuthModal.tsx:35` `react(set-state-in-effect)`)
- `npx vitest run` → **141 passed / 9 files** (re-verified by the brain update, same day)
- `npx vite build` → **success, 13.72 s**
- Browser-verified at `http://127.0.0.1:5200/` (Chromium via Playwright): home / shop / PDP /
  cart / checkout / size-guide / orders all render with **0 console errors**; a seeded legacy
  v1 cart migrates to v2 with `size:null` and renders **2 image placeholders, 0 broken
  images**; the size gate blocks checkout for unsized lines; the payment gate blocks order
  placement with `bato-orders` left `null`; IDR formatting correct throughout; the 3D fitting
  room intact.

## Open risks found (this is the important part)

| Risk | Severity | Where |
|---|---|---|
| **Price authority is client-side** — `public.orders` insert policy constrains only `auth.uid() = user_id`, so `total`, `subtotal`, `items`, `address`, `payment_method` **and `status`** are attacker-chosen (`status:'paid', total:1` is accepted). No server-side recomputation. | **CRITICAL** — hard blocker before real payments | SECURITY SEC-001, KNOWN_ISSUES ISSUE-009 |
| Midtrans stub sends the **client-computed** `amount` and `items[].price`; unreachable today (`available:false`). The endpoint must recompute from its own catalogue keyed on `order_id` and ignore the body. | HIGH (latent) | SEC-002, ISSUE-010 |
| `contact_messages` / `newsletter_subscribers` are **INSERT-only open endpoints for `anon`** — spam, row-bloat, forged consent; needs honeypot / rate limit / Turnstile before launch | HIGH | SEC-003, ISSUE-013 |
| Newsletter duplicate → generic error instead of "already on the list" | LOW | SEC-004, ISSUE-014 |
| **PII**: guest orders (full shipping address) persist indefinitely in `localStorage` `bato-orders` and are **never cleared on sign-out**; no privacy notice, consent or retention rule; legal footer row hidden. UU PDP 27/2022 preconditions. | HIGH | SEC-005/006, ISSUE-011/012 |
| `isSupabaseConfigured` vs `isSupabaseConfiguredForWrites` disagree (a copy-pasted `.env.example` passes one, fails the other) | LOW–MEDIUM | ISSUE-015 |
| Brand contradiction: "built in Berlin" (`index.html`, `Footer.tsx`) vs IDR prices / Indonesian copy / `CONTACT.origin` default `Indonesia` | MEDIUM (owner decision) | ISSUE-016 |
| Outfit Builder Share link `?look=<base64>` is read by nothing (`btoa` also throws on non-Latin1); `colors` state never set → dead colourway picker | MEDIUM | ISSUE-017 |
| `VITE_PAYMENT_ENDPOINT` used but missing from `.env.example` | LOW | ISSUE-019 |
| QA side effect: browser QA created a real auth user `qa.mobilenav.verify@example.com` ("QA Mobile Nav", auto-confirmed) in the **dev** project. Local session signed out; **the row still needs manual deletion.** | LOW | ISSUE-018 |

Pre-existing debt still open: chunk >500 kB (`ContactShadows` ~931 kB, index ~820 kB;
`vite.config.ts` has no `manualChunks`); 3D rotation pointer-drag only (no keyboard path);
orphaned `constants/body.ts`, `ProductImageStack.tsx.bak`, `ProductImageStackComp.tsx`;
`localStorage` keys still on the legacy brand prefix (`bato-cart`, `bato-orders`,
`bato-wishlist`, `bato-fitting`, `bato-auth`); **no `strict` in any tsconfig**;
`THREE.Clock` deprecation; AnimatePresence `mode="wait"` warnings on `/outfit`.

## Brain re-sync (the part this session added)

Code is the authority. Before this, the brain claimed — falsely — that Checkout was a toast
placeholder, that there was "no backend, no database, no API", "no automated tests exist",
"no authentication model", "no `.env`", "no secrets", "no server-side PII", and a
non-submitting newsletter. A security reviewer noted that a brain asserting "no secrets, no
PII" is **worse than no brain**.

Updated: `CURRENT_STATE`, `REQUIREMENTS`, `SECURITY`, `KNOWN_ISSUES`, `TECHNICAL_DEBT`,
`TESTING`, `ARCHITECTURE`, `DEPLOYMENT`, `DECISIONS` (D-015…D-021), `DEPENDENCIES`,
`PROJECT`, `CONVENTIONS`, `STACK`, `PROJECT_HEALTH`, `BRAIN_AUDIT`, `ARCHITECTURE_DRIFT`,
`CHANGE_HISTORY`, `INDEX`, `SESSION_LOG`, plus this record.
Retracted claims are listed explicitly in SECURITY.md ("Retracted claims") so they cannot
be silently reintroduced.

## Result

**IMPLEMENTED / VERIFIED (2026-10-18)** — all gates green, 141/141 tests, browser-verified
with 0 console errors. The commerce layer is functionally complete and honest about what it
cannot do. It is **not** safe for real payments until a server-side price authority exists.

## Lessons

- **A placeholder that looks real is a liability.** A hardcoded bank account in source is
  indistinguishable from a live one; "no payment method configured" is the honest state.
- **A gate is only real if every path passes through it.** Quick-add from a product card
  would have bypassed the size requirement, so the quick-add was removed rather than
  special-cased.
- **Never invent a value to satisfy an invariant.** Defaulting a legacy cart row to size
  "M" would satisfy the type and ship the wrong garment; `null` plus a checkout refusal
  satisfies the invariant *honestly*.
- **Reporting success for a failed write is a data-integrity bug**, not a UX nit: an order
  the studio never received, or a newsletter signup that never happened, both destroy trust
  silently. Make the result type carry the outcome.

## Open questions (need owner input)

1. Should Wave 1 proceed with a Supabase Edge Function owning order creation + price
   recomputation (recommended), or is a hosted commerce provider preferred?
2. Is the studio origin **Berlin or Indonesia**? (brand contradiction — ISSUE-016)
3. Real `VITE_CONTACT_EMAIL` / `VITE_BRAND_ORIGIN` values.
4. Publish the three legal pages (`VITE_POLICY_*`) — required before any live checkout.
5. Apply `20261019_leads.sql` (after spam protection) or leave leads inactive for now?