# TESTING

> Project Brain file · What testing EXISTS so new tests don't duplicate/conflict. Confidence markers apply.
> **Re-synced 2026-10-18 (Wave 0).** The previous version said "no automated test framework
> is installed" — that was **stale**. Vitest + Testing Library landed with the commerce work.

## Framework & tooling

- Unit + component: **Vitest 5.0.5** (`vitest run`, config `vitest.config.ts`, environment `jsdom`, setup file `src/test/setup.ts`) — CONFIRMED.
- Assertions/DOM: **@testing-library/react 16.3.3**, **jest-dom 7.0.1**, **user-event 14.6.8** — CONFIRMED (`package-lock.json`).
- E2E: **NONE in-repo** — CONFIRMED (no Playwright/Cypress dependency; browser QA is run through an external Playwright driver and is not reproducible from the repo).
- CI test stage: **NONE** — CONFIRMED (no CI config at all).
- Coverage tool: **NONE** — CONFIRMED. No coverage goal stated.
- **Env isolation (important):** `vitest.config.ts` pins `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` to placeholders and the payment/social/policy vars to `""`, so **a test can never touch the real Supabase project or make a payment provider look available** — CONFIRMED. Do not remove these pins.

## Test structure & layout

Tests live **next to the code** as `*.test.ts(x)` under `src/` (included by `vitest.config.ts`) — CONFIRMED.

| File | Covers |
|---|---|
| `src/store/cart.test.ts` | cart store: `lineId` dedupe, quantity coercion, legacy v1 → v2 migration, subtotal |
| `src/lib/money.test.ts` | `formatIDR`, `toRupiah` (incl. non-finite), `normalizeIDR` (U+00A0) |
| `src/constants/commerce.test.ts` | `shippingCostFor`, `freeShippingHint`, threshold, `CONTACT` |
| `src/lib/orders.test.ts` | order normalisation, `generateOrderNumber` format/uniqueness, `hasUnSizedLines` |
| `src/lib/orders.persist.test.ts` | `createOrder` persistence paths + honest failure (`ok:false`, nothing written) |
| `src/lib/payments.test.ts` | provider availability gates, `availableProviders`, no published account when unconfigured |
| `src/lib/lead.test.ts` | input bounds, `LeadResult` never reports success for a failed write |
| `src/pages/Checkout.test.tsx` | component: size gate, payment gate, address validation, place-order flow |
| `src/test/storefront.test.tsx` | storefront components: PDP size gate + add, SizeGuide dialog open/Escape, rupiah prices + free-shipping badge, Shop + Navbar search |

## Current results (2026-10-18)

- `npx vitest run` → **Test Files 9 passed (9) · Tests 141 passed (141)** — CONFIRMED (re-run by the brain update at 18:38; the build session reported the same).
- Benign jsdom noise during the run: `Not implemented: Window's scrollTo()` and `HTMLCanvasElement's getContext()` (no `canvas` package installed) — CONFIRMED, informational only.

## Other verification that exists

- **Type check:** `npx tsc -b` → exit 0 (2026-10-18). Must use `-b` (root `tsconfig.json` has `files: []` + project references). **No `strict` flag is enabled anywhere** (see TECHNICAL_DEBT). — CONFIRMED
- **Lint:** `npx oxlint` → exit 0 with **1 pre-existing warning**: `src/components/AuthModal.tsx:35` `react(set-state-in-effect)`. — CONFIRMED
- **Build:** `npx vite build` → exit 0 (13.72 s, 2026-10-18); emits the >500 kB chunk warning — CONFIRMED
- **Browser QA (external Playwright driver, 2026-10-18):** home / shop / PDP / cart / checkout / size-guide / orders all render with **0 console errors**; a seeded legacy v1 cart migrates to v2 with `size:null` and renders 2 image placeholders and 0 broken images; the size gate blocks checkout for unsized lines; the payment gate blocks order placement with `bato-orders` left `null`; IDR formatting correct throughout; the 3D fitting room intact — CONFIRMED (session report). **These checks are not reproducible from the repo** (no E2E dependency).
- **Pixel-probe visual QA (3D, artifacts not committed):** screenshot → ImageMagick → small node scripts in `/tmp/opencode` reporting measurable facts (silhouette bounds, tone map, edge rows, speckle metric). Used for F-005/F-006/F-007 — CONFIRMED.

## Test pyramid reality

| Level | Count | Frameworks |
|-------|-------|------------|
| Unit | most of the 141 | Vitest |
| Component/integration | subset of the 141 | Vitest + Testing Library |
| E2E | 0 (in-repo) | — |

## Important regression tests (now covered)

| Area | Protected by |
|---|---|
| Cart variant identity + legacy migration | `store/cart.test.ts` (D-015/D-016) |
| IDR formatting and non-finite guarding | `lib/money.test.ts`, `constants/commerce.test.ts` (D-018) |
| Shipping rules / free-shipping threshold | `constants/commerce.test.ts` |
| Payment availability gating (no published account when unconfigured) | `lib/payments.test.ts` (D-020) |
| Failed writes never reported as success | `lib/orders.persist.test.ts`, `lib/lead.test.ts` (D-021) |
| Checkout size + payment refusal gates | `pages/Checkout.test.tsx` (D-017) |

## Still uncovered (known gaps)

- **No test asserts anything about RLS.** The policies in `supabase/migrations/*.sql` are untested; the client-side price-authority risk (SEC-001) is invisible to the suite by construction — a green run says nothing about it.
- Hero stacking rule (ISSUE-001), fitting-room layering/colour/size (D-003/D-009) remain manual/pixel-probe only.
- No e2e; the browser-verified behaviour above cannot be re-run from the repo.

## Current health

- Static checks green (`tsc -b`, `oxlint` with 1 known warning, build); **141/141 tests pass, no flakes observed** — CONFIRMED (2026-10-18).

## Rules

- Before writing tests, read this file. Keep test env vars pinned in `vitest.config.ts`.
- Tests that touch Supabase must mock the client; never point a test at the live project.
- Update after adding/removing test types or a major suite change.