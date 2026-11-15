-- 001_initial_schema.sql — JobPilot (feature 04)
-- Applied via InsForge run-raw-sql. Re-runnable: every statement is idempotent.
-- Profile rows are NOT created by a trigger (InsForge does not allow triggers on
-- auth.users). The app creates them with ensureProfile() — see lib/insforge/server.ts.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  full_name             text,
  email                 text,
  phone                 text,
  location              text,
  current_title         text,
  experience_level      text check (experience_level in ('junior', 'mid', 'senior', 'lead')),
  years_experience      integer check (years_experience >= 0),
  skills                text[] not null default '{}',
  industries            text[] not null default '{}',
  work_experience       jsonb not null default '[]'::jsonb,
  education             jsonb not null default '{}'::jsonb,
  job_titles_seeking    text[] not null default '{}',
  remote_preference     text check (remote_preference in ('remote', 'onsite', 'hybrid', 'any')),
  preferred_locations   text[] not null default '{}',
  salary_expectation    text,
  cover_letter_tone     text check (cover_letter_tone in ('formal', 'casual', 'enthusiastic')),
  linkedin_url          text,
  portfolio_url         text,
  work_authorization    text check (work_authorization in ('citizen', 'permanent_resident', 'visa_required')),
  resume_pdf_url        text,
  is_complete           boolean not null default false,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  missing_fields        text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_runs
-- ---------------------------------------------------------------------------
create table if not exists public.agent_runs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status             text not null default 'running' check (status in ('running', 'completed', 'failed')),
  job_title_searched text,
  location_searched  text,
  jobs_found         integer not null default 0,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz
);

create index if not exists agent_runs_user_started_idx
  on public.agent_runs (user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id                 uuid primary key default gen_random_uuid(),
  run_id             uuid references public.agent_runs (id) on delete set null,
  user_id            uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  external_id        text,
  source             text not null check (source in ('search', 'url')),
  source_url         text,
  external_apply_url text,
  title              text not null,
  company            text not null,
  location           text,
  salary             text,
  job_type           text,
  about_role         text,
  responsibilities   text[],
  requirements       text[],
  nice_to_have       text[],
  benefits           text[],
  about_company      text,
  match_score        integer check (match_score between 0 and 100),
  match_reason       text,
  matched_skills     text[] not null default '{}',
  missing_skills     text[] not null default '{}',
  company_research   jsonb,
  researched_at      timestamptz,
  found_at           timestamptz not null default now()
);

-- One row per Adzuna listing per user. NULL external_id (future URL imports) is exempt.
create unique index if not exists jobs_user_external_uidx
  on public.jobs (user_id, external_id);
create index if not exists jobs_user_found_idx
  on public.jobs (user_id, found_at desc);
create index if not exists jobs_user_score_idx
  on public.jobs (user_id, match_score desc);
create index if not exists jobs_run_idx
  on public.jobs (run_id);

-- ---------------------------------------------------------------------------
-- agent_logs
-- ---------------------------------------------------------------------------
create table if not exists public.agent_logs (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid references public.agent_runs (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  message    text not null,
  level      text not null default 'info' check (level in ('info', 'success', 'warning', 'error')),
  job_id     uuid references public.jobs (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists agent_logs_user_created_idx
  on public.agent_logs (user_id, created_at desc);
create index if not exists agent_logs_run_idx
  on public.agent_logs (run_id);

-- ---------------------------------------------------------------------------
-- Row level security — each user sees and changes only their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.agent_runs enable row level security;
alter table public.jobs       enable row level security;
alter table public.agent_logs enable row level security;

drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users manage own agent_runs" on public.agent_runs;
create policy "users manage own agent_runs" on public.agent_runs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users manage own jobs" on public.jobs;
create policy "users manage own jobs" on public.jobs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users manage own agent_logs" on public.agent_logs;
create policy "users manage own agent_logs" on public.agent_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Backfill: users who signed up before this migration
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name)
select u.id, u.email, u.profile ->> 'name'
from auth.users u
on conflict (id) do nothing;
