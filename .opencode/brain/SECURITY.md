# SECURITY

> Project Brain file · Project-specific SECURITY posture. NEVER store actual secrets.
> Reference secrets as ENV_VAR_NAME placeholders only. Confidence markers apply.
> **Re-synced 2026-10-18 (Wave 0).** The previous version of this file made **six claims
> that were false against the code** (no env vars/secrets anywhere, no `.env`, no auth,
> no API, no DB, no PII, non-submitting newsletter) — all enumerated in "Retracted claims"
> at the bottom. A brain that under-reports the surface is worse than no brain.

## Security posture summary

Supabase Auth is live and `public.orders` is live and RLS-scoped. **The client is the
price authority for orders.** Two anon INSERT-only lead tables are *authored* but the
migration **has never been applied** — when it is, they become an open write endpoint.
Guest orders put a full shipping address in `localStorage` forever. **Not safe for real
payments, and not privacy-compliant, as of 2026-10-18.**

## Authentication model

- **Supabase Auth** (`@supabase/supabase-js`) — email/password + Google/GitHub OAuth,
  session recovery on mount, `onAuthStateChange`, session persisted under `bato-auth`
  (`src/lib/supabase.ts`, `src/store/auth.ts`, `src/components/AuthModal.tsx`) — CONFIRMED.
- Credentials come from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; the anon key is
  **shipped in the client bundle by design** (it is a publishable key, not a secret) —
  CONFIRMED.
- **Configuration predicates disagree.** `isSupabaseConfigured` (`src/lib/supabase.ts`)
  rejects only URLs containing the literal word `placeholder`, while
  `isSupabaseConfiguredForWrites` (`src/lib/env.ts`) additionally runs the broader
  `hasValue` sweep (`placeholder|your-|changeme|example`). A copy-pasted `.env.example`
  therefore **passes the first and fails the second** — CONFIRMED (both files read
  2026-10-18). One predicate must become the single source of truth.

## Authorization model

- **Server-side authorization = PostgreSQL RLS only.** There is no **first-party** API
  layer (Supabase PostgREST is the data plane), no server-side session check beyond RLS,
  and no route guard — the SPA hides nothing by itself — CONFIRMED.
- `public.orders` (`supabase/migrations/20261018_orders.sql`): RLS enabled;
  `select` **own rows only** (`auth.uid() = user_id`); `insert` **own rows only**
  (`with check (auth.uid() = user_id)`); **no update/delete policy** — CONFIRMED.
- `public.contact_messages`, `public.newsletter_subscribers`
  (`supabase/migrations/20261019_leads.sql`): RLS **enabled and forced**; `insert` open
  to `anon, authenticated` (`with check (true)`); `select, update, delete` **revoked**
  from `anon, authenticated`; unique index on `lower(email)` for the newsletter — CONFIRMED.
  Reads are meant to happen from the dashboard under the service role — CONFIRMED
  (documented intent in the migration; **not** exercised in code).

## CRITICAL findings (Wave 0)

### SEC-001 · Price authority is client-side — **RESOLVED (Phase 1, 2026-10-19)**
- **Resolution:** Order creation for signed-in users now goes through the `create-order`
  Supabase Edge Function (`supabase/functions/create-order/`), which recomputes
  `subtotal`, `shipping_cost`, `total`, line `price`/`name`/`image`/`category`,
  `status` and `payment_method` from a vendored catalogue keyed on product ids.
  Client-supplied money/status fields are rejected (`client_amount_not_accepted`).
  Guest orders remain local and untrusted (acceptable — own cart).
- **Remaining:** migrate the catalogue from a vendored copy to a `products` table
  (drift guard: `src/lib/catalog.parity.test.ts`). Column-level grants (interim
  sketch) no longer needed.

