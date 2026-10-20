# Handoff — Phase 1: Order price authority via Supabase Edge Function `create-order`

Status: DESIGN (no code written). Owner: backend-developer + frontend-developer.
Tracks: SECURITY SEC-001 (CRITICAL), ISSUE-009, TECHNICAL_DEBT "No server-side price authority".
ADR: `docs/adr/0001-price-authority-edge-function.md`.

---

## TASK

Move order price authority for **signed-in** orders from the browser to a Supabase
Edge Function `create-order`, so that `subtotal`, `shipping_cost`, `total`, line
`price`/`name`/`image`/`category`, `status` and `payment_method` are computed and
set server-side. Guest orders stay local and untrusted (acceptable).

## CONTEXT

- Project: `/home/corvusjet/fashion-ecom` — React 19 + TS + Vite, Supabase Auth +
  Postgres. 6 products `p1`–`p6` in `src/constants/products.ts`.
- Current: `createOrder` (`src/lib/orders.ts`) computes and inserts client values into
  `public.orders`; RLS only checks `auth.uid() = user_id`.
- Supabase project ref: `xznhshhdwipafbvjpmad` (linked). Edge Functions deploy via
  `supabase functions deploy` or MCP `deploy_edge_function`.
- Existing honest-failure contract: `CreateOrderResult` (ok:true stored | ok:false
  reason). Checkout never clears the bag or navigates on failure.
- Tests: 9 files / 141 tests; Supabase is mocked in tests; env vars pinned in
  `vitest.config.ts`. Do not remove pins.

## ASSUMPTIONS

1. Phase 1 covers **signed-in** orders only. Guest orders remain localStorage.
2. No DB migration in Phase 1: reuse `public.orders` as-is. `products` table is Phase 2.
3. Only `manual_transfer` is live; Midtrans stays unavailable (Wave 1). Function sets
   `payment_method = 'manual_transfer'` by default.
4. The frontend still displays prices from `src/constants/products.ts` for browsing;
   the server's computed values win on persist.
5. `verify_jwt = true` on the function; the function additionally resolves the user
   from the JWT and never trusts a client-supplied `user_id`.
6. Service role key is available only inside the function environment
   (`SUPABASE_SERVICE_ROLE_KEY`), never in the client bundle.

---

## PLAN

### 1. Edge Function contract

**Location:** `supabase/functions/create-order/index.ts` (entry), plus shared modules
under `supabase/functions/create-order/`.

**Endpoint:** `POST https://<project-ref>.supabase.co/functions/v1/create-order`
**Auth:** `Authorization: Bearer <supabase access token>` (JWT). `verify_jwt = true`.
The function re-resolves the user with the anon client (`supabase.auth.getUser(token)`)
and uses the resulting `user.id` as `user_id`. A missing/invalid token → `401`.

**Request body (JSON):**
```json
{
  "items": [
    { "product_id": "p2", "size": "L", "colorway": "Jet", "quantity": 2 }
  ],
  "shipping_method": "standard",
  "address": {
    "full_name": "…", "email": "…", "phone": "…", "line1": "…",
    "city": "…", "postal_code": "…", "country": "…", "notes": "…"
  },
  "payment_method": "manual_transfer"
}
```
Rules:
- No `subtotal`, `shipping_cost`, `total`, `price`, or `status` field is accepted.
  If any is present → `400 { error: "client_amount_not_accepted" }`.
- `payment_method` is optional; defaults to `manual_transfer`; validated against the
  allowed enum. (Phase 1 effectively only allows `manual_transfer`.)
- Unknown extra fields: reject (strict schema) or ignore — recommend reject for
  clarity, but ignoring is acceptable if documented. Pick one and document.

**Success response (`200`):**
```json
{
  "order": {
    "id": "uuid", "order_number": "BTPK-…", "user_id": "uuid",
    "status": "pending_payment", "payment_method": "manual_transfer",
    "items": [ { "product_id","name","image","category","price","quantity","size","colorway","line_id" } ],
    "subtotal": 1978000, "shipping_cost": 0, "total": 1978000,
    "address": { … }, "created_at": "ISO-8601"
  }
}
```
**Error responses:**
| Status | `error` code | When |
|---|---|---|
| 401 | `unauthorized` | missing/invalid JWT |
| 400 | `invalid_request` (+ `fields`) | malformed body / missing required fields |
| 400 | `client_amount_not_accepted` | any price/total/status field sent |
| 400 | `unknown_product` | `product_id` not in catalogue |
| 400 | `invalid_size` | `size` not in `SIZES` |
| 400 | `invalid_quantity` | not an integer > 0 (and ≤ cap) |
| 400 | `invalid_shipping_method` | not `standard`/`express` |
| 400 | `invalid_address` (+ `fields`) | missing/invalid address fields |
| 400 | `empty_cart` | `items` empty |
| 400 | `too_many_items` | exceeds cap (e.g. 50) |
| 500 | `order_number_collision` | unique violation after retries (rare) |
| 500 | `persist_failed` | DB insert failure |

