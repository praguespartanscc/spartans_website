-- Hardening from the October 2026 audit. Re-runnable.
--
--   team_applications     visitors no longer insert directly (the join form posts to /api/join,
--                         which checks the request and writes with the server key), and the
--                         columns get sensible limits
--   photos                a member's photo must be a file in their own folder of our bucket
--                         (the old check was a substring match), committee cover and trophy
--                         photos must be in our bucket too
--   storage buckets       5 MB and images only
--   notify_join           sends a shared secret (Supabase Vault "join_hook_secret") that
--                         /api/hooks/join checks once JOIN_HOOK_SECRET is set in Vercel
--   committee             visitors read the public list through committee_public() only
--                         (the table also holds member account ids)
--   sponsors              an optional Czech description
--   tidy-ups              search_path on is_cricheroes_profile, trigger functions not callable
--                         through the API, indexes on foreign keys, auth.uid() evaluated once
--                         per query in policies

begin;

-- Join requests ---------------------------------------------------------------------------

drop policy if exists "Anyone can apply" on public.team_applications;

alter table public.team_applications
  drop constraint if exists team_applications_name_check,
  drop constraint if exists team_applications_email_check,
  drop constraint if exists team_applications_experience_check,
  drop constraint if exists team_applications_location_check,
  drop constraint if exists team_applications_specification_check,
  drop constraint if exists team_applications_age_check;

-- Old rows are not touched (not valid), new rows must fit.
alter table public.team_applications
  add constraint team_applications_name_check check (length(name) between 2 and 100) not valid,
  add constraint team_applications_email_check check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and length(email) <= 200) not valid,
  add constraint team_applications_experience_check check (experience is null or length(experience) <= 2000) not valid,
  add constraint team_applications_location_check check (location is null or length(location) <= 120) not valid,
  add constraint team_applications_specification_check check (specification is null or specification in ('batsman', 'bowler', 'allrounder', 'wicketkeeper', 'wicketkeeper_batsman')) not valid,
  add constraint team_applications_age_check check (age is null or age between 5 and 99) not valid;

-- Photos ----------------------------------------------------------------------------------

-- True when the URL points at a file in the given folder of our public club-photos bucket.
create or replace function public.is_club_photo(p_url text, p_folder text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/club-photos/' || p_folder || '/[A-Za-z0-9._-]+$')
$$;

revoke all on function public.is_club_photo(text, text) from public;
grant execute on function public.is_club_photo(text, text) to anon, authenticated;

create or replace function public.update_my_photo(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid() and status = 'approved';
  if me.id is null then
    raise exception 'Your membership has not been approved yet';
  end if;
  if p_url is not null and not public.is_club_photo(p_url, 'members/' || auth.uid()::text) then
    raise exception 'Upload the photo from your dashboard';
  end if;
  update public.profiles set photo_url = p_url where id = auth.uid();
  if me.player_id is not null then
    update public.players set photo_url = p_url where id = me.player_id;
  end if;
end $$;

-- The photo is set through update_my_photo() only. The other fields are a member's own.
create or replace function public.update_my_player_profile(
  p_photo_url text,
  p_bio text,
  p_batting_style text,
  p_bowling_style text,
  p_jersey_number integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target text;
begin
  select player_id::text into target from public.profiles where id = auth.uid() and status = 'approved';
  if target is null then
    raise exception 'Your account is not linked to a player profile yet';
  end if;
  if p_photo_url is not null and not public.is_club_photo(p_photo_url, '(members/' || auth.uid()::text || '|players)') then
    raise exception 'Upload the photo from your dashboard';
  end if;
  if p_jersey_number is not null and p_jersey_number not between 0 and 999 then
    raise exception 'Shirt number must be between 0 and 999';
  end if;
  update public.players
  set photo_url = p_photo_url,
      bio = left(nullif(trim(p_bio), ''), 1000),
      batting_style = left(nullif(trim(p_batting_style), ''), 80),
      bowling_style = left(nullif(trim(p_bowling_style), ''), 80),
      jersey_number = p_jersey_number,
      updated_at = now()
  where id::text = target;
end $$;

-- Committee writers: news covers and trophy photos come from our bucket.
alter table public.news_posts drop constraint if exists news_posts_cover_url_check;
alter table public.news_posts
  add constraint news_posts_cover_url_check check (cover_url is null or public.is_club_photo(cover_url, 'news')) not valid;
alter table public.achievements drop constraint if exists achievements_photo_url_check;
alter table public.achievements
  add constraint achievements_photo_url_check check (photo_url is null or public.is_club_photo(photo_url, 'achievements')) not valid;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('club-photos', 'sponsor-logos');

-- Join hook secret --------------------------------------------------------------------------

-- One random secret, created once. Copy it from Supabase Vault into Vercel as JOIN_HOOK_SECRET.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'join_hook_secret') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'join_hook_secret', 'Sent by private.notify_join to /api/hooks/join');
  end if;
end $$;

create or replace function private.notify_join(tbl text, row_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'join_hook_secret' limit 1;
  perform net.http_post(
    url := 'https://praguespartanscc.com/api/hooks/join',
    body := jsonb_build_object('table', tbl, 'id', row_id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', coalesce(secret, ''))
  );
exception when others then
  -- Never block a sign-up or application because the notification failed.
  raise warning 'join notification failed: %', sqlerrm;
end $$;

-- Committee list ----------------------------------------------------------------------------

drop policy if exists "Anyone can read" on public.committee;
drop policy if exists "Admins read committee" on public.committee;
create policy "Admins read committee" on public.committee
  for select to authenticated using (public.is_admin());

-- Sponsors ----------------------------------------------------------------------------------

alter table public.sponsors add column if not exists description_cs text;

-- Tidy-ups ----------------------------------------------------------------------------------

alter function public.is_cricheroes_profile(text) set search_path = '';

-- Trigger functions cannot run through the API anyway, but there is no reason to list them.
revoke execute on function public.check_profile_approval() from anon, authenticated;
revoke execute on function public.copy_cricheroes_to_player() from anon, authenticated;
revoke execute on function public.guard_indoor_match_update() from anon, authenticated;
revoke execute on function public.guard_player_team() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.news_publish_date() from anon, authenticated;
revoke execute on function public.touch_indoor_event() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;

create index if not exists indoor_events_created_by on public.indoor_events (created_by);
create index if not exists indoor_matches_scorer_id on public.indoor_matches (scorer_id);
create index if not exists match_availability_user_id on public.match_availability (user_id);
create index if not exists match_selection_player_id on public.match_selection (player_id);
create index if not exists news_posts_author_id on public.news_posts (author_id);
create index if not exists notices_created_by on public.notices (created_by);
create index if not exists practice_rsvps_user_id on public.practice_rsvps (user_id);

-- auth.uid() once per query instead of once per row.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Members manage their own" on public.match_availability;
create policy "Members manage their own" on public.match_availability
  for all to authenticated
  using (user_id = (select auth.uid()) and public.is_member())
  with check (user_id = (select auth.uid()) and public.is_member());

drop policy if exists "Members manage their own" on public.practice_rsvps;
create policy "Members manage their own" on public.practice_rsvps
  for all to authenticated
  using (user_id = (select auth.uid()) and public.is_member())
  with check (user_id = (select auth.uid()) and public.is_member());

drop policy if exists "Members start indoor matches" on public.indoor_matches;
create policy "Members start indoor matches" on public.indoor_matches
  for insert to authenticated
  with check (public.is_member() and created_by = (select auth.uid()) and scorer_id = (select auth.uid()));

commit;
