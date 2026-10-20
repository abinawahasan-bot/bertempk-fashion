# BRAIN_AUDIT

> Project Brain file · Log of brain consistency checks. Confidence: CONFIRMED (verified).
> First audit run at brain initialization, 2026-10-13.

## Audit procedure

Check the whole brain against the repository for:

- [x] stale information (repo no longer matches brain claims) — none; brain built directly from current files
- [x] contradictions (two brain files disagree) — none found; resolved all repo-vs-brief conflicts in favour of code
- [x] undocumented architecture (code exists, brain silent) — none; all `src` modules mapped
- [x] missing requirements (behavior with no FR entry) — none; FR-1..FR-9 cover implemented behavior
- [x] invalid dependencies (DEPENDENCIES entries no longer true) — none; all verified installed
- [x] obsolete decisions (DECISIONS entries violated by code) — none
- [x] missing security requirements — covered (none present; SECURITY.md documents the absence of auth/secrets surface)
- [x] missing testing information — TESTING.md accurately records "no framework installed"
- [x] secrets present in brain (must be ENV_VAR_NAME placeholders only) — none; **secret scan clean**
- [x] INDEX complete and current — all created files listed

## Audit log

| Date | Scope | Findings | Fixed | Checked-by |
|------|-------|----------|-------|------------|
| 2026-10-13 | Full brain vs repo (init audit) | No secrets; no stale/contradictory brain content. Repo-vs-brief contradictions identified and resolved in favour of code (dev port source; VP9 alpha not in ffprobe default; unlisted deps `@react-three/fiber`/`drei`; `src/assets/` present; Playwright battery not reproducible in-repo; `THREE.Clock` warning not in dev log; recolour mechanism INFERRED; stale README). | Brain reflects only verified facts; unverifiable items marked INFERRED/UNKNOWN | project-brain init |
| 2026-10-18 | Full brain vs repo (post-"Wave 0" re-sync audit) | **8 materially false claims** (see findings). Stale in CURRENT_STATE, REQUIREMENTS (FR-9), KNOWN_ISSUES (ISSUE-003), TECHNICAL_DEBT, TESTING, SECURITY, STACK, CONVENTIONS, PROJECT, ARCHITECTURE, DEPENDENCIES, PROJECT_HEALTH. 11 undocumented modules + 2 SQL migrations. Secret scan of `.opencode/brain/` **clean**. Contradiction: PROJECT_HEALTH said Security GREEN while the code had auth + a DB + PII. | All listed files corrected to match code; retracted claims enumerated in SECURITY.md; new issues ISSUE-009…ISSUE-022, decisions D-015…D-021, task TASK-008, PROJECT_HEALTH Security/Compliance → RED | project-brain-manager |

## Findings detail (2026-10-13)

- **CRITICAL:** none.
- **Resolved-in-favour-of-code:** dev port 5200 originates from the launch command (`/tmp/vite-dev.log`), not `vite.config.ts` — recorded in CONVENTIONS/DEPLOYMENT/KNOWN_ISSUES.
- **Marked INFERRED:** hero recolour mechanism ("tonal curve on luma"); external Playwright MCP battery result; "no circular deps".
- **Marked UNKNOWN:** production host, licensing terms of Pexels assets, a11y conformance level, product intent for checkout/auth.

## Findings detail (2026-10-18 — post-Wave-0 re-sync)

**CRITICAL**

- **SEC-001 — price authority is client-side.** `public.orders` grants `insert` to any
  authenticated user with only `auth.uid() = user_id` constrained, so `total`, `subtotal`,
  `items`, `address`, `payment_method` **and `status`** are attacker-chosen; a customer can
  insert `status:'paid', total:1`. No server-side recomputation exists. Recorded in
  SECURITY.md, KNOWN_ISSUES (ISSUE-009), TECHNICAL_DEBT and PROJECT_HEALTH (RED) so no
  future audit can sign Wave 0 off as "payment-safe".
