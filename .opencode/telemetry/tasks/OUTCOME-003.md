# Task Outcome Record — TASK-003

Per-project telemetry for SIGNIFICANT tasks only (see rules). Location:
`.opencode/telemetry/tasks/`. Never contains secrets (ENV_VAR_NAME only).

## Task

Tier B — replace the procedural fitting-room body with the user's rigged humanoid
GLB (`male`/`female`), add a gender selector, and refit the procedural garments
analytically to the broader A-posed body. Approved approach: render the GLB body
verbatim, keep the authored A-pose.

## Category

feature · ui · refactoring

## Agents Used

- `orchestrator` — implementation, numeric no-clip pre-check, in-session
  browser/pixel verification, root-cause analysis of the "missing arms"
  false positive, dev-server staleness fix, Project Brain + telemetry update.
- (subagent dispatch remains unavailable — see EVENT-001; all roles ran in the
  orchestrator.)

## Skills Used

orchestration · project-brain · telemetry (this record)

## Files Changed

Key only (not every line):

- NEW `src/constants/body.ts` — analytic GLB-body model (`K`, `bodyMetrics`,
  `bodySection`, `torsoShellProfile`) driving the garment refit.
- `src/components/Mannequin3D.tsx` — `GlbBody` (`useGLTF`, compute normals,
  monochrome material) + garments refit via a custom elliptical lathe;
  `HEM_BOTTOM −0.9 → −0.85`.
- `src/components/FittingRoom.tsx` — "Model" segmented toggle + height readout.
- `src/components/MannequinSvg.tsx` — gender-aware fallback label.
- `src/store/fitting.ts` — `gender` + `setGender` + `partialize`.
- `src/constants/fit.ts` — `wornLabel(picks, gender)`.
- `src/types/index.ts` — `Gender`, `MannequinProps.gender`.
- NEW `public/model/mannequin-{male,female}.glb`.

## Validation Performed

- Static: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` exit 0
  (2939 modules; `Mannequin3D` 95.96 kB).
- Numeric no-clip (`/tmp/opencode/fitcheck.mjs`): trouser-leg min clearance
  0.0140 both genders; body silhouette 0.661/0.618; camera covers aspect 0.537.
- Rendered body (pixel probe of the canvas on the bare model): head Ø 0.276 m,
  arm reach 0.653 m, legs 0.26 m, shins 0.24 m, height 1.9 m, centred — both
  genders within tolerance.
- Persistence: `localStorage["bato-fitting"]` includes `gender`; survives reload;
  UI restores the selection.
- Reduced motion (canvas renders) + WebGL-off (44 `<svg>` / 0 canvas, label
  intact, 0 errors).
- Console: 0 errors (only pre-existing `THREE.Clock` deprecations).

## Failures / Retries

- **False positive (no code defect):** the first clothed capture appeared to show
  no arms. Root cause: the luma mask missed dark jacket sleeves **and** the probe
  used a stale canvas size (443 px vs 541 px tall). Resolved by probing the bare
  body + re-deriving `px/m` from the actual image. (Recorded in CURRENT_STATE.)
- **Real defect — ISSUE-005 / F-008:** the dev server served a stale transform of
  `store/fitting.ts` (partialize without `gender`); fixed by re-triggering the
  watcher (`touch`). One retry cycle to confirm.
- No random fixes; each was root-caused before changing anything.

## Result

DONE / VERIFIED (2026-10-13). Residual: user visual sign-off; wordmark +
localStorage leftovers (non-blocking).

## Lessons

- Verify the **served** module during dev-server QA, not just disk (F-008).
- Validate rendered geometry on the **bare** body; dark garments defeat a
  brightness mask.
- Keep one analytic source (`constants/body.ts`) for both body placement and
  garment refit so they can never disagree.
