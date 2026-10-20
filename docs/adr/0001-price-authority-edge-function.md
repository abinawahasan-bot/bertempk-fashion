# ADR 0001 — Move order price authority to a Supabase Edge Function (SEC-001)

Status: Proposed
Date: 2026-10-19
Deciders: owner (pending), architect

## Context

`public.orders` is live and RLS-scoped to `auth.uid() = user_id`, but `createOrder`
(`src/lib/orders.ts`) computes `subtotal`, `shipping_cost`, `total`, `items`, `address`,
`payment_method` and `status` in the browser and inserts them verbatim. RLS does not
validate values, so any authenticated customer can write `status: 'paid'`, `total: 1`,
or an empty `items` array (SEC-001, CRITICAL; ISSUE-009). The Midtrans stub has the
same flaw latent (SEC-002). The deployment runbook states an Edge Function must own
prices before a real payment is enabled.

Constraints that shape this decision:

- Stack is a static SPA (Vite) + managed Supabase; there is no first-party server.
  Supabase Edge Functions (Deno) are the only server-side runtime available.
- Six products (`p1`–`p6`) with prices in `src/constants/products.ts`; shipping rules
  in `src/constants/commerce.ts`; sizes in `src/constants/fit.ts` (`SIZES`).
- Guest orders are legitimately stored in `localStorage` and are out of scope for
  server authority (untrusted but own cart, acceptable).
- Midtrans is permanently unavailable (Wave 1); only `manual_transfer` is live.
- No DB schema change is desired in Phase 1; reuse `public.orders`.

## Decision

1. Add a Supabase Edge Function `create-order` that is the **single writer of money
   fields** for signed-in orders. It verifies the caller's JWT, validates the request
   against a server-side catalogue, recomputes `subtotal`/`shipping_cost`/`total` and
   all line `price`/`name`/`image`/`category` from its own catalogue, sets
   `status = 'pending_payment'` and `payment_method = 'manual_transfer'` (default),
   and inserts the row with the service role.
2. The frontend `createOrder` path for signed-in users calls this function via
   `supabase.functions.invoke('create-order', …)` and sends **lines without prices**
   (`product_id`, `size`, `colorway`, `quantity`) plus the shipping method and address.
   It never sends `subtotal`, `shipping_cost`, `total`, `price`, or `status`.
3. Guest / unconfigured builds keep the existing `localStorage` path (client-computed,
   untrusted but own cart — acceptable and unchanged).
4. The catalogue is duplicated in the function as a vendored copy of the frontend
   constants, kept in sync by a parity test and a documented sync script. A
   `products` table is deferred to Phase 2.
5. Direct PostgREST inserts are **not** revoked in Phase 1 (doing so would break any
   client still on the old path); this is tracked as a follow-up hardening step.

## Alternatives Considered

- **Column-level grants / revoke `insert` on money columns.** Viable as interim
  hardening (SEC-001 sketch) but Postgres grant behaviour with RLS on this Supabase
  setup is unverified (UNKNOWN), and it would disable order creation entirely if the
  function is not ready. Rejected as the primary fix; noted as Phase 1.5.
- **Make the frontend fetch a server catalogue.** Would make the function the single
  source of truth for display prices too, but adds latency and coupling to browsing,
  and the brief explicitly allows display prices from constants. Rejected.
- **Move the catalogue into a shared monorepo package.** Cleanest long-term, but the
  repo is not a workspace and the build tooling (Vite + Deno) differs. Rejected for
  Phase 1 as over-engineering; revisit when a second consumer appears.
- **Database `products` table read by the function.** Best end state, but requires a
  migration, seed data, and a frontend migration off constants. Deferred to Phase 2
  (noted in the handoff).

## Consequences

- **Positive:** Money figures persisted for signed-in orders become server-authoritative;
  `status` can no longer be client-set; the Midtrans Wave 1 endpoint can later reuse
  the same catalogue and recomputation.
- **Positive:** Guest path and all existing honest-failure UX (`CreateOrderResult`)
  are preserved; no regression in the 141-test suite's intent.
- **Negative / Risks:** Two copies of the catalogue can drift; mitigated by a parity
  test and a sync script. Direct PostgREST writes remain possible until Phase 1.5.
- **Negative / Risks:** A function outage blocks signed-in checkout (no silent local
  fallback, by design — avoids phantom orders). Rollback is a frontend revert.
- **Negative / Risks:** Double-submit is not idempotent; duplicate orders possible
  under retries. Tracked as a future improvement.
- **Links:** SECURITY.md SEC-001/SEC-002, KNOWN_ISSUES ISSUE-009/ISSUE-010,
  TECHNICAL_DEBT "No server-side price authority", DEPLOYMENT runbook step 0.
