# PROJECT_HEALTH

> Project Brain file · Conceptual health assessment. GREEN/YELLOW/RED only. Confidence: CONFIRMED (measured/audited), INFERRED.
> **Re-assessed 2026-10-18 after Wave 0** (previous assessment: 2026-10-13).

## Scorecard

| Category | Status | Reasoning |
|----------|--------|-----------|
| Architecture | **YELLOW** | Modules are cleanly separated and the commerce layer is coherent (types → stores → lib → Supabase), but there is **no server tier**: price computation, payment selection and order creation all live in the browser, so a core business invariant (the amount charged) has no server owner — CONFIRMED (SEC-001). Long-standing orphans (`constants/body.ts`, `ProductImageStack.tsx.bak`) remain — CONFIRMED. |
| Code Quality | **GREEN** | `npx tsc -b` exit 0 · `npx oxlint` exit 0 with **1 known pre-existing warning** (`AuthModal.tsx:35`) · `npx vite build` exit 0 — all CONFIRMED 2026-10-18. Wave 0 code is heavily commented with explicit rationale. Caveat: **`strict` is off in every tsconfig**, so the `string \| null` variant handling is not compiler-checked — CONFIRMED. |
| Testing | **YELLOW** | Was RED. Now **9 files / 141 tests, all passing** — CONFIRMED (re-run 2026-10-18). Coverage is real for the Wave 0 invariants (cart migration, IDR formatting, shipping rules, payment gating, honest write failures, checkout gates). **Still zero coverage of RLS, of the Edge-Function path that does not exist, and of e2e** — a green suite cannot see the price-authority risk at all. |
| Security | **RED** | **CRITICAL:** order prices and `status` are client-chosen; a signed-in user can insert `status:'paid', total:1` (SEC-001). **HIGH:** guest addresses persist forever in `localStorage` and are never cleared on sign-out (SEC-005); the leads tables are open anon write endpoints with no rate limiting (SEC-003); no privacy notice/consent/retention (SEC-006). Upside: `.env` is now gitignored, no secret is committed, RLS is on and `.env.example` is placeholder-only. |
| Compliance / privacy | **RED** | Personal data (address, email, phone, contact messages, newsletter emails) is collected with **no privacy policy page reachable**, no consent capture and no retention/deletion path. Under UU PDP 27/2022 these are preconditions before enabling leads or a live checkout — CONFIRMED (gap), INFERRED (applicability). |
| Performance | **YELLOW** | `ContactShadows` chunk ~931 kB and the main chunk ~820 kB (both >500 kB); 3D paths are already lazy. `vite.config.ts` has **no `manualChunks`**. The main chunk grew ~290 kB when `@supabase/supabase-js` landed in it (cause INFERRED) — CONFIRMED (sizes). |
| Dependencies | **YELLOW** | Modern and coherent (React 19, router 7, Tailwind 4, Vitest 5). But: no `npm audit` cadence, `three` `Clock` deprecation, and `@supabase/supabase-js` is now security-critical because its RLS policies are the only access control — CONFIRMED/INFERRED. |
| Documentation | **YELLOW** | In-code comments are strong and the **Project Brain is now in sync with the code** (re-synced 2026-10-18). Still open: `README.md` is the generic Vite template — CONFIRMED. |
| Deployment | **YELLOW** | Build is green and reproducible; **no host, no CI, no rollback, and the repo is not under git** — CONFIRMED. Backend changes are manual SQL in the Supabase dashboard. |

## Definitions

- GREEN: healthy, no immediate action.
- YELLOW: known issues/debt but no known blocking risk; improvement planned.
- RED: blocking risk or serious debt; action required.

## Top three actions (highest leverage first)

1. **Move order creation to a Supabase Edge Function** that recomputes totals from its own
   catalogue and sets `status` (SEC-001). Until then no real payment can be taken.
2. **Privacy/consent groundwork before launch:** publish the three legal pages, decide a
   retention rule for guest orders, clear `bato-orders` on sign-out (SEC-005/SEC-006).
3. **Spam-protect the lead endpoints** (honeypot + rate limit/Turnstile) before applying
   `20261019_leads.sql` (SEC-003).

## Last assessment

- Date: **2026-10-18** · Produced by: project-brain re-sync after the "Wave 0" session
  (`BERTEMPK live + Wave 0`), based on reading the code, re-running `npx vitest run`
  (141/9), inspecting `dist/`, and the session's browser-QA evidence.
- Scope: whole repo, focus on the new commerce layer.
- Previous assessment: 2026-10-13 (Tier A 3D-mannequin session; Testing RED, Security GREEN).
  **Security GREEN was wrong** — it rested on a brain that had not yet seen auth, `.env`,
  the database or any PII.

## Rules

- Never invent quantitative scores without evidence.
- Update only after a meaningful audit/assessment, not on every change.
- Each status must cite the reasoning or artifact it came from.