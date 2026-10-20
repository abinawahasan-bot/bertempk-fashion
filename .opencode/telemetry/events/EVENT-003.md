# Event Row — EVENT-003

Lightweight telemetry line (a table row / small note), used for trivial
actions, retries, and observations that do not warrant a full task record.
Location: `.opencode/telemetry/events/` or a scratch log. Never secrets.

## Event

2026-10-14 · METHOD/QA · While verifying the new PDP gallery, several checks
used `curl http://127.0.0.1:5200/product/p1 | grep "Product view"` → **0
matches**, which was misread as a possible bug. It is not: the app is an SPA
and `/product/:id` serves only `index.html`; all product markup is
client-rendered. Correct verification = browser/DOM (Playwright found
`img "Product view 1"`, click advanced to `"Product view 2"`, 0 console
errors). Retired the misleading grep method. · agent: orchestrator · skills:
orchestration · outcome: corrected method; noted in CHANGE_HISTORY session 5.

## Purpose

- Incremental traceability without heavy records
- Small observations (tool issues, retry nudges, routing misses)
- **Why flagged:** a whole class of "empty result" false negatives comes from
  grepping client-rendered routes. Verify SPAs in a browser, not via curl+grep.

## Rules

- Only trivial/observational events; significant work => Task Outcome Record.
- No secrets; less than a line of substance; mind data minimization.
