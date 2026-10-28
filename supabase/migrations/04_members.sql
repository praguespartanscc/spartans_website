-- Prague Spartans: member accounts, availability, practice RSVPs and notices.
--
-- Anyone can register; they start "pending" and only see the member dashboard
-- once an admin approves them (and links them to their player profile).

begin;

-- Profiles: one per sign-up -------------------------------------------------------
do $$
declare
  player_id_type text;
begin
  select format_type(atttypid, atttypmod) into player_id_type
  from pg_attribute where attrelid = 'public.players'::regclass and attname = 'id';

  execute format(
    'create table if not exists public.profiles (
       id uuid primary key references auth.users(id) on delete cascade,
       full_name text,
       email text,
       cricheroes_url text,
       status text not null default ''pending'' check (status in (''pending'', ''approved'', ''rejected'')),
       player_id %s unique references public.players(id) on delete set null,
       created_at timestamptz not null default now()
     )', player_id_type);
end $$;

-- For databases where profiles was created by an earlier version of this script.
alter table public.profiles add column if not exists cricheroes_url text;

alter table public.profiles enable row level security;

-- A CricHeroes player profile link, e.g. https://cricheroes.com/player-profile/123/name
create or replace function public.is_cricheroes_profile(url text)
returns boolean
language sql
immutable
as $$
  select coalesce(url ~* '^https?://([a-z0-9-]+\.)*cricheroes\.(com|in)/player-profile/[0-9]+', false)
$$;

-- New sign-ups get a pending profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, cricheroes_url, status)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case when public.is_cricheroes_profile(new.raw_user_meta_data ->> 'cricheroes_url')
         then new.raw_user_meta_data ->> 'cricheroes_url' end,
    case when new.raw_app_meta_data ->> 'isAdmin' = 'true' then 'approved' else 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing accounts: admins start approved, everyone else pending.
insert into public.profiles (id, email, full_name, cricheroes_url, status)
select id, email, nullif(raw_user_meta_data ->> 'full_name', ''),
       case when public.is_cricheroes_profile(raw_user_meta_data ->> 'cricheroes_url')
            then raw_user_meta_data ->> 'cricheroes_url' end,
       case when raw_app_meta_data ->> 'isAdmin' = 'true' then 'approved' else 'pending' end
from auth.users
on conflict (id) do nothing;

-- True for admins and approved members. Security definer so it can read
-- profiles regardless of the caller's row access.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
$$;

drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins manage profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Names of approved members, for availability and RSVP lists (no emails).
create or replace function public.member_directory()
returns table (id uuid, full_name text, player_id text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(pl.name, p.full_name, 'Member'), p.player_id::text
  from public.profiles p
  left join public.players pl on pl.id = p.player_id
  where p.status = 'approved' and public.is_member()
$$;

alter table public.players add column if not exists updated_at timestamptz;

-- Members set or correct their own CricHeroes link (required before approval).
create or replace function public.update_my_cricheroes(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_cricheroes_profile(trim(p_url)) then
    raise exception 'Please paste your CricHeroes player profile link (https://cricheroes.com/player-profile/...)';
  end if;
  update public.profiles set cricheroes_url = trim(p_url) where id = auth.uid();
  -- Keep the linked player's public profile in step.
  update public.players pl
  set cricheroes_url = trim(p_url)
  from public.profiles p
  where p.id = auth.uid() and pl.id = p.player_id;
end $$;

revoke all on function public.update_my_cricheroes(text) from public, anon;
grant execute on function public.update_my_cricheroes(text) to authenticated;

-- Members can only be approved once they have given a CricHeroes link.
create or replace function public.check_profile_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') and new.cricheroes_url is null
     and coalesce((select raw_app_meta_data ->> 'isAdmin' from auth.users where id = new.id), 'false') <> 'true' then
    raise exception 'This member has not added their CricHeroes profile yet';
  end if;
  return new;
end $$;

drop trigger if exists profiles_require_cricheroes on public.profiles;
create trigger profiles_require_cricheroes
  before update on public.profiles
  for each row execute function public.check_profile_approval();

-- When an admin links a member to a player, give the player the member's CricHeroes link if it has none.
create or replace function public.copy_cricheroes_to_player()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.player_id is not null and new.cricheroes_url is not null then
    update public.players
    set cricheroes_url = new.cricheroes_url
    where id = new.player_id and (cricheroes_url is null or cricheroes_url = '');
  end if;
  return new;
end $$;

drop trigger if exists profiles_copy_cricheroes on public.profiles;
create trigger profiles_copy_cricheroes
  after insert or update of player_id, cricheroes_url on public.profiles
  for each row execute function public.copy_cricheroes_to_player();

-- Members edit only the safe fields of the player profile linked to them.
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
  select player_id::text into target
  from public.profiles
  where id = auth.uid() and status = 'approved';

  if target is null then
    raise exception 'Your account is not linked to a player profile yet';
  end if;

  update public.players
  set photo_url = p_photo_url,
      bio = nullif(trim(p_bio), ''),
      batting_style = nullif(trim(p_batting_style), ''),
      bowling_style = nullif(trim(p_bowling_style), ''),
      jersey_number = p_jersey_number,
      updated_at = now()
  where id::text = target;
end $$;

revoke all on function public.update_my_player_profile(text, text, text, text, integer) from public, anon;
grant execute on function public.update_my_player_profile(text, text, text, text, integer) to authenticated;
revoke all on function public.member_directory() from public, anon;
grant execute on function public.member_directory() to authenticated;

-- Match availability and practice RSVPs ---------------------------------------------
do $$
declare
  match_id_type text;
  practice_id_type text;
begin
  select format_type(atttypid, atttypmod) into match_id_type
  from pg_attribute where attrelid = 'public.matches'::regclass and attname = 'id';
  select format_type(atttypid, atttypmod) into practice_id_type
  from pg_attribute where attrelid = 'public.practices'::regclass and attname = 'id';

  execute format(
    'create table if not exists public.match_availability (
       id bigint generated always as identity primary key,
       match_id %s not null references public.matches(id) on delete cascade,
       user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
       status text not null check (status in (''yes'', ''no'', ''maybe'')),
       note text,
       updated_at timestamptz not null default now(),
       unique (match_id, user_id)
     )', match_id_type);

  execute format(
    'create table if not exists public.practice_rsvps (
       id bigint generated always as identity primary key,
       practice_id %s not null references public.practices(id) on delete cascade,
       user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
       status text not null check (status in (''yes'', ''no'')),
       updated_at timestamptz not null default now(),
       unique (practice_id, user_id)
     )', practice_id_type);
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['match_availability', 'practice_rsvps']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Members read" on public.%I', t);
    execute format('drop policy if exists "Members manage their own" on public.%I', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format('create policy "Members read" on public.%I for select to authenticated using (public.is_member())', t);
    execute format(
      'create policy "Members manage their own" on public.%I for all to authenticated
         using (user_id = auth.uid() and public.is_member())
         with check (user_id = auth.uid() and public.is_member())', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Club notices (members only) -------------------------------------------------------
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;
drop policy if exists "Members read notices" on public.notices;
drop policy if exists "Admins manage notices" on public.notices;
create policy "Members read notices" on public.notices
  for select to authenticated using (public.is_member());
create policy "Admins manage notices" on public.notices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Members upload their own photo to club-photos/members/<their user id>/ -------------
drop policy if exists "Members upload own photo" on storage.objects;
create policy "Members upload own photo" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'club-photos'
    and split_part(name, '/', 1) = 'members'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.is_member()
  )
  with check (
    bucket_id = 'club-photos'
    and split_part(name, '/', 1) = 'members'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.is_member()
  );

commit;
