-- Migration 001: one owner per plate, ownership claims, and Realtime access rules.
-- Run once in the Supabase SQL editor on an existing database.
-- Fresh databases should use schema.sql instead, which already includes this.
--
-- BEFORE RUNNING: check for plates registered to more than one account.
--
--   select plate_number, count(*) as accounts, array_agg(user_id) as user_ids
--   from public.vehicles group by plate_number having count(*) > 1;
--
-- If that returns rows, decide which account keeps each plate and delete the
-- other vehicle rows. The migration refuses to run until no duplicates remain.

begin;

-- ─── 1. One account per plate ────────────────────────────────────────────────

do $$
begin
  if exists (
    select 1 from public.vehicles group by plate_number having count(*) > 1
  ) then
    raise exception 'Some plates are registered to more than one account. Run the duplicate check at the top of this file and resolve them first.';
  end if;
end $$;

drop index if exists public.vehicles_plate_number_idx;
create unique index if not exists vehicles_plate_number_key
  on public.vehicles (plate_number);

-- ─── 2. push_tokens (existed only in the dashboard until now) ────────────────

create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

-- ─── 3. Ownership claims ─────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'claim_status') then
    create type claim_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.plate_claims (
  id                 uuid primary key default gen_random_uuid(),
  plate_number       text not null,
  claimant_user_id   uuid not null references auth.users(id) on delete cascade,
  current_vehicle_id uuid references public.vehicles(id) on delete set null,
  make               text not null,
  model              text not null,
  color              text not null,
  note               text,
  status             claim_status not null default 'pending',
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists plate_claims_claimant_idx
  on public.plate_claims (claimant_user_id);
create index if not exists plate_claims_pending_idx
  on public.plate_claims (plate_number) where status = 'pending';

alter table public.plate_claims enable row level security;

-- ─── 4. Realtime access rules ────────────────────────────────────────────────
-- Owners only receive Realtime events for alerts on their own vehicles.

drop policy if exists "Owners can read their own vehicles" on public.vehicles;
create policy "Owners can read their own vehicles"
  on public.vehicles for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Owners can read alerts for their own vehicles" on public.alerts;
create policy "Owners can read alerts for their own vehicles"
  on public.alerts for select to authenticated
  using (vehicle_id in (
    select id from public.vehicles where user_id = (select auth.uid())
  ));

commit;

-- AFTER RUNNING: list every policy on these tables. Anything other than the
-- two policies above was added by hand in the dashboard. A policy such as
-- "using (true)" lets every signed-in user receive every alert; drop it with:
--   drop policy "<policy name>" on public.<table>;
--
--   select tablename, policyname, cmd, roles, qual
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('vehicles', 'reports', 'alerts', 'abuse_events', 'push_tokens', 'plate_claims');
