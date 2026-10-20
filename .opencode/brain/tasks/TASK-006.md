# TASK-006 · Fitting-room avatar swap (cogan/cecan) — loading fix + orientation

> Task record. Confidence markers apply (CONFIRMED / INFERRED / UNKNOWN).
> Session: 2026-10-14 (session 6). User: *"saya ingin melanjutkan tuning avatar
> cogan.glb dan cecan.glb"*.

## Goal

Make the realistic rigged avatars `cogan.glb` / `cecan.glb` actually render in
the 3D fitting room (they were dead → SVG fallback), standing upright at the
right scale/position.

## Findings (evidence)

Pre-state — the 3D stage never rendered:

- `Mannequin3D.tsx` (mtime **2026-10-14 09:28**) sets `BODY_URL = {male:
  "/model/cogan.glb", female: "/model/cecan.glb"}`, but **neither file existed in
  `public/model/`**. Vite dev answered the request with `index.html`, so
  `GLTFLoader` threw `Unexpected token '<'` → `Mannequin.tsx`'s `StageBoundary`
  caught it → **flat SVG fallback** (clothes visible, avatar absent). Verified
  live: Playwright console showed `Could not load /model/cogan.glb` and
  `[Mannequin] 3D stage failed; using the SVG fallback`. — CONFIRMED
- The real files were present as **`public/model/male.glb` (= `cogan.glb`)** and
  **`female.glb` (= `cecan.glb`)** — md5 identical (`ff078c19…`, `ce24e1f6…`),
  copied 2026-10-14 08:41. — CONFIRMED
- The `GlbBody` transform was written for the **old Z-up primitive**:
  `rotation={[-π/2,0,0]}` + `scale={m.k≈0.954}` + `position={[0, m.ty≈-0.93, 0]}`
  (from `constants/body.ts`). The new avatars are **Y-up, feet at y≈0, height
  ≈1.65 m (cogan) / ≈1.75 m (cecan)** — so that transform tips them flat. —
  CONFIRMED (GLB scene root node scale/translation + POSITION bbox).
- GLB structure: 1 scene / 1 skinned mesh / **1 material "Realistic Skin - Web
  Optimized"** (3 PNG textures: base/normal/roughness). **No garment baked in**,
  no animations, root node names are **cross-labelled** (see below). — CONFIRMED
- **Gender mapping is inverted:** `cogan.glb` root node = `"Woman (Rig)"` and
  reads as **female**; `cecan.glb` root node = `"Man (Rig)"` and reads as
  **male**. Heights corroborate (1.65 vs 1.75). — CONFIRMED (2 independent
  signals: file metadata + vision model).
- The current `Mannequin3D.tsx` renders the **body only — no garments** (the
  documented Tier B analytic garment refit is gone; `constants/body.ts` is now
  otherwise unused). Clothes now show **only** in the SVG fallback. — CONFIRMED

## Changes

- `public/model/` — renamed `male.glb → cogan.glb`, `female.glb → cecan.glb` so
  the on-disk names match `BODY_URL`.
- `public/model/` — **swapped the two files' contents** (user-confirmed intent:
  `cogan` = male, `cecan` = female). Before: `cogan.glb` held the `"Woman (Rig)"`
  body and `cecan.glb` the `"Man (Rig)"` body (inverted). After: `cogan.glb` =
  `ce24e1f6…` (Man, 4 552 360 B) → male slot; `cecan.glb` = `ff078c19…` (Woman,
  3 563 512 B) → female slot.
- `src/components/Mannequin3D.tsx`
  - `GlbBody` now **auto-fits** from the loaded bounding box: scale to
    `TARGET_HEIGHT = 1.9`, centre X/Z, sit feet on `FLOOR_Y = -0.95`; dropped the
    `bodyMetrics` import and the `-π/2` rotation (the avatars are already Y-up).
  - Added `MONOCHROME = true` switch (keeps the `#c9c5bc` house repaint of D-010).

## Validation

- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npx vite build` exit 0
  (`Mannequin3D` chunk 72.50 kB).
- Dev server: `/model/cogan.glb` → HTTP 200, 3 563 512 B; `/model/cecan.glb` →
  200, 4 552 360 B. Served module contains the new `TARGET_HEIGHT`/`setFromObject`
  code. — CONFIRMED
- Browser (Playwright, viewport 1440×1000): fitting room opens with **0 console
  errors**; canvas fills its 290×540 container; vision model confirms for both
  slots — whole body head-to-feet, upright, facing viewer, monochrome grey, no
  clothing. — CONFIRMED
- **Gender swap re-verified** after the file swap (dev :5200 serves the new md5s;
  `Cache-Control: no-cache` so a reload refetches): vision model → male slot =
  **male**, female slot = **female**; 0 console errors. — CONFIRMED

## Notes / method corrections

- **Viewport trap:** at a short Playwright viewport (933×331) the stage
  `flex-1` collapses to 0 px and R3F falls back to a 300×150 canvas — a
  *test-harness* artifact, not a product bug. Always size the viewport before
  judging the stage layout. — CONFIRMED
- Vision gender calls and the in-file rig names **agree**, which is why the swap
  is treated as real rather than a VLM error.

## Result

PARTIAL → **RESOLVED (2026-10-14, session 7).** Avatar now loads, stands upright,
framed correctly; **gender mapping is corrected** (cogan = male, cecan = female;
verified); and **garments now render on both genders** in the avatars' realistic
skin (bone-driven rebuild — see the session-7 section below). Remaining open
item is cosmetic: the hardcoded height label vs the scaled model.

## Open questions (need user input)

1. Should the 3D stage render the worn pieces again (refit to the new body / via
   `garment.glb`), or stay body-only for now?
2. Keep the house grey repaint (`#c9c5bc`) or show the avatars' realistic skin?
3. ~~Confirm `cogan` = male / `cecan` = female.~~ **RESOLVED** — confirmed, files
   swapped (see Changes).

