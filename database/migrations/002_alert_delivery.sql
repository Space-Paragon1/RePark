-- Migration 002: alert delivery tracking and automatic closing of stale reports.
-- Run once in the Supabase SQL editor, BEFORE deploying the matching backend.
-- Fresh databases should use schema.sql instead, which already includes this.

begin;

-- ─── 1. Delivery tracking ────────────────────────────────────────────────────

-- How the owner was reached: 'push' or 'sms'. Null while pending or if both failed.
alter table public.alerts
  add column if not exists delivery_channel text
  check (delivery_channel in ('push', 'sms'));

-- Whether an alert was ever created for this report. The status alone can't
-- tell "closed with no response" apart from "closed, owner never registered".
alter table public.reports
  add column if not exists owner_notified boolean not null default false;

update public.reports r
set owner_notified = true
where exists (select 1 from public.alerts a where a.report_id = r.id);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at);

-- ─── 2. Close stale reports ──────────────────────────────────────────────────
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

-- Functions in public are callable through the API by default; this one is
-- only for the scheduler.
revoke execute on function public.close_stale_reports() from public, anon, authenticated;

commit;

-- ─── 3. Schedule it every 15 minutes ─────────────────────────────────────────
-- Needs the pg_cron extension. If this line fails, turn it on under
-- Database → Extensions → pg_cron in the Supabase dashboard, then rerun from here.

create extension if not exists pg_cron;

select cron.schedule(
  'close-stale-reports',
  '*/15 * * * *',
  'select public.close_stale_reports()'
);

-- Check it's scheduled:   select jobname, schedule, active from cron.job;
-- Check recent runs:      select status, start_time, return_message
--                         from cron.job_run_details order by start_time desc limit 5;