All error bodies: `{ "error": "<code>", "message"?: string, "fields"?: Record<string,string> }`.
Never leak DB error details to the client; log them server-side.

### 2. Authoritative catalogue inside the function

Files:
- `supabase/functions/create-order/catalog.ts` exporting:
  - `PRODUCTS: Record<string, { name; image; category; price }>` for `p1`–`p6`
    (copied from `src/constants/products.ts` — only `id`, `name`, `image`, `category`,
    `price`; drop `images`, `originalPrice`, `isNew`).
  - `SIZES: readonly string[]` = `["XS","S","M","L","XL"]`.
  - `SHIPPING_METHODS`, `FREE_SHIPPING_THRESHOLD`, `shippingCostFor`, `toRupiah`.
- `supabase/functions/create-order/compute.ts` exporting a pure
  `computeOrder(lines, shippingMethodId)` → `{ items, subtotal, shipping_cost, total }`
  that looks up each product, multiplies price × quantity, applies the free-shipping
  rule, and throws typed errors for unknown product/size/quantity.

**Single source of truth recommendation:**
- Canonical = frontend constants (`src/constants/products.ts`, `src/constants/commerce.ts`,
  `SIZES` in `src/constants/fit.ts`), because they drive browsing/display and already
  have tests.
- The function catalogue is a **vendored copy**. Keep them in sync via:
  1. A parity test in the frontend suite (e.g. `src/lib/catalog.parity.test.ts`) that
     imports the frontend constants and a JSON snapshot exported from the function
     catalogue (`supabase/functions/create-order/catalog.json` generated at build time)
     and asserts ids + prices + shipping constants + sizes are identical.
  2. A documented sync script `scripts/sync-catalog.mjs` (Phase 1, manual run) that
     regenerates the function catalogue from the frontend constants. Run it whenever a
     product price changes; the parity test fails in CI if it is forgotten.
  3. A comment header in both files pointing to the other and to this ADR.
- Future (Phase 2): move the catalogue to a `products` table and have both the function
  and (optionally) the frontend read from it. Out of Phase 1 scope.

### 3. Validation rules (server)

- JWT present & valid → resolve `user_id`. Else `401`.
- Body must be a JSON object. Else `400 invalid_request`.
- `items`: non-empty array, length ≤ 50. Each:
  - `product_id`: string present in `PRODUCTS`.
  - `size`: string present in `SIZES`.
  - `colorway`: `string | null` (optional; if string, length ≤ 64).
  - `quantity`: integer, `1 ≤ q ≤ 99`.
- `shipping_method`: `standard` or `express`.
- `address`: object with required non-empty trimmed strings `full_name`, `email`
  (basic email regex), `phone`, `line1`, `city`, `postal_code`, `country`;
  `notes` optional string (≤ 500 chars). Max lengths enforced (e.g. 200 for names).
- `payment_method`: optional; if present must be `manual_transfer` in Phase 1.
- Rejected if any of `subtotal`, `shipping_cost`, `total`, `price`, `status`,
  `items[].price` present → `400 client_amount_not_accepted`.
- All money computed server-side with `toRupiah`-equivalent integer rounding.

### 4. DB write

- Use a **service role** client (`createClient(SUPABASE_URL, SERVICE_ROLE_KEY)`).
- Build the row:
  ```ts
  {
    id: crypto.randomUUID(),
    order_number: generateOrderNumber(),
    user_id, status: "pending_payment",
    payment_method: "manual_transfer",
    items: computed.items,        // server price/name/image/category
    subtotal, shipping_cost, total,
    address, created_at: new Date().toISOString()
  }
  ```
- `.insert(row).select().single()` to get the persisted row back.
- Retry on Postgres `23505` (unique violation on `order_number`) up to `INSERT_ATTEMPTS = 3`,
  regenerating `order_number` each retry. Any other error → `500 persist_failed`.
- RLS remains `auth.uid() = user_id` for select/insert. The function bypasses RLS via
  service role but only after JWT verification and user resolution, so the row is
  still owned by the authenticated user.
- No DB schema change in Phase 1.

### 5. Frontend changes

