# STACK

> Project Brain file · Based on ACTUAL project files. Confidence: CONFIRMED (seen in files), INFERRED, UNKNOWN.
> NEVER store credentials. Secrets belong in SECURITY.md as ENV_VAR_NAME placeholders.
> Versions: range from `package.json`; exact installed version from `package-lock.json`. Node runtime: **v26.8.1**, npm **11.19.0** (CONFIRMED via `node -v`).

## Frontend

- **Framework:** React `^19.2.8` (installed 19.3.0), React DOM 19.3.0 — CONFIRMED.
- **Language:** TypeScript `~6.0.2` (installed 6.0.3), `target es2023`, `moduleResolution bundler`, `verbatimModuleSyntax`, `noEmit` — CONFIRMED (`tsconfig.app.json`).
- **Build tool:** Vite `^7.3.7` (installed 7.3.7) via `@vitejs/plugin-react` `^4.7.0` — CONFIRMED.
- **Styling:** Tailwind CSS **v4** `^4.3.3` through `@tailwindcss/vite` (installed 4.3.3); design tokens in `src/index.css` `@theme`; **no tailwind config file** — CONFIRMED.
- **Routing:** `react-router-dom` `^7.18.4` (installed 7.18.4), `BrowserRouter` — CONFIRMED (`App.tsx`).
- **Animation:** `motion` `^14.1.0` (installed 14.1.0), imported as `motion/react` — CONFIRMED. (Formerly Framer Motion.)
- **State:** `zustand` `^5.0.15` (installed 5.0.15) with `persist` middleware — CONFIRMED.
- **3D:** `three` `^0.186.1` (installed 0.186.1), `@react-three/fiber` `^9.8.1` (9.8.1), `@react-three/drei` `^10.7.9` (10.7.9) — CONFIRMED. *(Not listed in the init brief; present and load-bearing for the 3D turntable hero.)*
- **Icons / UI utils:** `lucide-react` `^1.55.0` (installed 1.55.0), `sonner` `^2.0.8` (toasts), `clsx` `^2.1.1`, `tailwind-merge` `^3.7.0` — CONFIRMED.

## Backend

- **None first-party.** No Express/Nest/Next server, no Edge Function, no serverless code — CONFIRMED.
- **Hosted backend:** Supabase. `@supabase/supabase-js` `^2.118.0` (installed 2.118.0) provides Auth (email/password + Google/GitHub OAuth) and PostgREST data access — CONFIRMED (`src/lib/supabase.ts`, `src/store/auth.ts`).
- **SQL migrations (run by hand in the Supabase SQL Editor):** `supabase/migrations/20261018_orders.sql` (`public.orders`, RLS select/insert own rows) and `supabase/migrations/20261019_leads.sql` (`contact_messages`, `newsletter_subscribers`, INSERT-only; **never applied**) — CONFIRMED.
- **Payments:** no gateway integrated. Manual bank transfer is env-gated; the Midtrans provider is registered but `available: false` (Wave 1) — CONFIRMED (`src/lib/payments.ts`).

## Mobile

- **None.** Responsive web only — CONFIRMED.

## Database

- **PostgreSQL via Supabase**, accessed through the Supabase JS client — **no ORM, no query builder** (hand-written `.from(...).select/insert`) — CONFIRMED.
- Tables: `public.orders` (live), `public.contact_messages` + `public.newsletter_subscribers` (migration pending). RLS on all three — CONFIRMED.
- **Client-side persistence remains:** zustand `persist` (`bato-cart`, `bato-wishlist`, `bato-fitting`, `bato-auth`) and raw `localStorage` `bato-orders` for guest orders — CONFIRMED.

## AI / ML

- **None** — CONFIRMED.

## Infrastructure

- **None configured.** No Dockerfile, no IaC, no host config — CONFIRMED.

## CI / CD

- **None.** No `.github/`, no CI YAML — CONFIRMED.

## Build / tooling

- `vite` `^7.3.7`; `typescript` `~6.0.2`; `oxlint` `^1.81.0` (installed 1.87.0) with `.oxlintrc.json`; `@types/node` / `@types/react` / `@types/react-dom` / `@types/three` — CONFIRMED.
- **Testing:** `vitest` `^5.0.5` (installed 5.0.5) + `@testing-library/react` 16.3.3 / `jest-dom` 7.0.1 / `user-event` 14.6.8 + `jsdom` 30.1.3; config `vitest.config.ts` with pinned placeholder env vars — CONFIRMED.
- Scripts: `dev` = `vite`; `build` = `tsc -b && vite build`; `lint` = `oxlint`; `test` = `vitest run`; `test:watch` = `vitest`; `preview` = `vite preview` — CONFIRMED (`package.json`).
- **No `strict` (or `strictNullChecks`) in any tsconfig**; only `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch` — CONFIRMED (debt).

## Verification sources

| File | What it proves |
|------|----------------|
| `package.json`, `package-lock.json` | Dependency set and exact installed versions — CONFIRMED |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TS config, project references, `files: []` root — CONFIRMED |
| `vite.config.ts` | Vite plugins (react + tailwindcss); **no server/port config** — CONFIRMED |
| `src/index.css` | Tailwind v4 `@import "tailwindcss"` + `@theme` tokens/fonts — CONFIRMED |
| `src/App.tsx`, `src/main.tsx` | Routing (9 routes) + app bootstrap — CONFIRMED |
| `supabase/migrations/*.sql` | Database schema + RLS policies — CONFIRMED |
| `vitest.config.ts`, `src/**/*.test.*` | Test framework, env pinning, 9 files / 141 tests — CONFIRMED |
| `.oxlintrc.json` | Lint rule set — CONFIRMED |
| `node -v` / `npm -v` | Node v26.8.1, npm 11.19.0 — CONFIRMED |

## Change log

| Date | Change | Evidence |
|------|--------|----------|
| 2026-10-13 | Initial stack record from repo scan | package.json, tsconfig*, vite.config.ts, index.css |
| 2026-10-17 | Supabase added as the hosted backend (auth only) | package.json, src/lib/supabase.ts |
| 2026-10-18 | Wave 0: Supabase DB tables + migrations, Vitest + Testing Library + jsdom, `test` script | supabase/migrations/*, vitest.config.ts, package.json |
