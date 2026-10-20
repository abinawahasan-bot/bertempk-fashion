# TASK-003 · Tier B — rigged GLB body + gender selector + analytic garment refit

> Task record. Confidence markers apply (CONFIRMED / INFERRED / UNKNOWN).
> Session: 2026-10-13 (session 4).

## Goal

Replace the Tier A procedural body with the user's **rigged humanoid GLB** (`male`/`female`) and **refit the procedural garments analytically** to the broader, A-posed body. Add a gender selector. Approved approach (option a): render the GLB body verbatim, keep the authored A-pose, no re-posing.

## Scope delivered

### Added
- **`src/constants/body.ts`** — analytic mirror of the GLB generator so garments can be refit:
  - `K = 1.9 / 1.992 = 0.9538153` (glb→project uniform scale); `S = 1.80` (male) / `1.70` (female) height factor.
  - `bodyMetrics(gender)` (cached) → `BodyMetrics`; `EProfile = [y, rx, rz][]`; `bodySection(m, y)` (unions pelvis/waist-cylinder/chest/head spheres); `torsoShellProfile(m, hem, pad, top = 0.715, steps = 10)`.
  - Mapping: `projectX = glbX·K`, `projectY = glbZ·K + ty`, `projectZ = −glbY·K`; `ty = −0.95 − K·lowest` → **male ≈ −0.933917**, **female ≈ −0.942512** (both feet at y −0.95).

### Changed
- **`src/types/index.ts`** — `export type Gender = "male" | "female"`; `MannequinProps.gender?: Gender`.
- **`src/constants/fit.ts`** — `wornLabel(picks, gender)` → `"male model"`/`"female model"` prefix; empty picks → `"Fitting room <who>"`.
- **`src/store/fitting.ts`** — added `gender: Gender` (default `"male"`) + `setGender`; `partialize` now `{gender, picks, colors, sizes}`. No migration needed (zustand v5 default shallow merge keeps the default when a pre-existing persisted blob has no `gender`).
- **`src/components/FittingRoom.tsx`** — "Model" segmented toggle (`BODIES = ["male","female"]`, group `aria-label="Mannequin body"`, buttons `aria-label="{body} model"` + `aria-pressed`, acid active style), height readout (`1.70 m` / `1.80 m`), passes `gender` to `<Mannequin>`.
- **`src/components/MannequinSvg.tsx`** — `gender` prop threaded to the SVG fallback label (geometry unchanged).
- **`src/components/Mannequin3D.tsx`** — rewritten body/garment path:
  - `GlbBody({gender})` — `useGLTF` on the cached scene **directly** (no `clone`), shared monochrome `bodyMaterial` `#c9c5bc` (rough 0.42, metal 0.03), `computeVertexNormals()` when `NORMAL` is missing, `frustumCulled={false}`, wrapped in `<group rotation={[-π/2,0,0]} scale={m.k} position={[0,m.ty,0]}>`; `useGLTF.preload()` for both genders.
  - Garments refit from `body.ts` via a custom elliptical lathe (`shellGeometry`) + `Shell`/`Prism`/`Arm`; `sizeScale` width-only `[k,1,k]` (`SIZE_SCALE` XS 0.955 / S 0.975 / M 1 / L 1.025 / XL 1.05); `pad = layer * LAYER_STEP`.
  - Constants: `SHELL_TOP 0.7`, `COLLAR_YS [0.72,0.748,0.776]`, `WAIST_TOP 0.14`, **`HEM_BOTTOM −0.85`** (lowered from −0.9 which would have swallowed the bare feet at y ≈ −0.88), `CLOTH 0.014`.
  - Tuple-typing fixes for `COLLAR_YS.map(...)` and `Prism`'s `useMemo<EProfile>` under `tsc -b` strictness.

## Assets

- `public/model/mannequin-male.glb` (85 184 B) · `mannequin-female.glb` (90 592 B) — real rigged humanoids, `User`-less "approximate reference mannequin generator" output (explicitly not an identity likeness). 17 joints, 23 primitives, **no `NORMAL`**, 3 flat materials, no animations, no morphs, **rigid 1-bone skinning**.
- Bind pose = rest pose (skinning is identity — verified by full joint-matrix evaluation).

## Numeric pre-check (no-clip) — PASS both genders

`/tmp/opencode/fitcheck.mjs`: male seat margins x 0.0141 / z 0.0073; trouser-leg min clearance **0.0140** (both genders); female seat x 0.0271 / z 0.0100. Body silhouette `|x|max` male 0.661 / female 0.618. Camera `[0,0,5.15]` fov 30 covers worst aspect 0.537; XL width `0.661·1.05 = 0.694 < 0.742` available.

## Verification

- **Static/built:** `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` exit 0 (2939 modules; `Mannequin3D` chunk 23.6 kB → **95.96 kB** as it now pulls GLTFLoader + skinning).
- **Rendered body (pixel probe of the `<canvas>`, aspect 0.538, px/m 196):** bare male — head Ø **0.276 m** (measured halfW 0.143), **arm reach halfW 0.653 m** (expected hand edge 0.658), legs halfW 0.26 (exp 0.262), shins 0.24 (exp 0.242), total height 1.9 m, centred (cxOff ≈ 0). Female — crown shorter (row 107 vs 85), arm reach 0.605 vs 0.653, legs 0.235 vs 0.260. **All within tolerance.**
- **False positive resolved:** the first clothed shot appeared to show no arms; the clothing mask (luma > 60) missed the **dark jacket sleeves**, and the probe read the wrong canvas size (443 vs 541 px tall → wrong px/m). Bare-body probe + `skinned.mjs` (identity skinning) proved the arms render.
- **Gender persistence:** `localStorage["bato-fitting"]` → `{"gender":"female",...}`; survives reload; UI restores `female model` `aria-pressed="true"`; label `"female model wearing Wide Trousers / 003"`.
- **Reduced motion:** canvas still renders (`frameloop="demand"`).
- **WebGL-off fallback:** 0 canvas / 44 `<svg>`, gender-aware label intact, 0 errors.
- **Console:** 0 errors; only the pre-existing `THREE.Clock` deprecation warnings (×2).

## Issue found & fixed during QA

- **ISSUE-005** (new) — the **Vite dev server served a stale transform** of `src/store/fitting.ts`: `partialize` without `gender`, even after a full page reload, because the file watcher missed the 4th edit. Disk was correct; the served module (and its inline sourcemap) was not. Fix: `touch src/store/fitting.ts` to re-trigger the watcher, then re-verify. Lesson: **verify the SERVED module (`curl .../src/...`), not just the file on disk.** See FAILURES F-008.

## Files touched

`src/constants/body.ts` (new) · `src/types/index.ts` · `src/constants/fit.ts` · `src/store/fitting.ts` · `src/components/FittingRoom.tsx` · `src/components/MannequinSvg.tsx` · `src/components/Mannequin3D.tsx` · `public/model/mannequin-{male,female}.glb` (new assets).

## Status

**DONE / VERIFIED** (2026-10-13). Residual: user to visually sign off; wordmark styling + localStorage leftovers open (non-blocking).
