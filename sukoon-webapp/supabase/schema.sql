-- Sukoon: Supabase schema for persistence (profiles + tracking).
-- Run ONCE in the Supabase Dashboard -> SQL Editor for this project.
-- Not idempotent -- re-running requires dropping these objects first.
--
-- If these tables already exist in your project (they do, as of
-- 2026-08-25), this file is the target *shape*, not something to re-run --
-- apply migrations/002_checkins.sql instead to bring an existing database
-- up to date with the check-in columns added below.

-- profiles: one row per authenticated user, mirrors src/App.jsx's
-- profile state (minus the "tracking" branch, below).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  gender text not null default '',
  age smallint,
  tags text[] not null default '{}',
  location text not null default '',
  journeys text[] not null default '{}',
  quiz_answers jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{"phases": [], "answers": {}}'::jsonb,
  -- Whether this person's plan tier includes expert monitoring of their
  -- daily check-ins. No real subscription/billing exists yet -- this is a
  -- plain flag, set manually for now, so the check-in flagging logic below
  -- has something real to gate on once a subscription flow is built.
  expert_notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tracking: one row per user, mirrors profile.tracking.
create table public.tracking (
  user_id uuid primary key references auth.users (id) on delete cascade,
  habit_log jsonb not null default '{}'::jsonb,
  periods jsonb not null default '[]'::jsonb,
  symptom_log jsonb not null default '{}'::jsonb,
  weight_log jsonb not null default '[]'::jsonb,
  -- One-tap daily plan-adherence check-in (see src/data/checkins.js),
  -- keyed by date: { "2026-08-25": { "value": 2 } }. Deliberately separate
  -- from habit_log/symptom_log -- this is the single low-friction gesture,
  -- everything else stays optional detail.
  checkin_log jsonb not null default '{}'::jsonb,
  -- Set (client-side, see hasStrugglePattern in checkins.js) when a
  -- struggling pattern is detected in the trailing week, cleared once it
  -- resolves. Data-model-only for now -- nothing consumes this yet, but it
  -- makes "notify the expert" queryable once an expert-facing surface
  -- exists, without needing a schema change then.
  flagged_for_expert_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: every user can only ever see/touch their own row.
alter table public.profiles enable row level security;
alter table public.tracking enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "tracking_select_own" on public.tracking
  for select using (auth.uid() = user_id);
create policy "tracking_insert_own" on public.tracking
  for insert with check (auth.uid() = user_id);
create policy "tracking_update_own" on public.tracking
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-bump updated_at on any change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tracking_set_updated_at
  before update on public.tracking
  for each row execute function public.set_updated_at();

-- Auto-create empty profile + tracking rows the instant a new auth
-- user is created, so the client only ever needs UPDATE, never
-- INSERT, whether they just signed up or are logging back in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.tracking (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