**`src/lib/orders.ts`:**
- Change `CreateOrderInput` to:
  ```ts
  interface CreateOrderLine { product_id: string; size: string; colorway: string | null; quantity: number; }
  interface CreateOrderInput {
    userId: string | null;
    lines: CreateOrderLine[];
    shippingMethod: ShippingMethodId;
    address: ShippingAddress;
    paymentMethod?: PaymentMethod;
  }
  ```
  (Drop `items`, `subtotal`, `shippingCost`, `total`, `price`.)
- `createOrder(input)`:
  - Basic client validation (product id non-empty, size in `SIZES`, quantity integer > 0)
    → if invalid return `{ ok:false, reason:"invalid-items", … }` (no write).
  - If guest or Supabase not configured: compute totals from constants and write
    `localStorage` (existing path, `storage: "local"`).
  - If signed in: call `supabase.functions.invoke('create-order', { body })`.
    On 2xx parse `order` → return `{ ok:true, order, storage:"supabase" }`.
    On non-2xx / network error → return `{ ok:false, reason:"persist-failed", order, storage:"none" }`
    (construct a placeholder `order` for the result shape, as today).
- Keep `generateOrderNumber`, `normaliseOrder`, `getOrder`, `listOrders`, `hasUnSizedLines`.
- Keep the retry/unique-violation logic only on the local path? The function owns retry
  now; frontend does not need it for the remote path. Keep for local path (trivial).

**`src/pages/Checkout.tsx`:**
- Build `lines` from cart items: `{ product_id: i.id, size: i.size!, colorway: i.colorway, quantity: i.quantity }`.
- Call `createOrder({ userId, lines, shippingMethod: shippingId, address, paymentMethod: paymentId })`.
- Still compute `sub`/`shippingCost`/`total` from constants for **display/preview** only.
- On `!result.ok`: existing behaviour (warning toast, no clear, no navigate).
- On success: `providerFor(paymentId).pay(order)`, then `clear()`, navigate.
  Use `result.order` (server totals) for any post-success display; the confirmation page
  re-fetches from DB.
- Keep size/payment/address gates unchanged.

**Client price preview module (new, optional):** `src/lib/pricing.ts` exporting
`computePreview(lines)` using constants, for Checkout and tests. Unit-testable.

### 6. What stays client-side

- Display prices in Shop/PDP/Cart/Checkout summary (from `src/constants/products.ts`).
- Cart UI, quantity edits, variant identity.
- Shipping preview (`shippingCostFor`) — server recomputes and may differ (price change);
  server wins on persist; UI shows preview.
- Size gate validation (UX); server re-validates authoritatively.
- Payment provider availability gating.

### 7. Migration needs

- **Phase 1:** none. Reuse `public.orders`.
- **Phase 2 (future, out of scope):** create `public.products` (id, name, image, category,
  price, active) + seed from constants; Edge Function reads from DB; frontend optionally
  fetches for display. Note in TECHNICAL_DEBT/ROADMAP.

### 8. Security

- `verify_jwt = true` on deploy (MCP default). Function re-resolves user via anon client.
- Service role key used only inside the function; never exposed to client.
- Strict input schema; reject client-supplied money/status fields.
- Validate size against `SIZES`, product against catalogue, quantity integer > 0,
  shipping method against allowed list, address required fields + lengths.
- CORS: handle `OPTIONS`; allow origin from `SITE_ORIGIN` env (plus localhost in dev),
  else `*` only if unset (document the risk). Prefer allowlist.
- Rate limiting: none built-in beyond platform limits in Phase 1. Note for follow-up
  (align with SEC-003 honeypot/Turnstile work). Do not claim rate limiting exists.
- No idempotency key in Phase 1; double-submit can create duplicate orders. Document.
- Do not revoke direct PostgREST `insert` in Phase 1 (would break old clients); track
  as Phase 1.5 hardening once all clients use the function.

### 9. Testing plan

**Unit (Vitest):**
- `src/lib/pricing.test.ts` (new): preview totals, free-shipping boundary, invalid line
  handling.
- `src/lib/catalog.parity.test.ts` (new): frontend constants vs function catalogue snapshot
  (ids, prices, shipping constants, sizes) identical.
- `src/lib/orders.test.ts`: update `CreateOrderInput` usage; keep normalisation tests.
- `src/lib/orders.persist.test.ts`: mock changes from `from().insert()` to
  `functions.invoke()`; assert request body has no price/total; assert success/failure
  honesty (no bag clear on failure).

**Component:**
- `src/pages/Checkout.test.tsx`: mock `supabase.functions.invoke`; assert submitted body
  excludes `subtotal`/`shippingCost`/`total`/`price`/`status`; success clears cart +
  navigates; failure keeps cart + stays. Keep size/payment gates.

