# Event Row — EVENT-002

Lightweight telemetry line (a table row / small note), used for trivial
actions, retries, and observations that do not warrant a full task record.
Location: `.opencode/telemetry/events/` or a scratch log. Never secrets.

## Event

2026-10-13 · DEV-SERVER/QA · During TASK-003, the Vite dev server (port 5200)
served a **stale transform** of `src/store/fitting.ts`: `persist.partialize`
lacked `gender` even though the on-disk file had it and `tsc -b`/build were
green — persisted across a full page reload. Detected via
`curl http://127.0.0.1:5200/src/store/fitting.ts`. Resolved by `touch`ing the
file to re-trigger the watcher. · agent: orchestrator · skills: orchestration ·
outcome: fixed; failure lesson recorded as FAILURES F-008.

## Purpose

- Incremental traceability without heavy records
- Small observations (tool issues, retry nudges, routing misses)
- **Why flagged:** "served module ≠ disk" is a silent failure mode that can make
  a correct edit look like a bug during browser verification — worth remembering
  for every dev-server QA pass (full lesson in F-008).

## Rules

- Only trivial/observational events; significant work => Task Outcome Record.
- No secrets; less than a line of substance; mind data minimization.