## Lessons

- A GLB referenced by code but absent from `public/` fails silently into the
  fallback; **assert the asset HTTP 200** when swapping a model.
- Don't reuse one model's transform (`body.ts`) for another model — measure the
  loaded bounding box instead; avatar up-axis/height varies per source.

## 2026-10-14 (session 7) — garments on the rigged avatar (bone-driven rebuild)

**Goal (answering the open questions above):** render the worn pieces on the new
realistic body (`cogan.glb`/`cecan.glb`) with realistic skin — no garment baked
in, no monochrome repaint, garments fitted anatomically.

### Approach

`src/lib/avatar.ts` rebuilt around real bone landmarks:
- `bonePoints(root, group)` reads every joint in `group` space; `normalise()`
  de-punctuates glTF names (`spine.005` → `spine005`, `shoulder.L` → `shoulderL`).
- `measureFit(p, bones)` takes anatomy off the rig — `pelvis*` = hip, `spine005` =
  neck base, `upper_arm*` = shoulder, `hand*` = wrist, `shin*` = knee, `foot*` =
  ankle — each with a stature-fraction fallback.
- `extractBody()` measures the **skinned** surface (`SkinnedMesh.applyBoneTransform`)
  in group space; `buildGarment()` duplicates that surface, offsets each vertex
  along its normal by the cloth thickness, and keeps the faces a shape covers
  (torso/arm split + leg band).

### Bugs found & fixed (evidence)

1. **Inside-out GLB.** The avatar mesh is authored with **both** winding and
   authored normals facing the body interior (mirror-scaled root node). Dev probe:
   `outwardXZ.dot = −0.369` and `windingDotRadial = −0.406` (agree, negative). So
   `P + N·pad` pushed the cloth *into* the skin → garments invisible.
   **Fix:** signed-volume test in `extractBody`; negate `N` when `volume < 0`.
   After: `outwardXZ.dot = +0.369` (male) / `+0.367` (female).
2. **Width profile measured from the world origin.** `halfX` used `Math.abs(x)`,
   but the body is centred at x ≈ 0.75 (male) / −0.63 (female). **Fix:** measure
   from the body mid-line (`centerX`, the x-bbox centre) and use it in the
   torso/arm and leg splits.
3. **Sparse low-poly bins read as zero width.** The female shin has a vertex gap
   (leg scan: 0 vertices near y ≈ 0.11), so those `halfX` bins stayed 0 → the leg
   filter dropped the shins and the trousers stopped at mid-calf. **Fix:**
   interpolate `halfX` across empty bins (leading/trailing borrow the nearest).

### Validation

- Gates: `tsc -b --force` 0 · `oxlint src` 0 · `vite build` 0.
- Browser (Playwright 1440×1000), both genders, **0 console errors** (1 benign
  `THREE.Clock` deprecation warning from drei):
  - male: `centerX 0.751`, `dot +0.369`; layers — trousers `y[0.051,0.62]`,
    hoodie `y[0.432,0.885]`, jacket `y[0.431,0.892]`.
  - female: `centerX −0.631`, `dot +0.367`; trousers `y[−0.058,0.625]` (reaches
    the ankle after the sparse-bin fix), hoodie/jacket `y[0.447,0.878]`.
- Vision (Qwen2.5-VL), light backdrop, both genders: **head bare** (realistic
  skin), **torso covered** by the dark top/jacket, **sleeves to the wrist**
  (rechecked with a focused arm crop), **trousers to the ankles**, **no cloth on
  the face / no floating cloth**.
- Dev probe `window.__avatarFit` extended (gender, landmarks, `centerX`, layer
  bboxes over indexed vertices, `outwardXZ`, `bones`).

### Notes / method corrections

- `computeBoundingBox()` measures the whole `position` attribute, not just indexed
  vertices → misleading garment bboxes; compute over the index buffer.
- Element-screenshots of the WebGL canvas can return a **stale** composited frame
  (identical md5 across different states) → take a full viewport screenshot and
  crop the canvas rect.
- Do **not** set `gender` by editing `localStorage` directly: the store's
  `persist` writes on the next state change and clobbers it. Use the UI toggle.

### Open (needs user input)

- `FittingRoom.tsx` hardcodes the height label `1.80 m` / `1.70 m` while the
  rendered figure is scaled to `TARGET_HEIGHT = 1.9`; confirm the intended values.
