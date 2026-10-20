# FAILURES

> Project Brain file · Reusable lessons from RECURRING or expensive failures. Confidence markers apply.

## Failure log

### F-001 · Hero garment rendered as a black box (nested stacking context)

- **Problem:** The video garment rendered as an opaque black box instead of an alpha-composited hoodie. — CONFIRMED.
- **Cause:** A `z-index`/`opacity` (or other property creating a stacking context) was applied to the media layer, producing a nested stacking context that broke normal compositing/blend inside the hero's `isolate` group. — CONFIRMED (source doc comment; debugging history in brief).
- **Solution:** Give the media layer `position: relative` with **no** z-index/opacity; let the hero `<section>` provide the blend group via `isolate`. — CONFIRMED.
- **Lesson:** In `VideoGarment`, never add `z-index` or `opacity` to the `<video>`/`<img>` layer. — CONFIRMED.
- **Scope:** `src/components/VideoGarment.tsx` and the hero composition only.
- **First seen:** 2026-10-12.

### F-002 · `tsc` appears to do nothing

- **Problem:** Running plain `tsc` produced no type-checking output/errors, giving false confidence. — CONFIRMED.
- **Cause:** The root `tsconfig.json` has `"files": []` with project references (`tsconfig.app.json`, `tsconfig.node.json`); a plain `tsc` has no files to check. — CONFIRMED.
- **Solution:** Always run `npx tsc -b` (build mode follows references). — CONFIRMED.
- **Lesson:** Use `tsc -b` in this repo; `npm run build` already does. — CONFIRMED.
- **Scope:** All type-checking/CI for this repo.
- **First seen:** 2026-10-12.

### F-003 · react-refresh lint error on mixed component/const exports

- **Problem:** Exporting non-component constants alongside a component triggered `react/only-export-components` (fast-refresh) warnings. — CONFIRMED.
- **Cause:** Fast Refresh requires component files to export only components (constants allowed only when `allowConstantExport` is enabled). — CONFIRMED.
- **Solution:** Move shared non-component values (motion `Variants`) into non-component modules such as `src/lib/motion.ts`. — CONFIRMED.
- **Lesson:** Keep shared constants out of component files. — CONFIRMED.
- **Scope:** All component files.
- **First seen:** 2026-10-12.

### F-004 · `lucide-react` lacks a hanger glyph

- **Problem:** No `Hanger` icon available in `lucide-react@1.55.0`. — CONFIRMED.
- **Cause:** The installed lucide version does not include a hanger (and dropped brand icons). — CONFIRMED.
- **Solution:** Add an inline SVG component (`HangerIcon.tsx`, 3 paths); similarly inline social icons in `Footer.tsx`. — CONFIRMED.
- **Lesson:** Before using a lucide icon, confirm it exists in v1.55.0; otherwise inline the SVG. — CONFIRMED.
- **Scope:** Icon usage across the app.
- **First seen:** 2026-10-12.

### F-005 · Coincident / identical geometry across layered garments z-fights

- **Problem:** In the 3D try-on, layered garments produced speckle where two surfaces shared (or nearly shared) a plane/tangent surface. — CONFIRMED (code inspection; independent code review finding C1).
- **Cause:** The sleeve builder emitted a **byte-identical** upper capsule for every garment regardless of sleeve length; two garment shells reached the **exact same radius** at one height; and the tee and hoodie shared an identical shell. — CONFIRMED.
- **Solution:** Inflate each layer outward by `pad = layer * LAYER_STEP` (**`LAYER_STEP = 0.014`**), using the **worn-array index** as `layer` (so duplicate slots separate too), threaded into shell radii, sleeve capsule/cuff radii and all front-detail z-offsets. At this camera distance 0.014 ≈ 1200× the depth-buffer ULP. — CONFIRMED.
- **Lesson:** Never render two garments on the same surface. Separate consecutive layers by a fixed geometric step ≥ ~100× the depth-buffer ULP; offset from the **worn order**, not the slot. — CONFIRMED.
- **Scope:** `src/components/Mannequin3D.tsx` (all garment geometry).
- **First seen:** 2026-10-13.

### F-006 · Scaling a figure uniformly moves its feet off the floor

- **Problem:** At XL the trouser hems sank below the foot sole and the shadow plane; at XS the jacket collar sank into the torso. — CONFIRMED (independent code review finding H1).
- **Cause:** `sizeScale()` multiplied **all three axes** about the world origin (which sits at the hip), so a size factor also scaled the figure's **vertical** extents (and its vertical position relative to the floor). — CONFIRMED.
- **Solution:** Scale **width only** — `sizeScale()` returns `[k, 1, k]`. — CONFIRMED.
- **Lesson:** When a size/scale factor is applied to a figure anchored at a joint, scale only the axes that must change; pin the vertical axis so ground contact and layering stay fixed. — CONFIRMED.
- **Scope:** sizing in `src/components/Mannequin3D.tsx`.
- **First seen:** 2026-10-13.

### F-007 · Reduced-motion first frame could be stranded mid-animation

- **Problem:** With reduced motion enabled, the mannequin could freeze on an **incomplete** state (garment at scale 0.92, y +0.05) instead of the resting outfit. — CONFIRMED (independent code review finding H2).
- **Cause:** `useReducedMotion` initialised to `false`, so the **first commit** ran with motion enabled and the animation already started; the effect then flipped the render loop to on-demand and the in-flight animation froze. The `Pop` motion had no path to finish. — CONFIRMED.
- **Solution:** Seed `useState` from a **synchronous** `matchMedia` read, and give the animation an explicit **snap** to its resting pose whenever it is not active (plus a guard so it never animates a finished/inactive state). — CONFIRMED.
- **Lesson:** Any state that decides whether an animation starts must be correct on the **first** commit, and any animation that can be suspended (reduced motion, on-demand render loop) needs an explicit snap-to-end path. — CONFIRMED.
- **Scope:** `src/lib/useReducedMotion.ts`, `src/components/Mannequin3D.tsx`.
- **First seen:** 2026-10-13.

### F-008 · A dev server can serve a stale transform of a just-edited module

- **Problem:** After adding `gender` to `persist.partialize` in `src/store/fitting.ts`, `gender` never appeared in `localStorage["bato-fitting"]` — even after a full page reload. The change looked correct on disk (and `tsc -b`/build were green), so it presented as a logic bug. — CONFIRMED.
- **Cause:** The Vite dev server kept serving an **older transform** of the module (its inline sourcemap agreed the edit was missing); the file watcher missed the write and the transform cache was not invalidated. `curl http://127.0.0.1:5200/src/store/fitting.ts` showed the old `partialize`. — CONFIRMED (curl), INFERRED (watcher miss).
- **Solution:** Re-trigger the watcher (`touch <file>`) so the transform is rebuilt; re-verify with `curl`. — CONFIRMED.
- **Lesson:** During dev-server verification, **verify the SERVED module, not just the file on disk** — especially when a change "should work but doesn't." A pixel/DOM check that contradicts a green build may be a stale-serve artifact, not a code bug. — CONFIRMED.
- **Scope:** dev-server workflow (any module); QA method.
- **First seen:** 2026-10-13.

## Learning rules

- Record only reusable project-specific lessons (as above).
- When a fix becomes a pattern, add a PATTERNS.md entry (and a regression test when a test framework exists).
- Anti-patterns here must not be reintroduced by future agents (regression awareness).
