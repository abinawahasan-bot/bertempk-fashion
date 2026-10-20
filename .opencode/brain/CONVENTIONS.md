# CONVENTIONS

> Project Brain file · Project conventions OVERRIDE generic skill recommendations when there is no security or correctness conflict.
> Confidence: CONFIRMED (seen in code/docs), INFERRED, UNKNOWN.

## General

- **Naming:** Components/pages `PascalCase.tsx`; stores/constants/lib `kebab-case` or lowercase (`cart.ts`, `products.ts`, `useReducedMotion.ts`); barrelless direct imports — CONFIRMED.
- **Folder layout:** `src/components` (UI), `src/pages` (route views), `src/store` (zustand), `src/constants` (static data), `src/lib` (helpers/hooks), `src/types/index.ts` (shared types). Product type lives in `src/types/index.ts` — **not** `src/types.ts` — CONFIRMED.
- **Imports:** relative (`../lib/utils`, `../store/fitting`, `../constants/fit`); `type` imports use `import type` (enforced by `verbatimModuleSyntax`) — CONFIRMED.
- **Formatting / linting:** `npx oxlint src` (silent, exit 0 on success). Rule set: `react/rules-of-hooks: error`, `react/only-export-components: warn` with `allowConstantExport: true` (`.oxlintrc.json`) — CONFIRMED.

## Per layer

- **Components:** Default-export one component per file. Non-component exports should live in **non-component modules** (e.g. `src/lib/motion.ts`, `src/constants/`) to avoid the `react/only-export-components` (fast-refresh) warning — CONFIRMED (see comment in `lib/motion.ts`). `ScrollReveal.tsx` legitimately exports two components.
- **Class composition:** always `cn()` from `../lib/utils` (clsx + tailwind-merge) — CONFIRMED.
- **State management:** zustand; one store per domain under `src/store`; `persist` middleware for cart/wishlist/fitting with `bato-*` localStorage keys — CONFIRMED. Selectors used per-field (`useFittingStore((s) => s.open)`) — CONFIRMED.
- **Styling:** Tailwind v4 utility classes; design tokens from `@theme` in `src/index.css` (`bg-ink`, `text-bone`, `text-acid`, `border-steel/40`, `font-display`, …). No `tailwind.config.js` — CONFIRMED.
- **Animation:** `motion/react`; shared easing/variants from `src/lib/motion.ts` (`EASE_OUT`, `staggerContainer`, `staggerItem`); honour `useReducedMotion` — CONFIRMED.
- **Icons:** `lucide-react`; where lucide lacks a glyph, add an inline SVG component (e.g. `HangerIcon.tsx`) — CONFIRMED.
- **3D stage (React Three Fiber):** procedural geometry only — no downloaded assets, and no drei `Environment`/HDR (it adds a CDN fetch). Separate consecutive garment layers with `pad = layer * LAYER_STEP` using the **worn-array index** (`LAYER_STEP = 0.014`); scale a figure on a joint pivot **width only**; and whenever motion can be suspended (reduced motion, on-demand render loop) give it an explicit snap-to-resting path — CONFIRMED (D-008/D-009, F-005/F-006/F-007). Shared non-component props/labels go in `types`/`constants`, not the component file (see the fast-refresh rule).
- **Error handling:** writes return an explicit result type — `CreateOrderResult` (`lib/orders.ts`) and `LeadResult` (`lib/lead.ts`). **Never report success for a write that did not happen**: only clear the bag / reset the form / navigate on `ok: true`. User feedback via `sonner` toasts; unexpected failures use `console.warn` — CONFIRMED.
- **API conventions:** Supabase JS client only (`src/lib/supabase.ts`); data access via `supabase.from("orders").select/insert` — **no REST layer, no wrapper service, no fetch**. Env reads go through `lib/env.ts` `hasValue` so a placeholder never renders as real data — CONFIRMED.
- **Database conventions:** schema lives in `supabase/migrations/*.sql` (idempotent, run by hand in the SQL Editor), **RLS enabled on every table**, `revoke` explicit privileges where a table should be write-only, `force row level security` on PII tables. Client code reads via `lib/orders.ts` and normalises unknown rows before rendering — CONFIRMED.
- **Money:** all amounts are **whole rupiah** and go through `src/lib/money.ts` (`formatIDR`, `toRupiah`, `normalizeIDR`). Never hardcode a price format, a shipping rate or a threshold — read `src/constants/commerce.ts` — CONFIRMED (D-018).
- **Configuration:** every optional feature (payment, social, legal, contact) is **env-gated with no fallback**: absent config renders an honest "not configured" state, never a plausible-looking placeholder (e.g. a fake bank account) — CONFIRMED (D-019/D-020).
- **Persistence:** zustand `persist` stores use a `version` and a `migrate` that **coerces hostile stored data and never invents a value** (a legacy cart row keeps `size: null`) — CONFIRMED (D-015/D-016).
- **Testing conventions:** Vitest + Testing Library, tests **colocated** as `*.test.ts(x)` next to the source. `vitest.config.ts` **must** keep the pinned placeholder env vars so a test can never reach the live Supabase project or make a payment provider look available — CONFIRMED.
- **Git conventions:** repo is **not a git repository** (no `.git`) — UNKNOWN/none.

