-- Indoor tournaments. A tournament is a name, one set of rules, teams with fixed squads and a
-- list of fixtures (who plays whom, when and on which court).
--
-- A fixture never stores a score. The phone still starts an ordinary indoor match, scores it
-- and uploads it, and the match says which fixture it was played for. The table, the bracket
-- and the stats are worked out from the match rows when the tournament is read.
--
-- Who can do what:
--   approved members see every tournament and can start one
--   the member who started a tournament, the members named as its organisers, and admins
--     can change it, its teams and its fixtures
--   scoring a match is unchanged: any approved member starts one, with or without a tournament
--   anyone with the link can follow a tournament, through indoor_tournament_by_slug()
--
-- Re-runnable.

begin;

-- Ids are made on the phone, like match ids, so a retried save never makes a second copy.
-- rev goes up by one with every change the organiser saves.
create table if not exists public.indoor_tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]{8,32}$'),
  name text not null check (length(name) between 1 and 80),
  status text not null default 'live' check (status in ('draft', 'live', 'complete')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  organisers uuid[] not null default '{}',
  rules jsonb not null,
  settings jsonb not null default '{}'::jsonb,
  rev integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists indoor_tournaments_created_by on public.indoor_tournaments (created_by);

-- Squads are plain names inside the team, the same way a match keeps its players.
create table if not exists public.indoor_tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.indoor_tournaments(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  short text check (short is null or length(short) between 1 and 6),
  seed integer not null default 0,
  grp text,
  squad jsonb not null default '[]'::jsonb,
  withdrawn boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists indoor_tournament_teams_tournament_sort on public.indoor_tournament_teams (tournament_id, sort);

-- home, away and duty say who plays: a team, or a place that is filled once earlier games are
-- done ("winner of semi final 1"). winner_id, match_id and voided are the organiser's rulings.
-- They are plain ids on purpose (see the note on indoor_matches below).
create table if not exists public.indoor_fixtures (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.indoor_tournaments(id) on delete cascade,
  stage text not null,
  grp text,
  round integer not null default 1,
  seq integer not null default 0,
  label text not null default '',
  home jsonb not null,
  away jsonb not null,
  duty jsonb,
  venue text,
  court integer,
  day date,
  starts text check (starts is null or starts ~ '^[0-2][0-9]:[0-5][0-9]$'),
  status text not null default 'scheduled' check (status in ('scheduled', 'walkover', 'no_result', 'cancelled')),
  winner_id uuid,
  match_id uuid,
  voided uuid[] not null default '{}',
  locked boolean not null default false,
  note text check (note is null or length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists indoor_fixtures_tournament_seq on public.indoor_fixtures (tournament_id, seq);

-- A match scored for a tournament game carries the tournament and the fixture.
--
-- No foreign key and no unique index, on purpose. The phone scores without signal and uploads
-- later, and an upload must never be refused: not because the organiser re-planned the
-- fixtures in the meantime (the fixture id is gone), and not because two phones scored the
-- same game (both are kept). The tournament decides which match counts when it reads them.
alter table public.indoor_matches add column if not exists tournament_id uuid;
alter table public.indoor_matches add column if not exists fixture_id uuid;

create index if not exists indoor_matches_tournament_id on public.indoor_matches (tournament_id) where tournament_id is not null;
create index if not exists indoor_matches_fixture_id on public.indoor_matches (fixture_id) where fixture_id is not null;

alter table public.indoor_tournaments enable row level security;
alter table public.indoor_tournament_teams enable row level security;
alter table public.indoor_fixtures enable row level security;

-- Signed in members reach these tables through the rules below. Visitors never do: the public
-- page reads through indoor_tournament_by_slug(). Stated here so it does not depend on what
-- the project gives new tables by default.
revoke all on public.indoor_tournaments, public.indoor_tournament_teams, public.indoor_fixtures from anon;
grant select, insert, update, delete on public.indoor_tournaments, public.indoor_tournament_teams, public.indoor_fixtures to authenticated;
grant all on public.indoor_tournaments, public.indoor_tournament_teams, public.indoor_fixtures to service_role;

-- True when the caller may run this tournament.
create or replace function public.can_run_indoor_tournament(p_tournament uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.indoor_tournaments t
        where t.id = p_tournament
          and public.is_member()
          and (t.created_by = auth.uid() or auth.uid() = any (t.organisers))
      )
$$;

revoke all on function public.can_run_indoor_tournament(uuid) from public, anon;
grant execute on function public.can_run_indoor_tournament(uuid) to authenticated;

drop policy if exists "Members read indoor tournaments" on public.indoor_tournaments;
drop policy if exists "Members start indoor tournaments" on public.indoor_tournaments;
drop policy if exists "Organisers update indoor tournaments" on public.indoor_tournaments;
drop policy if exists "Organisers delete indoor tournaments" on public.indoor_tournaments;

create policy "Members read indoor tournaments" on public.indoor_tournaments
  for select to authenticated using (public.is_member());
create policy "Members start indoor tournaments" on public.indoor_tournaments
  for insert to authenticated
  with check (public.is_member() and created_by = (select auth.uid()));
create policy "Organisers update indoor tournaments" on public.indoor_tournaments
  for update to authenticated
  using (public.can_run_indoor_tournament(id))
  with check (public.can_run_indoor_tournament(id));
create policy "Organisers delete indoor tournaments" on public.indoor_tournaments
  for delete to authenticated using (public.can_run_indoor_tournament(id));

-- The link never changes, and only an admin can change who started a tournament.
-- A change made with nobody signed in is let through (the Supabase dashboard, the website's
-- server key, and an account being deleted, which empties created_by on its own). Without
-- that, an account that started a tournament could not be deleted.
create or replace function public.guard_indoor_tournament_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'The share link of a tournament cannot change';
  end if;
  if new.created_by is distinct from old.created_by and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change who started a tournament';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists indoor_tournaments_guard on public.indoor_tournaments;
create trigger indoor_tournaments_guard
  before update on public.indoor_tournaments
  for each row execute function public.guard_indoor_tournament_update();

drop policy if exists "Members read indoor tournament teams" on public.indoor_tournament_teams;
drop policy if exists "Organisers add indoor tournament teams" on public.indoor_tournament_teams;
drop policy if exists "Organisers change indoor tournament teams" on public.indoor_tournament_teams;
drop policy if exists "Organisers delete indoor tournament teams" on public.indoor_tournament_teams;

create policy "Members read indoor tournament teams" on public.indoor_tournament_teams
  for select to authenticated using (public.is_member());
create policy "Organisers add indoor tournament teams" on public.indoor_tournament_teams
  for insert to authenticated with check (public.can_run_indoor_tournament(tournament_id));
create policy "Organisers change indoor tournament teams" on public.indoor_tournament_teams
  for update to authenticated
  using (public.can_run_indoor_tournament(tournament_id))
  with check (public.can_run_indoor_tournament(tournament_id));
create policy "Organisers delete indoor tournament teams" on public.indoor_tournament_teams
  for delete to authenticated using (public.can_run_indoor_tournament(tournament_id));

drop policy if exists "Members read indoor fixtures" on public.indoor_fixtures;
drop policy if exists "Organisers add indoor fixtures" on public.indoor_fixtures;
drop policy if exists "Organisers change indoor fixtures" on public.indoor_fixtures;
drop policy if exists "Organisers delete indoor fixtures" on public.indoor_fixtures;

create policy "Members read indoor fixtures" on public.indoor_fixtures
  for select to authenticated using (public.is_member());
create policy "Organisers add indoor fixtures" on public.indoor_fixtures
  for insert to authenticated with check (public.can_run_indoor_tournament(tournament_id));
create policy "Organisers change indoor fixtures" on public.indoor_fixtures
  for update to authenticated
  using (public.can_run_indoor_tournament(tournament_id))
  with check (public.can_run_indoor_tournament(tournament_id));
create policy "Organisers delete indoor fixtures" on public.indoor_fixtures
  for delete to authenticated using (public.can_run_indoor_tournament(tournament_id));

-- Teams and fixtures stay in the tournament they were made for. A re-plan deletes fixtures
-- and adds new ones, it never moves them.
create or replace function public.touch_indoor_tournament_row()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.tournament_id is distinct from old.tournament_id then
    raise exception 'A team or a fixture cannot move to another tournament';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists indoor_tournament_teams_touch on public.indoor_tournament_teams;
create trigger indoor_tournament_teams_touch
  before insert or update on public.indoor_tournament_teams
  for each row execute function public.touch_indoor_tournament_row();

drop trigger if exists indoor_fixtures_touch on public.indoor_fixtures;
create trigger indoor_fixtures_touch
  before insert or update on public.indoor_fixtures
  for each row execute function public.touch_indoor_tournament_row();

-- Trigger functions cannot run through the API anyway, but there is no reason to list them.
revoke all on function public.guard_indoor_tournament_update() from public, anon, authenticated;
revoke all on function public.touch_indoor_tournament_row() from public, anon, authenticated;

-- Public tournament page: everything it shows, by the share link, without any account ids
-- (not who started it, not the organisers). A draft is not shown to anyone but members.
-- Matches come without their balls and setup: the summary is enough for tables and stats.
create or replace function public.indoor_tournament_by_slug(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'tournament', jsonb_build_object(
      'id', t.id,
      'slug', t.slug,
      'name', t.name,
      'status', t.status,
      'rules', t.rules,
      'settings', t.settings,
      'rev', t.rev,
      'created_at', t.created_at,
      'updated_at', t.updated_at
    ),
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tt.id,
        'tournament_id', tt.tournament_id,
        'name', tt.name,
        'short', tt.short,
        'seed', tt.seed,
        'grp', tt.grp,
        'squad', tt.squad,
        'withdrawn', tt.withdrawn,
        'sort', tt.sort
      ) order by tt.sort, tt.name, tt.id)
      from public.indoor_tournament_teams tt
      where tt.tournament_id = t.id
    ), '[]'::jsonb),
    'fixtures', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'tournament_id', f.tournament_id,
        'stage', f.stage,
        'grp', f.grp,
        'round', f.round,
        'seq', f.seq,
        'label', f.label,
        'home', f.home,
        'away', f.away,
        'duty', f.duty,
        'venue', f.venue,
        'court', f.court,
        'day', to_char(f.day, 'YYYY-MM-DD'),
        'starts', f.starts,
        'status', f.status,
        'winner_id', f.winner_id,
        'match_id', f.match_id,
        'voided', f.voided,
        'locked', f.locked,
        'note', f.note
      ) order by f.seq, f.id)
      from public.indoor_fixtures f
      where f.tournament_id = t.id
    ), '[]'::jsonb),
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'tournament_id', m.tournament_id,
        'fixture_id', m.fixture_id,
        'status', m.status,
        'share_slug', m.share_slug,
        'team_a', m.team_a,
        'team_b', m.team_b,
        'summary', m.summary,
        'played_on', m.played_on,
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) order by m.created_at, m.id)
      from public.indoor_matches m
      where m.tournament_id = t.id
    ), '[]'::jsonb)
  )
  from public.indoor_tournaments t
  where t.slug = p_slug and t.status <> 'draft'
$$;

revoke all on function public.indoor_tournament_by_slug(text) from public;
grant execute on function public.indoor_tournament_by_slug(text) to anon, authenticated;

-- Indoor matches being scored now, for everyone (no account ids). A match left "live" by a
-- scorer who never finished it drops off after 6 hours without a ball.
--
-- Same as in migration 15, except that the summary comes without its "digest". A summary now
-- also carries every player's figures for the tournament stats, which the live bar never
-- shows. A summary that is not a JSON object is passed on as it is, so one odd row cannot
-- break the Live page for everyone.
create or replace function public.live_indoor_matches()
returns table (share_slug text, team_a text, team_b text, summary jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.share_slug, m.team_a, m.team_b,
         case when jsonb_typeof(m.summary) = 'object' then m.summary - 'digest' else m.summary end,
         m.updated_at
  from public.indoor_matches m
  where m.status = 'live' and m.updated_at > now() - interval '6 hours'
  order by m.updated_at desc
  limit 6
$$;

revoke all on function public.live_indoor_matches() from public;
grant execute on function public.live_indoor_matches() to anon, authenticated;

commit;
