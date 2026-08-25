-- Run ONCE in the Supabase Dashboard -> SQL Editor to bring an existing
-- database (created from the original schema.sql) up to date with the
-- daily plan-adherence check-in feature. Idempotent via `if not exists`,
-- safe to re-run.

alter table public.profiles
  add column if not exists expert_notifications_enabled boolean not null default false;

alter table public.tracking
  add column if not exists checkin_log jsonb not null default '{}'::jsonb,
  add column if not exists flagged_for_expert_at timestamptz;
