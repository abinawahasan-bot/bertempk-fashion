# DEPLOYMENT

> Project Brain file · ACTUAL deployment architecture. NEVER store deployment credentials. Confidence markers apply.

## Environments

| Environment | Purpose | URL/domain | Confidence |
|-------------|---------|-----------|------------|
| Local dev | Development | `http://127.0.0.1:5200/` (via `vite --port 5200 --host 127.0.0.1`; log `/tmp/vite-dev.log`) | CONFIRMED (**unchanged** — re-checked 2026-10-18; `vite.config.ts` still has no `server` block, see ISSUE-002) |
| Local preview | Preview built output | `vite preview` (Vite default 4173) | CONFIRMED (command) |
| Production / staging | — | **UNKNOWN** — no hosting config found | UNKNOWN |

- No `netlify.toml`, `vercel.json`, `Dockerfile`, `render`/`fly`/`caddy`/nginx config, or CI YAML exists in the repo — CONFIRMED. **Host = UNKNOWN.**

## Build process

- `npm run build` = `tsc -b && vite build` → static output in `dist/`. — CONFIRMED.
- **Latest verified build (2026-10-18, Wave 0):** `npx vite build` → exit 0, **13.72 s** (session report). Artifact sizes observed in `dist/` (exact bytes, hashes not pinned because they change with every content edit): `dist/index.html` 1 001 B · `dist/assets/index-CHHYKBF-.css` 50 730 B · `dist/assets/index-CcXhdYyd.js` **820 060 B** · `dist/assets/ContactShadows-ByWwcPCX.js` **931 055 B** · `dist/assets/Mannequin3D-gyqFlQza.js` 77 718 B · `dist/assets/GarmentTurntable-BN5_1v95.js` 3 778 B — CONFIRMED (observed in `dist/`, built 2026-10-18 18:36).
  - The main chunk grew from ~531 kB (2026-10-14) to ~820 kB when `@supabase/supabase-js` was pulled into it — cause **INFERRED** from the dependency change (not bundle-analysed). Both large chunks still trigger the >500 kB warning; `vite.config.ts` has **no `manualChunks`** — CONFIRMED.
  - Superseded: 2026-10-14 (session 8) `index` 531.32 kB; 2026-10-13 (session 3) exit 0, 12.65 s, 2938 modules, `index` 521.67 kB (162.89 gzip), `ContactShadows` 928.67 kB (249.96 gzip), `GarmentTurntable` 2.75 kB, `Mannequin3D` 23.55 kB; session 2 (15.97 s); session-1 baseline (11.28 s).
- `public/` assets are copied verbatim to `dist/` (media, favicon, `model/garment.glb`). — CONFIRMED.

## Containers / runtime

- **None.** No container image; static files served by any static host. — CONFIRMED.

## Servers & reverse proxy

- **None configured.** — CONFIRMED.

## CI / CD

- **None.** No pipeline; deployment is manual/unconfigured. — CONFIRMED.

## Monitoring & logging

- **None** (no metrics/alerts). Local dev log at `/tmp/vite-dev.log` during development. — CONFIRMED.

## Rollback strategy

- Not established (no deploy pipeline). For a static host, rollback = redeploy the previous `dist/` artifact; version control is unavailable (repo is not a git repo) — INFERRED / WEAK.

## Deploy runbook

0. **(Wave 1 prerequisite)** order creation must move to a Supabase Edge Function before a
   real payment is enabled — today the client is the price authority (SEC-001 / ISSUE-009).
1. `npm ci` (or `npm install`).
2. `npm run build`.
3. Serve `dist/` from the chosen static host (host TBD).
4. (Optional) `npm run preview` to sanity-check locally.
- Note: repo is **not under git** — no commit/branch-based release flow exists. — CONFIRMED.

## Secrets in deployment

- **16 `VITE_*` variable names** are read from `import.meta.env` and therefore **inlined into `dist/assets/*.js` at build time** — CONFIRMED (grep over `src/`, 2026-10-18). A build with no `.env` still succeeds; features degrade to their honest "not configured" states.
- Names only (never values — see SECURITY.md for the full table): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_WHATSAPP`, `VITE_BRAND_ORIGIN`, `VITE_PAYMENT_BANK_NAME`, `VITE_PAYMENT_ACCOUNT_NUMBER`, `VITE_PAYMENT_ACCOUNT_NAME`, `VITE_PAYMENT_ENDPOINT`, `VITE_SOCIAL_INSTAGRAM`, `VITE_SOCIAL_TIKTOK`, `VITE_SOCIAL_X`, `VITE_POLICY_PRIVACY_URL`, `VITE_POLICY_TERMS_URL`, `VITE_POLICY_COOKIES_URL`.
- **No secret key belongs in the frontend.** Midtrans' secret key must stay server-side in the future Edge Function; only `VITE_PAYMENT_ENDPOINT` (a URL) is a client variable — CONFIRMED (`src/lib/payments.ts`).
- `.env` holds a live Supabase publishable key and is **gitignored** since 2026-10-18; `.env.example` carries 14 placeholder-only names — CONFIRMED (`VITE_PAYMENT_ENDPOINT` is missing from it — ISSUE-019).
- **Backend deploy is manual SQL:** both migrations in `supabase/migrations/` are run by hand in the Supabase Dashboard SQL Editor (their header comments say so). `20261019_leads.sql` has **never** been applied — CONFIRMED.

## Release snapshots

- snapshots/snapshot-2026-10-13.md (baseline), snapshot-2026-10-13-tierA.md (Tier A).
- **No snapshot covers Wave 0 (2026-10-18)** — create one before the next release.
