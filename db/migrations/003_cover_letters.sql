-- 003_cover_letters.sql — JobPilot (feature 19)
-- Applied via InsForge run-raw-sql. Re-runnable.
-- One cover letter per job, stored on the jobs row. The existing "own rows only" policy on public.jobs
-- already covers the new columns, so no policy changes are needed.
--   cover_letter              the letter text (generated, then possibly edited by the user)
--   cover_letter_generated_at when GPT-4o wrote it
--   cover_letter_edited_at    when the user last saved their own changes; null until then, cleared on regenerate
--   cover_letter_tone         the tone it was written in (formal / casual / enthusiastic), so the card keeps
--                             showing the right tone after the profile tone changes

alter table public.jobs
  add column if not exists cover_letter text,
  add column if not exists cover_letter_generated_at timestamptz,
  add column if not exists cover_letter_edited_at timestamptz,
  add column if not exists cover_letter_tone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_cover_letter_tone_check'
  ) then
    alter table public.jobs
      add constraint jobs_cover_letter_tone_check
      check (cover_letter_tone is null or cover_letter_tone in ('formal', 'casual', 'enthusiastic'));
  end if;
end $$;
