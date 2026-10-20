# Event Row — EVENT-001

Lightweight telemetry line (a table row / small note), used for trivial
actions, retries, and observations that do not warrant a full task record.
Location: `.opencode/telemetry/events/` or a scratch log. Never secrets.

## Event

2026-10-13 · TOOLING/AGENT · `outcome-collector` subagent dispatch for TASK-002
failed immediately with "OpenCode's free tier can only be used from within
OpenCode" (task_id ses_ece3431ffffeUBvg4BnCH8ifFJ) · agent: orchestrator ·
skills: telemetry, orchestration · outcome: subagent unavailable, record
written directly by the orchestrator.

## Purpose

- Incremental traceability without heavy records
- Small observations (tool issues, retry nudges, routing misses)
- **Why flagged:** all subagent dispatch (Task tool) appears unavailable in this
  environment → the orchestrator must execute multi-agent pipelines itself, or
  the free-tier limitation must be resolved. Affects every pipeline mode.

## Rules

- Only trivial/observational events; significant work => Task Outcome Record.
- No secrets; less than a line of substance; mind data minimization.
