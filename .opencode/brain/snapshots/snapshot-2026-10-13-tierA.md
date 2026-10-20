# SNAPSHOT-2026-10-13-tierA

> Released for stable project states and significant releases. Directory: .opencode/brain/snapshots/
> Confidence: CONFIRMED (each line verified at capture time). MILESTONE snapshot — Tier A 3D fitting-room mannequin complete and all code-review blockers closed.

## Snapshot type

- Type: MILESTONE (Tier A feature complete + post-review fixes; not a release — no host/CI)

## Version

- Version: `0.0.0` (`package.json`) · Branch: N/A · Commit: N/A — **repo is not a git repository**.

## Architecture summary

- Client-only React 19 + Vite 7 + TypeScript SPA; Tailwind v4 `@theme`; react-router 7; zustand 5 (`persist`); motion 14; three/R3F for the hero turntable (opt-in) **and now the fitting-room mannequin (default)**.
- The fitting room's mannequin is a **procedural React-Three-Fiber stage** (`Mannequin3D.tsx`) behind a wrapper (`Mannequin.tsx`: lazy + `Suspense` + error boundary + WebGL gate), with the flat SVG (`MannequinSvg.tsx`) as fallback. Full detail: ARCHITECTURE.md.

## Current state

- Implemented: Home, Shop, ProductDetail, Cart drawer, Wishlist, Fitting Room (3D mannequin, layering, colourways, width-only sizes, start-over).
- Not implemented: Checkout and Sign In (placeholders).
- Active work: none. **Blocked work:** Tier B (realistic body from a user-supplied `mannequin.glb` — asset not yet delivered; swap hook ready at `public/model/mannequin.glb`).

## Important decisions

- D-001 hero = derived local video; D-002 VideoGarment stacking rule; D-003 fitting-room model; D-004 reference media study-only; D-005 Tailwind v4 tokens; D-006 custom HangerIcon; D-007 motion variants module; **D-008 3D mannequin default + SVG fallback; D-009 3D geometry/motion rules (layer inflation, width-only sizing, resting-pose snap)**. (DECISIONS.md)

## Active issues

- ISSUE-001 hero black-box risk (MITIGATED); ISSUE-002 dev port not in config (OPEN, informational); ISSUE-003 checkout/sign-in placeholders (OPEN, known gap); **ISSUE-004 no realistic body GLB → Tier B blocked (OPEN/external)**. Fixed: **ISSUE-HIST-002** (review blockers C1/H1/H2 → VERIFIED). (KNOWN_ISSUES.md)

## Test status

- No automated test framework. Static checks green 2026-10-13 (session 2): `tsc -b` exit 0, `oxlint src` exit 0, `npm run build` exit 0 (**15.97 s**, 2938 modules; `Mannequin3D` 23.55 kB lazy; three/drei vendor chunk 928.67 kB warned — M4).
- Pixel-probe visual QA (CONFIRMED): reduced-motion hem edge row 281 = 281 (normal); figure base row 457 identical XS/XL with lower-leg width 89→97 px; layered-torso z-fighting speckle 1/46,207 px (0.002%); WebGL-off fallback renders SVG with matching label, 0 console errors. (TASK-002, TESTING.md)

## Security status

- No auth, no API, no secrets; secret scan clean; no unfixed severities. No app-level security headers (host-level TBD). (SECURITY.md)

## Deployment state

- Build artifact `dist/` produced locally and current with source; **no host/CI/rollback configured**, host UNKNOWN. Repo not under git. (DEPLOYMENT.md)

## Rules

- Only create when genuinely useful: milestones, releases, or major restructurings.
- Do not claim release readiness unless validation supports it.
- Old snapshots may be archived/removed to keep the directory small.
