# DEPENDENCIES

> Project Brain file · MEANINGFUL dependencies only. Confidence: CONFIRMED.
> Versions: range from `package.json`; installed from `package-lock.json`.

## Key dependencies

| Dependency | Purpose | Version (range → installed) | Compatibility constraints | Confidence |
|------------|---------|-----------------------------|---------------------------|------------|
| `react` / `react-dom` | UI runtime | `^19.2.8` → 19.3.0 | React 19 | CONFIRMED |
| `react-router-dom` | SPA routing | `^7.18.4` → 7.18.4 | v7 API (`BrowserRouter`, `useSearchParams`) | CONFIRMED |
| `vite` + `@vitejs/plugin-react` | Build/dev | `^7.3.7` / `^4.7.0` | — | CONFIRMED |
| `typescript` | Type checking | `~6.0.2` → 6.0.3 | project references + `tsc -b` | CONFIRMED |
| `@tailwindcss/vite` + `tailwindcss` | Styling | `^4.3.3` → 4.3.3 | Tailwind v4 CSS-first (`@theme`), no JS config | CONFIRMED |
| `motion` | Animation | `^14.1.0` → 14.1.0 | import from `motion/react` (former Framer Motion) | CONFIRMED |
| `zustand` | State | `^5.0.15` → 5.0.15 | `persist` middleware, localStorage | CONFIRMED |
| `three` | 3D engine | `^0.186.1` → 0.186.1 | r183+ deprecates `Clock` (see TECHNICAL_DEBT) | CONFIRMED |
| `@react-three/fiber` | React↔three renderer | `^9.8.1` → 9.8.1 | pairs with three 0.186 / React 19 | CONFIRMED |
| `@react-three/drei` | three helpers | `^10.7.9` → 10.7.9 | uses `ContactShadows`, `useGLTF`, `RoundedBox` | CONFIRMED |
| `lucide-react` | Icons | `^1.55.0` → 1.55.0 | **no `Hanger` icon**, brand icons dropped | CONFIRMED |
| `sonner` | Toasts | `^2.0.8` → 2.0.8 | Toaster styled in `Layout.tsx` | CONFIRMED |
| `clsx` + `tailwind-merge` | Class merge (`cn()`) | `^2.1.1` / `^3.7.0` | — | CONFIRMED |
| `oxlint` | Linting | `^1.81.0` → 1.87.0 | rules in `.oxlintrc.json` | CONFIRMED |
| `@supabase/supabase-js` | Hosted BaaS client — Auth + PostgREST data access | `^2.118.0` → 2.118.0 | Anon key ships in the bundle by design; RLS is the only access control | CONFIRMED |
| `vitest` | Test runner (jsdom) | `^5.0.5` → 5.0.5 | needs the pinned placeholder env in `vitest.config.ts` | CONFIRMED |
| `@testing-library/react` + `jest-dom` + `user-event` | Component/DOM assertions | 16.3.3 / 7.0.1 / 14.6.8 | React 19 compatible | CONFIRMED |
| `jsdom` | Test DOM environment | `^30.1.3` → 30.1.3 | no `canvas` package → WebGL paths warn (benign) | CONFIRMED |
| `@types/*` | TS types | node/react/react-dom/three | — | CONFIRMED |

## Dependency decisions

- Caret/tilde ranges resolve to newer patch/minor at install (e.g. oxlint 1.81→1.87, react 19.2.8→19.3.0). Lockfile not committed to git (no git repo) — CONFIRMED.
- `@react-three/*` are opt-in for the 3D turntable hero but always installed. — CONFIRMED
- `@supabase/supabase-js` is the only runtime dependency that talks to a network API; it moved the main bundle from ~531 kB to ~820 kB (cause INFERRED, not bundle-analysed) — CONFIRMED (sizes) / INFERRED (cause) — see TECHNICAL_DEBT.

## Known constraints

- Tailwind v4 requires the Vite plugin; do not add a v3-style `tailwind.config.js` — CONFIRMED.
- `motion` v14 must be imported via `motion/react` (not `framer-motion`) — CONFIRMED.

## Watch items

- `three` `Clock` deprecation (see TECHNICAL_DEBT).
- Oversized bundle (three/R3F) — see TECHNICAL_DEBT.
- No `npm audit` cadence configured (SEC-010).
- `@supabase/supabase-js` is now security-critical: its RLS policies are the only access control for `orders` and the lead tables. A client dependency bump can change default request behaviour — watch on upgrade.

## Rules

- Add rows for deps that shape architecture or carry security risk; skip transitive noise.
- Update on intentional dependency changes (see CHANGE_HISTORY.md).
