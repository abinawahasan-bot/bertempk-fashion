# Task Outcome Record — TASK-005

Per-project telemetry for SIGNIFICANT tasks only (see rules). Location:
`.opencode/telemetry/tasks/`. Never contains secrets (ENV_VAR_NAME only).

## Task

Fix wrong PDP gallery images for products p2 / p4 / p5: replace guessed
sequential Pexels IDs with verified single-shoot photos so the swiped views
match the garment shown.

## Category

bug fix · data · ui

## Agents Used

- `orchestrator` — root-cause analysis, Playwright-based Pexels sourcing,
  image existence/content verification (curl + vision model), code edit,
  gates, browser verification, Project Brain + telemetry update.
- (subagent dispatch remains unavailable — see EVENT-001.)

## Skills Used

orchestration · project-brain · telemetry (this record) · photo-editing
(vision CLI, ad-hoc)

## Files Changed

Key only:

- `src/constants/products.ts` — `image` + `images[]` for **p2, p4, p5**:
  - p2 `images` → 28701960, 28701951, 28701965, 28701952 (hero kept)
  - p4 `image` → 14437343; `images` → 14437343, 14437345, 14437346, 14437348
  - p5 `image` → 5443935; `images` → 5443935, 5443934, 5443936, 5443932

## Validation Performed

- Static: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npx vite build` exit 0.
- All 12 new image URLs: HTTP 200, valid JPEG, **distinct** md5 (no duplicates).
- Vision model (montage per product): all 4 photos = same person + same outfit.
- Served module (`:5200/src/constants/products.ts`): 12 new IDs present, 0
  retired IDs (28701961/2/3, 8863914/5/6, 12061091/2/3).
- Browser (Playwright) `/product/p2|p4|p5`: 4 views each advance in order, all
  `naturalWidth=1600`, correct IDs, 0 console errors.
- `/shop`: 6 thumbnails load.

## Failures / Retries

- **Wrong approach, reverted:** first attempt edited IDs blindly (before
  verification). Reverted p2/p4/p5 to originals, then re-sourced with evidence.
  No random fix shipped.
- **Dead end:** Pexels **search-result alt text** is unreliable (an id labelled
  "black crop top" was a pregnant woman). Switched to photo-page title + "More
  like this" graph. One wasted navigation cycle.
- **Vision-server timeout:** the Bash tool's default 120 s timeout kills the
  3B CPU vision call; must raise the `timeout` param (e.g. 400000).
- **Cloudflare:** `curl` to `pexels.com` returns a 39-byte challenge, not HTML;
  Playwright is required to read Pexels pages.

## Result

DONE / VERIFIED (2026-10-14). Residual: user visual sign-off.

## Lessons

- Gallery arrays must come from one verified shoot — never `hero_id + n`.
- Verify both URL existence **and** image content.
- For Pexels sourcing: Playwright + photo-page title + "More like this".