### SEC-002 · Midtrans stub trusts the client's amount — **PARTIALLY ADDRESSED (infra deployed, secret pending)**
- **Resolution (2026-10-19):** `create-payment` Edge Function deployed; it looks the
  order up by `order_number` (owner-scoped) and recomputes `gross_amount` from the
  stored row — the request body is ignored for money. Returns 503
  `payment_not_configured` until `MIDTRANS_SERVER_KEY` is set. Frontend
  `payments.ts` invokes the function when `VITE_PAYMENT_ENDPOINT` is set.
- **Remaining:** set `MIDTRANS_SERVER_KEY` (+ optional `MIDTRANS_IS_PRODUCTION`),
  set `VITE_PAYMENT_ENDPOINT`, implement Midtrans webhook for status updates.

## Explicit untrusted-by-construction statement

> **Every money figure the app displays or persists is client-computed and therefore
> UNTRUSTED until a server-side recomputation path exists.** Any future review, audit or
> release sign-off MUST NOT treat Wave 0 as "payment-safe" because (a) RLS is enabled,
> (b) the UI refuses to place an order with no payment provider, or (c) tests are green.
> Those gates protect *honesty of the UI*, not the *integrity of the price*.

## Other findings

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| SEC-003 | `contact_messages` / `newsletter_subscribers` are **INSERT-only open write endpoints for `anon`** (`with check (true)`). **Mitigated:** honeypot + IP/email rate limiting via `lead_rate_limits` table + Cloudflare Turnstile (secret key configured) in `submit-lead` Edge Function. Frontend sends Turnstile token. — CONFIRMED (`submit-lead/index.ts`, `src/lib/lead.ts`, `src/components/TurnstileWidget.tsx`) | MEDIUM (pre-launch) | MITIGATED |
| SEC-004 | Newsletter duplicate email returns a **generic** error, not "you are already on the list" (23505 collapses into `LeadResult{ok:false, reason:"error"}`) — CONFIRMED (`src/lib/lead.ts`) | LOW | OPEN |
| SEC-005 | **PII exposure — guest orders persist indefinitely** in `localStorage` under `bato-orders` (full shipping address: name, email, phone, address, postal code) and are **never cleared on sign-out** → shared-device exposure. — CONFIRMED (`src/lib/orders.ts`, no clear-on-signout path found in `src/store/auth.ts`) | HIGH | OPEN |
| SEC-006 | **No privacy notice, consent capture, or retention rule exists** for any collected personal data; the footer's legal row renders only when all three `VITE_POLICY_*_URL` are set, and they are unset — CONFIRMED (`src/components/Footer.tsx`). Under **UU PDP 27/2022** (Indonesia) a privacy policy, consent basis and retention rule are preconditions before enabling the leads migration or a live checkout — CONFIRMED (regulation applies; its applicability to this project is INFERRED pending owner confirmation of Indonesian operation). **Partial (2026-10-19):** `/privacy` and `/terms` pages added; footer legal links still env-gated. | HIGH (pre-launch) | PARTIALLY ADDRESSED |
| SEC-007 | `20261019_leads.sql` has **never been executed against the live project** — CONFIRMED (session report; the code degrades to "not configured" until it is). Until applied, both lead forms honestly report failure; nothing is written. | INFO | OPEN |
| SEC-008 | No auth rate limiting / abuse control on Supabase Auth endpoints beyond provider defaults — INFERRED (provider-level, not verifiable from this repo) | LOW | OPEN |
| SEC-009 | No CSP / security headers of any kind in `index.html` — CONFIRMED. Must be applied at the host/CDN; host is **UNKNOWN** | MEDIUM (at launch) | OPEN |
| SEC-010 | `npm audit` is not wired into any script or CI; no audit cadence — CONFIRMED (`package.json` scripts) | LOW | OPEN |

## Secrets strategy

