-- BERTEMPK — leads: contact messages + newsletter subscribers, with RLS
-- Run in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run (idempotent).
--
-- Until this migration is applied the app degrades honestly: the contact form
-- and the newsletter report "not configured" and never claim to have stored
-- anything. Apply it to make them live.
--
-- Defence in depth, in two independent locks:
--   1. RLS (enable + force) decides WHICH ROWS a role may reach through a
--      policy. Forcing it also subjects the table owner to RLS.
--   2. The table GRANTS below are the second lock: they decide WHICH COMMANDS
--      the role has at all. RLS can only filter what a privilege allows, so
--      revoking select/update/delete means a future permissive policy still
--      cannot export a single lead. Reads happen from the dashboard via
--      service_role, which bypasses RLS.
--
-- The email bounds live in the CREATE TABLE statements: a length check beside
-- the regex, so a 1-character "a@b.co"-shaped string cannot reach the queue.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  email       text not null check (
                char_length(email) between 3 and 320
                and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
              ),
  message     text not null check (char_length(btrim(message)) between 1 and 4000),
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

-- The studio reads leads newest-first from the dashboard.
create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (
                char_length(email) between 3 and 320
                and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
              ),
  created_at timestamptz not null default now()
);

-- Case-insensitive de-dup: "A@B.co" and "a@b.co" are one subscriber.
create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

-- Row Level Security: these tables hold PII, so they are write-only.
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- ...and forced, so the table owner cannot walk around the policies either.
alter table public.contact_messages force row level security;
alter table public.newsletter_subscribers force row level security;

-- Lock #2 (behind RLS): privileges. RLS filters rows a command may return;
-- without these revokes a permissive policy would still hand every lead out.
revoke select, update, delete on public.contact_messages, public.newsletter_subscribers from anon, authenticated;

-- INSERT-only, deliberately. The anon key ships in the JS bundle, so a select
-- policy would let anyone export every name, email and message ever sent.
-- There is intentionally NO select / update / delete policy here, and the
-- matching privileges are revoked above: reads happen from the Supabase
-- dashboard (service role), writes happen from the app.
-- `archived_at` is likewise only editable by an operator.

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can subscribe to the newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe to the newsletter"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);
