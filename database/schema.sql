-- RePark MVP Schema
-- Run this in your Supabase SQL editor.
-- Supabase Auth manages the auth.users table automatically.

-- ─── vehicles ────────────────────────────────────────────────────────────────

create table public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plate_number  text not null,       -- stored normalised: uppercase, no spaces/hyphens
  make          text not null,
  model         text not null,
  color         text not null,
  parking_zone  text,
  created_at    timestamptz not null default now()
);

-- One account per plate, so every alert reaches exactly one owner.
-- Disputes go through plate_claims.
create unique index vehicles_plate_number_key on public.vehicles (plate_number);
create index vehicles_user_id_idx             on public.vehicles (user_id);

-- ─── reports ─────────────────────────────────────────────────────────────────

create type report_status as enum (
  'submitted', 'notified', 'responded', 'closed', 'rejected'
);

create type issue_type as enum (
  'blocking_driveway',
  'construction_access',
  'garbage_pickup',
  'restricted_zone',
  'emergency_access'
);

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  plate_number     text not null,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  latitude         double precision not null,
  longitude        double precision not null,
  issue_type       issue_type not null,
  message          text,
  status           report_status not null default 'submitted',
  owner_notified   boolean not null default false,  -- an alert was created for this report
  created_at       timestamptz not null default now()
);

create index reports_plate_number_idx   on public.reports (plate_number);
create index reports_status_created_idx on public.reports (status, created_at);

-- ─── alerts ──────────────────────────────────────────────────────────────────

create type delivery_status as enum ('pending', 'sent', 'failed');

create type owner_response as enum (
  'moving_now', 'already_moved', 'incorrect_report', 'abuse_reported'
);

create table public.alerts (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid not null references public.vehicles(id) on delete cascade,
  report_id       uuid not null references public.reports(id) on delete cascade,
  delivery_status delivery_status not null default 'pending',
  delivery_channel text check (delivery_channel in ('push', 'sms')),  -- how the owner was reached
  owner_response  owner_response,
  responded_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- ─── abuse_events ─────────────────────────────────────────────────────────────

create table public.abuse_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  report_id  uuid references public.reports(id) on delete set null,
  event_type text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- ─── push_tokens ──────────────────────────────────────────────────────────────

create table public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

-- ─── plate_claims ─────────────────────────────────────────────────────────────
-- Someone says a plate registered to another account is theirs.
-- Reviewed manually; see README.md → "Resolving plate ownership claims".

create type claim_status as enum ('pending', 'approved', 'rejected');

create table public.plate_claims (
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

create index plate_claims_claimant_idx on public.plate_claims (claimant_user_id);
create index plate_claims_pending_idx  on public.plate_claims (plate_number) where status = 'pending';

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- The FastAPI service uses the service role key (bypasses RLS).
-- Enable RLS anyway as a defence-in-depth measure.

alter table public.vehicles     enable row level security;
alter table public.reports      enable row level security;
alter table public.alerts       enable row level security;
alter table public.abuse_events enable row level security;
alter table public.push_tokens  enable row level security;
alter table public.plate_claims enable row level security;

-- The mobile app reads alerts directly only through Supabase Realtime.
-- Realtime applies these policies, so each owner receives only alerts for
-- their own vehicles. Every other table is reachable only via the API.

create policy "Owners can read their own vehicles"
  on public.vehicles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners can read alerts for their own vehicles"
  on public.alerts for select to authenticated
  using (vehicle_id in (
    select id from public.vehicles where user_id = (select auth.uid())
  ));

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.alerts;

-- ─── Close stale reports (needs the pg_cron extension) ───────────────────────
-- Unregistered plate, no owner joined within 2 hours  → closed
-- Owner notified, no response within 24 hours         → closed
-- The 2 hours must match UNREGISTERED_WAIT_HOURS in backend/app/routers/reports.py.

create or replace function public.close_stale_reports()
returns void
language sql
as $$
  update public.reports
  set status = 'closed'
  where (status = 'submitted' and created_at < now() - interval '2 hours')
     or (status = 'notified'  and created_at < now() - interval '24 hours');
$$;

revoke execute on function public.close_stale_reports() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('close-stale-reports', '*/15 * * * *', 'select public.close_stale_reports()');