**Integration (manual, `supabase functions serve`):**
1. Start local function; sign up a test user; get access token.
2. `POST` valid body with JWT → `200`, row in `orders`, totals recomputed server-side
   (tamper price in body → still server price).
3. Missing JWT → `401`.
4. Unknown product / bad size / bad quantity / bad shipping / missing address → `400`
   with correct code.
5. Body with `total: 1` → `400 client_amount_not_accepted`.
6. Guest path unaffected (localStorage).
Document commands in the PR; no E2E framework added.

**Regression guards:**
- Existing 141 tests must still pass after input-shape change (update, don't delete).
- `tsc -b`, `oxlint`, `vite build` green.

### 10. Rollback

- No DB migration to roll back. Function can remain deployed unused.
- Rollback = revert the frontend commit that switches signed-in `createOrder` to the
  function; `createOrder` falls back to the local/PostgREST path (old behaviour).
- During rollout, if the function is unavailable, signed-in checkout fails honestly
  (no silent local fallback) — acceptable; monitor function logs.
- Keep the old local write code path (`writeLocalOrders`) for guest/unconfigured builds;
  do not delete it.

---

## CHANGES (file-level)

**New:**
- `supabase/functions/create-order/index.ts`
- `supabase/functions/create-order/catalog.ts`
- `supabase/functions/create-order/compute.ts`
- `supabase/functions/create-order/validate.ts` (optional, can live in index.ts)
- `src/lib/pricing.ts` (client preview, optional)
- `src/lib/catalog.parity.test.ts`
- `scripts/sync-catalog.mjs` (optional but recommended)
- `docs/adr/0001-price-authority-edge-function.md`

**Modified:**
- `src/lib/orders.ts` (`CreateOrderInput`, `createOrder` branching)
- `src/pages/Checkout.tsx` (send lines without price)
- `src/lib/orders.test.ts`, `src/lib/orders.persist.test.ts`, `src/pages/Checkout.test.tsx`
- `src/constants/products.ts`, `src/constants/commerce.ts`, `src/constants/fit.ts` (sync comments)

**Unchanged:**
- `public.orders` schema and RLS policies.
- Guest/localStorage path.
- Payment providers (Midtrans stays unavailable).

## VALIDATION

- `npx tsc -b` → exit 0.
- `npx oxlint` → no new warnings.
- `npx vitest run` → all tests pass (updated, not weakened).
- `npx vite build` → exit 0.
- Manual integration checklist above passes against `supabase functions serve`.
- Security review: no client amount accepted; JWT verified; service role key not in bundle
  (grep `dist/` for `SERVICE_ROLE` → none).

## RISKS

| Risk | Mitigation |
|---|---|
| Catalog drift between frontend and function | Parity test + sync script + comment headers |
| Direct PostgREST writes still possible (SEC-001 residual) | Phase 1.5: narrow insert grant / revoke direct insert once all clients use function |
| Function outage blocks signed-in checkout | Honest failure UX already in place; no silent fallback; monitor logs |
| Double-submit creates duplicate orders | Document; add idempotency key in a later phase |
| CORS misconfiguration | Allowlist env with localhost fallback; test preflight |
| Service role key leakage | Only in function env; never in Vite bundle; verify via build grep |
| Test suite coupling to old insert mock | Update mocks to `functions.invoke`; do not delete tests |
| Edge Function cold start latency | Acceptable for checkout; measure if needed |

## HANDOFF

**Backend-developer:**
- Implement `supabase/functions/create-order/*` per contract above.
- Deploy with `verify_jwt = true`; set `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`,
  `SITE_ORIGIN` in function secrets (`supabase secrets set`).
- Provide `catalog.ts` vendored copy + `compute.ts` + `validate.ts`.
- Add integration smoke notes (commands) to the PR.

**Frontend-developer:**
- Refactor `CreateOrderInput` and `createOrder` branching; update Checkout.
- Add `src/lib/pricing.ts` + tests; add parity test.
- Update existing tests' mocks from `from().insert()` to `functions.invoke()`.
- Keep guest path and honest-failure UX.

**QA must verify:**
- Signed-in order: totals come from server (tamper test: send `total:1` → server price).
- Guest order: localStorage path unchanged.
- Failure path: function returns 500 → no bag clear, no navigate, warning toast.
- No `SERVICE_ROLE` in `dist/`.
- `tsc -b`, `oxlint`, `vitest run`, `vite build` all green.

**Security-auditor follow-up:**
- Re-run audit on the function (input validation, JWT, CORS, secret handling).
- Decide on Phase 1.5 direct-insert revocation.
