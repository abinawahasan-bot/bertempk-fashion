# Event Row — EVENT-004

Lightweight telemetry line for trivial actions / observations. Never secrets.

## Event

2026-10-14 · DATA/TOOLING · Sourcing Pexels photos for the PDP gallery fix:
two reusable facts learned. (1) A 21-byte HTTP body `"Source is unreachable"`
from `images.pexels.com/photos/<id>/...` = **404** (missing id); a 39-byte body
from `pexels.com` = Cloudflare challenge (use Playwright, not curl). (2) Pexels
**search-result alt text is generic/unreliable** — the trustworthy signals are
the photo page **title** and the hero's **"More like this"** anchors. · agent:
orchestrator · skills: orchestration · outcome: corrected sourcing method;
recorded in TASK-005 + OUTCOME-004.

## Purpose / Rules

- Incremental traceability for small tool/data observations.
- Only trivial/observational events; significant work => Task Outcome Record.
- No secrets; mind data minimization.
