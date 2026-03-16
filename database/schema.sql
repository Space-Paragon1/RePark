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

create index vehicles_plate_number_idx on public.vehicles (plate_number);
create index vehicles_user_id_idx      on public.vehicles (user_id);

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
  created_at       timestamptz not null default now()
);

create index reports_plate_number_idx on public.reports (plate_number);

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

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- The FastAPI service uses the service role key (bypasses RLS).
-- Enable RLS anyway as a defence-in-depth measure.

alter table public.vehicles     enable row level security;
alter table public.reports      enable row level security;
alter table public.alerts       enable row level security;
alter table public.abuse_events enable row level security;
