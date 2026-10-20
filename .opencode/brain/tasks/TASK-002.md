# TASK-002

> Task memory record — created ONLY for meaningful engineering work. Directory: .opencode/brain/tasks/
> Created 2026-10-13 (session 2). Not a git repo — reconstructed from files + verification artifacts.

## Objective

**Tier A:** replace the flat SVG fitting-room mannequin with a real, **procedural 3D mannequin** (React Three Fiber, no external/downloaded assets), keeping the SVG as the no-WebGL/degraded fallback and keeping a `.glb` swap hook ready for a user-supplied mannequin model (promised, **not yet provided**). Then clear an independent `code-reviewer` pass.

## Context

- User approved Tier A after the Tier 0 hero-recolour work (TASK-001). The user will supply a real mannequin `.glb` later; no mannequin `.glb` exists on this machine (verified).
- Brain: DECISIONS D-003 (fitting-room model), **D-008** (3D default + SVG fallback), **D-009** (3D geometry/motion rules); ARCHITECTURE fitting-room + Hero modules; FAILURES **F-005/F-006/F-007**; KNOWN_ISSUES ISSUE-004.
- Prior art: `GarmentTurntable.tsx` / `HoodieModel.tsx` (R3F + drei + procedural geometry), `lib/useReducedMotion.ts`, zustand `bato-fitting`.

## Plan

1. New `Mannequin3D.tsx`: procedural body (`latheGeometry` torso z-squashed 0.66 + capsule limbs + `RoundedBox` feet) and six garment shells (tee/crop/hoodie/jacket/vest/trousers) as inflated surfaces; lights + `ContactShadows` only (no drei `Environment`/HDR — avoids a CDN fetch); `OrbitControls` with front framing.
2. New `MannequinSvg.tsx`: the previous flat SVG, preserved verbatim as the fallback.
3. `Mannequin.tsx` becomes a wrapper: `lazy(() => import("./Mannequin3D"))` + `Suspense` (SVG fallback) + `StageBoundary` error boundary + `hasWebGL()` gate → the stage is never blank.
4. Move shared non-component values out of components to satisfy `react/only-export-components` (`MannequinProps` → `src/types/index.ts`; `wornLabel` → `src/constants/fit.ts`).
5. Independent `code-reviewer` (read-only) → fix all CRITICAL/HIGH findings → re-verify empirically.

## Changes

| File | Change | Reason |
|------|--------|--------|
| `src/components/Mannequin3D.tsx` | **NEW** — procedural 3D mannequin stage: body, 6 garment shells, `Pop` motion, `OrbitControls`, `ContactShadows`, `.glb` swap hook | Tier A (D-008) |
| `src/components/MannequinSvg.tsx` | **NEW** — the former flat SVG mannequin | No-WebGL fallback (D-008) |
| `src/components/Mannequin.tsx` | REWRITTEN as wrapper: lazy 3D + `Suspense` + `StageBoundary` + `hasWebGL()` (`webglProbe` cached, `componentDidCatch` logs) | Degrade without a blank stage |
| `src/lib/useReducedMotion.ts` | `useState` now seeded by a synchronous `initial()` `matchMedia` read | First commit must already honour reduced motion (F-007) |
| `src/types/index.ts` | `MannequinProps` | Keep constants out of component files (F-003) |
| `src/constants/fit.ts` | `wornLabel(picks)` | Shared aria-label for SVG + 3D (parity) |
| `src/components/FittingRoom.tsx` | Passes `sizes` to the mannequin | Size readout |
| `Mannequin3D.tsx` (review fixes) | `LAYER_STEP = 0.014` + `pad` threaded through `Shell`/`Sleeves`/all garments/`Garment`/`Pop` map; `sizeScale()` → `[k, 1, k]`; `Pop` snap `useEffect` + `!active` guard; `cuffY`/`cuffR` fix; removed unused `FitShape` local | C1, H1, H2, L1, L3 (F-005/F-006/F-007) |

## Tests

- `npx tsc -b` → exit 0 · `npx oxlint src` → exit 0 (both re-run after the fixes). — CONFIRMED
- `npm run build` → exit 0, **15.97 s**, 2938 modules. Chunks: `index-C7XQqlFW.css` 40.44 kB · `GarmentTurntable-xJRhqP6P.js` 2.75 kB · `Mannequin3D-CoW9zXvg.js` **23.55 kB** · `index-BFhzfLVH.js` 521.67 kB (gzip 162.91) · `ContactShadows-C5hQhnCU.js` 928.67 kB (gzip 249.96, >500 kB warning — M4). — CONFIRMED
- **Visual QA by pixel probe** (no framework; screenshots → `magick … -flatten -depth 8 RGB:` → node scripts in `/tmp/opencode`):
  - **H2:** centre-column garment run = dark 102–281, hem edge row **281** in *both* reduced and no-preference → reduced frame sits exactly at the resting pose (old bug would strand it ~10 px high). — CONFIRMED
  - **H1:** with trousers worn (Bone), figure **base row 457 identical** for XS and XL, while the lower-leg width grows **89 → 97 px** (≈ 1.05/0.955) → size changes width, not height. No clipping (canvas 291×493; figure rows 52–457). — CONFIRMED
  - **C1:** isolated-spike metric on the layered torso = **1 / 46,207 px (0.002%)**, indistinguishable from bare skin (1/15,211 = 0.007%) and single-layer legs (0/28,987) → no z-fighting speckle field. — CONFIRMED
  - **Fallback:** WebGL disabled → 0 `<canvas>`, `<svg>` shown, label "Fitting room model"; worn → "Model wearing Mod Jacket / 001", 0 console errors. — CONFIRMED
- No automated tests exist (TESTING.md).

## Issues

- **Code review (pre-fix) blocked:** C1 z-fighting on layered garments (identical sleeves + coincident shells), H1 `sizeScale` pivoting on the world origin, H2 reduced-motion first frame. All three fixed (D-009) and re-verified. See FAILURES F-005/F-006/F-007.
- **Deferred (TECHNICAL_DEBT):** M1 uncapped/`DoubleSide` lathes, M3 drag-only rotation has no keyboard path (kept `role="img"`), M4 `ContactShadows` 928 kB chunk, plus the reviewer's remaining LOW findings.
- **Blocked:** no mannequin `.glb` on disk → Tier B (photoreal body) cannot start; the `.glb` swap hook is ready.

## Final Status

- Status: **DONE (Tier A)** — 3D mannequin is the default path, SVG fallback verified, all review blockers closed; gates green.
- Validation: `tsc -b`, `oxlint`, `build`, plus the pixel-probe battery above.
- Handoff: keep `LAYER_STEP` inflation when adding garments; keep sizing width-only (`sizeScale` returns `[k,1,k]`) or re-introduce H1; keep the `Pop` snap for any new motion; when the user supplies `public/model/mannequin.glb`, swap `Body` for a `useGLTF` clone (mirrors `GarmentTurntable`); re-audit the deferred M-items; add Vitest+Playwright to protect the layering rule (TESTING.md).
