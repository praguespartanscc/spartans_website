-- CricHeroes links in every form the app shares, practice end times, and a public list of
-- indoor matches being scored right now (for the Live page). Re-runnable.

begin;

-- The website turns any pasted CricHeroes link into the standard profile link
-- (https://cricheroes.com/player-profile/<id>/<name>). An app short link (chshare.link) that
-- could not be expanded is kept as it is.
create or replace function public.is_cricheroes_profile(url text)
returns boolean
language sql
immutable
as $$
  select coalesce(
    url ~* '^https?://((www|m|app)\.)?cricheroes\.(com|in)/player-profile/[0-9]+'
    or url ~* '^https?://(www\.)?chshare\.link/[a-z-]+/[a-z0-9]{4,12}',
    false)
$$;

create or replace function public.update_my_cricheroes(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_cricheroes_profile(trim(p_url)) then
    raise exception 'Please paste your CricHeroes profile link (in the app: your profile, Share, Copy link)';
  end if;
  update public.profiles set cricheroes_url = trim(p_url) where id = auth.uid();
  update public.players pl
  set cricheroes_url = trim(p_url)
  from public.profiles p
  where p.id = auth.uid() and pl.id = p.player_id;
end $$;

revoke all on function public.update_my_cricheroes(text) from public, anon;
grant execute on function public.update_my_cricheroes(text) to authenticated;

-- Practices get an end time, so the Live page can show a session that is on right now.
alter table public.practices add column if not exists end_time time;

-- Indoor matches being scored now, for everyone (no account ids). A match left "live" by a
-- scorer who never finished it drops off after 6 hours without a ball.
create or replace function public.live_indoor_matches()
returns table (share_slug text, team_a text, team_b text, summary jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.share_slug, m.team_a, m.team_b, m.summary, m.updated_at
  from public.indoor_matches m
  where m.status = 'live' and m.updated_at > now() - interval '6 hours'
  order by m.updated_at desc
  limit 6
$$;

revoke all on function public.live_indoor_matches() from public;
grant execute on function public.live_indoor_matches() to anon, authenticated;

commit;