| ENV_VAR_NAME (never the value) | Purpose | Required? | Confidence |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | for auth/orders/leads | CONFIRMED |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key (ships in the bundle by design) | for auth/orders/leads | CONFIRMED |
| `VITE_CONTACT_EMAIL` | Contact address shown to customers | recommended | CONFIRMED |
| `VITE_CONTACT_WHATSAPP` | WhatsApp number, optional | optional | CONFIRMED |
| `VITE_BRAND_ORIGIN` | Studio origin label; defaults to `Indonesia` | optional | CONFIRMED |
| `VITE_PAYMENT_BANK_NAME` | Manual-transfer bank name | all 3 required to enable manual transfer | CONFIRMED |
| `VITE_PAYMENT_ACCOUNT_NUMBER` | Manual-transfer account number | all 3 required | CONFIRMED |
| `VITE_PAYMENT_ACCOUNT_NAME` | Manual-transfer account holder | all 3 required | CONFIRMED |
| `VITE_PAYMENT_ENDPOINT` | Midtrans token endpoint (Wave 1) | unused today; **missing from `.env.example`** | CONFIRMED |
| `VITE_SOCIAL_INSTAGRAM` / `VITE_SOCIAL_TIKTOK` / `VITE_SOCIAL_X` | Social channels; blank ⇒ channel hidden | optional | CONFIRMED |
| `VITE_POLICY_PRIVACY_URL` / `VITE_POLICY_TERMS_URL` / `VITE_POLICY_COOKIES_URL` | Legal pages; the footer legal row needs all three | unset today | CONFIRMED |

- **`.env` exists and holds a live Supabase publishable key** — CONFIRMED (present on
  disk; key/value never recorded in this brain). The **value is not quoted anywhere in
  `.opencode/brain/`** — CONFIRMED (secret scan, this session).
- **`.env` and `.env.*` are now gitignored**, with `!.env.example` — CONFIRMED
  (`.gitignore`, 2026-10-18). It previously was not.
- `.env.example` carries **14 placeholder-only variable names** (2 Supabase + 12 added in
  Wave 0) and no values — CONFIRMED. `VITE_PAYMENT_ENDPOINT` is read by the code but
  **not documented** there — CONFIRMED (drift).
- The repo is **still not a git repository**, so no secret has been committed — CONFIRMED
  (no `.git`).
- **Remaining risk:** any local dev/QA shell that echoes `.env` (or a future `git init
  -A`) can still expose it; `VITE_*` values are inlined into `dist/assets/*.js` at build
  time by design — CONFIRMED (Vite behaviour).

## Data protection / privacy

- **Personal data collected by the app:**
  - Auth profile (Supabase) — CONFIRMED.
  - Shipping address (name, email, phone, street, city, postal code, country, notes) —
    held in `localStorage` `bato-orders` for guest orders and in `public.orders.address`
    (jsonb) for signed-in orders — CONFIRMED.
  - Contact form (name, email, message) and newsletter email → `contact_messages` /
    `newsletter_subscribers`, if and when the migration is applied — CONFIRMED.
- **Device-local state (never transmitted):** `bato-cart`, `bato-wishlist`,
  `bato-fitting`, `bato-auth` — CONFIRMED. `bato-orders` is device-local **only** for
  guest/unconfigured builds; a signed-in order with Supabase configured goes to Postgres — CONFIRMED.
- **No consent, retention or deletion path exists** for any of the above — CONFIRMED.
- **No privacy policy page is reachable** while the `VITE_POLICY_*` vars are unset — CONFIRMED.

## API security

- **No application API.** Outbound calls are: Supabase PostgREST/Auth
  (`<VITE_SUPABASE_URL>`), the image CDN `images.pexels.com`, and Google Fonts —
  CONFIRMED. `VITE_PAYMENT_ENDPOINT` is the only other outbound target and is unused —
  CONFIRMED.
- CORS is handled by Supabase; there is no first-party server to configure — CONFIRMED.
- **No rate limiting anywhere** — neither on the anon lead INSERTs nor on order INSERTs
  beyond Postgres/Supabase defaults — CONFIRMED (SEC-003).

## File upload security

- Not applicable (no uploads) — CONFIRMED.

