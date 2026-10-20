# ARCHITECTURE_DRIFT

> Project Brain file · Created ONLY when meaningful drift between documented architecture and actual code is detected. Confidence: CONFIRMED (verified against code).
> Initialized 2026-10-13.

## Detected drift

### Initialization pass — no verified drift
- **Documented:** ARCHITECTURE.md describes a client-only React/Vite SPA (presentation → routing → zustand state → static data → assets).
- **Actual:** Matches. No undocumented modules, no obsolete modules, no unexpected imports, no circular dependencies found during the initial scan. — CONFIRMED.
- **Detected:** 2026-10-13
- **Severity:** none
- **Action:** none (baseline established). The deviations recorded here are documentation-vs-brief, not architecture drift.
- **Status:** RESOLVED (informational).

## Detected drift — Wave 0 (2026-10-18)

### Commerce layer existed with zero architecture documentation
- **Documented:** ARCHITECTURE.md described a client-only SPA whose only backend was Supabase
  **Auth**; "API flow: None", "Database flow: None", 6 routes; CURRENT_STATE/REQUIREMENTS/
  KNOWN_ISSUES/TECHNICAL_DEBT all described Checkout as a toast placeholder with "no backend,
  no database, no API".
- **Actual (verified by reading the code):** a full commerce layer — `pages/Checkout.tsx`,
  `pages/Orders.tsx`, `pages/OrderConfirmation.tsx`, `pages/SizeGuide.tsx`,
  `lib/orders.ts`, `lib/payments.ts`, `lib/lead.ts`, `lib/money.ts`, `lib/env.ts`,
  `constants/commerce.ts`, `components/{SizeGuide,SizeGuideContent,LineImage}.tsx`,
  `supabase/migrations/20261018_orders.sql` and `20261019_leads.sql`, **9 routes**, a
  variant-keyed cart (`store/cart.ts` v2), and **9 test files / 141 tests** — CONFIRMED.
- **Detected:** 2026-10-18
- **Severity:** HIGH (the documentation actively misled: a security reviewer flagged that a
  brain claiming "no secrets, no PII" is worse than no brain)
- **Action:** ARCHITECTURE.md, CURRENT_STATE.md, REQUIREMENTS.md, KNOWN_ISSUES.md,
  TECHNICAL_DEBT.md, TESTING.md, SECURITY.md, STACK.md, CONVENTIONS.md, PROJECT.md,
  DEPENDENCIES.md, PROJECT_HEALTH.md and INDEX.md re-synced; decisions D-015…D-021 added;
  task record tasks/TASK-008.md created. Retracted claims are enumerated in SECURITY.md.
- **Status:** RESOLVED

### Price authority lives outside the architecture entirely
- **Documented:** N/A — no server-side commerce layer exists in code either.
- **Actual:** `createOrder` computes and inserts `subtotal`/`shipping_cost`/`total`/`items`/
  `address`/`payment_method`/`status` from the browser; the `public.orders` RLS insert policy
  constrains only `auth.uid() = user_id`; the inactive Midtrans stub posts the client-computed
  `amount` — CONFIRMED (SEC-001, SEC-002, ISSUE-009, ISSUE-010).
- **Detected:** 2026-10-18
- **Severity:** **CRITICAL**
- **Action:** requires a Supabase Edge Function (service role) owning order creation and price
  recomputation. **Not applied** — it is a product/infrastructure decision, and revoking the
  insert grant first would stop orders being creatable.
- **Status:** OPEN

### AuthModal lint warnings (unused destructure + set-state-in-effect)
- **Documented:** N/A
- **Actual:** `oxlint` still reports `AuthModal.tsx:35` `react(set-state-in-effect)` when
  `authModalOpen` opens (resets form fields) — CONFIRMED (re-verified 2026-10-18; the two
  unused-destructure warnings previously logged are gone).
- **Detected:** 2026-10-17
- **Severity:** LOW (dev-experience, no user impact)
- **Action:** the form-field reset on open could be done via a `key` re-mount instead of setState-in-effect.
- **Status:** OPEN

## Documentation drift (non-architectural, recorded for completeness)


### Auth + Outfit Builder drift (documented as "not implemented" but already in code)
- **Documented:** ARCHITECTURE.md says "Authentication flow — None. Sign In buttons are non-functional placeholders". CURRENT_STATE says "Sign in / auth — PLANNED / NOT IMPLEMENTED". INDEX.md/ARCHITECTURE make no mention of an Outfit Builder.
- **Actual:** `src/lib/supabase.ts` + `src/store/auth.ts` (zustand persist store `bato-auth`) + `src/components/AuthModal.tsx` is a fully wired Supabase auth flow (email/password + Google/GitHub OAuth, session recovery on mount, onAuthStateChange). Navbar shows Sign In/Sign Out. App.tsx calls `useAuthStore.initialize()`. Outfit Builder (`/outfit`) exists at `src/pages/OutfitBuilder.tsx`, registered in App.tsx routes, linked in Navbar. Env vars in `.env`. — CONFIRMED (code inspected 2026-10-17)
- **Detected:** 2026-10-17
- **Severity:** HIGH (documentation materially under-describes the shipped product)
- **Action:** ARCHITECTURE.md, CURRENT_STATE.md, KNOWN_ISSUES.md ISSUE-003, TECHNICAL_DEBT.md, INDEX.md, CHANGE_HISTORY.md updated to reflect actual code. See DECISIONS for any new decisions to record.
- **Status:** RESOLVED

### README is generic Vite template
- **Documented:** The repo's `README.md`.
- **Actual:** Contains only the default Vite + React + TS template copy; it does not describe BERTEMPK, the fitting room, or the asset pipeline. — CONFIRMED (`README.md`).
- **Detected:** 2026-10-13
- **Severity:** LOW
- **Action:** update docs (write a real README) — suggested, not applied (out of brain scope).
- **Status:** OPEN.

### Dev port not in config
- **Documented:** N/A in ARCHITECTURE.md; noted in CONVENTIONS/DEPLOYMENT.
- **Actual:** Known dev URL uses port 5200 from the launch command, not `vite.config.ts`. — CONFIRMED.
- **Detected:** 2026-10-13
- **Severity:** LOW
- **Action:** accept-and-record (see KNOWN_ISSUES ISSUE-002).
- **Status:** OPEN (logged).

## Detector checklist (run during audits)

- Undocumented modules — **Wave 0 found 11 previously undocumented modules** (checkout/orders/
  payments/lead/money/env/commerce-constants/size-guide/line-image + 2 SQL migrations) — all
  now documented (2026-10-18). Prior check (2026-10-13) found none.
- Dead modules — `src/constants/body.ts` (0 importers), `src/components/ProductImageStack.tsx.bak`,
  `src/components/ProductImageStackComp.tsx` — CONFIRMED 2026-10-18, documented as debt.
- Obsolete modules — none found.
- Unexpected dependencies — none: `@react-three/fiber`/`drei` are now used at runtime by the **default** fitting-room mannequin (`Mannequin3D`) as well as the opt-in hero turntable (`USE_GLB=false`); documented in ARCHITECTURE.md, not drift (2026-10-13).
- Circular dependencies — none observed.
- Duplicated architecture — none.
- Outdated decisions — none (docs match code).

## Rules

- Only log drift verified against actual source; never guess.
- Resolution always updates the source of truth (code or brain), never both silently.
- After resolution, update ARCHITECTURE.md / DECISIONS.md and mark the entry RESOLVED.
