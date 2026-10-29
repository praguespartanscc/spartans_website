-- Indoor match scorer. Kept apart from the club's players and stats on purpose: squads are
-- stored as plain names inside the match setup.
--
-- Every ball is an event. Ids are made on the scorer's phone, so a retried upload never
-- counts twice. Undo marks an event deleted instead of removing it.
--
-- Who can do what:
--   approved members start matches and see members' matches
--   only the member who started a match, the member it was handed to, or an admin, can score it
--   anyone with the share link can follow a match, through indoor_match_by_slug()

begin;

create table if not exists public.indoor_matches (
  id uuid primary key,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  scorer_id uuid references auth.users(id) on delete set null default auth.uid(),
  team_a text not null check (length(team_a) between 1 and 60),
  team_b text not null check (length(team_b) between 1 and 60),
  setup jsonb not null,
  summary jsonb,
  status text not null default 'live' check (status in ('live', 'complete', 'abandoned')),
  share_slug text not null unique check (share_slug ~ '^[a-z0-9]{8,32}$'),
  played_on date not null default ((now() at time zone 'Europe/Prague')::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists indoor_matches_played_on on public.indoor_matches (played_on desc);
create index if not exists indoor_matches_created_by on public.indoor_matches (created_by);

create table if not exists public.indoor_events (
  id uuid primary key,
  match_id uuid not null references public.indoor_matches(id) on delete cascade,
  seq double precision not null,
  type text not null check (type in ('ball', 'overStart', 'openers', 'swapStrike', 'retire', 'nextBatter', 'penalty', 'rulesChange', 'oversChange', 'addPlayer', 'inningsEnd')),
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists indoor_events_match_seq on public.indoor_events (match_id, seq);

alter table public.indoor_matches enable row level security;
alter table public.indoor_events enable row level security;

-- True when the caller may score this match.
create or replace function public.can_score_indoor(p_match uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.indoor_matches m
        where m.id = p_match
          and public.is_member()
          and (m.created_by = auth.uid() or m.scorer_id = auth.uid())
      )
$$;

revoke all on function public.can_score_indoor(uuid) from public, anon;
grant execute on function public.can_score_indoor(uuid) to authenticated;

drop policy if exists "Members read indoor matches" on public.indoor_matches;
drop policy if exists "Members start indoor matches" on public.indoor_matches;
drop policy if exists "Scorers update indoor matches" on public.indoor_matches;
drop policy if exists "Starter or admin deletes indoor matches" on public.indoor_matches;

create policy "Members read indoor matches" on public.indoor_matches
  for select to authenticated using (public.is_member());
create policy "Members start indoor matches" on public.indoor_matches
  for insert to authenticated
  with check (public.is_member() and created_by = auth.uid() and scorer_id = auth.uid());
create policy "Scorers update indoor matches" on public.indoor_matches
  for update to authenticated
  using (public.can_score_indoor(id))
  with check (public.can_score_indoor(id));
create policy "Starter or admin deletes indoor matches" on public.indoor_matches
  for delete to authenticated using (public.is_admin() or created_by = auth.uid());

-- The scorer can hand the match to another member, but only the starter or an admin can
-- change who started it.
create or replace function public.guard_indoor_match_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is distinct from old.created_by and not public.is_admin() then
    raise exception 'Only an admin can change who started a match';
  end if;
  if new.share_slug is distinct from old.share_slug then
    raise exception 'The share link of a match cannot change';
  end if;
  if new.scorer_id is distinct from old.scorer_id
     and not (public.is_admin() or old.created_by = auth.uid() or old.scorer_id = auth.uid()) then
    raise exception 'Only the scorer, the starter or an admin can hand the match over';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists indoor_matches_guard on public.indoor_matches;
create trigger indoor_matches_guard
  before update on public.indoor_matches
  for each row execute function public.guard_indoor_match_update();

drop policy if exists "Members read indoor events" on public.indoor_events;
drop policy if exists "Scorers add indoor events" on public.indoor_events;
drop policy if exists "Scorers change indoor events" on public.indoor_events;

create policy "Members read indoor events" on public.indoor_events
  for select to authenticated using (public.is_member());
create policy "Scorers add indoor events" on public.indoor_events
  for insert to authenticated with check (public.can_score_indoor(match_id));
create policy "Scorers change indoor events" on public.indoor_events
  for update to authenticated
  using (public.can_score_indoor(match_id))
  with check (public.can_score_indoor(match_id));
-- No delete policy: undo keeps the event with deleted = true.

create or replace function public.touch_indoor_event()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.match_id is distinct from old.match_id then
    raise exception 'An event cannot move to another match';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists indoor_events_touch on public.indoor_events;
create trigger indoor_events_touch
  before insert or update on public.indoor_events
  for each row execute function public.touch_indoor_event();

-- Public follow page: one match by its share link, without any account ids.
create or replace function public.indoor_match_by_slug(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', m.id,
    'team_a', m.team_a,
    'team_b', m.team_b,
    'setup', m.setup,
    'summary', m.summary,
    'status', m.status,
    'played_on', m.played_on,
    'updated_at', m.updated_at,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'seq', e.seq, 'type', e.type, 'data', e.data) order by e.seq)
      from public.indoor_events e
      where e.match_id = m.id and not e.deleted
    ), '[]'::jsonb)
  )
  from public.indoor_matches m
  where m.share_slug = p_slug
$$;

revoke all on function public.indoor_match_by_slug(text) from public;
grant execute on function public.indoor_match_by_slug(text) to anon, authenticated;

commit;
