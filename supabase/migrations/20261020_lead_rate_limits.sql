-- Rate-limit ledger for lead submissions (contact messages + newsletter).
-- Keyed by a caller-derived string (IP or email); windowed counts are done
-- in the submit-lead Edge Function. Rows are append-only and pruned lazily.

create table if not exists public.lead_rate_limits (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists lead_rate_limits_key_created_idx
  on public.lead_rate_limits (key, created_at desc);

-- No client access; only the service role (Edge Function) writes/reads.
alter table public.lead_rate_limits enable row level security;
