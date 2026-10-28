-- Prague Spartans: richer player, committee, sponsor and match data.
-- Run in Supabase > SQL Editor AFTER supabase/security.sql (it uses public.is_admin()).
--
-- Only adds things, so it is safe to run while the current website is live.
-- Player emails and ages are copied into an admin-only table here; they are
-- removed from the public players table later by 001b, once the new website
-- (which no longer reads them from there) is in production.

begin;

-- Players: profile fields for the squad and player pages ---------------------
alter table public.players
  add column if not exists photo_url text,
  add column if not exists bio text,
  add column if not exists batting_style text,
  add column if not exists bowling_style text,
  add column if not exists jersey_number integer,
  add column if not exists joined_year integer,
  add column if not exists cricheroes_url text,
  add column if not exists is_active boolean not null default true;

-- Private player details (email, age): admins only.
do $$
declare
  id_type text;
begin
  select format_type(atttypid, atttypmod) into id_type
  from pg_attribute
  where attrelid = 'public.players'::regclass and attname = 'id';

  execute format(
    'create table if not exists public.player_private (
       player_id %s primary key references public.players(id) on delete cascade,
       email text,
       age integer,
       updated_at timestamptz not null default now()
     )', id_type);
end $$;

alter table public.player_private enable row level security;
drop policy if exists "Admins manage private player details" on public.player_private;
create policy "Admins manage private player details" on public.player_private
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Copy what exists today (only if the old columns are still there), and stop
-- requiring them on players: the new admin form saves them in player_private.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'players' and column_name = 'email'
  ) then
    execute 'alter table public.players alter column email drop not null, alter column age drop not null';
    execute $copy$
      insert into public.player_private (player_id, email, age)
      select id, email, age from public.players
      on conflict (player_id) do update
        set email = excluded.email, age = excluded.age, updated_at = now()
    $copy$;
  end if;
end $$;

-- Committee: photo, bio, public contact and display order ---------------------
alter table public.committee
  add column if not exists photo_url text,
  add column if not exists bio text,
  add column if not exists contact_email text,
  add column if not exists sort_order integer not null default 100;

-- Sponsors: tier and display order --------------------------------------------
alter table public.sponsors
  add column if not exists tier text not null default 'partner',
  add column if not exists sort_order integer not null default 100;

-- Matches: live stream link and a one-line result ------------------------------
-- (the existing "url" column stays as the CricHeroes scorecard link)
alter table public.matches
  add column if not exists stream_url text,
  add column if not exists summary text;

-- Practices: optional session title ---------------------------------------------
alter table public.practices add column if not exists title text;

-- Applications: always start as pending ------------------------------------------
alter table public.team_applications alter column status set default 'pending';
update public.team_applications set status = 'pending' where status is null;

-- Photos for players and committee members ---------------------------------------
insert into storage.buckets (id, name, public)
values ('club-photos', 'club-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins manage club photos" on storage.objects;
create policy "Admins manage club photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'club-photos' and public.is_admin())
  with check (bucket_id = 'club-photos' and public.is_admin());

commit;