## Input handling

- All user input goes through React rendering (no `dangerouslySetInnerHTML` anywhere in
  `src/`) — CONFIRMED.
- Client-side validation exists but is **not** a trust boundary: `Checkout` validates the
  address, `lib/lead.ts` bounds name/email/message to match the DB `check` constraints,
  and `createOrder`'s `isPersistableLine` rejects unidentifiable/unsized/unpriced lines —
  CONFIRMED. Server-side validation is **absent** for every write (SEC-001).
- Persisted data is **coerced, not trusted**: the cart migrator (`store/cart.ts`
  `migrate`) sanitises hostile `localStorage`; `lib/orders.ts` normalises every unknown
  stored/remote row before it reaches the UI — CONFIRMED. `Item.p.image` is rendered via
  a URL from storage; a hostile value could request an arbitrary origin (browser-enforced,
  no script execution) — INFERRED, low risk.

## Dependency security

- Lockfile present (`package-lock.json`). No audit cadence; `npm audit` is not a script
  and there is no CI — CONFIRMED (SEC-010).
- Notable runtime deps: `@supabase/supabase-js` 2.118.0, `three` 0.186.1,
  `@react-three/fiber` 9.8.1, `@react-three/drei` 10.7.9 — CONFIRMED (`package-lock.json`).

## Logging policy

- No server-side logging. Client logs are `console.warn` on genuine failures only
  (`[orders]`, `[lead]`) and `sonner` toasts for the user; **no secret or PII value is
  logged** — CONFIRMED. Supabase dashboard retains table rows; retention is unconfigured
  — UNKNOWN.

## Audit history

| Date | Finding(s) | Severity | Status |
|------|-----------|----------|--------|
| 2026-10-13 | Secret scan of repo (src/public/config) — no secrets found | — | Clean (still true for `src/`) |
| 2026-10-18 | Wave 0 re-sync: auth + RLS + leads + PII now exist; `.env` present | — | File corrected |
| 2026-10-18 | SEC-001 client-side price authority | CRITICAL | OPEN (blocker before real payments) |
| 2026-10-18 | SEC-002 Midtrans stub trusts client amount (unreachable today) | HIGH (latent) | OPEN (Wave 1) |
| 2026-10-18 | SEC-003 open anon write endpoints, no rate limit | HIGH | OPEN |
| 2026-10-18 | SEC-005 guest PII in `localStorage`, never cleared | HIGH | OPEN |
| 2026-10-18 | SEC-006 no privacy notice / consent / retention (UU PDP) | HIGH | OPEN |
| 2026-10-18 | SEC-004 duplicate-email UX, SEC-009 headers, SEC-010 audit | LOW–MEDIUM | OPEN |

## Retracted claims (do not reintroduce)

These statements were in this file before 2026-10-18 and were **false against the code**:

1. "There are currently **no environment variables and no secrets referenced anywhere**"
   — false: 16 `VITE_*` names are read from `import.meta.env`, and `.env` holds a live
   Supabase publishable key — CONFIRMED.
2. "**Authentication model: None.** Sign In buttons are non-functional UI placeholders"
   — false: full Supabase auth shipped 2026-10-17 — CONFIRMED.
3. "No `.env` file, no `import.meta.env` usage, no API keys" — false — CONFIRMED.
4. "**No API**"; "No DB" — false: Supabase PostgREST (`orders`, and pending the leads
   migration, two more tables) — CONFIRMED.
5. "Newsletter form … **no submission/transmission occurs**" — false: it calls
   `subscribeNewsletter` → `supabase.from("newsletter_subscribers").insert(...)`
   — CONFIRMED.
6. "No user accounts or server-side PII" — false — CONFIRMED.

## Rules

- Never store actual credentials or personal data in this brain.
- Security findings/severities come from security-auditor reports; this file records
  resulting posture and requirements.
- **Do not mark a future release "payment-safe" without a server-side recomputation path.**