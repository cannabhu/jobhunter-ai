-- 002_dashboard_stats.sql — JobPilot (feature 15)
-- Applied via InsForge run-raw-sql. Re-runnable.
-- One row of dashboard numbers for one user. PostgREST caps a plain select at 1000 rows, so the
-- average (and the counts) are computed in the database instead of in Node.
-- security invoker: row level security on public.jobs still applies, and the explicit
-- user_id filter keeps the "always scope to the user" rule even if a policy is ever loosened.
-- "week ago" columns describe the account as it was 7 days ago (only jobs found before then),
-- which is what the "vs last week" trend badges compare against.

create or replace function public.dashboard_stats(p_user_id uuid)
returns table (
  total_jobs         bigint,
  jobs_week_ago      bigint,
  avg_match          numeric,
  avg_match_week_ago numeric,
  researched         bigint,
  jobs_this_week     bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*),
    count(*) filter (where found_at < now() - interval '7 days'),
    avg(match_score),
    avg(match_score) filter (where found_at < now() - interval '7 days'),
    count(*) filter (where company_research is not null),
    count(*) filter (where found_at >= now() - interval '7 days')
  from public.jobs
  where user_id = p_user_id;
$$;

revoke all on function public.dashboard_stats(uuid) from public;
grant execute on function public.dashboard_stats(uuid) to authenticated;
