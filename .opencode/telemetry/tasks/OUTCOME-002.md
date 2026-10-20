# Task Outcome Record — TASK-002

Per-project telemetry for SIGNIFICANT tasks only (see rules). Location:
`.opencode/telemetry/tasks/`. Never contains secrets (ENV_VAR_NAME only).

## Task

Replace the flat SVG fitting-room mannequin with a procedural React Three Fiber
3D mannequin (procedural assets only), keep the SVG as the no-WebGL/error
fallback and a `.glb` swap hook ready; then clear an independent code review and
fix its blockers. (User-approved "Tier A".)

## Category

feature · bug · refactoring (layered fix cycle)

## Agents Used

- `code-reviewer` — independent read-only review pre-fix; verdict NOT APPROVED
  (3 CRITICAL blockers C1/H1/H2 + M/L findings). Outcome: useful, precise.
- `orchestrator` — implementation of the fix cycle, in-session browser/pixel
  verification, static gates, and the whole Project Brain update. Outcome: done.
- `outcome-collector` — **dispatch FAILED** (env: "OpenCode's free tier can only
  be used from within OpenCode"); record written by the orchestrator instead.

## Skills Used

orchestration · project-brain · code-reviewer · telemetry (this record)

## Files Changed

Key only (not every line):

- NEW `src/components/Mannequin3D.tsx` — procedural R3F body + 6 garment shells,
  `Pop` motion, `OrbitControls`, `ContactShadows`, `.glb` swap hook.
- NEW `src/components/MannequinSvg.tsx` — the former flat SVG, now the fallback.
- REWRITTEN `src/components/Mannequin.tsx` — lazy + `Suspense` + error boundary
  + cached `hasWebGL()` gate.
- `src/lib/useReducedMotion.ts` — synchronous `matchMedia` seed.
- `src/types/index.ts` (`MannequinProps`), `src/constants/fit.ts` (`wornLabel`),
  `src/components/FittingRoom.tsx` (passes `sizes`).

## Validation

What was actually run (evidence, not claims):

- Static: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` exit 0
  (15.97 s, 2938 modules; `Mannequin3D-CoW9zXvg.js` 23.55 kB,
  `index-BFhzfLVH.js` 521.67 kB, `ContactShadows-C5hQhnCU.js` 928.67 kB warned).
- H2 (reduced-motion first frame): Playwright element screenshots, reduced vs
  no-preference → centre-column garment run byte-identical; hem edge row 281 = 281.
- H1 (`sizeScale` pivot): with trousers worn, figure base row 457 identical for
  XS and XL; lower-leg width 89 → 97 px; figure rows 52–457 of a 291×493 canvas
  → no clipping.
- C1 (z-fighting): isolated-spike metric on the layered torso 1 / 46,207 px =
  0.002% (bare skin 1 / 15,211 = 0.007%; single-layer legs 0 / 28,987).
- Degraded path: WebGL off → 0 canvas, `<svg>` rendered, label "Fitting room
  model" / worn "Model wearing Mod Jacket / 001", 0 console errors.

## Tests

No automated test framework exists in this repo (Testing = RED) → no suites
passed/failed; regression tests NOT added (none possible without a framework).
Verification was screenshot pixel-probing + static gates.

## Failures

- CODE (fixed): C1 coincident layered surfaces; H1 world-origin scale pivot;
  H2 reduced-motion first frame stranded mid-animation; L1 buried short cuff;
  L3 unused local.
- ARCHITECTURE (open, deferred to TECHNICAL_DEBT): M1 uncapped lathes; M4 >500 kB
  vendor chunk.
- TOOLING: `outcome-collector` subagent dispatch impossible in this environment.
- PROJECT: no test framework; repo not a git repo (no commit/rollback context).

## Retries

2 verification-method corrections (count + what changed):
1. `canvas.__r3f` not exposed in this R3F build → scene-graph introspection
   impossible → switched to screenshot pixel probes.
2. Initial tone map read at the wrong canvas dimensions and looked sheared →
   re-ran at native size (291×456).

## Security Findings

None. Static client-only SPA, no auth/API/secrets; secret scan clean. No CRITICAL/
HIGH security findings. (Backend hardening N/A.)

## Final Result

DONE (Tier A complete; all review blockers closed; gates green).
Tier B BLOCKED — awaits a user-supplied `public/model/mannequin.glb` (none on disk).

## Lessons

1. Consecutive rendered 3D layers must be separated by a fixed geometric step of
   the worn order (≈100× the depth-buffer ULP) — not left coincident.
2. A scale applied to a joint-pivoted figure must pin the vertical axis; and any
   state deciding whether an animation starts must be correct on FIRST commit,
   with an explicit snap-to-rest path when motion is suspended.

## Rules

- Create for significant tasks only; trivial edits get an event row, not a record.
- Do not store passwords, keys, tokens, or credentials.
- Quality check before writing: run the no-secret scan.
