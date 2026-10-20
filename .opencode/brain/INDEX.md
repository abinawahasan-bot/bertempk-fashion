# INDEX

> Project Brain file · Map of all Project Brain knowledge. Entry point for retrieval. Keep current.
> Confidence markers: CONFIRMED (verified from repo), INFERRED (reasonably inferred), UNKNOWN (not established).
> Initialized: 2026-10-13 · Project: BERTEMPK (fashion-ecom)
> **Re-synced 2026-10-18 after "Wave 0"** — the brain had drifted materially (Checkout/orders/tests existed but were documented as placeholders; SECURITY claimed no auth, no `.env`, no PII).

## Brain map

```
PROJECT
├── STACK              technology stack (evidence-linked)
├── ARCHITECTURE       layers, modules, flows, integrations
├── CONVENTIONS        engineering conventions (override order)
├── REQUIREMENTS       functional + non-functional + constraints
├── DECISIONS          significant decisions (ADR-style)
├── CURRENT_STATE      feature/architecture/deploy status now
├── KNOWN_ISSUES       bugs & problems (statused)
├── TECHNICAL_DEBT     tracked debt
├── SECURITY           security posture + secrets map (placeholders only)
├── TESTING            existing tests, coverage, regressions
├── DEPLOYMENT         environments, runbook, rollback
├── DEPENDENCIES       meaningful dependencies
├── CHANGE_HISTORY     significant changes
├── FAILURES           recurring failures & lessons
├── PATTERNS           established project patterns
├── PROJECT_HEALTH     health scores per category
├── ARCHITECTURE_DRIFT documented drift vs code
├── SESSION_LOG       lightweight multi-agent run log (operational, prunable)
└── BRAIN_AUDIT        brain consistency checks
tasks/                 task records (TASK-NNN.md)
snapshots/             state snapshots (YYYY-MM-DD)
```

## Retrieval quick-reference

| Need | File(s) |
|------|---------|
| What does the project do? | PROJECT |
| Tech stack? | STACK, DEPENDENCIES |
| How is it structured? | ARCHITECTURE |
| How do we write code here? | CONVENTIONS, PATTERNS |
| What must it do? | REQUIREMENTS |
| Why decisions? | DECISIONS |
| What's broken? | KNOWN_ISSUES, FAILURES |
| What's owed? | TECHNICAL_DEBT |
| Security posture? | SECURITY |
| Testing in place? | TESTING |
| How to build/run/deploy? | DEPLOYMENT, CONVENTIONS |
| Latest state? | CURRENT_STATE, CHANGE_HISTORY |
| Hero garment / stacking bug? | DECISIONS, KNOWN_ISSUES, FAILURES |
| Fitting room model? | DECISIONS, PATTERNS, ARCHITECTURE |
| Story / Contact nav & anchors? | DECISIONS (D-012), CURRENT_STATE, KNOWN_ISSUES (ISSUE-008), tasks/TASK-007.md |
| Auth (Supabase)? | ARCHITECTURE (Authentication flow), CURRENT_STATE, STACK, SECURITY |
| **Checkout / orders?** | ARCHITECTURE (Commerce layer detail, Database flow), CURRENT_STATE, REQUIREMENTS FR-10–FR-11, KNOWN_ISSUES ISSUE-009 |
| **Sizes / variants / cart lines?** | DECISIONS D-015–D-017, ARCHITECTURE (Commerce layer detail), REQUIREMENTS FR-12–FR-13 |
| **Money / IDR / shipping?** | DECISIONS D-018, `src/constants/commerce.ts`, REQUIREMENTS FR-14–FR-15, TECHNICAL_DEBT |
| **Payments / honesty gates?** | DECISIONS D-020–D-021, SECURITY (SEC-001/SEC-002), KNOWN_ISSUES ISSUE-010 |
| **PII / privacy / leads?** | SECURITY (SEC-003–SEC-006), KNOWN_ISSUES ISSUE-011–ISSUE-014, PROJECT_HEALTH |
| **Is this safe to take money on?** | SECURITY (SEC-001 + the untrusted-by-construction statement) — **no, not until an Edge Function owns prices** |
| Tests / how do I verify? | TESTING, tasks/TASK-008.md |
| Outfit Builder? | CURRENT_STATE, ARCHITECTURE (modules/routes), src/pages/OutfitBuilder.tsx |