## Build & run gotchas (learned the hard way) — CONFIRMED

1. **Always run `npx tsc -b`**, not plain `tsc`. The root `tsconfig.json` has `"files": []` + project references, so plain `tsc` does nothing — CONFIRMED.
2. `npm run build` = `tsc -b && vite build` — CONFIRMED.
3. Dev server port is **not** in `vite.config.ts`. The known dev URL `http://127.0.0.1:5200/` comes from launching `vite --port 5200 --host 127.0.0.1` (visible in `/tmp/vite-dev.log`). Plain `npm run dev` would use Vite's default port (5173) — CONFIRMED.
4. `lucide-react@1.55.0` has **no `Hanger` icon** (and dropped brand icons), hence `HangerIcon.tsx` and the inline social icons in `Footer.tsx` — CONFIRMED.
5. `npx tsc -b` is green partly because **`strict` is off**. Treat `size: string | null` handling as unverified by the compiler (debt) — CONFIRMED.
6. `npx vitest run` prints benign jsdom noise (`Window's scrollTo`, `HTMLCanvasElement's getContext`) — **not** failures — CONFIRMED.
7. `formatIDR` output contains a non-breaking space (U+00A0) after "Rp"; compare formatted money via `normalizeIDR` — CONFIRMED (D-018).

## Explicitly forbidden

- **Do not add `z-index` or `opacity` to the `VideoGarment` media layer.** Either creates a nested stacking context and the garment renders as a black box (see FAILURES.md F-001). Use `position: relative` with no z-index inside the `isolate` hero section — CONFIRMED.
- **Do not place the STUDY-ONLY reference material into the site** (`/home/corvusjet/Bajuku.mp4`, `bajuku 1.webp`, `bajuku 2.webp`, `fiturku.mp4`) — CONFIRMED (constraint).
- **Never hardcode credentials, bank details, account numbers or contact addresses.** They are `VITE_*` env vars with no fallback (D-020). Never commit a real one — CONFIRMED.
- **Never emit `href="#"`.** If a destination does not exist, either build the page or delete the link — do not stub it (D-019).
- **Never let a card/grid quick-add bypass the size gate.** Adding to the cart requires an explicit size (D-017).
- **Never trust persisted or remote values as-is.** Normalise/coerce on read; `size` is `string | null` and `null` must block checkout (D-016).
- Never store secrets/credentials in the repo or in the brain — the repo **does** now hold a live Supabase publishable key in `.env` (gitignored); reference it as `VITE_SUPABASE_*` names only — CONFIRMED.

## Override order

1. Explicit user requirements
2. Security requirements
3. Actual project implementation
4. These project conventions
5. Specialized skills
6. Generic best practices

## Confidence notes

- Rules marked CONFIRMED were read directly from code/config (re-verified 2026-10-18). Nothing here is INFERRED except the "no circular deps" note in ARCHITECTURE.md.