- **The prior SECURITY.md was actively harmful.** It asserted "no environment variables and
  no secrets referenced anywhere", "Authentication model: None", "No API", "No DB" and "the
  newsletter never transmits" while the repo contained a live Supabase key in `.env`, full
  Supabase Auth, three RLS tables and two lead-capture writes. A reviewer correctly flagged
  that a brain claiming "no secrets, no PII" is worse than no brain. Corrected, and the six
  retracted claims are now listed explicitly so they cannot be silently reintroduced.

**HIGH**

- **SEC-005 / ISSUE-011** — guest orders (full shipping address) persist indefinitely in
  `localStorage` `bato-orders` and are never cleared on sign-out.
- **SEC-006 / ISSUE-012** — no privacy notice, consent capture or retention rule; the legal
  footer row is hidden while `VITE_POLICY_*` are unset (UU PDP 27/2022 precondition).
- **SEC-003 / ISSUE-013** — `contact_messages` / `newsletter_subscribers` are INSERT-only open
  endpoints for `anon` with no rate limiting; the migration has never been applied, which is
  the only thing currently containing the exposure.

**Stale / contradictory (all corrected)**

| File | Was | Now |
|---|---|---|
| CURRENT_STATE | "5 routes", "Checkout is a toast placeholder", "No automated tests exist" | 9 routes, real checkout, 141 tests |
| REQUIREMENTS | FR-9 "Sign In and Checkout are UI placeholders" | FR-9 split into real auth (FR-9) + checkout (FR-10…FR-21); money/size/honesty requirements added |
| KNOWN_ISSUES | ISSUE-003 "Checkout is a non-functional placeholder / no backend / no order DB" | RESOLVED; replaced by ISSUE-009 (CRITICAL) and the Wave 0 issues |
| TECHNICAL_DEBT | "No automated tests", "Unimplemented checkout", "inert footer links" | Retracted/addressed; structural debt re-listed with current sizes |
| TESTING | "no automated test framework is installed" | Vitest + Testing Library, 9 files / 141 tests, per-file coverage map |
| STACK / CONVENTIONS / PROJECT | "No backend / no database / no API" | Supabase Auth + Postgres + migrations; commerce conventions |
| ARCHITECTURE | "API flow: None", "Database flow: None", 6 routes, inert footer | Full commerce layer + database + API flows + 9 routes |
| DEPLOYMENT | "No ENV_VAR_NAMES are referenced by the build or runtime" | 16 `VITE_*` names inlined at build time; manual-SQL backend deploy |
| PROJECT_HEALTH | Security **GREEN**, Testing **RED** | Security **RED**, Compliance **RED** (new), Testing **YELLOW** |
| DEPENDENCIES | no Supabase, no test tooling | both added with installed versions |

**Recorded as UNKNOWN / INFERRED (not asserted)**

- Production host; a11y conformance level; whether UU PDP formally applies (project is not a
  registered Indonesian entity in this repo); whether a Postgres column-level `insert` grant is
  acceptable with RLS in this Supabase setup (the SEC-001 interim hardening sketch).
- Cause of the main-chunk growth from ~531 kB to ~820 kB is **INFERRED** from the Supabase
  dependency; it was not bundle-analysed.

**Secret scan (this session)**

- `grep` over `.opencode/brain/` for key-shaped strings, `VITE_SUPABASE_*` values, tokens and
  the deleted bank account: **clean**. `.env` itself was read with values redacted
  (`sed 's/=.*/=<redacted>/'`); no value was copied into any brain file.
- `.env` is now gitignored and `.env.example` is placeholder-only — CONFIRMED.

## Rules

- Verification is against the ACTUAL repository, never against the last audit.
- Fix what can be safely fixed (update brain to match code; code wins on conflict).
- Record meaningful corrections; log secrets-in-brain as CRITICAL.