## Files in this brain

| File | Retrieval purpose | Confidence of content |
|------|-------------------|-----------------------|
| INDEX.md | This map; list of every brain file | CONFIRMED |
| PROJECT.md | Identity, purpose, objectives, constraints, platforms | CONFIRMED/INFERRED |
| STACK.md | Exact stack with evidence sources | CONFIRMED |
| ARCHITECTURE.md | SPA layers, modules, data flow, integrations | CONFIRMED |
| CONVENTIONS.md | Coding/style/build conventions and build gotchas | CONFIRMED |
| REQUIREMENTS.md | Functional + non-functional requirements, constraints | CONFIRMED/INFERRED |
| DECISIONS.md | Significant design decisions (ADR-style), D-001–D-021 | CONFIRMED |
| CURRENT_STATE.md | Feature/architecture/deploy status as of 2026-10-18 (Wave 0) | CONFIRMED |
| KNOWN_ISSUES.md | Known bugs/risks with statuses | CONFIRMED |
| TECHNICAL_DEBT.md | Tracked debt items | CONFIRMED |
| SECURITY.md | Security posture, auth/RLS model, secrets map (ENV_VAR_NAME only), CRITICAL findings | CONFIRMED |
| TESTING.md | Vitest + Testing Library setup, 9 files / 141 tests, per-file coverage map, gaps | CONFIRMED |
| DEPLOYMENT.md | Build artifact + (unknown) hosting | CONFIRMED/UNKNOWN |
| DEPENDENCIES.md | Meaningful dependencies with installed versions | CONFIRMED |
| CHANGE_HISTORY.md | Significant changes log | CONFIRMED |
| FAILURES.md | Reusable failure lessons | CONFIRMED |
| PATTERNS.md | Established project patterns | CONFIRMED |
| PROJECT_HEALTH.md | GREEN/YELLOW/RED scorecard (Security + Compliance RED as of 2026-10-18) | CONFIRMED/INFERRED |
| ARCHITECTURE_DRIFT.md | Documented drift vs code (Wave 0 commerce layer; price authority) | CONFIRMED |
| SESSION_LOG.md | Lightweight multi-agent run log (operational, not a fact file) | CONFIRMED |
| BRAIN_AUDIT.md | Brain consistency audit log (init 2026-10-13, re-sync 2026-10-18) | CONFIRMED |
| tasks/TASK-001.md | Fitting-room feature work record | CONFIRMED |
| tasks/TASK-002.md | 3D fitting-room mannequin (Tier A) + code review/fix cycle | CONFIRMED |
| tasks/TASK-003.md | Tier B — rigged GLB body + gender selector + analytic garment refit | CONFIRMED |
| tasks/TASK-004.md | PDP stacked image gallery | CONFIRMED |
| tasks/TASK-005.md | PDP gallery image-data mismatch fix (p2/p4/p5) | CONFIRMED |
| tasks/TASK-006.md | Fitting-room avatar swap (cogan/cecan) + Tier C bone-driven garments | CONFIRMED |
| tasks/TASK-007.md | Story & Contact navigation fix + Contact section | CONFIRMED |
| tasks/TASK-008.md | Wave 0 — commerce/variants/IDR/honesty gates + full brain re-sync | CONFIRMED |
| snapshots/snapshot-2026-10-13.md | Baseline snapshot at brain init | CONFIRMED |
| snapshots/snapshot-2026-10-13-tierA.md | Milestone — 3D fitting-room mannequin (Tier A) complete | CONFIRMED |

**No snapshot covers Wave 0 (2026-10-18)** — create one before the next release.

## Read this before trusting the brain

- **Code is the authority.** If a brain file and the repo disagree, the repo wins — fix the brain.
- **Money is client-computed.** Every total the app shows or stores is untrusted until a
  Supabase Edge Function recomputes it (**SEC-001**, CRITICAL). Do not sign a release off as
  "payment-safe" — see SECURITY.md.
- Claims deliberately retracted on 2026-10-18 are listed in SECURITY.md § "Retracted claims".

## Maintenance

- Ensure every new/updated file is listed here with its retrieval purpose.
- When a file is archived to snapshots/, remove it from the live map and note the archive.
- Update this index whenever brain files change.
